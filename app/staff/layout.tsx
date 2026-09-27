import type { Metadata } from 'next'
import { anton } from '@/components/home/fonts'
import { manrope } from '@/components/staff/fonts'
import Stage from '@/components/staff/Stage'
import './staff.css'

/**
 * Involucro dell'area staff — il vestito, non il guardiano.
 *
 * Qui non c'è nessun controllo di accesso, e non è una dimenticanza: questo
 * layout avvolge anche /staff/login, che per definizione si apre senza
 * sessione. Il gate sta in app/staff/(dash)/layout.tsx, che avvolge tutto il
 * resto.
 *
 * La scena sta qui per la stessa ragione: il video dietro il vetro è il fondo
 * dell'area intera, login compreso. Montarlo nel layout interno vorrebbe dire
 * che la porta d'ingresso ha un aspetto e la casa un altro.
 *
 * I due font sono dichiarati qui e non in app/layout.tsx: Manrope veste tutta
 * l'interfaccia, Anton serve solo al wordmark. Caricarli a livello di app li
 * farebbe pagare anche alle pagine pubbliche, che hanno i loro.
 */
export const metadata: Metadata = {
  title: 'Staff',
  /* Un'area interna non si indicizza, nemmeno la sua pagina di accesso. */
  robots: { index: false, follow: false },
}

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`lm-staff ${manrope.variable} ${anton.variable}`}>
      <Stage />
      {children}
    </div>
  )
}
