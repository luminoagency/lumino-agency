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
 * **La libreria si carica solo quando serve.** `pdfjs` pesa più di tutto il
 * resto dell'area messo insieme: importato in cima al file lo pagherebbe
 * chiunque apra l'Archivio anche solo per cercare. Con l'import dinamico lo
 * paga solo chi sceglie davvero un PDF, una volta per sessione.
 *
 * **Niente qui è una garanzia.** Un PDF scansionato non ha testo da estrarre
 * (arriva vuoto, e lo si dice); un OCR sbaglia i nomi propri e le cifre. Per
 * questo il testo finisce in un campo modificabile e non in una riga da
 * leggere, e per questo il database distingue «automatico» da «corretto».
 *
 * **Le foto non passano più dall'OCR** (30 settembre 2026). Un OCR su una foto
 * di un menù scritto a mano, su uno screenshot compresso o su una vetrina
 * ripresa di sbieco non restituisce un testo sbagliato: restituisce righe di
 * caratteri che non sono parole, e quelle righe finivano nella `tsvector` —
 * cioè sporcavano la ricerca di tutto l'archivio e arrivavano al Lab AI come
 * se fossero contenuto. Una foto si guarda: al posto del testo l'Archivio ne
 * mostra l'anteprima, e la descrizione scritta a mano sta nella nota, che è
 * indicizzata come il resto.
 */

/** Oltre questo, il testo si taglia: lo stesso tetto della colonna in tabella. */
const MAX = 100_000

/**
 * Sotto questa quota di parole vere, il testo estratto non si tiene.
 *
 * Non è una soglia sull'OCR: vale anche sui PDF, che hanno il modo loro di
 * uscire illeggibili — un font senza mappa dei caratteri restituisce parole
 * perfettamente formate e completamente sbagliate. Si contano le sequenze che
 * *somigliano* a parole (tre lettere o più di fila): sotto il 55% del totale
 * si sta guardando rumore, e un rumore salvato è peggio di un campo vuoto,
 * perché nessuno lo rilegge e la ricerca ci inciampa dentro.
 */
const CONFIDENZA_MINIMA = 0.55

export interface EsitoEstrazione {
  testo: string
  /** Cosa è successo, in italiano, da mostrare sotto il campo. */
  nota: string
  /**
   * Il file è una foto: niente testo, si guarda.
   *
   * Non è lo stesso di `testo: ''`. Un PDF senza testo è un PDF a cui manca
   * qualcosa; un'immagine senza testo è un'immagine, e l'interfaccia deve
   * mostrare due cose diverse.
   */
  immagine?: boolean
}

/** I formati che si guardano invece di leggerli. */
export function eImmagine(mime: string | null | undefined): boolean {
  return Boolean(mime?.startsWith('image/'))
}

/**
 * Quanto di questo testo sono parole.
 *
 * Zero su un testo vuoto, così chi chiama non deve distinguere i due casi.
 */
export function confidenza(testo: string): number {
  const pulito = testo.replace(/\s+/g, ' ').trim()
  if (!pulito) return 0

  const pezzi = pulito.split(' ')
  const parole = pezzi.filter((p) => /[\p{L}]{3,}/u.test(p)).length
  return parole / pezzi.length
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

  if (confidenza(testo) < CONFIDENZA_MINIMA) {
    /* Non si salva: vedi `CONFIDENZA_MINIMA`. Un PDF con i caratteri mappati
       male esce come una lunga sequenza di non-parole, e tenerla vorrebbe dire
       sporcare la ricerca di tutto l'archivio con del rumore. */
    return { testo: '', nota: 'Nessun testo leggibile.' }
  }

  const tagliato = doc.numPages > quante || pezzi.join('\n\n').length > MAX
  return {
    testo,
    nota: tagliato
      ? `Lette le prime ${quante} pagine su ${doc.numPages}: il resto non è nel testo estratto.`
      : `Testo estratto da ${quante} ${quante === 1 ? 'pagina' : 'pagine'}. Rileggilo: è quello che l’AI leggerà.`,
  }
}

/** Un file di testo si legge e basta: nessuna libreria, nessuna attesa. */
export async function testoDaFile(file: File): Promise<EsitoEstrazione> {
  const testo = (await file.text()).slice(0, MAX)
  if (!testo) return { testo: '', nota: 'Il file è vuoto.' }
  if (confidenza(testo) < CONFIDENZA_MINIMA) {
    return { testo: '', nota: 'Nessun testo leggibile.' }
  }
  return { testo, nota: 'Contenuto del file.' }
}

/**
 * Sceglie da sé come leggere il file, o dice che non sa.
 *
 * Il ramo `null` non è un errore: un formato senza testo dentro — domani un
 * formato nuovo — si archivia comunque, e la nota scritta a mano fa da testo.
 * Bloccare il caricamento perché l'estrazione non funziona vorrebbe dire
 * perdere il materiale per salvare una comodità.
 *
 * Le immagini escono subito, con `immagine: true` e senza toccare il file:
 * non c'è niente da estrarre, c'è una foto da guardare.
 */
export async function estraiDa(file: File, avanza?: Avanzamento): Promise<EsitoEstrazione | null> {
  if (eImmagine(file.type)) {
    return {
      testo: '',
      nota: 'Le foto si guardano: qui sotto c’è l’anteprima. Scrivi nella nota cosa si vede — è quella che rende la foto ritrovabile.',
      immagine: true,
    }
  }
  if (file.type === 'application/pdf') return testoDaPdf(file, avanza)
  if (file.type.startsWith('text/')) return testoDaFile(file)
  return null
}
