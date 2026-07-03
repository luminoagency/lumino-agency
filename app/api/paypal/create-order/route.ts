import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createPayPalOrder } from '@/lib/paypal/client';
import {
  isPaymentType,
  toAmountString,
  paymentPlan,
  type OrderRow,
} from '@/lib/orders/tranche';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/paypal/create-order
 * Body: { orderId: string, type: 'deposit' | 'balance' | 'full' }
 *
 * L'importo viene SEMPRE calcolato dal server da Supabase (orderId + type):
 * il browser sceglie solo QUALE tipo pagare, mai l'importo. Crea l'ordine
 * PayPal in EUR, salva il paypal order id sulla colonna del tipo e ritorna { id }.
 */
export async function POST(req: Request) {
  let body: { orderId?: string; type?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body non valido' }, { status: 400 });
  }

  const { orderId, type } = body;
  if (!orderId || !isPaymentType(type)) {
    return NextResponse.json(
      { error: 'Parametri mancanti o non validi (orderId, type)' },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'Errore lettura ordine' }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'Ordine non trovato' }, { status: 404 });
  }

  const order = data as OrderRow;
  const plan = paymentPlan(order, type);

  // Se non c'è nulla da pagare per questo tipo, niente ordine PayPal.
  if (plan.alreadyPaid) {
    return NextResponse.json(
      { error: 'Questo pagamento risulta già completato' },
      { status: 409 },
    );
  }

  if (!(plan.amount > 0)) {
    return NextResponse.json(
      { error: 'Importo non valido per questo pagamento' },
      { status: 400 },
    );
  }

  const description = `${plan.label} — sito web Lumino (${order.client_name})`;

  let ppOrder;
  try {
    ppOrder = await createPayPalOrder(toAmountString(plan.amount), {
      referenceId: `${order.id}:${plan.type}`,
      customId: `${order.id}:${plan.type}`,
      description,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Errore PayPal';
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  // Salva l'id ordine PayPal sulla colonna del tipo (per tracciamento + lookup).
  const { error: updErr } = await admin
    .from('orders')
    .update({ [plan.paypalOrderIdColumn]: ppOrder.id })
    .eq('id', order.id);

  if (updErr) {
    // Non blocchiamo il pagamento: l'ordine PayPal esiste già. Logghiamo soltanto.
    console.error('Impossibile salvare paypal order id:', updErr.message);
  }

  return NextResponse.json({ id: ppOrder.id });
}
