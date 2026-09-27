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
