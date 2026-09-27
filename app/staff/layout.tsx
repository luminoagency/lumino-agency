import type { Metadata } from 'next'
import { anton } from '@/components/home/fonts'
import { manrope } from '@/components/staff/fonts'
import './staff.css'

/**
 * Involucro dell'area staff — il vestito, non il guardiano.
 *
 * Qui non c'è nessun controllo di accesso, e non è una dimenticanza: questo
 * layout avvolge anche /staff/login, che per definizione si apre senza
 * sessione. Il gate sta in app/staff/(dash)/layout.tsx, che avvolge tutto il
 * resto.
 *
 * I due font sono dichiarati qui e non in app/layout.tsx: Manrope veste tutta
 * l'interfaccia e i numeri, Anton serve solo al wordmark. Caricarli a livello
 * di app li farebbe pagare anche alle pagine pubbliche, che hanno i loro.
 */
export const metadata: Metadata = {
  title: 'Staff',
  /* Un'area interna non si indicizza, nemmeno la sua pagina di accesso. */
  robots: { index: false, follow: false },
}

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return <div className={`lm-staff ${manrope.variable} ${anton.variable}`}>{children}</div>
}
