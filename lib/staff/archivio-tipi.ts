/**
 * I tipi dell'Archivio, senza niente di server dentro.
 *
 * Esiste per la stessa ragione di `lab-tipi.ts`, e la ragione è meccanica:
 * `archivio.ts` e `archivio-lab.ts` arrivano a `db.ts`, cioè a `next/headers`,
 * quindi sono moduli che **non possono** entrare in un componente client. La
 * vista dell'Archivio e quella del Lab sono componenti client, e gli servono
 * l'elenco dei generi, la forma di una voce e i testi delle due analisi.
 *
 * Senza questo file l'unico modo di dargliele sarebbe duplicarle, e due elenchi
 * che devono restare uguali restano uguali fino al primo che ne aggiunge uno.
 * I due moduli server li riesportano, così chi legge dal server non deve sapere
 * che la divisione esiste.
 */

export const GENERI = {
  pdf: 'PDF',
  immagine: 'immagine',
  nota: 'nota',
  vocale: 'vocale',
  link: 'link',
  testo: 'testo',
} as const

export type Genere = keyof typeof GENERI

export function eGenere(v: string): v is Genere {
  return v in GENERI
}

export const STATI_TESTO = {
  assente: 'nessun testo',
  automatico: 'estratto in automatico',
  corretto: 'riletto a mano',
} as const

export type StatoTesto = keyof typeof STATI_TESTO

export interface VoceArchivio {
  id: string
  kind: Genere
  titolo: string
  nota: string | null
  /** L'indirizzo da aprire: la firma del file nostro, o il link esterno. */
  indirizzo: string | null
  /** È un file nel nostro bucket e non un link di qualcun altro. */
  nostro: boolean
  mime: string | null
  dimensione: number | null
  testo: string | null
  testo_stato: StatoTesto
  fonte: string | null
  tags: string[]
  client_id: string | null
  cliente: string | null
  avvenuto_il: string | null
  created_at: string
  created_by: string | null
  autore: string | null
}

export interface FiltriArchivio {
  /** La ricerca a testo pieno. Vuota, si vede tutto. */
  q?: string
  /* Una voce sola, per id. È il filtro che apre il Lab AI quando si clicca la
     citazione `[#7]`: porta sulla voce vera invece che su una ricerca del suo
     titolo, che è la differenza fra verificare e cercare di ritrovare. */
  voce?: string
  kind?: Genere
  tag?: string
  /** L'id di chi ha caricato. */
  autore?: string
  cliente?: string
  /** Solo le voci avvenute da questa data in poi (ISO, `2026-09-01`). */
  dal?: string
  al?: string
}

export interface DatiArchivio {
  voci: VoceArchivio[]
  /* Chi può aver caricato qualcosa: sono i profili staff, letti insieme alle
     voci perché servivano già per attaccare il nome dell'autore a ognuna. */
  autori: { id: string; nome: string }[]
  /** Tutti i tag in uso, dal più frequente: sono i filtri veri. */
  tagInUso: { tag: string; quante: number }[]
  /** Quante voci ci sono in tutto, prima dei filtri. */
  totale: number
  /** Quante hanno davvero del testo dentro: è la salute dell'archivio. */
  conTesto: number
  mancaSchema: boolean
}

/** Una voce come il modello la può citare: `[#7]`. */
export interface FonteCitabile {
  n: number
  id: string
  titolo: string
}

/**
 * Le due analisi che si fanno con un bottone.
 *
 * Sono domande scritte bene, non funzioni: il valore sta nella formulazione, e
 * tenerle qui vuol dire che si correggono leggendo una risposta storta invece
 * di riscrivere del codice. La seconda dipende dalla prima per costruzione — un
 * prodotto che non nasce da un problema visto è un'idea, e di idee ne bastano
 * poche.
 */
export const ANALISI = {
  problemi: {
    titolo: 'Problemi che tornano',
    sotto: 'Cosa si lamentano di più i locali, e quanto spesso',
    tipo: 'problema_ricorrente',
    domanda:
      'Leggi tutto l’archivio e trova i problemi che tornano più spesso nei locali: cosa li blocca, cosa si lamentano, cosa gli manca. Elencane al massimo sei, dal più frequente. Per ognuno: una riga che dice il problema con le loro parole, su quante voci l’hai visto, e i contrassegni. Non mettere i problemi che hai visto una volta sola.',
  },
  idee: {
    titolo: 'Idee che ne nascono',
    sotto: 'Prodotti o servizi che risolverebbero quei problemi',
    tipo: 'idea_startup',
    domanda:
      'Leggi tutto l’archivio, trova i problemi che tornano, e per i tre più frequenti proponi una cosa che Lumino potrebbe costruire e vendere: un prodotto, un servizio o uno strumento. Per ognuno: cosa fa in una frase, quale problema risolve con i contrassegni delle voci da cui l’hai visto, e chi lo comprerebbe fra i clienti che ci sono nell’archivio. Niente idee che non nascono da un problema scritto lì dentro.',
  },
} as const

export type ChiaveAnalisi = keyof typeof ANALISI
