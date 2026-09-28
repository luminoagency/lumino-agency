import { requireStaff } from '@/lib/staff/auth'
import { firmaAvatar } from '@/lib/staff/avatar'
import { ANTEPRIMA } from '@/lib/staff/db'
import { demoAttivo } from '@/lib/staff/demo'
import StaffShell from './StaffShell'

/**
 * Il gate dell'area staff.
 *
 * Sta su un route group — app/staff/(dash) — e non su app/staff, perché un
 * layout avvolge ogni figlio: messo un livello più su avvolgerebbe anche
 * /staff/login, cioè chiederebbe una sessione per poter fare il login.
 *
 * Il controllo è QUI e non solo nel middleware: il middleware guarda se esiste
 * un cookie, non se vale. Qui si interroga davvero Supabase.
 */
export default async function StaffDashLayout({ children }: { children: React.ReactNode }) {
  const me = await requireStaff()
  /* La firma dell'avatar si fa qui, una volta per navigazione, e non dentro il
     rail: il rail è un componente client e non può toccare il service-role.
     Sei ore di validità e le pagine tutte `force-dynamic`, quindi la firma si
     rifà da sola prima di scadere. */
  const foto = await firmaAvatar(me.foto_url)

  return (
    <StaffShell me={me} foto={foto} demo={demoAttivo(me.role)} anteprima={ANTEPRIMA}>
      {children}
    </StaffShell>
  )
}
