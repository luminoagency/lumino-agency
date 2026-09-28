/**
 * Il lettore di CSV dell'import lead.
 *
 * Gira nel browser: il file l'utente lo deve vedere prima di mandarlo, e
 * un'anteprima che passa dal server è un giro inutile su un file che di solito
 * pesa qualche decina di kilobyte.
 *
 * Non è un parser generico — è quel poco che serve per i CSV che escono da
 * Excel e da Google Sheets: virgolette doppie, virgolette raddoppiate dentro
 * al campo, separatore che in Italia è il punto e virgola almeno quanto la
 * virgola.
 */

/** Il separatore vero, dedotto dalla prima riga. */
function separatore(testo: string): string {
  const prima = testo.split(/\r?\n/, 1)[0] ?? ''
  const conteggi = [';', ',', '\t'].map((sep) => ({
    sep,
    /* Solo le occorrenze fuori dalle virgolette: un indirizzo come
       "Via Roma, 4" non deve far credere che il file sia a virgole. */
    n: fuoriDaVirgolette(prima, sep),
  }))
  conteggi.sort((a, b) => b.n - a.n)
  return conteggi[0].n > 0 ? conteggi[0].sep : ','
}

function fuoriDaVirgolette(riga: string, sep: string): number {
  let dentro = false
  let n = 0
  for (const ch of riga) {
    if (ch === '"') dentro = !dentro
    else if (ch === sep && !dentro) n++
  }
  return n
}

/** Righe e colonne, virgolette sciolte, righe vuote buttate. */
export function leggiCsv(testo: string): string[][] {
  const pulito = testo.replace(/^﻿/, '')
  const sep = separatore(pulito)

  const righe: string[][] = []
  let riga: string[] = []
  let campo = ''
  let dentro = false

  for (let i = 0; i < pulito.length; i++) {
    const ch = pulito[i]

    if (dentro) {
      if (ch === '"') {
        if (pulito[i + 1] === '"') {
          campo += '"'
          i++
        } else {
          dentro = false
        }
      } else {
        campo += ch
      }
      continue
    }

    if (ch === '"') dentro = true
    else if (ch === sep) {
      riga.push(campo)
      campo = ''
    } else if (ch === '\n') {
      riga.push(campo)
      righe.push(riga)
      riga = []
      campo = ''
    } else if (ch !== '\r') {
      campo += ch
    }
  }

  if (campo !== '' || riga.length) {
    riga.push(campo)
    righe.push(riga)
  }

  return righe
    .map((r) => r.map((c) => c.trim()))
    .filter((r) => r.some((c) => c !== ''))
}

/** I campi in cui si può versare una colonna del file. */
export const CAMPI_IMPORT = [
  { key: 'nome', label: 'Nome', alias: ['nome', 'locale', 'ragione sociale', 'name', 'azienda'] },
  { key: 'settore', label: 'Settore', alias: ['settore', 'categoria', 'tipo', 'category'] },
  { key: 'citta', label: 'Città', alias: ['citta', 'città', 'comune', 'city'] },
  { key: 'zona', label: 'Zona', alias: ['zona', 'quartiere', 'area'] },
  { key: 'indirizzo', label: 'Indirizzo', alias: ['indirizzo', 'via', 'address'] },
  { key: 'referente', label: 'Referente', alias: ['referente', 'contatto', 'titolare', 'owner'] },
  { key: 'telefono', label: 'Telefono', alias: ['telefono', 'tel', 'cellulare', 'phone'] },
  { key: 'email', label: 'Email', alias: ['email', 'mail', 'e-mail'] },
  { key: 'instagram', label: 'Instagram', alias: ['instagram', 'ig', 'social'] },
  { key: 'sito_attuale', label: 'Sito attuale', alias: ['sito', 'sito attuale', 'website', 'web'] },
  { key: 'stato', label: 'Stato', alias: ['stato', 'status'] },
  {
    key: 'prezzo_consigliato',
    label: 'Prezzo consigliato',
    alias: ['prezzo', 'prezzo consigliato', 'budget', 'valore'],
  },
  { key: 'note_sito', label: 'Note', alias: ['note', 'notes', 'commento', 'appunti'] },
] as const

export type CampoImport = (typeof CAMPI_IMPORT)[number]['key']

/**
 * La mappatura di partenza, indovinata dalle intestazioni.
 *
 * Indovinata e non imposta: resta tutta modificabile, perché un file con la
 * colonna "contatto" che contiene i telefoni esiste, e l'unico che lo sa è chi
 * ha il file davanti.
 */
export function indovinaMappa(intestazioni: string[]): Record<CampoImport, number> {
  const mappa = {} as Record<CampoImport, number>

  for (const campo of CAMPI_IMPORT) {
    mappa[campo.key] = -1
  }

  intestazioni.forEach((testa, indice) => {
    const pulita = testa.toLowerCase().trim()
    for (const campo of CAMPI_IMPORT) {
      if (mappa[campo.key] !== -1) continue
      if ((campo.alias as readonly string[]).includes(pulita)) {
        mappa[campo.key] = indice
        return
      }
    }
  })

  /* Ultima spiaggia per il nome: se nessuna intestazione lo dice, è quasi
     sempre la prima colonna — e senza nome la riga non si importa affatto. */
  if (mappa.nome === -1 && intestazioni.length) mappa.nome = 0

  return mappa
}
