/**
 * SVG wordmark logo generator — gratis, zero dipendenze, server-side safe.
 *
 * Genera un logo testuale "wordmark" col nome del ristorante.
 * Font scelto in base al template del sito.
 * Output: SVG string + base64 data URL pronto per <img src=...>.
 *
 * I font sono Google Fonts (caricati dal sito pubblico via <link>),
 * lo SVG referenzia il font family generico — il browser renderizza
 * col font caricato dalla pagina. Per la portabilita lo SVG include
 * anche un fallback serif/sans-serif.
 */

export type LogoTemplate = 'cinematico' | 'bento' | 'panoramico' | 'aurora' | 'mercato'

interface FontSpec {
  family: string
  weight: number
  style: 'normal' | 'italic'
  letterSpacing: number   // em
  caps: boolean
  /** Fallback CSS dopo la family principale */
  fallback: string
  /** Rapporto altezza/larghezza approssimativo per dimensionare il viewBox */
  ratio: number
}

const FONTS: Record<LogoTemplate, FontSpec> = {
  cinematico: {
    family: 'Cormorant Garamond',
    weight: 500, style: 'normal',
    letterSpacing: -0.01, caps: false,
    fallback: '"Playfair Display", Georgia, serif',
    ratio: 0.62,
  },
  bento: {
    family: 'Space Grotesk',
    weight: 700, style: 'normal',
    letterSpacing: -0.02, caps: false,
    fallback: 'Inter, system-ui, sans-serif',
    ratio: 0.58,
  },
  panoramico: {
    family: 'Cormorant Garamond',
    weight: 400, style: 'italic',
    letterSpacing: 0.02, caps: false,
    fallback: 'Georgia, serif',
    ratio: 0.55,
  },
  aurora: {
    family: 'Tenor Sans',
    weight: 400, style: 'normal',
    letterSpacing: 0.18, caps: true,
    fallback: 'Italiana, "Optima", sans-serif',
    ratio: 0.5,
  },
  mercato: {
    family: 'DM Serif Display',
    weight: 400, style: 'normal',
    letterSpacing: 0,    caps: false,
    fallback: 'Georgia, serif',
    ratio: 0.72,
  },
}

interface LogoInput {
  restaurantName: string
  template: LogoTemplate
  /** Colore del testo. Default nero. */
  primaryColor?: string
  /** Altezza in px del logo (il viewBox è in unità). Default 96. */
  height?: number
}

export interface GeneratedLogo {
  svg: string
  dataUrl: string
  width: number
  height: number
}

export function generateWordmarkLogo(input: LogoInput): GeneratedLogo {
  const font = FONTS[input.template]
  const color = input.primaryColor || '#0a0a0a'
  const height = input.height ?? 96

  const text = (input.restaurantName || 'Lumino').trim()
  const display = font.caps ? text.toUpperCase() : text

  // Stima larghezza: numero caratteri × ratio × dimensione font.
  // Aggiungo padding orizzontale del 6% per evitare clipping.
  const charCount = Math.max(display.length, 1)
  const fontSize = height * 0.75
  const baseWidth = charCount * fontSize * font.ratio
  const padX = height * 0.16
  const width = Math.round(baseWidth + padX * 2)

  const xmlns = 'http://www.w3.org/2000/svg'
  const fontStack = `'${escapeAttr(font.family)}', ${font.fallback}`

  const svg =
    `<svg xmlns="${xmlns}" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeAttr(text)}">` +
    `<text x="${padX}" y="${height * 0.74}" ` +
      `font-family="${fontStack}" ` +
      `font-size="${fontSize}" ` +
      `font-weight="${font.weight}" ` +
      `font-style="${font.style}" ` +
      `letter-spacing="${font.letterSpacing}em" ` +
      `fill="${color}">` +
      escapeXml(display) +
    `</text>` +
    `</svg>`

  const dataUrl = `data:image/svg+xml;base64,${toBase64(svg)}`

  return { svg, dataUrl, width, height }
}

/* ─────────────── helpers ─────────────── */

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeAttr(s: string): string {
  return s.replace(/"/g, '&quot;')
}

function toBase64(s: string): string {
  // Node ha Buffer, edge/browser hanno btoa. Funziona in entrambi.
  // I caratteri non-ASCII richiedono encodeURIComponent → unescape per btoa.
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(s, 'utf-8').toString('base64')
  }
  // eslint-disable-next-line no-undef
  return btoa(unescape(encodeURIComponent(s)))
}
