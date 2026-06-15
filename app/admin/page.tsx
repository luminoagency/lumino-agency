import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getMySite } from './actions/site'
import { AdminEditor } from './AdminEditor'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const site = await getMySite()
  if (!site) {
    const next = encodeURIComponent('/admin')
    redirect('/login?next=' + next + '&error=' + encodeURIComponent('Accedi per gestire il tuo sito.'))
  }

  // Il join site_content può tornare array oppure oggetto a seconda della relazione
  const content = Array.isArray(site.content) ? site.content[0] : site.content
  const restaurant = Array.isArray(site.restaurant) ? site.restaurant[0] : site.restaurant
  const events = Array.isArray(site.events) ? site.events : []

  return (
    <AdminEditor
      site={{
        id: site.id,
        slug: site.slug,
        tier: site.tier,
        active: site.active,
        status: site.status,
      }}
      initial={{
        restaurant_name: content?.restaurant_name || restaurant?.name || '',
        tagline: content?.tagline || '',
        description: content?.description || '',
        address: content?.address || '',
        city: content?.city || '',
        phone: content?.phone || '',
        email: content?.email || '',
        whatsapp: content?.whatsapp || '',
        opening_hours: content?.opening_hours || {},
      }}
      eventsCount={events.length}
    />
  )
}
