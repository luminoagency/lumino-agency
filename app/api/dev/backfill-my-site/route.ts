/**
 * DEV-only backfill: per utenti registrati PRIMA che il bug del `source` fosse fixato,
 * crea retroattivamente la chain restaurant → client → site → site_content → site_owner.
 *
 * Trigger: GET /api/dev/backfill-my-site (mentre sei loggato)
 * Idempotente: se hai già un sito, ritorna quello esistente.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Disabled in production' }, { status: 403 })
  }

  const admin = createAdminClient()

  // Modalità A: ?email=... (dev only, no auth needed)
  const emailParam = new URL(request.url).searchParams.get('email')
  let user: any = null

  if (emailParam) {
    const { data, error } = await admin.auth.admin.listUsers()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    user = data.users.find(u => u.email?.toLowerCase() === emailParam.toLowerCase()) || null
    if (!user) return NextResponse.json({ error: `Nessun utente con email ${emailParam}` }, { status: 404 })
  } else {
    // Modalità B: usa la sessione corrente
    const sb = createClient()
    const { data: { user: sessionUser } } = await sb.auth.getUser()
    user = sessionUser
  }

  if (!user) {
    return NextResponse.json({
      error: 'Devi essere loggato (oppure passa ?email=tua@email.it in dev)',
    }, { status: 401 })
  }

  // Già esistente?
  const { data: existing } = await admin
    .from('site_owners')
    .select('site_id, sites:site_id(slug, status)')
    .eq('user_id', user.id)
    .maybeSingle()
  if (existing) {
    return NextResponse.json({
      ok: true,
      message: 'Sito già esistente',
      siteId: existing.site_id,
      site: existing.sites,
    })
  }

  // Recupera nome ristorante dal metadata (settato in signUp)
  const meta = (user.user_metadata || {}) as { restaurant_name?: string }
  const name = meta.restaurant_name || 'Il mio ristorante'
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    + '-' + user.id.slice(0, 6)

  // 1. restaurant
  const { data: restaurant, error: e1 } = await admin
    .from('restaurants')
    .insert({ name, city: null, phone: null, email: user.email })
    .select('id')
    .single()
  if (e1) return NextResponse.json({ step: 'restaurant', error: e1.message }, { status: 500 })

  // 2. client
  const { data: client, error: e2 } = await admin
    .from('clients')
    .insert({ restaurant_id: restaurant.id, name, email: user.email, plan: 'pro' })
    .select('id')
    .single()
  if (e2) return NextResponse.json({ step: 'client', error: e2.message }, { status: 500 })

  // 3. site (draft di default: il proprietario lo metterà live quando è pronto)
  const { data: site, error: e3 } = await admin
    .from('sites')
    .insert({
      client_id: client.id,
      slug,
      tier: 'pro',
      active: true,
      status: 'building',  // legacy constraint: 'building' | 'live' | 'error'
    })
    .select('id, slug')
    .single()
  if (e3) return NextResponse.json({ step: 'site', error: e3.message }, { status: 500 })

  // 4. site_owner
  const { error: e4 } = await admin
    .from('site_owners')
    .insert({ user_id: user.id, site_id: site.id, role: 'owner' })
  if (e4) return NextResponse.json({ step: 'site_owner', error: e4.message }, { status: 500 })

  // 5. site_content placeholder
  const { error: e5 } = await admin
    .from('site_content')
    .insert({ site_id: site.id, restaurant_name: name })
  if (e5) return NextResponse.json({ step: 'site_content', error: e5.message }, { status: 500 })

  return NextResponse.json({
    ok: true,
    message: 'Sito creato. Vai su /admin per modificarlo.',
    siteId: site.id,
    slug: site.slug,
  })
}
