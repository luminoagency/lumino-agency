/**
 * Composizione dell'hero: cosa c'è in scena e dove sta.
 *
 * Le quattro finestre raccontano il lavoro in quattro scatti: le riprese, chi
 * guarda il contenuto, il titolare che riceve i contatti, il locale pieno.
 * Foto generate per Lumino (/public/hero/), servite da next/image.
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
  { slot: 'w1', src: '/hero/shoot.webp', width: 800, height: 498, client: 'riprese sul posto per i social' },
  { slot: 'w2', src: '/hero/scroll.webp', width: 800, height: 498, client: 'un cliente che guarda un reel' },
  { slot: 'w3', src: '/hero/shop.webp', width: 800, height: 498, client: 'una titolare che riceve nuovi contatti' },
  { slot: 'w4', src: '/hero/sala.webp', width: 800, height: 498, client: 'un locale pieno di clienti' },
]

/** Le sei lettere del wordmark. La I è quella nel gradiente. */
export const HERO_LETTERS = ['L', 'U', 'M', 'I', 'N', 'O'] as const

/** Il payoff sotto la composizione. Esportato: è anche il testo dell'h1. */
export const HERO_PAYOFF_LEAD = 'Social e pubblicità '
export const HERO_PAYOFF_ACCENT = 'che portano clienti.'
export const HERO_TITLE = `Lumino — social, pubblicità e clienti per le aziende. ${HERO_PAYOFF_LEAD}${HERO_PAYOFF_ACCENT}`

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
