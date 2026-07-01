import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createPayPalOrder } from '@/lib/paypal/client';
import {
  isTrancheType,
  toAmountString,
  trancheOf,
  type OrderRow,
} from '@/lib/orders/tranche';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/paypal/create-order
 * Body: { orderId: string, type: 'deposit' | 'balance' }
 *
 * L'importo viene letto SEMPRE dal server da Supabase (orderId + type):
 * il browser non lo trasmette mai. Crea l'ordine PayPal in EUR, salva il
 * paypal order id sulla riga e restituisce { id }.
 */
export async function POST(req: Request) {
  let body: { orderId?: string; type?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body non valido' }, { status: 400 });
  }

  const { orderId, type } = body;
  if (!orderId || !isTrancheType(type)) {
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
  const tranche = trancheOf(order, type);

  // Se già pagata, non creare un nuovo ordine PayPal.
  if (tranche.status === 'paid') {
    return NextResponse.json(
      { error: 'Questa tranche è già stata pagata' },
      { status: 409 },
    );
  }

  if (!(tranche.amount > 0)) {
    return NextResponse.json(
      { error: 'Importo non valido per questa tranche' },
      { status: 400 },
    );
  }

  const description =
    tranche.type === 'deposit'
      ? `Acconto 30% — sito web Lumino (${order.client_name})`
      : `Saldo 70% — sito web Lumino (${order.client_name})`;

  let ppOrder;
  try {
    ppOrder = await createPayPalOrder(toAmountString(tranche.amount), {
      referenceId: `${order.id}:${tranche.type}`,
      customId: `${order.id}:${tranche.type}`,
      description,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Errore PayPal';
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  // Salva l'id ordine PayPal sulla tranche corrispondente (per tracciamento).
  const { error: updErr } = await admin
    .from('orders')
    .update({ [tranche.paypalOrderIdColumn]: ppOrder.id })
    .eq('id', order.id);

  if (updErr) {
    // Non blocchiamo il pagamento: l'ordine PayPal esiste già. Logghiamo soltanto.
    console.error('Impossibile salvare paypal order id:', updErr.message);
  }

  return NextResponse.json({ id: ppOrder.id });
}
