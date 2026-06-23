import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getDemoSite } from './actions'
import { SUPER_ADMINS, DEMO_SITE_SLUG } from './constants'
import { DemoDashboardEditor } from './DemoDashboardEditor'

export const metadata = { title: 'Dashboard Demo Cliente · Lumino' }
export const dynamic = 'force-dynamic'

export default async function LuminoDashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/lumino-dashboard')

  if (!SUPER_ADMINS.includes(user.email || '')) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif', padding: '2rem' }}>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&display=swap" />
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <h1 style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: 48, fontWeight: 400, margin: '0 0 12px', letterSpacing: '-0.02em' }}>Accesso negato</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.6 }}>
            Questa pagina è riservata al super-admin. Loggato come <strong style={{ color: '#fff' }}>{user.email}</strong>.
          </p>
          <Link href="/admin" style={{ display: 'inline-block', marginTop: 20, color: '#e52d1d', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>← Torna al tuo pannello</Link>
        </div>
      </div>
    )
  }

  const site = await getDemoSite()

  if (!site) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif', padding: '2rem' }}>
        <div style={{ textAlign: 'center', maxWidth: 520 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🧪</div>
          <h1 style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: 32, fontWeight: 400, margin: '0 0 12px' }}>Sito demo non trovato</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
            Applica la migrazione <code style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: 6, fontSize: 12 }}>0017_demo_site.sql</code> nel SQL editor di Supabase per creare il sito demo con i dati di esempio.
          </p>
          <Link href="/lumino-admin" style={{ display: 'inline-block', color: '#e52d1d', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>← Pannello Lumino</Link>
        </div>
      </div>
    )
  }

  const content = Array.isArray(site.content) ? site.content[0] : site.content
  const events = Array.isArray(site.events) ? site.events : []

  return (
    <DemoDashboardEditor
      site={{
        id: site.id,
        slug: (site.slug as string) ?? DEMO_SITE_SLUG,
        tier: (site.tier as string) ?? 'pro',
        active: !!site.active,
        status: (site.status as string) ?? 'live',
      }}
      initial={{
        restaurant_name: (content as any)?.restaurant_name || 'Trattoria Demo Lumino',
        tagline: (content as any)?.tagline || '',
        description: (content as any)?.description || '',
        address: (content as any)?.address || '',
        city: (content as any)?.city || '',
        phone: (content as any)?.phone || '',
        email: (content as any)?.email || '',
        whatsapp: (content as any)?.whatsapp || '',
        opening_hours: (content as any)?.opening_hours || {},
      }}
      featureFlags={{
        feature_reservations_enabled:    (content as any)?.feature_reservations_enabled ?? null,
        feature_newsletter_enabled:      (content as any)?.feature_newsletter_enabled ?? null,
        feature_events_enabled:          (content as any)?.feature_events_enabled ?? null,
        feature_whatsapp_button_enabled: (content as any)?.feature_whatsapp_button_enabled ?? null,
        feature_reviews_enabled:         (content as any)?.feature_reviews_enabled ?? null,
        feature_chef_section_enabled:    (content as any)?.feature_chef_section_enabled ?? null,
      }}
      eventsCount={events.length}
    />
  )
}
