export const modernTokens = {
  colors: {
    bg:              '#1a1210',
    bgAlt:           '#221a16',
    bgCard:          '#2a2018',
    fg:              '#FAF2E8',
    fgMuted:         '#b8a898',
    accent:          '#e52d1d',
    accentLight:     '#ff4533',
    accentSecondary: '#FAF2E8',
    border:          'rgba(250,242,232,0.1)',
    overlay:         'rgba(26,18,16,0.92)',
  },
  fonts: {
    heading: '"Inter", "Helvetica Neue", Arial, sans-serif',
    body:    '"Inter", "Helvetica Neue", Arial, sans-serif',
  },
  fontWeights: {
    light:    '300',
    regular:  '400',
    semibold: '600',
    bold:     '700',
    black:    '900',
  },
  letterSpacing: {
    tight:  '-0.04em',
    normal: '-0.01em',
    wide:   '0.05em',
    wider:  '0.1em',
  },
  duration: {
    fast:   0.15,
    normal: 0.3,
    slow:   0.6,
    bounce: 0.5,
  },
  // Bezier arrays — pass directly to Framer Motion or GSAP ease arrays
  easing: {
    default: [0.25, 0.1, 0.25, 1]  as const,
    out:     [0, 0, 0.2, 1]         as const,
    spring:  [0.34, 1.56, 0.64, 1] as const,
    snappy:  [0.77, 0, 0.175, 1]   as const,
  },
  shadows: {
    punch: '0 4px 20px rgba(229, 45, 29, 0.25)',
    card:  '0 2px 16px rgba(0, 0, 0, 0.08)',
    hover: '0 8px 32px rgba(0, 0, 0, 0.12)',
  },
  radius: {
    sm:   '4px',
    md:   '8px',
    lg:   '16px',
    xl:   '24px',
    full: '9999px',
  },
} as const

export type ModernTokens = typeof modernTokens
