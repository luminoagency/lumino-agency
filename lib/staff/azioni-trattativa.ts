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

/* ═══════════════════════════════════════════════════════════════════════════
   Gli incassi
   ═══════════════════════════════════════════════════════════════════════════ */

/** Le pagine che mostrano un numero che dipende da un incasso. */
function rinfrescaSoldi(clientId: string) {
  revalidatePath(`/staff/clienti/${clientId}`)
  revalidatePath('/staff/soldi')
  revalidatePath('/staff/statistiche')
  revalidatePath('/staff/team')
  revalidatePath('/staff')
}

/**
 * «È arrivato».
 *
 * Due colonne per tre bottoni: `acconto` e `unico` scrivono le stesse
 * (`acconto_30_pagato`, `acconto_30_data`), perché col pagamento in una volta
 * la voce è una e una terza colonna direbbe la stessa cosa in un posto in più
 * — da tenere in pari, e un giorno fuori sincrono. Quale delle due si scrive
 * lo decide la chiave, e la chiave la propone `vociPagamento()`: l'interfaccia
 * non può chiedere di segnare un saldo che in quella modalità non esiste.
 *
 * La data arriva da chi incassa e non è `current_date`: un bonifico si vede il
 * lunedì ed è di venerdì, e nel grafico «mese per mese» finirebbe nel mese
 * sbagliato. Il default è oggi, ma si cambia.
 */
export async function segnaIncasso(
  dealId: string,
  clientId: string,
  chiave: 'acconto' | 'saldo' | 'unico',
  data: string,
): Promise<Esito> {
  await requireStaff()

  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return { ok: false, error: 'Data non valida.' }
  /* Un incasso nel futuro non è un incasso: è una previsione, e sommata agli
     altri farebbe un totale che non esiste in banca. */
  if (data > oggiISO()) return { ok: false, error: 'Non si può segnare un incasso futuro.' }

  const patch =
    chiave === 'saldo'
      ? { saldo_70_pagato: true, saldo_70_data: data }
      : { acconto_30_pagato: true, acconto_30_data: data }

  return scriviSulDeal(dealId, clientId, patch)
}

/** L'incasso segnato per sbaglio. Torna «da incassare», e la data sparisce. */
export async function annullaIncasso(
  dealId: string,
  clientId: string,
  chiave: 'acconto' | 'saldo' | 'unico',
): Promise<Esito> {
  await requireStaff()

  const patch =
    chiave === 'saldo'
      ? { saldo_70_pagato: false, saldo_70_data: null }
      : { acconto_30_pagato: false, acconto_30_data: null }

  return scriviSulDeal(dealId, clientId, patch)
}

async function scriviSulDeal(
  dealId: string,
  clientId: string,
  patch: Record<string, unknown>,
): Promise<Esito> {
  const { data, error } = await createClient()
    .from('staff_deals')
    .update(patch)
    .eq('id', dealId)
    .select('id')

  if (error) return { ok: false, error: error.message }
  /* Con la RLS accesa un update che la policy non permette **non è un errore**:
     PostgREST risponde «ok, zero righe». Senza il conteggio, a chi tocca la
     trattativa di un collega l'interfaccia direbbe «segnato». */
  if (!data?.length) return { ok: false, error: 'Questa trattativa non è tua.' }

  rinfrescaSoldi(clientId)
  return { ok: true }
}

/* ── I canoni ──────────────────────────────────────────────────────────────
   Un abbonamento si incassa ogni mese, quindi non c'è una spunta da accendere
   ma una riga da aggiungere: vedi il commento in cima alla 0039. */

/** Il primo del mese di `data`, in ISO. È la chiave del mese di competenza. */
function primoDelMese(data: string): string {
  return `${data.slice(0, 7)}-01`
}

function oggiISO(): string {
  /* `toISOString()` passa da UTC: alle 23 di sera in Italia darebbe domani.
     Le tre parti si prendono dal fuso locale e si rimettono in fila. */
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const g = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${g}`
}

/**
 * Il canone del mese, incassato.
 *
 * `mese` è quello di competenza (il primo del mese), `data` quando i soldi
 * sono arrivati davvero: sono due cose diverse e il grafico degli incassi
 * guarda la seconda. L'importo si fotografa adesso dalla riga
 * dell'abbonamento, e non si legge al volo dopo: se il canone viene
 * rinegoziato a marzo, i mesi di gennaio e febbraio devono restare quelli che
 * sono stati davvero incassati.
 */
export async function segnaCanone(
  subscriptionId: string,
  clientId: string,
  mese: string,
  data: string,
): Promise<Esito> {
  const me = await requireStaff()

  if (!/^\d{4}-\d{2}-\d{2}$/.test(mese) || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return { ok: false, error: 'Data non valida.' }
  }
  if (data > oggiISO()) return { ok: false, error: 'Non si può segnare un incasso futuro.' }

  const supabase = createClient()

  const { data: abb, error: errAbb } = await supabase
    .from('staff_subscriptions')
    .select('id, importo_mensile, is_demo')
    .eq('id', subscriptionId)
    .maybeSingle()

  if (errAbb) return { ok: false, error: errAbb.message }
  if (!abb) return { ok: false, error: 'Questo abbonamento non è tuo.' }

  const { error } = await supabase.from('staff_subscription_payments').insert({
    subscription_id: subscriptionId,
    mese: primoDelMese(mese),
    importo: Number(abb.importo_mensile ?? 0),
    incassato_il: data,
    created_by: me.id,
    is_demo: abb.is_demo ?? false,
  })

  if (error) {
    /* 23505: il vincolo di unicità. Non è un guasto, è il bottone premuto due
       volte — da due schede aperte, o da due persone. */
    if (error.code === '23505') return { ok: false, error: 'Questo mese era già segnato.' }
    if (error.code === '42P01') {
      return { ok: false, error: 'Manca la migration 0039: eseguila e riprova.' }
    }
    return { ok: false, error: error.message }
  }

  rinfrescaSoldi(clientId)
  return { ok: true }
}

/** Il canone segnato per sbaglio: la riga del mese se ne va. */
export async function annullaCanone(
  subscriptionId: string,
  clientId: string,
  mese: string,
): Promise<Esito> {
  await requireStaff()

  const { data, error } = await createClient()
    .from('staff_subscription_payments')
    .delete()
    .eq('subscription_id', subscriptionId)
    .eq('mese', primoDelMese(mese))
    .select('id')

  if (error) return { ok: false, error: error.message }
  if (!data?.length) return { ok: false, error: 'Questo mese non risultava incassato.' }

  rinfrescaSoldi(clientId)
  return { ok: true }
}
