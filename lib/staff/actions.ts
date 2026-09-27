'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireStaff } from './auth'
import { SETTORI, SITI, STATI, type Settore, type SitoAttuale, type Stato } from './types'

/**
 * Le scritture dell'area staff.
 *
 * Tutte passano da requireStaff(): non per decidere *cosa* può fare chi — quello
 * lo decide la RLS nel database, che non si può dimenticare — ma per non
 * lasciare che una POST senza sessione arrivi fino a Postgres.
 *
 * Nessuna di queste funzioni sceglie `assegnato_a` per conto proprio quando
 * chi scrive è un venditore: la policy di insert accetta solo righe intestate a
 * sé, quindi qui si scrive l'unico valore che passerebbe comunque.
 */

export interface Esito {
  ok: boolean
  error?: string
  /** Quante righe sono entrate davvero (import). */
  n?: number
}

/**
 * Sposta un cliente di stato — è quello che fa il drag & drop del kanban.
 *
 * Il motivo del rifiuto è obbligatorio e lo è due volte: qui, per dare un
 * messaggio comprensibile, e nel check constraint della tabella, perché una
 * regola che vive solo nell'interfaccia non è una regola. Uscendo da
 * "rifiutato" il motivo si azzera: tenerselo appiccicato a un cliente tornato
 * in trattativa è il modo più rapido di leggere lo storico al contrario.
 */
export async function cambiaStato(id: string, stato: Stato, motivo?: string): Promise<Esito> {
  await requireStaff()

  if (!STATI.includes(stato)) return { ok: false, error: 'Stato non valido.' }

  const pulito = (motivo ?? '').trim()
  if (stato === 'rifiutato' && !pulito) {
    return { ok: false, error: 'Serve il motivo del rifiuto.' }
  }

  const supabase = createClient()
  const { error } = await supabase
    .from('staff_clients')
    .update({
      stato,
      motivo_rifiuto: stato === 'rifiutato' ? pulito.slice(0, 500) : null,
    })
    .eq('id', id)

  if (error) return { ok: false, error: messaggio(error.message) }

  revalidatePath('/staff/pipeline')
  revalidatePath('/staff/clienti')
  revalidatePath(`/staff/clienti/${id}`)
  revalidatePath('/staff')
  return { ok: true }
}

export interface NuovoCliente {
  nome: string
  settore: string
  citta?: string
  zona?: string
  indirizzo?: string
  referente?: string
  telefono?: string
  email?: string
  instagram?: string
  sito_attuale?: string
  note_sito?: string
  stato?: string
  prezzo_consigliato?: string
  assegnato_a?: string
}

export async function creaCliente(dati: NuovoCliente): Promise<Esito & { id?: string }> {
  const me = await requireStaff()

  const nome = (dati.nome ?? '').trim()
  if (!nome) return { ok: false, error: 'Il nome è obbligatorio.' }

  const supabase = createClient()
  const { data, error } = await supabase
    .from('staff_clients')
    .insert(riga(dati, me.id, me.role === 'admin'))
    .select('id')
    .single()

  if (error) return { ok: false, error: messaggio(error.message) }

  revalidatePath('/staff/pipeline')
  revalidatePath('/staff/clienti')
  return { ok: true, id: data?.id }
}

/**
 * Import CSV.
 *
 * Il file lo legge e lo mappa il browser: mandare qui un CSV grezzo vorrebbe
 * dire riscrivere un parser sul server per un dato che l'utente ha già visto
 * in anteprima. Qui arrivano righe già in colonne, e vengono comunque
 * ricontrollate — i valori fuori vocabolario diventano il default invece di
 * far fallire tutto l'import per una cella scritta male.
 *
 * L'inserimento è unico: 300 righe in una insert invece di 300 chiamate, e
 * soprattutto o entrano tutte o nessuna. Un import a metà è peggio di un
 * import fallito, perché non si sa da dove ripartire.
 */
export async function importaClienti(righe: NuovoCliente[]): Promise<Esito> {
  const me = await requireStaff()

  if (!Array.isArray(righe) || righe.length === 0) {
    return { ok: false, error: 'Nessuna riga da importare.' }
  }
  if (righe.length > 500) {
    return { ok: false, error: 'Massimo 500 righe per import. Dividi il file.' }
  }

  const admin = me.role === 'admin'
  const valide = righe
    .filter((r) => (r.nome ?? '').trim().length > 0)
    .map((r) => riga(r, me.id, admin))

  if (!valide.length) return { ok: false, error: 'Nessuna riga ha un nome.' }

  const supabase = createClient()
  const { error } = await supabase.from('staff_clients').insert(valide)

  if (error) return { ok: false, error: messaggio(error.message) }

  revalidatePath('/staff/pipeline')
  revalidatePath('/staff/clienti')
  return { ok: true, n: valide.length }
}

/* ─────────────────────────────────────────────────────────────────────────── */

/** Una riga pulita e dentro il vocabolario, pronta per l'insert. */
function riga(dati: NuovoCliente, meId: string, admin: boolean) {
  const stato = dentro(dati.stato, STATI, 'da_contattare') as Stato
  const prezzo = Number(String(dati.prezzo_consigliato ?? '').replace(',', '.'))

  return {
    nome: (dati.nome ?? '').trim().slice(0, 200),
    settore: dentro(dati.settore, SETTORI, 'altro') as Settore,
    citta: testo(dati.citta),
    zona: testo(dati.zona),
    indirizzo: testo(dati.indirizzo),
    referente: testo(dati.referente),
    telefono: testo(dati.telefono),
    email: testo(dati.email),
    instagram: testo(dati.instagram),
    sito_attuale: dati.sito_attuale
      ? (dentro(dati.sito_attuale, SITI, 'nessuno') as SitoAttuale)
      : null,
    note_sito: testo(dati.note_sito),
    /* Un import non può creare rifiuti: il motivo è obbligatorio e in un CSV
       non c'è. Lo stato scivola all'inizio del funnel. */
    stato: stato === 'rifiutato' ? 'da_contattare' : stato,
    prezzo_consigliato: Number.isFinite(prezzo) && prezzo > 0 ? prezzo : null,
    /* Un venditore può intestare solo a sé: la policy di insert rifiuterebbe
       qualunque altro valore, quindi non si prova nemmeno. */
    assegnato_a: admin ? (testo(dati.assegnato_a) ?? meId) : meId,
  }
}

function testo(value: string | undefined | null): string | null {
  const v = (value ?? '').trim()
  return v ? v.slice(0, 500) : null
}

function dentro(value: string | undefined, valori: readonly string[], fallback: string): string {
  const v = (value ?? '').trim().toLowerCase().replace(/\s+/g, '_')
  return valori.includes(v) ? v : fallback
}

/** Gli errori di Postgres tradotti nelle due cose che possono succedere qui. */
function messaggio(raw: string): string {
  if (raw.includes('42P01')) {
    return 'Le tabelle dell’area staff non esistono ancora: esegui la migration 0030.'
  }
  if (raw.toLowerCase().includes('row-level security')) {
    return 'Non hai i permessi per questa operazione.'
  }
  if (raw.includes('staff_clients_motivo_rifiuto')) {
    return 'Serve il motivo del rifiuto.'
  }
  return raw
}
