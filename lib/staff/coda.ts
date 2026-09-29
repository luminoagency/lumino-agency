import type { DatiVisita } from '@/lib/staff/actions'

/**
 * Le visite compilate senza rete.
 *
 * ## Perché esiste
 *
 * Il Campo si usa in piedi davanti a un locale, spesso in un centro storico o
 * dentro un capannone: la rete c'è e non c'è. Una visita compilata in due
 * minuti e persa perché al momento di salvare non c'era campo è il modo più
 * sicuro di far smettere qualcuno di registrare le visite. Quindi la visita si
 * mette da parte qui e parte da sola quando la rete torna.
 *
 * ## `localStorage` e non IndexedDB
 *
 * Una visita è un oggetto JSON di poche centinaia di byte: testo, chip, una
 * coppia di coordinate, la trascrizione del vocale e i **percorsi** delle foto
 * già caricate. Niente binari. Per una cosa così IndexedDB è una transazione
 * asincrona e un migration path da mantenere, in cambio di niente.
 *
 * ## Quello che la coda **non** fa
 *
 * Non mette da parte le fotografie. `PhotoPicker` le carica nel bucket al
 * momento dello scatto, non al salvataggio, quindi senza rete lo dice subito e
 * la visita parte senza foto: il testo, il GPS e il vocale — che sono il
 * contenuto — si salvano lo stesso. Tenere i file in locale e caricarli al
 * ritorno della rete vorrebbe dire una seconda coda, binaria, con un suo
 * quota-exceeded da gestire: si farà se servirà davvero.
 */

const CHIAVE = 'lm_coda_visite'

/** Oltre questo numero la coda smette di crescere: vedi `accoda`. */
const TETTO = 40

export interface VisitaInCoda {
  /** Serve solo a togliere la riga giusta: non è l'id della visita sul server. */
  id: string
  /** Quando è stata compilata, per dirlo a chi guarda la coda. */
  quando: number
  /** Il nome del cliente, per poterla nominare senza interrogare il server. */
  cliente: string
  dati: DatiVisita
}

function leggiGrezzo(): VisitaInCoda[] {
  if (typeof window === 'undefined') return []
  try {
    const crudo = window.localStorage.getItem(CHIAVE)
    if (!crudo) return []
    const letto: unknown = JSON.parse(crudo)
    return Array.isArray(letto) ? (letto as VisitaInCoda[]) : []
  } catch {
    /* Storage pieno, modalità privata, JSON rotto da una versione vecchia: in
       tutti e tre i casi la risposta giusta è «la coda è vuota», non un errore
       che fa saltare la pagina. */
    return []
  }
}

function scrivi(righe: VisitaInCoda[]): boolean {
  try {
    window.localStorage.setItem(CHIAVE, JSON.stringify(righe))
    return true
  } catch {
    return false
  }
}

export function leggiCoda(): VisitaInCoda[] {
  return leggiGrezzo()
}

/**
 * Mette una visita in coda. Torna `false` se non c'è stato verso di scriverla,
 * e chi chiama **deve** dirlo: una visita che l'utente crede salvata e non è da
 * nessuna parte è peggio di un errore al momento del salvataggio.
 */
export function accoda(cliente: string, dati: DatiVisita): boolean {
  const righe = leggiGrezzo()
  /* Il tetto non è per lo spazio — quaranta visite sono una manciata di KB — è
     perché una coda che cresce senza fermarsi vuol dire che l'invio non
     funziona, e in quel caso continuare ad accettare è raccontare una bugia. */
  if (righe.length >= TETTO) return false
  righe.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    quando: Date.now(),
    cliente,
    dati,
  })
  return scrivi(righe)
}

export function togli(id: string): void {
  scrivi(leggiGrezzo().filter((r) => r.id !== id))
}

/** L'evento con cui la pagina che accoda sveglia la pill che mostra la coda. */
export const EVENTO_CODA = 'lumino:coda'

export function annunciaCoda(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(EVENTO_CODA))
}
