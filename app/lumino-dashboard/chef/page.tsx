import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDemoSite, saveDemoChef, SUPER_ADMINS, DEMO_SITE_SLUG } from '../actions'
import { ChefEditor } from '@/app/admin/chef/ChefEditor'

export const dynamic = 'force-dynamic'

export default async function DemoChefPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !SUPER_ADMINS.includes(user.email || '')) {
    redirect('/login?next=/lumino-dashboard/chef')
  }

  const site = await getDemoSite()
  const content = site ? (Array.isArray(site.content) ? site.content[0] : site.content) : null

  return (
    <ChefEditor
      siteSlug={DEMO_SITE_SLUG}
      backPath="/lumino-dashboard"
      saveAction={saveDemoChef}
      initial={{
        chef_active: !!(content as any)?.chef_active,
        chef_name: (content as any)?.chef_name || '',
        chef_role: (content as any)?.chef_role || '',
        chef_quote: (content as any)?.chef_quote || '',
        chef_photo_url: (content as any)?.chef_photo_url || '',
      }}
    />
  )
}
