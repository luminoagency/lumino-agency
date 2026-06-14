export const luxuryTokens = {
  colors: {
    bg:          '#0a0a0a',
    bgAlt:       '#111111',
    bgCard:      '#161410',
    fg:          '#f5f0e8',
    fgMuted:     '#a89b8c',
    accent:      '#c9a84c',
    accentLight: '#e8cc80',
    accentDark:  '#8a6f2e',
    border:      '#2a2520',
    overlay:     'rgba(10, 10, 10, 0.85)',
  },
  fonts: {
    heading: '"Cormorant Garamond", "Garamond", Georgia, serif',
    body:    '"Libre Baskerville", Georgia, serif',
  },
  fontWeights: {
    light:    '300',
    regular:  '400',
    semibold: '600',
    bold:     '700',
  },
  letterSpacing: {
    tight:  '-0.02em',
    normal: '0.02em',
    wide:   '0.15em',
    wider:  '0.3em',
  },
  duration: {
    fast:      0.3,
    normal:    0.6,
    slow:      1.2,
    cinematic: 2.0,
  },
  // Bezier arrays — pass directly to Framer Motion or GSAP ease arrays
  easing: {
    default:   [0.25, 0.1, 0.25, 1] as const,
    out:       [0, 0, 0.2, 1]        as const,
    cinematic: [0.76, 0, 0.24, 1]   as const,
  },
  shadows: {
    gold: '0 0 40px rgba(201, 168, 76, 0.15)',
    card: '0 4px 32px rgba(0, 0, 0, 0.6)',
    glow: '0 0 80px rgba(201, 168, 76, 0.08)',
  },
  radius: {
    sm: '2px',
    md: '4px',
    lg: '8px',
  },
} as const

export type LuxuryTokens = typeof luxuryTokens
