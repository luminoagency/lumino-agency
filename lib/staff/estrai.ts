/**
 * Il testo, tirato fuori nel browser.
 *
 * **Perché nel browser e non sul server.** Estrarre lato server vorrebbe dire
 * un runtime che sa leggere i PDF e far girare un OCR: qualche secondo e
 * qualche centinaio di MB per ogni foto caricata, moltiplicato per nove
 * venditori che archiviano tutto il giorno. Su un piano gratuito è la via più
 * rapida per esaurirlo. Il browser ce l'ha già tutto, e l'estrazione succede
 * mentre la persona sta ancora scrivendo il titolo: al momento del salvataggio
 * il testo c'è già.
 *
 * **Le due librerie si caricano solo quando servono.** `pdfjs` e `tesseract`
 * insieme pesano più di tutto il resto dell'area messo insieme: importate in
 * cima al file le pagherebbe chiunque apra l'Archivio anche solo per cercare.
 * Con l'import dinamico le paga solo chi sceglie davvero un PDF o una foto, una
 * volta per sessione.
 *
 * **Niente qui è una garanzia.** Un PDF scansionato non ha testo da estrarre
 * (arriva vuoto, e lo si dice); un OCR sbaglia i nomi propri e le cifre. Per
 * questo il testo finisce in un campo modificabile e non in una riga da
 * leggere, e per questo il database distingue «automatico» da «corretto».
 */

/** Oltre questo, il testo si taglia: lo stesso tetto della colonna in tabella. */
const MAX = 100_000

export interface EsitoEstrazione {
  testo: string
  /** Cosa è successo, in italiano, da mostrare sotto il campo. */
  nota: string
}

export type Avanzamento = (frase: string, quota: number) => void

/**
 * Il testo di un PDF, pagina per pagina.
 *
 * Si fermano a cinquanta pagine: oltre, si sta archiviando un manuale e non un
 * documento, l'estrazione dura minuti e il tetto della colonna arriva comunque
 * prima. Lo dice, invece di troncare in silenzio.
 */
export async function testoDaPdf(file: File, avanza?: Avanzamento): Promise<EsitoEstrazione> {
  avanza?.('Apro il PDF…', 0.05)

  const pdfjs = await import('pdfjs-dist')
  /* Il worker viene dal nostro dominio e non da un CDN: un archivio interno non
     deve dipendere da un dominio di terzi per aprirsi.

     E viene da `public/` e non da un `new URL(..., import.meta.url)`: quella
     strada lo fa emettere a webpack come risorsa, e poi Terser prova a
     minificarlo come uno script classico, trova `import` ed `export` e ferma la
     build intera. Il file lo copia `scripts/copia-pdf-worker.mjs` a ogni build,
     così la versione segue quella del pacchetto senza che nessuno se ne
     ricordi. */
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs'

  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise
  const quante = Math.min(doc.numPages, 50)
  const pezzi: string[] = []

  for (let n = 1; n <= quante; n++) {
    avanza?.(`Pagina ${n} di ${quante}…`, 0.05 + (n / quante) * 0.9)
    const pagina = await doc.getPage(n)
    const contenuto = await pagina.getTextContent()
    const riga = contenuto.items
      .map((i) => ('str' in i ? i.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
    if (riga) pezzi.push(riga)
    if (pezzi.join('\n\n').length > MAX) break
  }

  await doc.destroy()

  const testo = pezzi.join('\n\n').slice(0, MAX)

  if (!testo) {
    return {
      testo: '',
      nota: 'Questo PDF non contiene testo: è una scansione. Salvalo lo stesso, oppure caricane le pagine come immagini per farle leggere dall’OCR.',
    }
  }

  const tagliato = doc.numPages > quante || pezzi.join('\n\n').length > MAX
  return {
    testo,
    nota: tagliato
      ? `Lette le prime ${quante} pagine su ${doc.numPages}: il resto non è nel testo estratto.`
      : `Testo estratto da ${quante} ${quante === 1 ? 'pagina' : 'pagine'}. Rileggilo: è quello che l’AI leggerà.`,
  }
}

/**
 * Il testo di un'immagine, con l'OCR.
 *
 * `ita+eng` e non solo italiano: metà degli screenshot di questo mestiere sono
 * interfacce in inglese, e un OCR con la lingua sbagliata non sbaglia qualche
 * parola — restituisce righe di niente.
 *
 * I dati della lingua li scarica da un CDN pubblico la prima volta (qualche
 * MB, poi restano nella cache del browser). È l'unica dipendenza esterna
 * dell'area, e non costa niente: l'alternativa era un servizio di OCR a
 * consumo.
 */
export async function testoDaImmagine(file: File, avanza?: Avanzamento): Promise<EsitoEstrazione> {
  avanza?.('Preparo il riconoscimento…', 0.05)

  const { createWorker } = await import('tesseract.js')

  const worker = await createWorker('ita+eng', 1, {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === 'recognizing text') avanza?.('Leggo l’immagine…', 0.2 + m.progress * 0.8)
      else avanza?.('Preparo il riconoscimento…', 0.05 + m.progress * 0.15)
    },
  })

  try {
    const { data } = await worker.recognize(file)
    const testo = (data.text ?? '').replace(/[ \t]+/g, ' ').trim().slice(0, MAX)

    return {
      testo,
      nota: testo
        ? 'Testo riconosciuto dall’immagine. Rileggilo: l’OCR sbaglia i nomi propri e le cifre, che è proprio quello per cui l’hai archiviata.'
        : 'Nessun testo riconoscibile in questa immagine. Va bene lo stesso: scrivi tu nella nota cosa si vede.',
    }
  } finally {
    await worker.terminate()
  }
}

/** Un file di testo si legge e basta: nessuna libreria, nessuna attesa. */
export async function testoDaFile(file: File): Promise<EsitoEstrazione> {
  const testo = (await file.text()).slice(0, MAX)
  return { testo, nota: testo ? 'Contenuto del file.' : 'Il file è vuoto.' }
}

/**
 * Sceglie da sé come leggere il file, o dice che non sa.
 *
 * Il ramo `null` non è un errore: un formato senza testo dentro — un'immagine
 * HEIC che il browser non decodifica, domani un formato nuovo — si archivia
 * comunque, e la nota scritta a mano fa da testo. Bloccare il caricamento
 * perché l'estrazione non funziona vorrebbe dire perdere il materiale per
 * salvare una comodità.
 */
export async function estraiDa(file: File, avanza?: Avanzamento): Promise<EsitoEstrazione | null> {
  if (file.type === 'application/pdf') return testoDaPdf(file, avanza)
  if (file.type.startsWith('image/') && file.type !== 'image/heic') {
    return testoDaImmagine(file, avanza)
  }
  if (file.type.startsWith('text/')) return testoDaFile(file)
  return null
}
