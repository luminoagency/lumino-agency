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

/**
 * I tre livelli, dal più alto.
 *
 * `owner` è uno solo (migration 0040) e non si assegna dall'interfaccia: è chi
 * gestisce la squadra e decide i permessi. `admin` vede il lavoro di tutti ma
 * è **regolabile** dall'owner, ed è il motivo per cui owner non è semplicemente
 * un admin con un titolo diverso. `sales` vede i propri clienti.
 *
 * Per sapere se qualcuno ha i poteri da amministratore non si confronta questa
 * stringa con 'admin': si chiama `eAdmin()` in `lib/staff/permessi.ts`. Un
 * `role === 'admin'` sparso nel codice è un posto in cui l'owner perde i suoi
 * stessi permessi.
 */
export type StaffRole = 'owner' | 'admin' | 'sales'

export interface StaffProfile {
  id: string
  nome: string
  email: string | null
  telefono: string | null
  role: StaffRole
  attivo: boolean
  obiettivo_mensile: number | null
  provvigione_pct: number | null
  /* ── migration 0033 ──
     `ruolo_titolo` NON è `role`, ed è il motivo per cui sono due campi: `role`
     vale 'admin' | 'sales' e decide cosa si vede (lo legge la RLS), mentre
     questo è il biglietto da visita — «CCO», «Head of Sales» — e non decide
     niente. Con una colonna sola, rinominare un ruolo in azienda toglierebbe a
     qualcuno l'accesso ai margini. */
  ruolo_titolo: string | null
  /** La riga sotto il saluto. Se manca, la scrive l'ora del giorno. */
  saluto_custom: string | null
  /** Un **percorso** dentro il bucket privato `staff-avatars`, non un URL. */
  foto_url: string | null
  /* ── migration 0037 ──
     Chi può aprire «Nuovo membro», cioè creare credenziali. Non è `role`, e
     non si eredita da `role`: un admin creato dalla dashboard non deve poter
     creare a sua volta altri account, altrimenti il permesso si propaga da
     solo. Da sola non basta più a decidere chi apre il pannello Team: con la
     0040 quel cancello è `role === 'owner'`, e questa colonna è rimasta a
     essere la stessa cosa detta due volte — il pannello controlla entrambe. */
  puo_creare_membri: boolean
  /* ── migration 0040 ──
     I quattro permessi che l'owner regola per ogni membro. Non si eredita
     niente da `role`: un admin senza `can_view_soldi` non vede i soldi, ed è
     esattamente il punto. Qui sono quattro booleani perché così li legge la
     RLS — la stessa regola, nel punto in cui non si può aggirare. */
  can_view_soldi: boolean
  can_view_incassi: boolean
  can_manage_clients: boolean
  can_view_trattative: boolean
}

/** Il nome con il titolo davanti: «CCO Ratib». Senza titolo, solo il nome. */
export function nomeConTitolo(p: Pick<StaffProfile, 'nome' | 'ruolo_titolo'>): string {
  const primo = p.nome.trim().split(/\s+/)[0] ?? p.nome
  return p.ruolo_titolo ? `${p.ruolo_titolo} ${primo}` : primo
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

/**
 * Le etichette corte per i grafici.
 *
 * Non si ricavano tagliando quelle lunghe alla prima parola: «In trattativa» e
 * «In pausa» diventerebbero due colonne chiamate «In», che oltre a essere
 * illeggibili sono la stessa chiave React due volte.
 */
export const STATO_CORTO: Record<Stato, string> = {
  da_contattare: 'Da fare',
  contattato: 'Contattati',
  in_trattativa: 'Trattativa',
  preventivo_inviato: 'Preventivo',
  accettato: 'Accettati',
  rifiutato: 'Rifiutati',
  in_pausa: 'In pausa',
}

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
  /* ── migration 0041 ──
     Perché le coordinate ci sono o non ci sono. Serve a una cosa sola, ed è la
     ragione per cui non basta guardare `lat is null`: distinguere «non c'è un
     indirizzo da cercare» da «l'indirizzo c'è e non si trova». Il secondo è un
     errore di scrittura, e la scheda lo deve dire — nessun altro se ne
     accorgerà, perché un cliente che manca da una mappa non si vede mancare. */
  geo_stato?: GeoStato | null
}

/** Vedi `lib/staff/geocode.ts`: qui è un re-export per non importare due file. */
export type GeoStato = 'ok' | 'non_trovato' | 'assente' | 'da_fare'

/* ═══════════════════════════════════════════════════════════════════════════
   Campo (F3)

   Le colonne di staff_field_reports sono text[] e text senza check constraint:
   il vocabolario qui sotto è una proposta, non un cancello. È voluto — davanti
   a un bar si scopre sempre un modo di lavorare che nessuno aveva previsto, e
   un insert rifiutato in mezzo a una visita costa più di un valore fuori
   elenco. I campi liberi accanto ai chip servono proprio a quello.
   ═══════════════════════════════════════════════════════════════════════════ */

export const GESTIONI = [
  'telefono',
  'whatsapp',
  'di_persona',
  'thefork',
  'booking',
  'instagram',
  'quaderno',
  'nessuna',
] as const
export type Gestione = (typeof GESTIONI)[number]

export const GESTIONE_LABEL: Record<Gestione, string> = {
  telefono: 'Telefono',
  whatsapp: 'WhatsApp',
  di_persona: 'Di persona',
  thefork: 'TheFork',
  booking: 'Booking',
  instagram: 'Instagram',
  quaderno: 'Quaderno',
  nessuna: 'Non prenota',
}

export const STRUMENTI = [
  'nessuno',
  'sito_proprio',
  'facebook',
  'instagram',
  'google_business',
  'thefork',
  'booking',
  'menu_qr',
  'gestionale',
  'volantini',
] as const
export type Strumento = (typeof STRUMENTI)[number]

export const STRUMENTO_LABEL: Record<Strumento, string> = {
  nessuno: 'Niente',
  sito_proprio: 'Sito suo',
  facebook: 'Facebook',
  instagram: 'Instagram',
  google_business: 'Scheda Google',
  thefork: 'TheFork',
  booking: 'Booking',
  menu_qr: 'Menù QR',
  gestionale: 'Gestionale',
  volantini: 'Volantini',
}

export const LINGUE = [
  'italiano',
  'inglese',
  'tedesco',
  'francese',
  'spagnolo',
  'arabo',
  'russo',
] as const
export type Lingua = (typeof LINGUE)[number]

export const LINGUA_LABEL: Record<Lingua, string> = {
  italiano: 'Italiano',
  inglese: 'Inglese',
  tedesco: 'Tedesco',
  francese: 'Francese',
  spagnolo: 'Spagnolo',
  arabo: 'Arabo',
  russo: 'Russo',
}

/**
 * Com'è andata, in cinque gradini.
 *
 * Cinque e non tre: fra "interessato" e "chiuso" ci sta tutta la differenza
 * fra un cliente da richiamare la settimana prossima e uno da lasciar perdere,
 * e una scala a tre la appiattisce.
 */
export const REAZIONI = ['entusiasta', 'interessato', 'tiepido', 'diffidente', 'chiuso'] as const
export type Reazione = (typeof REAZIONI)[number]

export const REAZIONE_LABEL: Record<Reazione, string> = {
  entusiasta: 'Entusiasta',
  interessato: 'Interessato',
  tiepido: 'Tiepido',
  diffidente: 'Diffidente',
  chiuso: 'Chiuso',
}

export const OBIEZIONI = [
  'prezzo',
  'non_ho_tempo',
  'ho_gia_un_sito',
  'ci_pensa_un_parente',
  'non_mi_serve',
  'decide_un_altro',
  'fine_stagione',
  'ci_devo_pensare',
] as const
export type Obiezione = (typeof OBIEZIONI)[number]

export const OBIEZIONE_LABEL: Record<Obiezione, string> = {
  prezzo: 'Costa troppo',
  non_ho_tempo: 'Non ho tempo',
  ho_gia_un_sito: 'Ho già un sito',
  ci_pensa_un_parente: 'Ci pensa un parente',
  non_mi_serve: 'Non mi serve',
  decide_un_altro: 'Decide un altro',
  fine_stagione: 'Fine stagione',
  ci_devo_pensare: 'Ci devo pensare',
}

/** Il report di campo come lo legge l'interfaccia. */
export interface ReportRiga {
  id: string
  client_id: string
  user_id: string | null
  gestione_prenotazioni: string[]
  strumenti_usati: string[]
  lingue_clienti: string[]
  commissioni_pagate: number | null
  turisti: boolean | null
  problemi_dichiarati: string | null
  reazione: string | null
  obiezione_principale: string | null
  frase_titolare: string | null
  trascrizione_vocale: string | null
  foto: string[]
  lat: number | null
  lng: number | null
  created_at: string
}

/** Il follow-up come lo legge l'interfaccia. */
export interface FollowupRiga {
  id: string
  client_id: string
  user_id: string | null
  data: string
  nota: string | null
  fatto: boolean
}

/**
 * L'etichetta di un valore che potrebbe non essere in elenco.
 *
 * Serve perché questi campi accettano testo libero: un valore scritto a mano
 * deve comunque leggersi come una parola, non sparire perché non ha una voce
 * nel dizionario.
 */
export function etichetta(value: string, dizionario: Record<string, string>): string {
  return dizionario[value] ?? value.replace(/_/g, ' ')
}

/** Oggi in formato ISO corto, il formato delle colonne `date`. */
export function oggiISO(giorniAvanti = 0): string {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() + giorniAvanti)
  return d.toISOString().slice(0, 10)
}

/** "oggi", "domani", "in ritardo di 3 giorni": la distanza da oggi, a parole. */
export function quando(data: string): { testo: string; tardi: boolean } {
  const giorni = Math.round(
    (new Date(`${data}T12:00:00`).getTime() - new Date(`${oggiISO()}T12:00:00`).getTime()) /
      86_400_000,
  )
  if (giorni === 0) return { testo: 'oggi', tardi: false }
  if (giorni === 1) return { testo: 'domani', tardi: false }
  if (giorni === -1) return { testo: 'ieri', tardi: true }
  if (giorni < 0) return { testo: `${-giorni} giorni fa`, tardi: true }
  return { testo: `fra ${giorni} giorni`, tardi: false }
}

/**
 * Quanto tempo è passato, a parole: «adesso», «2 ore fa», «ieri», «4 set».
 *
 * Serve al flusso del team, dove le attività sono `timestamptz` e non `date`:
 * `quando()` ragiona in giorni interi e direbbe «oggi» a una chiamata di cinque
 * minuti fa, che è l'informazione sbagliata proprio nel caso in cui quella card
 * serve.
 *
 * Oltre la settimana torna alla data breve: «9 giorni fa» costringe a fare il
 * conto, «4 set» no.
 */
export function quandoOre(value: string): string {
  const minuti = Math.round((Date.now() - new Date(value).getTime()) / 60_000)
  if (minuti < 2) return 'adesso'
  if (minuti < 60) return `${minuti} min`
  const ore = Math.round(minuti / 60)
  if (ore < 24) return `${ore} h`
  const giorni = Math.round(ore / 24)
  if (giorni === 1) return 'ieri'
  if (giorni < 8) return `${giorni} giorni`
  return dataBreve(value)
}
