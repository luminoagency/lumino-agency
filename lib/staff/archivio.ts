import { createAdminClient } from '@/lib/supabase/admin'
import { staffDb } from './db'
import { senzaDemo } from './demo'
import type { DatiArchivio, FiltriArchivio, VoceArchivio } from './archivio-tipi'

/* I tipi vivono in `archivio-tipi.ts`, che non tocca niente di server: la vista
   è un componente client e questo modulo arriva a `next/headers`. Si
   riesportano perché chi legge dal server non debba sapere che la divisione
   esiste — la stessa convenzione di `lab.ts` con `lab-tipi.ts`. */
export * from './archivio-tipi'

/**
 * L'Archivio: le letture.
 *
 * Cos'è, e perché non sono le Risorse. Le Risorse sono **materiale da mostrare
 * a un cliente** — listino, manuale, demo — e le aggiunge solo l'admin. Qui
 * dentro va tutto il resto: il PDF ricevuto da un fornitore, lo screenshot di
 * una chat, la foto di un menù, la nota scritta in macchina, la vocale detta
 * uscendo da un locale. Materiale che oggi resta nel telefono di chi l'ha
 * preso e che nessuno rilegge mai.
 *
 * Quello che lo rende un archivio e non una cartella è la colonna `testo`: il
 * browser estrae il testo al caricamento — dai PDF, dalle immagini con l'OCR,
 * dalle vocali col dettato — e da lì in poi il materiale è **cercabile** (la
 * full-text di Postgres, migration 0035) e **analizzabile** (il Lab AI legge da
 * qui e cita da dove ha preso).
 */

export const BUCKET_ARCHIVIO = 'staff-archive'

/** Un'ora: l'archivio si consulta, non si rimanda a nessuno. */
const DURATA_FIRMA = 3600

/** Quante voci si caricano per pagina. Oltre, si cerca. */
export const PER_PAGINA = 40

/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * L'elenco, filtrato.
 *
 * La ricerca passa da `textSearch` con `websearch`, non da un `ilike '%q%'`.
 * Non è pignoleria: `ilike` su una colonna che contiene trenta pagine di PDF
 * scansionato legge ogni riga di ogni documento a ogni tasto premuto, e non sa
 * che «ristoranti» e «ristorante» sono la stessa parola. La `tsvector` generata
 * della 0035 è indicizzata (GIN) e pesata — il titolo conta più del testo
 * estratto — quindi la voce che si *chiama* «Menù del Bacaro» esce prima del
 * PDF in cui la parola compare a pagina dodici.
 *
 * `websearch` e non `plainto`: accetta le virgolette per la frase esatta e il
 * meno per escludere, che è la sintassi che chiunque ha già imparato altrove.
 */
export async function caricaArchivio(
  demo: boolean,
  filtri: FiltriArchivio = {},
): Promise<DatiArchivio> {
  const supabase = staffDb()

  let query = supabase
    .from('staff_archive')
    .select('*, staff_clients(nome)')
    .order('created_at', { ascending: false })
    .limit(PER_PAGINA)

  if (filtri.voce) query = query.eq('id', filtri.voce)

  const q = (filtri.q ?? '').trim()
  if (q) {
    query = query.textSearch('ricerca', q, { type: 'websearch', config: 'italian' })
  }
  if (filtri.kind) query = query.eq('kind', filtri.kind)
  if (filtri.tag) query = query.contains('tags', [filtri.tag])
  if (filtri.autore) query = query.eq('created_by', filtri.autore)
  if (filtri.cliente) query = query.eq('client_id', filtri.cliente)
  /* Le date guardano `avvenuto_il` con un ripiego su `created_at`: una voce
     senza data dell'evento non deve sparire da un filtro per periodo, perché
     una data ce l'ha comunque — quella in cui è entrata. Si fa in memoria e non
     in SQL perché un `or` su due colonne in PostgREST diventa una stringa che
     nessuno rilegge, e le righe qui sono al massimo quaranta. */

  const [righe, profili] = await Promise.all([
    query,
    supabase.from('staff_profiles').select('id, nome'),
  ])

  if (righe.error?.code === '42P01' || righe.error?.code === '42703') {
    return { voci: [], autori: [], tagInUso: [], totale: 0, conTesto: 0, mancaSchema: true }
  }

  const nomi = new Map(((profili.data ?? []) as { id: string; nome: string }[]).map((p) => [p.id, p.nome]))

  type Riga = Omit<VoceArchivio, 'indirizzo' | 'nostro' | 'cliente' | 'autore'> & {
    file_path: string | null
    file_url: string | null
    is_demo?: boolean
    staff_clients?: { nome: string } | null
  }

  let lista = senzaDemo((righe.data ?? []) as unknown as Riga[], demo)

  if (filtri.dal) lista = lista.filter((r) => quando(r) >= filtri.dal!)
  if (filtri.al) lista = lista.filter((r) => quando(r) <= filtri.al!)

  const firme = await firmaFile(lista.map((r) => r.file_path).filter(Boolean) as string[])

  const voci: VoceArchivio[] = lista.map((r) => ({
    id: r.id,
    kind: r.kind,
    titolo: r.titolo,
    nota: r.nota,
    indirizzo: r.file_path ? (firme[r.file_path] ?? null) : r.file_url,
    nostro: Boolean(r.file_path),
    mime: r.mime,
    dimensione: r.dimensione,
    testo: r.testo,
    testo_stato: r.testo_stato,
    fonte: r.fonte,
    tags: r.tags ?? [],
    client_id: r.client_id,
    cliente: r.staff_clients?.nome ?? null,
    avvenuto_il: r.avvenuto_il,
    created_at: r.created_at,
    created_by: r.created_by,
    autore: r.created_by ? (nomi.get(r.created_by) ?? null) : null,
  }))

  const sommario = await sommarioArchivio(demo)

  const autori = [...nomi.entries()]
    .map(([id, nome]) => ({ id, nome }))
    .sort((a, b) => a.nome.localeCompare(b.nome))

  return { voci, autori, ...sommario, mancaSchema: false }
}

/**
 * I tag in uso e i due conti di testa.
 *
 * Sta a parte dall'elenco perché deve ignorare i filtri: un elenco di tag che
 * si accorcia man mano che si filtra è un elenco che dopo due clic non permette
 * più di tornare indietro. Legge solo tre colonne di tutte le righe — non il
 * testo, che è la colonna pesante — quindi sono poche decine di KB anche con
 * qualche migliaio di voci.
 */
async function sommarioArchivio(
  demo: boolean,
): Promise<{ tagInUso: { tag: string; quante: number }[]; totale: number; conTesto: number }> {
  const { data } = await staffDb().from('staff_archive').select('tags, testo, is_demo').limit(5000)

  const righe = senzaDemo(
    (data ?? []) as { tags: string[] | null; testo: string | null; is_demo?: boolean }[],
    demo,
  )

  const conta = new Map<string, number>()
  for (const r of righe) {
    for (const t of r.tags ?? []) conta.set(t, (conta.get(t) ?? 0) + 1)
  }

  return {
    tagInUso: [...conta.entries()]
      .map(([tag, quante]) => ({ tag, quante }))
      .sort((a, b) => b.quante - a.quante || a.tag.localeCompare(b.tag))
      .slice(0, 40),
    totale: righe.length,
    conTesto: righe.filter((r) => (r.testo ?? '').trim().length > 0).length,
  }
}

/** La data che conta: quando è successo, o in mancanza quando è entrato. */
function quando(r: { avvenuto_il: string | null; created_at: string }): string {
  return r.avvenuto_il ?? r.created_at.slice(0, 10)
}

/**
 * Da percorsi a indirizzi guardabili, in una chiamata sola.
 *
 * Come per le foto di campo: firmare una per una vorrebbe dire quaranta viaggi
 * a Storage per disegnare un elenco. Una voce che non si firma resta senza
 * indirizzo invece di rompere la pagina — di un file sparito si vede comunque
 * il titolo, la nota e il testo estratto, che è la parte che serviva.
 */
export async function firmaFile(paths: string[]): Promise<Record<string, string>> {
  const puliti = Array.from(new Set(paths.filter(Boolean)))
  if (!puliti.length) return {}

  const { data, error } = await createAdminClient()
    .storage.from(BUCKET_ARCHIVIO)
    .createSignedUrls(puliti, DURATA_FIRMA)

  if (error || !data) return {}

  const mappa: Record<string, string> = {}
  for (const riga of data) {
    if (riga.path && riga.signedUrl) mappa[riga.path] = riga.signedUrl
  }
  return mappa
}
