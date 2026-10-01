/**
 * Come si incassa una trattativa, in un posto solo.
 *
 * Il 30 e il 70 erano scritti a mano in cinque file — Soldi, la home, il Team,
 * il saluto e la scheda del cliente — e andavano bene finché il modello era
 * uno. Dalla 0038 ce ne sono due (`modalita_pagamento`), e cinque copie di una
 * regola che adesso ha un `if` dentro sono cinque posti dove la prossima
 * modalità verrà dimenticata: la quarta pagina direbbe numeri diversi dalle
 * altre tre, e nessuno se ne accorgerebbe perché nessuna delle due cifre
 * sembra sbagliata.
 *
 * Qui dentro non si legge il database: si prende una riga di `staff_deals` e
 * si dice **in quante voci si divide e quali sono già entrate**. Chi la riga
 * l'ha letta — con la sessione o col finto client dell'anteprima — resta
 * affare di chi chiama.
 */

export const MODALITA_PAGAMENTO = ['30_70', '100_subito'] as const
export type ModalitaPagamento = (typeof MODALITA_PAGAMENTO)[number]

export const MODALITA_LABEL: Record<ModalitaPagamento, string> = {
  '30_70': 'Acconto 30% + saldo 70%',
  '100_subito': 'Tutto subito, in una volta',
}

/** La forma minima che serve per fare i conti. Non è la riga intera. */
export interface DealDaIncassare {
  prezzo_chiuso: number | null
  modalita_pagamento?: string | null
  acconto_30_pagato: boolean
  acconto_30_data?: string | null
  saldo_70_pagato: boolean
  saldo_70_data?: string | null
  data_chiusura?: string | null
}

export interface VocePagamento {
  /** `unico` esiste solo col pagamento in una volta. */
  chiave: 'acconto' | 'saldo' | 'unico'
  /** Come si chiama a schermo: «Acconto 30%», «Saldo 70%», «Pagamento unico». */
  etichetta: string
  /** Come si chiama dentro una frase, articolo compreso: «l'acconto», «il saldo». */
  nome: string
  importo: number
  pagato: boolean
  /** Quando è entrata. `null` se non è entrata, o se non è stata segnata. */
  data: string | null
}

/**
 * Una modalità sconosciuta vale `30_70`.
 *
 * Non è indulgenza: su un database dove la 0038 non è passata la colonna
 * arriva `undefined`, e trattarlo come un errore vorrebbe dire una pagina
 * Soldi vuota invece di una pagina Soldi col modello di prima.
 */
export function modalitaDi(d: DealDaIncassare): ModalitaPagamento {
  return d.modalita_pagamento === '100_subito' ? '100_subito' : '30_70'
}

/**
 * Le voci in cui si divide una trattativa.
 *
 * Vuoto se non c'è un prezzo chiuso o una data di chiusura: finché la
 * trattativa non è chiusa non c'è niente da incassare, ed è la stessa regola
 * che la pagina Soldi applicava da sé.
 */
export function vociPagamento(d: DealDaIncassare): VocePagamento[] {
  const totale = Number(d.prezzo_chiuso ?? 0)
  if (!totale || !d.data_chiusura) return []

  if (modalitaDi(d) === '100_subito') {
    return [
      {
        chiave: 'unico',
        etichetta: 'Pagamento unico',
        nome: 'il pagamento',
        importo: totale,
        /* La spunta è quella dell'acconto, e il vincolo della 0038 tiene il
           saldo spento: con una voce sola servirebbe una terza colonna per
           dire la stessa cosa. */
        pagato: d.acconto_30_pagato,
        data: d.acconto_30_pagato ? (d.acconto_30_data ?? d.data_chiusura) : null,
      },
    ]
  }

  return [
    {
      chiave: 'acconto',
      etichetta: 'Acconto 30%',
      nome: 'l’acconto',
      importo: totale * 0.3,
      pagato: d.acconto_30_pagato,
      data: d.acconto_30_pagato ? (d.acconto_30_data ?? d.data_chiusura) : null,
    },
    {
      chiave: 'saldo',
      etichetta: 'Saldo 70%',
      nome: 'il saldo',
      importo: totale * 0.7,
      pagato: d.saldo_70_pagato,
      data: d.saldo_70_pagato ? (d.saldo_70_data ?? d.data_chiusura) : null,
    },
  ]
}

/** Quanto è entrato davvero da questa trattativa. */
export function incassatoDi(d: DealDaIncassare): number {
  return vociPagamento(d).reduce((s, v) => (v.pagato ? s + v.importo : s), 0)
}

/** La percentuale già pagata, da 0 a 100. Zero se non c'è niente da pagare. */
export function quotaPagata(d: DealDaIncassare): number {
  const voci = vociPagamento(d)
  const totale = voci.reduce((s, v) => s + v.importo, 0)
  if (!totale) return 0
  return Math.round((voci.reduce((s, v) => (v.pagato ? s + v.importo : s), 0) / totale) * 100)
}
