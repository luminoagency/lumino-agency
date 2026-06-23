import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getMySite } from './actions/site'
import { AdminEditor } from './AdminEditor'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  // Verifica reale della sessione. Se non autenticato → login.
  // Se autenticato ma senza sito → messaggio, NON redirect a /login
  // (altrimenti un utente loggato verrebbe sbattuto sul form di login).
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login?next=' + encodeURIComponent('/admin') + '&error=' + encodeURIComponent('Accedi per gestire il tuo sito.'))
  }

  const site = await getMySite()
  if (!site) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif', padding: '2rem' }}>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&display=swap" />
        <div style={{ textAlign: 'center', maxWidth: 460 }}>
          <h1 style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: 36, fontStyle: 'italic', fontWeight: 400, margin: '0 0 12px' }}>Nessun sito collegato</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.6 }}>
            Sei loggato come <strong style={{ color: '#fff' }}>{user.email}</strong> ma a questo account non è ancora associato un sito.
            Se hai appena completato la registrazione, attendi qualche minuto o contatta Lumino.
          </p>
          <Link href="/" style={{ display: 'inline-block', marginTop: 20, color: '#e52d1d', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>← Torna alla home</Link>
        </div>
      </div>
    )
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
      featureFlags={{
        feature_reservations_enabled:    content?.feature_reservations_enabled ?? null,
        feature_newsletter_enabled:      content?.feature_newsletter_enabled ?? null,
        feature_events_enabled:          content?.feature_events_enabled ?? null,
        feature_whatsapp_button_enabled: content?.feature_whatsapp_button_enabled ?? null,
        feature_reviews_enabled:         content?.feature_reviews_enabled ?? null,
        feature_chef_section_enabled:    content?.feature_chef_section_enabled ?? null,
      }}
      eventsCount={events.length}
    />
  )
}
