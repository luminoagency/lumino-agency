import { requireStaff } from '@/lib/staff/auth'
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

  return (
    <StaffShell me={me} demo={demoAttivo(me.role)} anteprima={ANTEPRIMA}>
      {children}
    </StaffShell>
  )
}
