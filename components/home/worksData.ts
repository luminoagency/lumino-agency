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
  /** Testo mostrato nella barra finta del browser. Vuoto = pillola vuota.
      TODO: da confermare, NON inventare domini. */
  url: string
  /** Link reale al sito online. Se assente, la card non è cliccabile. */
  href?: string
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

    Finché non ci sono, WorkCard mostra un placeholder generato in CSS
    (nessuna immagine rotta, nessun layout shift: le dimensioni sono già
    dichiarate qui sotto).

    TODO DATI — il campo `url` di ogni voce è VUOTO di proposito: nessun
    dominio va inventato. Quando li confermi, la barra del browser li mostra.  */

export const WORKS: Work[] = [
  {
    id: 'hosteria-moderna',
    client: 'Hosteria Moderna',
    sector: 'Ristorazione',
    year: '2026',
    url: '',
    blurb:
      'Cucina di ricerca raccontata senza fronzoli. Menu che si aggiorna da solo, prenotazioni gestite dalla sala.',
    accent: 'var(--red)',
    ready: false,
    media: { kind: 'shot', src: '/works/hosteria-moderna.webp', width: 900, height: 5400 },
  },
  {
    id: 'trattoria-dall-oste',
    client: "Trattoria Dall'Oste",
    sector: 'Steakhouse',
    year: '2026',
    url: '',
    blurb:
      'Carne, brace e un sipario che si apre sulla sala. Tipografia grossa, contrasto netto, zero decorazione inutile.',
    accent: 'var(--bordeaux)',
    ready: false,
    media: { kind: 'shot', src: '/works/trattoria-dall-oste.webp', width: 900, height: 5200 },
  },
  {
    id: 'hotel-aurora',
    client: 'Hotel Aurora',
    sector: 'Ospitalità',
    year: '2026',
    url: '',
    blurb:
      "Quattro stelle superior sul mare. L'ora dorata come chiave visiva, prenotazione diretta senza intermediari.",
    accent: 'var(--violet)',
    ready: false,
    media: { kind: 'shot', src: '/works/hotel-aurora.webp', width: 900, height: 5800 },
  },
  {
    id: 'miss-poppy',
    client: 'Miss Poppy',
    sector: 'Retail',
    year: '2025',
    url: '',
    blurb:
      'Un negozio che online doveva restare sé stesso: colore pieno, ritmo veloce, catalogo che si sfoglia col pollice.',
    accent: 'var(--pink)',
    ready: false,
    media: { kind: 'shot', src: '/works/miss-poppy.webp', width: 900, height: 5000 },
  },
]
