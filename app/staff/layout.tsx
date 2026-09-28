import type { Metadata } from 'next'
import { anton } from '@/components/home/fonts'
import { manrope, naskh } from '@/components/staff/fonts'
import Sfondo from '@/components/staff/Sfondo'
import './staff.css'

/**
 * Involucro dell'area staff — il vestito, non il guardiano.
 *
 * Qui non c'è nessun controllo di accesso, e non è una dimenticanza: questo
 * layout avvolge anche /staff/login, che per definizione si apre senza
 * sessione. Il gate sta in app/staff/(dash)/layout.tsx, che avvolge tutto il
 * resto.
 *
 * La scena sta qui per la stessa ragione: lo sfondo che si muove dietro il
 * vetro è il fondo dell'area intera, login compreso. Montarlo nel layout
 * interno vorrebbe dire che la porta d'ingresso ha un aspetto e la casa un
 * altro.
 *
 * I tre font sono dichiarati qui e non in app/layout.tsx: Manrope veste tutta
 * l'interfaccia, Anton serve solo al wordmark, Noto Naskh Arabic solo le ayat
 * del widget della preghiera. Caricarli a livello di app li farebbe pagare
 * anche alle pagine pubbliche, che hanno i loro — e il subset arabo non
 * c'entra niente con il sito di un ristorante.
 */
export const metadata: Metadata = {
  title: 'Staff',
  /* Un'area interna non si indicizza, nemmeno la sua pagina di accesso. */
  robots: { index: false, follow: false },
}

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`lm-staff ${manrope.variable} ${anton.variable} ${naskh.variable}`}>
      <Sfondo />
      {children}
    </div>
  )
}
