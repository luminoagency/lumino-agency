import { staffDb } from './db'
import { senzaDemo } from './demo'
import { firmaFoto } from './storage'
import {
  STAFF_COUNTRY,
  quandoOre,
  type ClienteRiga,
  type FollowupRiga,
  type ReportRiga,
  type Settore,
  type Stato,
  type TipoAttivita,
} from './types'

/* `*` e non un elenco di colonne: serve leggere anche `is_demo`, che arriva
   con la migration 0031, e nominarla farebbe fallire la query su un database
   dove non è ancora passata. Le colonne in più non danno fastidio a nessuno —
   sono righe corte e sono centinaia. */
const CAMPI_CLIENTE = '*'

export interface ElencoClienti {
  clienti: ClienteRiga[]
  /** Il valore in campo per cliente: il chiuso se c'è, altrimenti il proposto. */
  prezzi: Record<string, number | null>
  venditori: { id: string; nome: string }[]
  zone: string[]
  mancaSchema: boolean
}

/**
 * L'elenco che alimenta pipeline e vista a lista.
 *
 * Tre query e non una join: PostgREST restituirebbe il deal annidato dentro
 * ogni cliente, e con più trattative per cliente andrebbe comunque appiattito
 * qui. Tanto vale leggerle in parallelo e incrociarle in memoria — sono
 * centinaia di righe, non milioni.
 *
 * Le zone e i venditori si ricavano dai dati veri: un elenco di zone scritto a
 * mano diventa sbagliato al primo cliente in un paese nuovo.
 */
export async function caricaClienti(demo: boolean): Promise<ElencoClienti> {
  const supabase = staffDb()

  const [clienti, deals, profili] = await Promise.all([
    supabase
      .from('staff_clients')
      .select(CAMPI_CLIENTE)
      .eq('country', STAFF_COUNTRY)
      .order('created_at', { ascending: false }),
    supabase.from('staff_deals').select('client_id, prezzo_proposto, prezzo_chiuso'),
    supabase.from('staff_profiles').select('id, nome').eq('attivo', true).order('nome'),
  ])

  const righe = senzaDemo((clienti.data ?? []) as unknown as ClienteRiga[], demo)

  const prezzi: Record<string, number | null> = {}
  for (const d of (deals.data ?? []) as {
    client_id: string
    prezzo_proposto: number | null
    prezzo_chiuso: number | null
  }[]) {
    prezzi[d.client_id] = d.prezzo_chiuso ?? d.prezzo_proposto ?? prezzi[d.client_id] ?? null
  }
  /* Il prezzo consigliato è l'ultima spiaggia: meglio un numero indicativo che
     una card muta, purché non ci sia già una trattativa vera. */
  for (const c of righe) {
    if (prezzi[c.id] == null) prezzi[c.id] = c.prezzo_consigliato
  }

  const zone = Array.from(
    new Set(righe.map((c) => c.zona ?? c.citta).filter((z): z is string => Boolean(z))),
  ).sort((a, b) => a.localeCompare(b, 'it'))

  return {
    clienti: righe,
    prezzi,
    venditori: (profili.data ?? []) as { id: string; nome: string }[],
    zone,
    mancaSchema: [clienti, deals, profili].some((r) => r.error?.code === '42P01'),
  }
}

/** L'avviso che compare finché la migration 0030 non è passata. */
export const AVVISO_SCHEMA =
  'Le tabelle dell’area staff non esistono ancora su questo database: esegui supabase/migrations/0030_staff_dashboard.sql nell’SQL editor di Supabase.'

/* ═══════════════════════════════════════════════════════════════════════════
   Campo e follow-up (F3)
   ═══════════════════════════════════════════════════════════════════════════ */

/** Il cliente come lo vede il selettore della visita: poco, e tutto utile. */
export interface ClienteScelta {
  id: string
  nome: string
  settore: Settore
  citta: string | null
  zona: string | null
  indirizzo: string | null
  telefono: string | null
  stato: Stato
}

/** Una visita già registrata, col nome del cliente attaccato. */
export interface VisitaRiga extends ReportRiga {
  cliente: string
  settore: Settore | null
  citta: string | null
}

/** Un richiamo, col nome e il telefono di chi va richiamato. */
export interface FollowupVista extends FollowupRiga {
  cliente: string
  telefono: string | null
}

export interface DatiCampo {
  visite: VisitaRiga[]
  /** Percorso della foto → URL firmato. Vale un'ora. */
  foto: Record<string, string>
  daFare: FollowupVista[]
  fatti: FollowupVista[]
  mancaSchema: boolean
}

/**
 * Quello che serve alla pagina Campo.
 *
 * Le visite si fermano a venti e i follow-up chiusi a dieci: questa pagina si
 * apre col telefono in mano, spesso in strada, e un elenco infinito costa
 * banda e non serve a nessuno. Lo storico completo di un cliente sta nella sua
 * scheda, che è il posto giusto per cercarlo.
 *
 * Le foto si firmano tutte insieme alla fine, una chiamata sola per l'intera
 * schermata (vedi storage.ts).
 */
export async function caricaCampo(demo: boolean): Promise<DatiCampo> {
  const supabase = staffDb()

  const [reports, aperti, chiusi] = await Promise.all([
    supabase
      .from('staff_field_reports')
      .select(`${CAMPI_REPORT}, staff_clients ( nome, settore, citta )`)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('staff_followups')
      .select('*, staff_clients ( nome, telefono )')
      .eq('fatto', false)
      .order('data', { ascending: true })
      .limit(50),
    supabase
      .from('staff_followups')
      .select('*, staff_clients ( nome, telefono )')
      .eq('fatto', true)
      .order('data', { ascending: false })
      .limit(10),
  ])

  const visite = senzaDemo(reports.data ?? [], demo).map((r) => {
    const { staff_clients: embed, ...resto } = r as Record<string, unknown> & {
      staff_clients: unknown
    }
    const c = primo(embed) as { nome?: string; settore?: Settore; citta?: string } | null
    return {
      ...(resto as unknown as ReportRiga),
      cliente: c?.nome ?? 'Cliente',
      settore: c?.settore ?? null,
      citta: c?.citta ?? null,
    }
  })

  return {
    visite,
    foto: await firmaFoto(visite.flatMap((v) => v.foto ?? [])),
    daFare: followup(senzaDemo(aperti.data ?? [], demo)),
    fatti: followup(senzaDemo(chiusi.data ?? [], demo)),
    mancaSchema: [reports, aperti, chiusi].some((r) => r.error?.code === '42P01'),
  }
}

/**
 * I clienti fra cui scegliere all'inizio di una visita.
 *
 * Li ordina per nome e non per data: qui non si guarda cos'è successo di
 * recente, si cerca il locale che si ha davanti, e lo si cerca per come si
 * chiama.
 */
export async function clientiPerVisita(
  demo: boolean,
): Promise<{ clienti: ClienteScelta[]; mancaSchema: boolean }> {
  const supabase = staffDb()

  const { data, error } = await supabase
    .from('staff_clients')
    .select('*')
    .eq('country', STAFF_COUNTRY)
    .order('nome')
    .limit(1000)

  return {
    clienti: senzaDemo((data ?? []) as unknown as ClienteScelta[], demo),
    mancaSchema: error?.code === '42P01',
  }
}

/** I report di campo di un cliente solo: è la card della sua scheda. */
export async function reportDiCliente(
  clientId: string,
): Promise<{ visite: ReportRiga[]; foto: Record<string, string> }> {
  const supabase = staffDb()

  const { data } = await supabase
    .from('staff_field_reports')
    .select(CAMPI_REPORT)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(10)

  const visite = (data ?? []) as unknown as ReportRiga[]
  return { visite, foto: await firmaFoto(visite.flatMap((v) => v.foto ?? [])) }
}

/** I richiami aperti di un cliente solo, per la sua scheda. */
export async function followupDiCliente(clientId: string): Promise<FollowupRiga[]> {
  const supabase = staffDb()

  const { data } = await supabase
    .from('staff_followups')
    .select('id, client_id, user_id, data, nota, fatto')
    .eq('client_id', clientId)
    .order('fatto')
    .order('data', { ascending: true })
    .limit(10)

  return (data ?? []) as unknown as FollowupRiga[]
}

/* ─────────────────────────────────────────────────────────────────────────── */

const CAMPI_REPORT = '*'

/**
 * La tabella collegata, appiattita.
 *
 * supabase-js non conosce i vincoli del database e dichiara ogni relazione
 * come possibile array: qui si prende la prima riga e si va avanti, invece di
 * spargere `Array.isArray` in ogni componente.
 */
function primo(embed: unknown): unknown {
  if (!embed) return null
  return Array.isArray(embed) ? (embed[0] ?? null) : embed
}

function followup(righe: unknown[] | null): FollowupVista[] {
  return (righe ?? []).map((r) => {
    const { staff_clients: embed, ...resto } = r as Record<string, unknown> & {
      staff_clients: unknown
    }
    const c = primo(embed) as { nome?: string; telefono?: string } | null
    return {
      ...(resto as unknown as FollowupRiga),
      cliente: c?.nome ?? 'Cliente',
      telefono: c?.telefono ?? null,
    }
  })
}

/* ═══════════════════════════════════════════════════════════════════════════
   Il flusso del team (la card nera della home)
   ═══════════════════════════════════════════════════════════════════════════ */

export interface VoceFlusso {
  id: string
  tipo: TipoAttivita
  testo: string | null
  quando: string
  cliente: string
  clientId: string
  chi: string
}

/**
 * Le ultime cose fatte, da chiunque le abbia fatte.
 *
 * Due query e non una join a tre tavoli: il nome del cliente lo porta l'embed
 * (`staff_clients` è l'unica relazione annidata che quest'area usa), il nome di
 * chi ha agito lo si incrocia in memoria su un elenco di profili che è lungo
 * quanto il team. Chiedere a PostgREST due relazioni annidate costringerebbe
 * anche il finto client dell'anteprima a saperle gestire, per risparmiare una
 * `Map` di tre righe.
 *
 * Il «quando» si calcola **qui, sul server**, e arriva al browser già a parole.
 * Calcolarlo nel componente vorrebbe dire che il server scrive «2 ore fa» e il
 * browser, un istante dopo, «3 ore fa»: è un errore di idratazione, e su una
 * card che si chiama flusso sarebbe anche l'unica riga sbagliata visibile.
 *
 * Non è tempo reale con la maiuscola: la home è `force-dynamic`, quindi ogni
 * caricamento è aggiornato. Un canale realtime di Supabase per una card che si
 * guarda entrando costerebbe una connessione aperta tutto il giorno per
 * anticipare un `F5`.
 */
export async function flussoTeam(demo: boolean, quante = 7): Promise<VoceFlusso[]> {
  const supabase = staffDb()

  const [attivita, profili] = await Promise.all([
    supabase
      .from('staff_activities')
      .select('*, staff_clients ( nome )')
      .order('data', { ascending: false })
      .limit(quante * 3),
    supabase.from('staff_profiles').select('id, nome'),
  ])

  const nomi = new Map(
    ((profili.data ?? []) as { id: string; nome: string }[]).map((p) => [p.id, p.nome]),
  )

  return senzaDemo(attivita.data ?? [], demo)
    .slice(0, quante)
    .map((riga) => {
      const r = riga as Record<string, unknown> & { staff_clients: unknown }
      const c = primo(r.staff_clients) as { nome?: string } | null
      return {
        id: String(r.id),
        tipo: (r.tipo as TipoAttivita) ?? 'nota',
        testo: (r.testo as string) ?? null,
        quando: quandoOre(String(r.data ?? r.created_at)),
        cliente: c?.nome ?? 'Cliente',
        clientId: String(r.client_id),
        chi: nomi.get(String(r.user_id)) ?? '·',
      }
    })
}
