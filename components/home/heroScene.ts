/**
 * Composizione dell'hero: cosa c'è in scena e dove sta.
 *
 * Le quattro finestre mostrano gli screenshot VERI dei nostri siti (gli stessi
 * file di /public/works/ usati dalla sezione Lavori). Nel riferimento HTML sono
 * in base64 solo per farlo funzionare da file singolo: qui sono file, serviti
 * da next/image.
 *
 * L'ordine conta e non va cambiato a caso: è quello che il driver del
 * movimento usa per decidere verso quale angolo ogni finestra esce
 * (0 e 2 a sinistra, 1 e 3 a destra; le prime due in alto, le altre in basso).
 */

export interface HeroWindow {
  /** Classe di posizione: la geometria vive in hero.css, non qui. */
  slot: 'w1' | 'w2' | 'w3' | 'w4'
  src: string
  /** Dimensioni reali del file: servono a next/image per non far ballare il layout. */
  width: number
  height: number
  /** Nome del progetto — finisce nell'alt, non a schermo. */
  client: string
}

export const HERO_WINDOWS: HeroWindow[] = [
  { slot: 'w1', src: '/works/hosteria-moderna.webp', width: 1600, height: 779, client: 'Hosteria Moderna' },
  { slot: 'w2', src: '/works/hotel-aurora.webp', width: 1600, height: 774, client: 'Hotel Aurora' },
  { slot: 'w3', src: '/works/miss-poppy.webp', width: 1600, height: 768, client: 'Miss Poppy' },
  { slot: 'w4', src: '/works/trattoria-dalloste.webp', width: 1600, height: 778, client: "Trattoria Dall'Oste" },
]

/** Le sei lettere del wordmark. La I è quella nel gradiente. */
export const HERO_LETTERS = ['L', 'U', 'M', 'I', 'N', 'O'] as const

/** Etichette negli spazi vuoti. Stanno sopra e sotto le finestre, mai addosso. */
export const HERO_TAGS = [
  { slot: 't1', label: '5 progetti online' },
  { slot: 't2', label: 'Padova → Mondo' },
  { slot: 't3', label: 'Studio digitale' },
] as const

/** Il payoff sotto la composizione. Esportato: è anche il testo dell'h1. */
export const HERO_PAYOFF_LEAD = 'Progettiamo e costruiamo siti che '
export const HERO_PAYOFF_ACCENT = 'si ricordano.'
export const HERO_TITLE = `Lumino — studio digitale. ${HERO_PAYOFF_LEAD}${HERO_PAYOFF_ACCENT}`

/**
 * Durata complessiva dell'entrata, in ms.
 *
 * È la somma dell'ultimo ritardo e dell'ultima durata dichiarati in hero.css
 * (la striscia: 2.2s + 0.9s), più un margine. Scaduta questa, il componente
 * mette `is-settled` sull'hero: le animazioni d'entrata vengono staccate e da
 * quel momento lo stile inline del driver ha via libera.
 *
 * Se cambiano i ritardi in hero.css va cambiata anche questa: sono la stessa
 * decisione scritta in due linguaggi.
 */
export const HERO_ENTRANCE_MS = 3400
