/**
 * Lavori mostrati nella sezione 4 della home.
 *
 * Dati PROPRI della vetrina: volutamente NON legge da templates/_shared/demoData.ts
 * (quelli sono ristoranti demo fittizi, condivisi con /portfolio e /demo/[slug]).
 *
 * Il campo `media` accetta due forme — screenshot full-page oppure video in loop —
 * così si può passare dall'una all'altra senza riscrivere WorkCard.
 */

export type WorkMedia =
  | {
      kind: 'shot'
      /** Screenshot full-page verticale, larghezza 900px. */
      src: string
      width: number
      height: number
    }
  | {
      kind: 'video'
      /** Primo fotogramma: evita il buco bianco prima del play. */
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
   *
   * Oggi è il NOME del progetto, non l'indirizzo: scrivere
   * "hosteria-moderna.vercel.app" su una vetrina fa amatoriale.
   * Quando i domini ufficiali saranno attivi, qui si scrive il dominio.
   */
  barLabel: string
  /**
   * Indirizzo realmente caricato nell'iframe dell'overlay.
   * Vuoto = la card non è apribile e resta una sola immagine.
   */
  siteUrl: string
  blurb: string
  /** Token colore usato per l'accento della card. */
  accent: string
  /** false finché lo screenshot/video non è in /public: la card mostra un placeholder. */
  ready: boolean
  media: WorkMedia
}

/*  TODO ASSET — screenshot full-page da produrre, larghezza 900px,
    altezza libera, formato WebP, da mettere in /public/works/:

      hosteria-moderna.webp
      trattoria-dall-oste.webp
      hotel-aurora.webp
      miss-poppy.webp

    Servono a due cose: la card in griglia, e il fallback dentro l'overlay
    quando un sito rifiuta di farsi incorporare.

    TODO DOMINI — `barLabel` mostra il nome del progetto finché non ci sono i
    domini ufficiali. `siteUrl` punta al deploy Vercel di produzione: tutti e
    quattro verificati 200, senza X-Frame-Options né CSP frame-ancestors,
    quindi incorporabili.

    NOTA — rossi-restaurant NON è qui: il suo deploy Vercel è protetto da SSO
    (302 verso vercel.com/sso-api) e risponde X-Frame-Options: DENY. Non è
    pubblico e non è incorporabile.  */

export const WORKS: Work[] = [
  {
    id: 'hosteria-moderna',
    client: 'Hosteria Moderna',
    sector: 'Osteria · Padova',
    year: '2026',
    barLabel: 'Hosteria Moderna',
    siteUrl: 'https://hosteria-moderna.vercel.app/it',
    blurb:
      'Osteria e burger gourmet raccontati senza fronzoli. Menu che si aggiorna da solo, prenotazioni gestite dalla sala.',
    accent: 'var(--red)',
    ready: false,
    media: { kind: 'shot', src: '/works/hosteria-moderna.webp', width: 900, height: 5400 },
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
    accent: 'var(--bordeaux)',
    ready: false,
    media: { kind: 'shot', src: '/works/trattoria-dall-oste.webp', width: 900, height: 5200 },
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
    accent: 'var(--violet)',
    ready: false,
    media: { kind: 'shot', src: '/works/hotel-aurora.webp', width: 900, height: 5800 },
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
    accent: 'var(--pink)',
    ready: false,
    media: { kind: 'shot', src: '/works/miss-poppy.webp', width: 900, height: 5000 },
  },
]
