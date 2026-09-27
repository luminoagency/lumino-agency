/**
 * Vocabolario della dashboard staff.
 *
 * I valori sono quelli dei check constraint in
 * supabase/migrations/0030_staff_dashboard.sql: cambiarli qui senza cambiarli
 * là produce un insert rifiutato dal database, non un bug silenzioso.
 * Le etichette sono italiane perché l'interfaccia è italiana; i valori restano
 * in snake_case perché sono dati.
 */

export const STATI = [
  'da_contattare',
  'contattato',
  'in_trattativa',
  'preventivo_inviato',
  'accettato',
  'rifiutato',
  'in_pausa',
] as const
export type Stato = (typeof STATI)[number]

export const STATO_LABEL: Record<Stato, string> = {
  da_contattare: 'Da contattare',
  contattato: 'Contattato',
  in_trattativa: 'In trattativa',
  preventivo_inviato: 'Preventivo inviato',
  accettato: 'Accettato',
  rifiutato: 'Rifiutato',
  in_pausa: 'In pausa',
}

export const SETTORI = ['ristorante', 'bar', 'hotel', 'estetista', 'barbiere', 'altro'] as const
export type Settore = (typeof SETTORI)[number]

export const SETTORE_LABEL: Record<Settore, string> = {
  ristorante: 'Ristorante',
  bar: 'Bar',
  hotel: 'Hotel',
  estetista: 'Estetista',
  barbiere: 'Barbiere',
  altro: 'Altro',
}

export const FASI_PROGETTO = ['brief', 'design', 'sviluppo', 'revisione', 'online'] as const
export type FaseProgetto = (typeof FASI_PROGETTO)[number]

export const PACCHETTI = ['basic', 'pro', 'premium'] as const
export type Pacchetto = (typeof PACCHETTI)[number]

export type StaffRole = 'admin' | 'sales'

export interface StaffProfile {
  id: string
  nome: string
  email: string | null
  telefono: string | null
  role: StaffRole
  attivo: boolean
  obiettivo_mensile: number | null
  provvigione_pct: number | null
}

/**
 * Il filtro nascosto.
 *
 * Si vende solo in Italia, ma `country` e `currency` sono nel database da
 * subito: il giorno del Marocco si accende un selettore, non si rifà lo
 * storico. Fino a quel giorno ogni lettura passa da qui — così quando il
 * filtro diventa visibile c'è un solo punto da toccare.
 */
export const STAFF_COUNTRY = 'IT'

/**
 * Formattazione dei soldi: sempre questa, mai un toFixed sparso.
 *
 * `useGrouping: true` esplicito perché in italiano ICU raggruppa solo da cinque
 * cifre in su: lasciato all'automatico si leggerebbe "3640 €" sopra "12.345 €",
 * due stili di numero nella stessa colonna.
 */
export function euro(value: number | null | undefined): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
    useGrouping: true,
  }).format(value ?? 0)
}

export const SITI = ['nessuno', 'solo_social', 'vecchio', 'ok'] as const
export type SitoAttuale = (typeof SITI)[number]

export const SITO_LABEL: Record<SitoAttuale, string> = {
  nessuno: 'Nessun sito',
  solo_social: 'Solo social',
  vecchio: 'Sito vecchio',
  ok: 'Sito a posto',
}

export const TIPI_ATTIVITA = ['visita', 'chiamata', 'messaggio', 'nota'] as const
export type TipoAttivita = (typeof TIPI_ATTIVITA)[number]

export const ATTIVITA_LABEL: Record<TipoAttivita, string> = {
  visita: 'Visita',
  chiamata: 'Chiamata',
  messaggio: 'Messaggio',
  nota: 'Nota',
}

export const PACCHETTO_LABEL: Record<Pacchetto, string> = {
  basic: 'Basic',
  pro: 'Pro',
  premium: 'Premium',
}

export const FASE_LABEL: Record<FaseProgetto, string> = {
  brief: 'Brief',
  design: 'Design',
  sviluppo: 'Sviluppo',
  revisione: 'Revisione',
  online: 'Online',
}

/**
 * Gli stati nell'ordine in cui compaiono sul kanban.
 *
 * È l'ordine del funnel, non l'alfabetico: `rifiutato` e `in_pausa` stanno in
 * fondo perché sono uscite, non tappe. STATI resta la fonte dei valori validi
 * (è allineato al check constraint), questo è solo come si dispongono.
 */
export const STATI_BOARD = STATI

/** Data breve all'italiana: 4 set, 12 dic. */
export function dataBreve(value: string | null | undefined): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short' }).format(
    new Date(value),
  )
}

/** Data lunga: 4 settembre 2026. */
export function dataLunga(value: string | null | undefined): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

/** La riga di cliente come la leggono pipeline, lista e scheda. */
export interface ClienteRiga {
  id: string
  nome: string
  settore: Settore
  citta: string | null
  zona: string | null
  indirizzo: string | null
  referente: string | null
  telefono: string | null
  email: string | null
  instagram: string | null
  sito_attuale: SitoAttuale | null
  note_sito: string | null
  stato: Stato
  motivo_rifiuto: string | null
  assegnato_a: string | null
  prezzo_consigliato: number | null
  voto_sito: number | null
  fonte: string
  created_at: string
}
