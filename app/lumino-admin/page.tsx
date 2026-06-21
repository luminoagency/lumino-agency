import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { SuperAdminClient } from './SuperAdminClient'
import { PLANS, ZONE_MULTIPLIERS, RESTAURANT_LEVEL_MULTIPLIERS } from '@/lib/plans'
import { getEmailMetricsToday, getStrategyPerformanceToday, getWhatsAppMetricsToday, getAnomalies, getWinsToday } from '@/lib/diagnostics/daily'
import { generateDailySummary } from '@/lib/diagnostics/aiSummary'
import { cacheGet, cacheSet, AI_SUMMARY_TTL } from '@/lib/diagnostics/cache'

// SUPER ADMIN ALLOWLIST
const SUPER_ADMINS = ['bylumino06@gmail.com']

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

  // Diagnostics in parallel — direct calls, no server-action wrapper needed here
  const diagnosticsPromise = (async () => {
    try {
      const [email, strategies, whatsapp, wins] = await Promise.all([
        getEmailMetricsToday(),
        getStrategyPerformanceToday(),
        getWhatsAppMetricsToday(),
        getWinsToday(),
      ])
      const anomalies = await getAnomalies(whatsapp.avg_response_time)
      const today = new Date().toISOString().slice(0, 10)
      const cacheKey = `ai_summary_${today}`
      let aiSummary = cacheGet<string>(cacheKey)
      if (!aiSummary) {
        aiSummary = await generateDailySummary({ email, strategies, whatsapp, anomalies, wins })
        cacheSet(cacheKey, aiSummary, AI_SUMMARY_TTL)
      }
      return { email, strategies, whatsapp, anomalies, wins, aiSummary, generatedAt: new Date().toISOString() }
    } catch (e) {
      console.error('[diagnostics] fetch error:', e)
      return null
    }
  })()

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

  // 4. Prenotazioni ultimi 30 giorni — SOLO AGGREGATI per sito (zero dati personali).
  // Lumino non vede nome/telefono/email del guest. Il ristoratore gestisce dal suo /admin.
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data: resRawAgg } = await admin
    .from('site_reservations')
    .select('site_id, status, created_at')
    .gte('created_at', since)
    .limit(5000)
  type AggRow = { site_id: string; siteSlug: string; restaurantName: string; total: number; confirmed: number; cancelled: number; pending: number; confirmedPct: number; cancelledPct: number }
  const aggMap = new Map<string, { total: number; confirmed: number; cancelled: number; pending: number }>()
  for (const r of (resRawAgg || [])) {
    const k = (r as any).site_id as string
    const a = aggMap.get(k) || { total: 0, confirmed: 0, cancelled: 0, pending: 0 }
    a.total++
    if (r.status === 'confirmed') a.confirmed++
    else if (r.status === 'cancelled') a.cancelled++
    else if (r.status === 'pending') a.pending++
    aggMap.set(k, a)
  }
  const reservationsAggregate: AggRow[] = []
  for (const [siteId, a] of aggMap) {
    const s = sites.find(x => x.id === siteId)
    if (!s || a.total === 0) continue
    reservationsAggregate.push({
      site_id: siteId,
      siteSlug: s.slug,
      restaurantName: s.restaurant?.name || s.client?.name || s.slug,
      total: a.total,
      confirmed: a.confirmed,
      cancelled: a.cancelled,
      pending: a.pending,
      confirmedPct: Math.round((a.confirmed / a.total) * 100),
      cancelledPct: Math.round((a.cancelled / a.total) * 100),
    })
  }
  reservationsAggregate.sort((a, b) => b.total - a.total)
  const totalReservations30d = reservationsAggregate.reduce((sum, r) => sum + r.total, 0)

  // 4b. Stato account outreach (warming/active/paused/burned)
  const { data: outreachRaw } = await admin
    .from('outreach_accounts')
    .select('id, email, sender_name, status, warmup_day, daily_cap, delivery_rate, last_paused_at, active, failure_count')
    .order('email')
  type OutreachAccountRow = {
    id: string; email: string; sender_name: string | null;
    status: 'warming' | 'active' | 'paused' | 'burned' | string;
    warmup_day: number; daily_cap: number;
    delivery_rate: number | null;
    last_paused_at: string | null;
    active: boolean;
    failure_count: number;
  }
  const outreachAccounts = (outreachRaw || []) as OutreachAccountRow[]

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

  const diagnosticsData = await diagnosticsPromise

  return (
    <SuperAdminClient
      currentUserEmail={user.email || ''}
      diagnostics={diagnosticsData}
      stats={{
        totalUsers,
        totalSites,
        liveSites,
        buildingSites,
        errorSites,
        reservations30d: totalReservations30d,
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
      reservationsAggregate={reservationsAggregate}
      outreachAccounts={outreachAccounts.map(a => ({
        id: a.id,
        email: a.email,
        sender_name: a.sender_name,
        status: a.status,
        warmup_day: a.warmup_day,
        daily_cap: a.daily_cap,
        delivery_rate: a.delivery_rate,
        last_paused_at: a.last_paused_at,
        active: a.active,
        failure_count: a.failure_count,
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
