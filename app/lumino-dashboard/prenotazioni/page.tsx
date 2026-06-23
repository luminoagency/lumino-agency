import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  getDemoReservations, confirmDemoReservation, cancelDemoReservation,
} from '../actions'
import { SUPER_ADMINS, DEMO_SITE_SLUG } from '../constants'
import { ReservationsManager } from '@/app/admin/prenotazioni/ReservationsManager'

export const dynamic = 'force-dynamic'

export default async function DemoPrenotazioniPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !SUPER_ADMINS.includes(user.email || '')) {
    redirect('/login?next=/lumino-dashboard/prenotazioni')
  }

  const r = await getDemoReservations()
  return (
    <ReservationsManager
      siteSlug={DEMO_SITE_SLUG}
      backPath="/lumino-dashboard"
      initial={r.reservations || []}
      confirmAction={confirmDemoReservation}
      cancelAction={cancelDemoReservation}
    />
  )
}
