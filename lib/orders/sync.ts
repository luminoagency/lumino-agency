import type { SupabaseClient } from '@supabase/supabase-js';
import { trancheColumns, type OrderRow, type TrancheType } from './tranche';

/**
 * Sincronizza i flag di pagamento sul/i sito/i del cliente collegato quando
 * una tranche passa a 'paid'.
 *
 *  - acconto (deposit) → sites.first_payment_confirmed = true
 *  - saldo   (balance) → sites.final_payment_confirmed = true
 *
 * Così la sezione "Tutti i siti" del dashboard resta coerente senza spunte
 * manuali. Idempotente: aggiorna solo i siti dove il flag è ancora false
 * (il timestamp viene quindi impostato una sola volta).
 *
 * Se clientId è null (ordini vecchi/manuali) non fa nulla e non solleva errori.
 *
 * Va usato con un client service-role (server-side). Non lancia: in caso di
 * errore lo logga e ritorna, così non blocca il flusso di pagamento.
 */
export async function syncSitePaymentFlags(
  admin: SupabaseClient,
  clientId: string | null | undefined,
  type: TrancheType,
  nowIso: string,
): Promise<void> {
  if (!clientId) return;

  const flagColumn =
    type === 'deposit' ? 'first_payment_confirmed' : 'final_payment_confirmed';
  const atColumn =
    type === 'deposit'
      ? 'first_payment_confirmed_at'
      : 'final_payment_confirmed_at';

  try {
    const { error } = await admin
      .from('sites')
      .update({ [flagColumn]: true, [atColumn]: nowIso })
      .eq('client_id', clientId)
      .eq(flagColumn, false); // idempotenza: solo se non già confermato

    if (error) {
      console.error('[syncSitePaymentFlags] update sites fallito:', error.message);
    }
  } catch (e) {
    console.error('[syncSitePaymentFlags] eccezione:', e);
  }
}

/**
 * Marca 'paid' una o più tranche di un ordine (usato dopo una cattura riuscita)
 * e sincronizza i flag sul sito del cliente. Idempotente: aggiorna una tranche
 * solo se ancora 'pending', così eventi/chiamate ripetute non fanno danni.
 *
 * Per il pagamento "full" si passano entrambe le tranche pendenti: l'ordine
 * viene marcato completamente pagato in un colpo solo.
 */
export async function markOrderTranchesPaid(
  admin: SupabaseClient,
  order: OrderRow,
  tranches: TrancheType[],
  nowIso: string,
): Promise<{ ok: boolean; error?: string }> {
  for (const t of tranches) {
    const { statusColumn, paidAtColumn } = trancheColumns(t);
    const { error } = await admin
      .from('orders')
      .update({ [statusColumn]: 'paid', [paidAtColumn]: nowIso })
      .eq('id', order.id)
      .eq(statusColumn, 'pending'); // idempotenza
    if (error) return { ok: false, error: error.message };
    await syncSitePaymentFlags(admin, order.client_id, t, nowIso);
  }
  return { ok: true };
}
