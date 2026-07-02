import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyWebhookSignature } from '@/lib/paypal/client';
import { syncSitePaymentFlags } from '@/lib/orders/sync';
import {
  isTrancheType,
  trancheOf,
  type OrderRow,
  type TrancheType,
} from '@/lib/orders/tranche';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** PayPal order id: alfanumerico maiuscolo. */
const PAYPAL_ID_RE = /^[A-Z0-9]{5,40}$/;

/**
 * POST /api/paypal/webhook
 *
 * Riceve le notifiche PayPal. Aggiorna i pagamenti in modo INDIPENDENTE dal
 * browser del cliente (fonte di verità affidabile).
 *
 * Sicurezza: la firma viene SEMPRE verificata con verify-webhook-signature
 * (PAYPAL_WEBHOOK_ID). Senza verifica riuscita non si aggiorna nulla.
 *
 * Evento gestito: PAYMENT.CAPTURE.COMPLETED.
 * Idempotenza: la tranche passa a 'paid' solo se ancora 'pending'; i flag sul
 * sito si impostano solo se ancora false. Eventi ripetuti non fanno danni.
 */
export async function POST(req: Request) {
  // 1) Corpo grezzo + parse.
  const raw = await req.text();
  let event: any;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Body non valido' }, { status: 400 });
  }

  // 2) Verifica firma (obbligatoria).
  const h = req.headers;
  let verified = false;
  try {
    verified = await verifyWebhookSignature({
      authAlgo: h.get('paypal-auth-algo'),
      certUrl: h.get('paypal-cert-url'),
      transmissionId: h.get('paypal-transmission-id'),
      transmissionSig: h.get('paypal-transmission-sig'),
      transmissionTime: h.get('paypal-transmission-time'),
      webhookEvent: event,
    });
  } catch (e) {
    // Config mancante (PAYPAL_WEBHOOK_ID) o errore di rete verso PayPal.
    const msg = e instanceof Error ? e.message : 'Errore verifica webhook';
    console.error('[webhook] verifica fallita:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  if (!verified) {
    console.warn('[webhook] firma NON valida: richiesta ignorata');
    return NextResponse.json({ error: 'Firma non valida' }, { status: 401 });
  }

  // 3) Filtra l'evento: ci interessa solo la cattura completata.
  const eventType: string = event?.event_type || '';
  if (eventType !== 'PAYMENT.CAPTURE.COMPLETED') {
    // Acknowledge senza fare nulla (evita retry inutili di PayPal).
    return NextResponse.json({ ok: true, ignored: eventType || 'unknown' });
  }

  const resource = event?.resource || {};

  // 4) Identifica l'ordine interno + la tranche.
  //    Primario: custom_id impostato in create-order ("<orderId>:<type>").
  //    Fallback: paypal order id da supplementary_data.related_ids.order_id.
  const admin = createAdminClient();
  let order: OrderRow | null = null;
  let type: TrancheType | null = null;

  const customId: string = resource?.custom_id || '';
  if (customId.includes(':')) {
    const [oid, t] = customId.split(':');
    if (oid && isTrancheType(t)) {
      const { data } = await admin
        .from('orders')
        .select('*')
        .eq('id', oid)
        .maybeSingle();
      if (data) {
        order = data as OrderRow;
        type = t;
      }
    }
  }

  if (!order) {
    const ppOrderId: string =
      resource?.supplementary_data?.related_ids?.order_id || '';
    if (PAYPAL_ID_RE.test(ppOrderId)) {
      const { data } = await admin
        .from('orders')
        .select('*')
        .or(
          `paypal_deposit_order_id.eq.${ppOrderId},paypal_balance_order_id.eq.${ppOrderId}`,
        )
        .maybeSingle();
      if (data) {
        order = data as OrderRow;
        type =
          (data as OrderRow).paypal_deposit_order_id === ppOrderId
            ? 'deposit'
            : 'balance';
      }
    }
  }

  if (!order || !type) {
    // Nessun ordine collegato: acknowledge (non è un errore da ritentare).
    console.warn('[webhook] nessun ordine per la cattura ricevuta');
    return NextResponse.json({ ok: true, matched: false });
  }

  const tranche = trancheOf(order, type);
  const nowIso = new Date().toISOString();

  // 5) Segna la tranche 'paid' (idempotente: solo se ancora 'pending').
  const { error: updErr } = await admin
    .from('orders')
    .update({
      [tranche.statusColumn]: 'paid',
      [tranche.paidAtColumn]: nowIso,
    })
    .eq('id', order.id)
    .eq(tranche.statusColumn, 'pending');

  if (updErr) {
    console.error('[webhook] update orders fallito:', updErr.message);
    // 500 → PayPal ritenterà l'invio.
    return NextResponse.json({ error: 'Update fallito' }, { status: 500 });
  }

  // 6) Sincronizza i flag sul sito del cliente (se collegato). Idempotente.
  //    Nessun client_id → salta, senza errori.
  await syncSitePaymentFlags(admin, order.client_id, type, nowIso);

  return NextResponse.json({ ok: true, orderId: order.id, tranche: type });
}
