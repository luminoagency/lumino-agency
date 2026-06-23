import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDemoMenu, saveDemoMenu } from '../actions'
import { SUPER_ADMINS, DEMO_SITE_SLUG } from '../constants'
import { MenuEditor } from '@/app/admin/menu/MenuEditor'

export const dynamic = 'force-dynamic'

export default async function DemoMenuPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !SUPER_ADMINS.includes(user.email || '')) {
    redirect('/login?next=/lumino-dashboard/menu')
  }

  const m = await getDemoMenu()
  return (
    <MenuEditor
      initial={m.categories || []}
      siteSlug={DEMO_SITE_SLUG}
      backPath="/lumino-dashboard"
      saveAction={saveDemoMenu}
    />
  )
}
