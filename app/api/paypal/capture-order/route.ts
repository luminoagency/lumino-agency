import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { capturePayPalOrder } from '@/lib/paypal/client';
import { markOrderTranchesPaid } from '@/lib/orders/sync';
import {
  paymentPlan,
  trancheColumns,
  type OrderRow,
  type PaymentType,
} from '@/lib/orders/tranche';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** PayPal order id: alfanumerico maiuscolo. Validazione difensiva anti-injection. */
const PAYPAL_ID_RE = /^[A-Z0-9]{5,40}$/;

/**
 * POST /api/paypal/capture-order
 * Body: { paypalOrderId: string }
 *
 * Cattura il pagamento e aggiorna Supabase. Il tipo (deposit/balance/full) e
 * l'ordine interno vengono ricavati dal paypalOrderId salvato in create-order,
 * NON da parametri del browser. Idempotente: se le tranche sono già 'paid', o
 * se PayPal risponde ORDER_ALREADY_CAPTURED, non ricattura e conferma lo stato.
 */
export async function POST(req: Request) {
  let body: { paypalOrderId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body non valido' }, { status: 400 });
  }

  const paypalOrderId = body.paypalOrderId;
  if (!paypalOrderId || !PAYPAL_ID_RE.test(paypalOrderId)) {
    return NextResponse.json(
      { error: 'paypalOrderId mancante o non valido' },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  // Trova l'ordine tramite l'id PayPal salvato (deposit / balance / full).
  const { data, error } = await admin
    .from('orders')
    .select('*')
    .or(
      `paypal_deposit_order_id.eq.${paypalOrderId},paypal_balance_order_id.eq.${paypalOrderId},paypal_full_order_id.eq.${paypalOrderId}`,
    )
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'Errore lettura ordine' }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json(
      { error: 'Nessun ordine associato a questo pagamento' },
      { status: 404 },
    );
  }

  const order = data as OrderRow;
  const type: PaymentType =
    order.paypal_full_order_id === paypalOrderId
      ? 'full'
      : order.paypal_deposit_order_id === paypalOrderId
        ? 'deposit'
        : 'balance';

  const plan = paymentPlan(order, type);

  // Idempotenza #1: se tutte le tranche di questo piano sono già pagate.
  const allPaid = plan.tranches.every(
    (t) => order[trancheColumns(t).statusColumn] === 'paid',
  );
  if (plan.tranches.length === 0 || allPaid) {
    return NextResponse.json({ status: 'COMPLETED', alreadyPaid: true });
  }

  // Cattura su PayPal.
  let captureStatus: string;
  try {
    const result = await capturePayPalOrder(paypalOrderId);
    captureStatus = result.status;
  } catch (e) {
    // Idempotenza #2: se PayPal dice che è già stato catturato, trattiamo
    // come completato e aggiorniamo Supabase (allineamento stato).
    const err = e as Error & { paypalStatus?: number; paypalBody?: any };
    const alreadyCaptured =
      err.paypalStatus === 422 &&
      JSON.stringify(err.paypalBody || '').includes('ORDER_ALREADY_CAPTURED');
    if (alreadyCaptured) {
      captureStatus = 'COMPLETED';
    } else {
      const msg = err instanceof Error ? err.message : 'Errore cattura PayPal';
      return NextResponse.json({ error: msg }, { status: 502 });
    }
  }

  if (captureStatus !== 'COMPLETED') {
    return NextResponse.json(
      { error: `Pagamento non completato (stato: ${captureStatus})`, status: captureStatus },
      { status: 402 },
    );
  }

  // Marca le tranche del piano come 'paid' + sincronizza i flag del sito.
  // Per "full" sono entrambe: l'ordine risulta completamente pagato.
  const nowIso = new Date().toISOString();
  const res = await markOrderTranchesPaid(admin, order, plan.tranches, nowIso);
  if (!res.ok) {
    return NextResponse.json(
      { error: 'Pagamento catturato ma aggiornamento stato fallito', status: 'COMPLETED' },
      { status: 500 },
    );
  }

  return NextResponse.json({ status: 'COMPLETED' });
}
