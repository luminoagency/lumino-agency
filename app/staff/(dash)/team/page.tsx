import { notFound } from 'next/navigation'
import { requireStaff } from '@/lib/staff/auth'
import Soon from '../Soon'

export const metadata = { title: 'Team' }

/**
 * Solo admin.
 *
 * Il menù nasconde già la voce a chi non è admin, ma nascondere un link non
 * protegge un indirizzo: /staff/team si scrive a mano. notFound() e non un
 * messaggio di divieto — a un venditore questa pagina non deve nemmeno
 * risultare esistente.
 */
export default async function Page() {
  const me = await requireStaff()
  if (me.role !== 'admin') notFound()

  return (
    <Soon
      sezione="Team"
      titolo="La squadra"
      testo="Chi c'è, con che ruolo, con quale obiettivo mensile e quale provvigione. Gli account si creano da Supabase, qui si gestisce il resto."
      fase={4}
    />
  )
}
