import type { Metadata } from 'next'
import { anton } from '@/components/home/fonts'
import './staff.css'

/**
 * Involucro dell'area staff — il vestito, non il guardiano.
 *
 * Qui non c'è nessun controllo di accesso, e non è una dimenticanza: questo
 * layout avvolge anche /staff/login, che per definizione si apre senza
 * sessione. Il gate sta in app/staff/(dash)/layout.tsx, che avvolge tutto il
 * resto.
 *
 * Anton è dichiarato qui e non in app/layout.tsx: serve ai numeri dei KPI, e
 * caricarlo a livello di app lo farebbe pagare anche alle pagine pubbliche.
 */
export const metadata: Metadata = {
  title: 'Staff',
  /* Un'area interna non si indicizza, nemmeno la sua pagina di accesso. */
  robots: { index: false, follow: false },
}

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return <div className={`lm-staff ${anton.variable}`}>{children}</div>
}
