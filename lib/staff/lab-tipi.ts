/**
 * I tipi del Lab, senza niente di server dentro.
 *
 * Esiste per una ragione sola e concreta: `lab.ts` importa `f4.ts` e `db.ts`,
 * che a loro volta arrivano a `next/headers` — cioè è un modulo che **non può**
 * entrare in un componente client. `LabView` è un componente client e gli
 * servono l'elenco dei tipi e la forma di un insight. Senza questo file
 * l'unico modo di dargliele sarebbe duplicarle, e due elenchi di tipi che
 * devono restare uguali restano uguali fino al primo che ne aggiunge uno.
 *
 * `lab.ts` li riesporta, così chi legge dal server non deve sapere che la
 * divisione esiste.
 */

export interface Insight {
  id: string
  tipo: string
  titolo: string
  contenuto: string | null
  created_at: string
  created_by: string | null
  /** Il nome di chi l'ha salvato, risolto a parte: la tabella conserva l'id. */
  autore?: string | null
}

/** I tipi di insight, con l'etichetta che si legge nell'interfaccia. */
export const TIPI_INSIGHT = {
  pattern: 'ricorrenza',
  errore: 'errore da non ripetere',
  segmento: 'segmento',
  idea_startup: 'idea',
  report_mensile: 'report',
} as const

export type TipoInsight = keyof typeof TIPI_INSIGHT

export function eTipoInsight(v: string): v is TipoInsight {
  return v in TIPI_INSIGHT
}
