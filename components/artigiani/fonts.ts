import { Anton, Bricolage_Grotesque, Inter_Tight } from 'next/font/google'

/* Font della home italiana (Lumino per artigiani). Self-hosted via next/font:
   nessuna richiesta a Google al primo dipinto. */
export const laDisplay = Bricolage_Grotesque({
  subsets: ['latin'],
  axes: ['wdth', 'opsz'],
  variable: '--la-display',
  display: 'swap',
})

export const laText = Inter_Tight({
  subsets: ['latin'],
  variable: '--la-text',
  display: 'swap',
})

export const laMark = Anton({
  subsets: ['latin'],
  weight: '400',
  variable: '--la-mark',
  display: 'swap',
})
