import { redirect } from 'next/navigation'
import { getMyMenu, getMySite } from '../actions/site'
import { MenuEditor } from './MenuEditor'

export const dynamic = 'force-dynamic'

export default async function MenuPage() {
  const site = await getMySite()
  if (!site) {
    redirect('/login?next=' + encodeURIComponent('/admin/menu') + '&error=' + encodeURIComponent('Accedi per gestire il menu.'))
  }
  const m = await getMyMenu()
  return (
    <MenuEditor
      initial={m.categories || []}
      siteSlug={(site as any).slug}
    />
  )
}
