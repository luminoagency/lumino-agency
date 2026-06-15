/**
 * DEV-only seed: popola un sito demo "live" nel DB Supabase.
 *
 * Trigger: GET /api/dev/seed-demo (solo se NODE_ENV !== 'production')
 * Idempotente: cancella il demo precedente prima di reinserirlo.
 *
 * Schema: restaurant → client → site → site_content / site_menus / site_events
 * Usa SOLO colonne che esistono sul DB live (0008 + 0009 non ancora applicate).
 *
 * Dopo aver triggerato, vai su /sites/demo-lumino per vedere il sito vero
 * renderizzato da dati reali Supabase.
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { DEMO_RESTAURANTS } from '@/templates/_shared/demoData'

const DEMO_SLUG = 'demo-lumino'

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Seed disabled in production' }, { status: 403 })
  }

  const supabase = createAdminClient()
  const demo = DEMO_RESTAURANTS[0]
  if (!demo) return NextResponse.json({ error: 'No demo data' }, { status: 500 })
  const d = demo.data

  // 1. Cancella il vecchio demo
  await supabase.from('sites').delete().eq('slug', DEMO_SLUG)

  // 2. Crea restaurant
  const { data: restaurant, error: restErr } = await supabase
    .from('restaurants')
    .insert({
      name: d.restaurantName,
      city: 'Milano',
      address: d.address,
      phone: d.phone,
      email: d.email,
    })
    .select('id')
    .single()
  if (restErr || !restaurant) {
    return NextResponse.json({ step: 'restaurant', error: restErr?.message }, { status: 500 })
  }

  // 3. Crea client (chain: restaurant → client → site)
  const { data: client, error: clientErr } = await supabase
    .from('clients')
    .insert({
      restaurant_id: restaurant.id,
      name: d.restaurantName,
      email: d.email,
      phone: d.phone,
      plan: 'premium',
    })
    .select('id')
    .single()
  if (clientErr || !client) {
    return NextResponse.json({ step: 'client', error: clientErr?.message }, { status: 500 })
  }

  // 4. Crea site (live).
  // template_style ha un check constraint legacy (solo luxury/exotic/modern) → lo skippiamo.
  // Il template vero viene scelto dal loader via theme_template (site_content) col fallback.
  const { data: site, error: siteErr } = await supabase
    .from('sites')
    .insert({
      client_id: client.id,
      slug: DEMO_SLUG,
      tier: 'premium',
      active: true,
      status: 'live',
    })
    .select('id')
    .single()
  if (siteErr || !site) {
    return NextResponse.json({ step: 'site', error: siteErr?.message }, { status: 500 })
  }

  // 5. site_content — SOLO colonne che esistono sul DB live (no chef_*, faq, reviews_*, theme_*, hero_images, time_slots, logo_url)
  const { error: contentErr } = await supabase.from('site_content').insert({
    site_id: site.id,
    restaurant_name: d.restaurantName,
    tagline: d.tagline,
    description: d.description,
    hero_image_url: d.heroImage,
    about_image_url: d.aboutImage,
    about_text: d.description,
    address: d.address,
    city: 'Milano',
    phone: d.phone,
    email: d.email,
    whatsapp: d.whatsappNumber,
    google_maps_embed_url: d.mapsUrl,
    opening_hours: d.hours,
    gallery_images: d.galleryImages || [],
    social_links: d.socialLinks || {},
    seo_title: `${d.restaurantName} · ${d.tagline}`,
    seo_description: d.description?.slice(0, 160),
  })
  if (contentErr) {
    return NextResponse.json({ step: 'content', error: contentErr.message }, { status: 500 })
  }

  // 6. site_menus
  if (d.menuCategories?.length) {
    const { error: menuErr } = await supabase
      .from('site_menus')
      .insert({ site_id: site.id, categories: d.menuCategories })
    if (menuErr) {
      return NextResponse.json({ step: 'menu', error: menuErr.message }, { status: 500 })
    }
  }

  // 7. site_events
  if (d.events?.length) {
    const rows = d.events.map((e: any) => ({
      site_id: site.id,
      title: e.title,
      description: e.description,
      event_date: e.date,
      active: true,
    }))
    const { error: evErr } = await supabase.from('site_events').insert(rows)
    if (evErr) {
      return NextResponse.json({ step: 'events', error: evErr.message }, { status: 500 })
    }
  }

  return NextResponse.json({
    ok: true,
    slug: DEMO_SLUG,
    url: `/sites/${DEMO_SLUG}`,
    siteId: site.id,
    message: 'Demo site created. Open /sites/demo-lumino to view.',
    note: 'Migrations 0008+0009 not applied yet — chef section, reviews cache, theme overrides, custom domain, whatsapp button are inactive until pushed.',
  })
}
