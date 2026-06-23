import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDemoEvents, saveDemoEvents } from '../actions'
import { SUPER_ADMINS, DEMO_SITE_SLUG } from '../constants'
import { EventsEditor } from '@/app/admin/events/EventsEditor'

export const dynamic = 'force-dynamic'

export default async function DemoEventiPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !SUPER_ADMINS.includes(user.email || '')) {
    redirect('/login?next=/lumino-dashboard/eventi')
  }

  const e = await getDemoEvents()
  return (
    <EventsEditor
      initial={e.events || []}
      siteSlug={DEMO_SITE_SLUG}
      backPath="/lumino-dashboard"
      saveAction={saveDemoEvents}
    />
  )
}
