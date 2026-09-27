import { Manrope } from 'next/font/google'

/**
 * Il carattere dell'area staff.
 *
 * Manrope fa due mestieri in uno: l'interfaccia ai pesi 400/500 e i numeri
 * grandi dei KPI a 800. È il motivo per cui qui non serve più un secondo font
 * display — i suoi numeri hanno le aste dritte e la larghezza costante che
 * reggono un `clamp(3rem, 9vw, 5rem)` senza sembrare un titolo di giornale.
 *
 * Dichiarato qui e non in app/layout.tsx: le pagine pubbliche hanno Inter e
 * Fraunces, e non devono pagare un terzo file per un'area in cui non entrano.
 */
export const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-ui',
  display: 'swap',
})
