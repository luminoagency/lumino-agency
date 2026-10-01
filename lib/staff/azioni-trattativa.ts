'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireStaff } from './auth'
import { MODALITA_PAGAMENTO, type ModalitaPagamento } from './pagamenti'
import type { Esito } from './actions'

/**
 * Le condizioni di una trattativa: come si incassa, e se c'è un canone.
 *
 * **Passa dalla sessione e non dal service-role**, al contrario di quasi tutte
 * le altre scritture di quest'area, e la differenza è voluta: la policy
 * `staff_deals_rw` dice `staff_owns_client(client_id)`, cioè esattamente la
 * regola che si vuole qui — il venditore sulle proprie trattative, l'admin su
 * tutte. Con la service-role avrei dovuto riscrivere quella stessa regola in
 * TypeScript, e due copie di un permesso divergono.
 *
 * **L'abbonamento non si crea da qui**: lo materializza
 * `staff_applica_accettazione()` quando il cliente accetta (migration 0038).
 * Scriverlo subito in `staff_subscriptions` vorrebbe dire un ricorrente che
 * compare in Soldi prima di essere stato venduto. Se il cliente è **già**
 * accettato, la funzione va richiamata: l'abbonamento appena concordato deve
 * comparire adesso, non al prossimo cambio di stato che non arriverà mai.
 */
export async function aggiornaCondizioni(
  dealId: string,
  clientId: string,
  dati: { modalita: string; abbonamentoMensile: string },
): Promise<Esito> {
  await requireStaff()

  const modalita = dati.modalita as ModalitaPagamento
  if (!MODALITA_PAGAMENTO.includes(modalita)) {
    return { ok: false, error: 'Modalità di pagamento non valida.' }
  }

  const grezzo = dati.abbonamentoMensile.trim().replace(',', '.')
  const canone = grezzo === '' ? null : Number(grezzo)
  if (canone !== null && (!Number.isFinite(canone) || canone < 0)) {
    return { ok: false, error: 'Il canone mensile dev’essere un numero, o niente.' }
  }

  const supabase = createClient()

  const patch: Record<string, unknown> = {
    modalita_pagamento: modalita,
    abbonamento_mensile: canone,
  }
  /* Il vincolo `staff_deals_unico_senza_saldo` rifiuta un pagamento unico con
     il saldo spuntato. Spegnerlo qui è l'unico modo di passare da 30/70 a
     «tutto subito» su una trattativa già saldata in parte senza far fallire
     l'update con un messaggio che nessuno saprebbe leggere. */
  if (modalita === '100_subito') patch.saldo_70_pagato = false

  /* `.select('id')` dopo l'update, e non per curiosità: con la RLS accesa un
     update che la policy non permette **non è un errore** — PostgREST
     risponde «ok, zero righe». Senza il conteggio, a un venditore che tocca la
     trattativa di un collega l'interfaccia direbbe «salvato». */
  const { data, error } = await supabase
    .from('staff_deals')
    .update(patch)
    .eq('id', dealId)
    .select('id')

  if (error) {
    if (error.code === '42703') {
      return { ok: false, error: 'Manca la migration 0038: eseguila e riprova.' }
    }
    return { ok: false, error: error.message }
  }
  if (!data?.length) return { ok: false, error: 'Questa trattativa non è tua.' }

  /* Idempotente e silenziosa se il cliente non è accettato: è la stessa
     funzione del trigger, e qui serve solo al caso «canone concordato dopo
     la firma». Un errore non deve far fallire il salvataggio, che è già
     avvenuto. */
  await supabase.rpc('staff_applica_accettazione', { p_client: clientId })

  revalidatePath(`/staff/clienti/${clientId}`)
  revalidatePath('/staff/soldi')
  revalidatePath('/staff/progetti')
  revalidatePath('/staff')
  return { ok: true }
}
