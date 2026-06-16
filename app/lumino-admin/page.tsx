import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { SuperAdminClient } from './SuperAdminClient'
import { PLANS, ZONE_MULTIPLIERS, RESTAURANT_LEVEL_MULTIPLIERS } from '@/lib/plans'

// SUPER ADMIN ALLOWLIST
const SUPER_ADMINS = ['outlumino@gmail.com']

export const metadata = { title: 'Lumino Control · Super Admin' }
export const dynamic = 'force-dynamic'

export default async function LuminoAdminPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/lumino-admin')

  if (!SUPER_ADMINS.includes(user.email || '')) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif', padding: '2rem' }}>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&display=swap" />
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <h1 style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: 48, fontWeight: 400, margin: '0 0 12px', letterSpacing: '-0.02em' }}>Accesso negato</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.6 }}>
            Questa pagina è riservata al proprietario di Lumino. Loggato come <strong style={{ color: '#fff' }}>{user.email}</strong>.
          </p>
          <Link href="/admin" style={{ display: 'inline-block', marginTop: 20, color: '#e52d1d', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>← Torna al tuo pannello</Link>
        </div>
      </div>
    )
  }

  const admin = createAdminClient()

  // 1. Utenti (auth.users)
  const usersList = await admin.auth.admin.listUsers()
  const users = usersList.data?.users || []

  // 2. Siti con chain corretta: sites → clients → restaurants
  const { data: sitesRaw } = await admin
    .from('sites')
    .select(`
      id, slug, tier, active, status, created_at, custom_domain,
      client_id, clients:client_id ( id, name, email, plan, restaurant_id, restaurants:restaurant_id ( id, name, city, address ) )
    `)
    .order('created_at', { ascending: false })
    .limit(500)
  const sites: any[] = (sitesRaw || []).map(s => ({
    ...s,
    client: Array.isArray((s as any).clients) ? (s as any).clients[0] : (s as any).clients,
  })).map(s => ({
    ...s,
    restaurant: s.client?.restaurants
      ? (Array.isArray(s.client.restaurants) ? s.client.restaurants[0] : s.client.restaurants)
      : null,
  }))

  // 3. site_owners per mappare user → site
  const { data: ownersRaw } = await admin.from('site_owners').select('site_id, user_id, role').limit(500)
  const owners = ownersRaw || []
  const siteByUserId = new Map<string, any>()
  for (const o of owners) {
    const s = sites.find(x => x.id === o.site_id)
    if (s) siteByUserId.set(o.user_id, s)
  }

  // 4. Prenotazioni ultimi 30 giorni
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data: resRaw } = await admin
    .from('site_reservations')
    .select('id, site_id, guest_name, guest_phone, guest_email, date, time, guests_count, notes, status, created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(200)
  const reservations: any[] = (resRaw || []).map(r => ({
    ...r,
    site: sites.find(s => s.id === r.site_id) || null,
  }))

  // 5. Recensioni in moderazione (site_content.reviews jsonb)
  const { data: contentsRaw } = await admin
    .from('site_content')
    .select('site_id, reviews')
    .limit(500)
  type PendingReview = { siteId: string; siteSlug: string; restaurantName: string; index: number; review: any }
  const pendingReviews: PendingReview[] = []
  for (const c of (contentsRaw || [])) {
    const reviews: any[] = Array.isArray((c as any).reviews) ? (c as any).reviews : []
    const site = sites.find(s => s.id === c.site_id)
    if (!site) continue
    reviews.forEach((r, i) => {
      if (r && r.show === false && r.source === 'site') {
        pendingReviews.push({
          siteId: c.site_id,
          siteSlug: site.slug,
          restaurantName: site.restaurant?.name || site.client?.name || site.slug,
          index: i,
          review: r,
        })
      }
    })
  }

  // 6. Stats
  const totalUsers = users.length
  const totalSites = sites.length
  const liveSites = sites.filter(s => s.status === 'live').length
  const buildingSites = sites.filter(s => s.status === 'building').length
  const errorSites = sites.filter(s => s.status === 'error').length
  const planCount = {
    basic: sites.filter(s => s.tier === 'basic').length,
    pro: sites.filter(s => s.tier === 'pro').length,
    premium: sites.filter(s => s.tier === 'premium').length,
  }
  // MRR potenziale = somma dei prezzi base × siti live di quel tier
  const mrrPotential =
    PLANS.find(p => p.key === 'basic')!.priceFrom * sites.filter(s => s.tier === 'basic' && s.status === 'live').length +
    PLANS.find(p => p.key === 'pro')!.priceFrom * sites.filter(s => s.tier === 'pro' && s.status === 'live').length +
    PLANS.find(p => p.key === 'premium')!.priceFrom * sites.filter(s => s.tier === 'premium' && s.status === 'live').length

  return (
    <SuperAdminClient
      currentUserEmail={user.email || ''}
      stats={{
        totalUsers,
        totalSites,
        liveSites,
        buildingSites,
        errorSites,
        reservations30d: reservations.length,
        pendingReviewsCount: pendingReviews.length,
        mrrPotential,
        planCount,
      }}
      users={users.map(u => ({
        id: u.id,
        email: u.email || '',
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at ?? null,
        restaurant_name: (u.user_metadata as any)?.restaurant_name || '',
        site: siteByUserId.get(u.id) ? {
          id: siteByUserId.get(u.id).id,
          slug: siteByUserId.get(u.id).slug,
          tier: siteByUserId.get(u.id).tier,
          status: siteByUserId.get(u.id).status,
        } : null,
      }))}
      sites={sites.map(s => ({
        id: s.id,
        slug: s.slug || '',
        tier: s.tier || 'basic',
        active: !!s.active,
        status: s.status || 'building',
        created_at: s.created_at,
        custom_domain: s.custom_domain || null,
        restaurant_name: s.restaurant?.name || s.client?.name || '—',
        city: s.restaurant?.city || null,
        client_email: s.client?.email || null,
      }))}
      reservations={reservations.map(r => ({
        id: r.id,
        guest_name: r.guest_name,
        guest_phone: r.guest_phone,
        guest_email: r.guest_email,
        date: r.date,
        time: typeof r.time === 'string' ? r.time.slice(0, 5) : '',
        guests_count: r.guests_count,
        notes: r.notes,
        status: r.status,
        created_at: r.created_at,
        site_slug: r.site?.slug || '',
        restaurant_name: r.site?.restaurant?.name || r.site?.client?.name || '—',
      }))}
      pendingReviews={pendingReviews}
      pricingMeta={{
        plans: PLANS.map(p => ({ key: p.key, name: p.name, priceFrom: p.priceFrom, priceMax: p.priceMax })),
        zones: Object.keys(ZONE_MULTIPLIERS) as any,
        levels: Object.keys(RESTAURANT_LEVEL_MULTIPLIERS) as any,
      }}
    />
  )
}
