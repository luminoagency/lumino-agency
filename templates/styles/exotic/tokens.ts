export const exoticTokens = {
  colors: {
    bg:              '#0d0816',
    bgAlt:           '#1a0a2e',
    bgCard:          '#1f1035',
    fg:              '#f0ebe0',
    fgMuted:         '#b8a898',
    accent:          '#e85d04',
    accentLight:     '#fb8500',
    accentSecondary: '#6a0572',
    border:          '#2e1a3e',
    overlay:         'rgba(13, 8, 22, 0.88)',
  },
  fonts: {
    heading: '"Cinzel", "Palatino Linotype", Georgia, serif',
    body:    '"Lato", "Helvetica Neue", Arial, sans-serif',
  },
  fontWeights: {
    light:    '300',
    regular:  '400',
    semibold: '600',
    bold:     '700',
    black:    '900',
  },
  letterSpacing: {
    tight:  '-0.01em',
    normal: '0.03em',
    wide:   '0.12em',
    wider:  '0.25em',
  },
  duration: {
    fast:     0.25,
    normal:   0.5,
    slow:     1.0,
    dramatic: 1.8,
  },
  // Bezier arrays — pass directly to Framer Motion or GSAP ease arrays
  easing: {
    default:  [0.25, 0.1, 0.25, 1]      as const,
    out:      [0, 0, 0.2, 1]             as const,
    dramatic: [0.68, -0.06, 0.32, 1.06] as const,
    sweep:    [0.4, 0, 0, 1]            as const,
  },
  shadows: {
    spice:  '0 0 40px rgba(232, 93, 4, 0.2)',
    card:   '0 4px 32px rgba(0, 0, 0, 0.7)',
    purple: '0 0 60px rgba(106, 5, 114, 0.15)',
  },
  radius: {
    sm: '2px',
    md: '6px',
    lg: '12px',
  },
} as const

export type ExoticTokens = typeof exoticTokens
