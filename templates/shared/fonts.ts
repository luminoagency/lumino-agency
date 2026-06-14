import {
  Cormorant_Garamond,
  Libre_Baskerville,
  Cinzel,
  Lato,
  Inter,
} from 'next/font/google'

export const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
})

export const libre = Libre_Baskerville({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-libre',
  display: 'swap',
})

export const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-cinzel',
  display: 'swap',
})

export const lato = Lato({
  subsets: ['latin'],
  weight: ['300', '400', '700', '900'],
  variable: '--font-lato',
  display: 'swap',
})

export const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700', '900'],
  variable: '--font-inter',
  display: 'swap',
})

// Single className string — apply to any wrapper that needs all template fonts
export function allFontVariables(
  ...fonts: Array<{ variable: string; className: string }>
) {
  return fonts.map((f) => f.variable).join(' ')
}
