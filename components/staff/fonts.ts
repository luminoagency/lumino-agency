import { Manrope } from 'next/font/google'

/**
 * Il carattere dell'area staff.
 *
 * Manrope fa due mestieri in uno: l'interfaccia ai pesi 400/500 e i titoli
 * e i numeri enormi ai pesi 200/300. I pesi sottili sono il punto: il
 * "Dashboard" di ref1 è grandissimo e leggerissimo, e un 700 alla stessa
 * misura diventa un titolo di giornale. Sopra i 700 qui non si va — il grassetto
 * serve alle etichette, non alle cifre.
 *
 * Dichiarato qui e non in app/layout.tsx: le pagine pubbliche hanno Inter e
 * Fraunces, e non devono pagare un terzo file per un'area in cui non entrano.
 */
export const manrope = Manrope({
  subsets: ['latin'],
  weight: ['200', '300', '400', '500', '600', '700'],
  variable: '--font-ui',
  display: 'swap',
})
