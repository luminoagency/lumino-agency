/**
 * Lavori mostrati nella sezione 4 della home.
 *
 * Dati PROPRI della vetrina: volutamente NON legge da templates/_shared/demoData.ts
 * (quelli sono ristoranti demo fittizi, condivisi con /portfolio e /demo/[slug]).
 *
 * Nella griglia ci sono SOLO immagini: niente iframe e niente video. Il sito
 * vero si apre al click, in un solo iframe per volta (vedi WorkViewer).
 */

export type WorkMedia =
  | {
      kind: 'shot'
      /** WebP servito per primo, PNG come riserva. */
      webp: string
      png: string
      /** Dimensioni reali del file: servono a capire se c'è da scorrere. */
      width: number
      height: number
    }
  | {
      kind: 'video'
      poster: string
      sources: { src: string; type: string }[]
      width: number
      height: number
    }

export interface Work {
  id: string
  client: string
  sector: string
  year: string
  /**
   * Testo mostrato nella barra finta del browser.
   * Oggi è il NOME del progetto: scrivere "*.vercel.app" su una vetrina fa
   * amatoriale. Quando i domini saranno attivi, qui si scrive il dominio.
   */
  barLabel: string
  /**
   * Indirizzo caricato nell'overlay al click.
   *
   * Anche se vuoto o irraggiungibile la card si apre lo stesso: l'overlay
   * ripiega sullo screenshot a schermo pieno. Un click che non produce nulla
   * fa sembrare il sito rotto.
   */
  siteUrl: string
  blurb: string
  /**
   * La SOLA PRIMA SCHERMATA, 1440×900 (16/10), ritagliata dalla cima del
   * full-page. È quella che si vede nella griglia e nelle finestre dell'hero:
   * lì servono immagini da monitor, ferme e riconoscibili.
   *
   * Tenuta separata da `media` di proposito. Quando i full-page hanno preso il
   * posto delle prime schermate, l'hero si è ritrovato quattro strisce alte
   * diecimila pixel al posto delle finestrelle: un file solo per due usi che
   * vogliono proporzioni opposte non può funzionare.
   */
  shot: { webp: string; png: string; width: number; height: number }

  /** Token colore usato per l'accento della card. */
  accent: string
  ready: boolean
  media: WorkMedia
}

/*  STATO ASSET — gli screenshot in /public/works/ sono le PRIME SCHERMATE
    (~1880×907 in origine, ridotte a 1600px di larghezza). Sono più larghe che
    alte, quindi NON c'è pagina da scorrere: la card lo capisce da sola dalle
    proporzioni e fa una deriva lenta invece di simulare uno scorrimento che
    non esiste. Sostituendo questi file con le versioni full-page — stessi
    nomi — lo scorrimento parte senza toccare il codice. Vedi README.txt.

    Gli screenshot sono TUTTI E NOVE interi, non prime schermate: catturati a
    1440 esatti di larghezza — con la barra di scorrimento nascosta, altrimenti
    ne verrebbero 1425 — e alti fra 5.000 e 12.500 pixel. La card lo riconosce
    dalle proporzioni e li fa scorrere davvero. Prima cinque erano prime
    schermate e facevano la deriva lenta: due comportamenti diversi nella
    stessa griglia si leggono come un difetto, non come una scelta.

    Il PNG accanto a ogni WebP è ridotto a 900px: lo serve solo un browser che
    non conosca WebP, cioè in pratica nessuno, e a piena risoluzione erano
    megabyte di peso morto nel deploy.

    URL — tutti e nove rispondono 200 e si lasciano incorporare. Le due
    eccezioni storiche sono chiuse: rossi-restaurant e incanto-gelateria erano
    dietro la Deployment Protection di Vercel e servivano la pagina di login
    (X-Frame-Options: DENY); tolta la protezione, incorporano come gli altri.
    Incanto in più non aveva alcun deployment di produzione: ora ce l'ha.  */

export const WORKS: Work[] = [
  {
    id: 'zayyane',
    client: 'Zayyane',
    sector: 'Restaurant marocain · Rabat',
    year: '2026',
    barLabel: 'Zayyane',
    siteUrl: 'https://zayyane.vercel.app',
    blurb:
      'Mosaico zellige generato in SVG che si compone tessera per tessera, medaglioni dei piatti a bordo dorato, menù completo e prenotazione via WhatsApp. Bilingue francese e inglese.',
    shot: {
      webp: '/works/hero/zayyane.webp',
      png: '/works/hero/zayyane.png',
      width: 1440,
      height: 900,
    },
    accent: 'var(--red)',
    ready: true,
    media: {
      kind: 'shot',
      webp: '/works/zayyane.webp',
      png: '/works/zayyane.png',
      width: 1440,
      height: 9768,
    },
  },
  {
    id: 'bien-venu',
    client: 'Bien Venu',
    sector: 'Restaurant marocain & méditerranéen · Marrakech',
    year: '2026',
    barLabel: 'Bien Venu',
    siteUrl: 'https://bienvenu-sito.vercel.app',
    blurb:
      'Sito in sei lingue con arabo RTL, pensato per i turisti che cercano prima di partire. Piatti che entrano da destra e da sinistra, prenotazione telefonica in primo piano.',
    shot: {
      webp: '/works/hero/bienvenu.webp',
      png: '/works/hero/bienvenu.png',
      width: 1440,
      height: 900,
    },
    accent: 'var(--violet)',
    ready: true,
    media: {
      kind: 'shot',
      webp: '/works/bienvenu.webp',
      png: '/works/bienvenu.png',
      width: 1440,
      height: 10124,
    },
  },
  {
    id: 'guizza',
    client: 'Rosticceria Pizzeria Guizza',
    sector: 'Pizzeria & Rosticceria · Padova',
    year: '2026',
    barLabel: 'Rosticceria Pizzeria Guizza',
    siteUrl: 'https://guizza-web.vercel.app',
    blurb:
      "Menù da oltre 130 pizze, configuratore d'ordine e consegna a domicilio. Tipografia grossa, colore pieno, zero fronzoli.",
    shot: {
      webp: '/works/hero/guizza.webp',
      png: '/works/hero/guizza.png',
      width: 1440,
      height: 900,
    },
    accent: 'var(--red)',
    ready: true,
    media: {
      kind: 'shot',
      webp: '/works/guizza.webp',
      png: '/works/guizza.png',
      width: 1440,
      height: 9110,
    },
  },
  {
    id: 'incanto',
    client: 'Incanto Gelateria',
    sector: 'Gelateria artigianale · Padova',
    year: '2026',
    barLabel: 'Incanto Gelateria',
    siteUrl: 'https://incanto-gelateria-siwakyceos-projects.vercel.app',
    blurb:
      'Lilla, cono scontornato e particelle che fluttuano. Un sito che sa di gelato prima ancora di leggerlo.',
    shot: {
      webp: '/works/hero/incanto.webp',
      png: '/works/hero/incanto.png',
      width: 1440,
      height: 900,
    },
    accent: 'var(--violet)',
    ready: true,
    media: {
      kind: 'shot',
      webp: '/works/incanto.webp',
      png: '/works/incanto.png',
      width: 1440,
      height: 5032,
    },
  },
  {
    id: 'hosteria-moderna',
    client: 'Hosteria Moderna',
    sector: 'Osteria · Padova',
    year: '2026',
    barLabel: 'Hosteria Moderna',
    siteUrl: 'https://hosteria-moderna.vercel.app/it',
    blurb:
      'Osteria e burger gourmet raccontati senza fronzoli. Menu che si aggiorna da solo, prenotazioni gestite dalla sala.',
    shot: {
      webp: '/works/hero/hosteria-moderna.webp',
      png: '/works/hero/hosteria-moderna.png',
      width: 1440,
      height: 900,
    },
    accent: 'var(--red)',
    ready: true,
    media: {
      kind: 'shot',
      webp: '/works/hosteria-moderna.webp',
      png: '/works/hosteria-moderna.png',
      width: 1440,
      height: 10464,
    },
  },
  {
    id: 'trattoria-dall-oste',
    client: "Trattoria Dall'Oste",
    sector: 'Steakhouse · Jesolo',
    year: '2026',
    barLabel: "Trattoria Dall'Oste",
    siteUrl: 'https://trattoria-oste.vercel.app/it',
    blurb:
      'Carne, brace e un sipario che si apre sulla sala. Tipografia grossa, contrasto netto, zero decorazione inutile.',
    shot: {
      webp: '/works/hero/trattoria-dalloste.webp',
      png: '/works/hero/trattoria-dalloste.png',
      width: 1440,
      height: 900,
    },
    accent: 'var(--bordeaux)',
    ready: true,
    media: {
      kind: 'shot',
      webp: '/works/trattoria-dalloste.webp',
      png: '/works/trattoria-dalloste.png',
      width: 1440,
      height: 11079,
    },
  },
  {
    id: 'hotel-aurora',
    client: 'Hotel Aurora',
    sector: 'Hotel 4★S · Jesolo',
    year: '2026',
    barLabel: 'Hotel Aurora',
    siteUrl: 'https://aurora-preview-blush.vercel.app/',
    blurb:
      "Quattro stelle superior fronte mare. L'ora dorata come chiave visiva, prenotazione diretta senza intermediari.",
    shot: {
      webp: '/works/hero/hotel-aurora.webp',
      png: '/works/hero/hotel-aurora.png',
      width: 1440,
      height: 900,
    },
    accent: 'var(--violet)',
    ready: true,
    media: {
      kind: 'shot',
      webp: '/works/hotel-aurora.webp',
      png: '/works/hotel-aurora.png',
      width: 1440,
      height: 12528,
    },
  },
  {
    id: 'miss-poppy',
    client: 'Miss Poppy',
    sector: 'Plant-based · Padova',
    year: '2025',
    barLabel: 'Miss Poppy',
    siteUrl: 'https://misspoppy.vercel.app/it',
    blurb:
      'Fast food 100% vegetale che online doveva restare sé stesso: colore pieno, ritmo veloce, menu che si sfoglia col pollice.',
    shot: {
      webp: '/works/hero/miss-poppy.webp',
      png: '/works/hero/miss-poppy.png',
      width: 1440,
      height: 900,
    },
    accent: 'var(--pink)',
    ready: true,
    media: {
      kind: 'shot',
      webp: '/works/miss-poppy.webp',
      png: '/works/miss-poppy.png',
      width: 1440,
      height: 8500,
    },
  },
  {
    id: 'rossi-restaurant',
    client: 'Rossi Restaurant & Pizza',
    sector: 'Ristorante & Pizzeria · Jesolo Lido',
    year: '2026',
    barLabel: 'Rossi Restaurant & Pizza',
    /* Il deploy è dietro SSO Vercel: l'iframe riceve la pagina di login, non
       il sito. L'URL resta qui comunque — l'overlay si apre lo stesso e
       ripiega sullo screenshot con il bottone per aprirlo in una scheda
       nuova, dove la sessione dell'utente vale. Tolta la protezione,
       l'incorporamento parte da solo. */
    siteUrl: 'https://rossi-restaurant-siwakyceos-projects.vercel.app/',
    blurb:
      'Wordmark che si apre attorno al video, palette petrolio e ottone. Recensioni Google in tempo reale, menù e prenotazioni.',
    shot: {
      webp: '/works/hero/rossi-restaurant.webp',
      png: '/works/hero/rossi-restaurant.png',
      width: 1440,
      height: 900,
    },
    accent: 'var(--blue)',
    ready: true,
    media: {
      kind: 'shot',
      webp: '/works/rossi-restaurant.webp',
      png: '/works/rossi-restaurant.png',
      width: 1440,
      height: 7080,
    },
  },
]
