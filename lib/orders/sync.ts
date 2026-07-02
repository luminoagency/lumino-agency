import type { SupabaseClient } from '@supabase/supabase-js';
import type { TrancheType } from './tranche';

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
