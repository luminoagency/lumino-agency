'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendReservationConfirmed, sendReservationCancelled } from '@/lib/integrations/email'

/**
 * Returns the site owned by the currently logged-in user, or null if they don't have one yet.
 * Joins sites + restaurants + site_content + site_menus + site_events.
 */
export async function getMySite() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Find the site_owner row for this user
  const { data: owner } = await supabase
    .from('site_owners')
    .select('site_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!owner) return null

  const { data: site } = await supabase
    .from('sites')
    .select(`
      *,
      restaurant:restaurants(*),
      content:site_content(*),
      menus:site_menus(*),
      events:site_events(*)
    `)
    .eq('id', owner.site_id)
    .maybeSingle()

  return site
}

export async function getMyReservations() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data: owner } = await supabase.from('site_owners').select('site_id').eq('user_id', user.id).maybeSingle()
  if (!owner) return []
  const { data } = await supabase
    .from('site_reservations')
    .select('*')
    .eq('site_id', owner.site_id)
    .order('reservation_date', { ascending: false })
    .limit(100)
  return data || []
}

export async function getMyCustomers() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data: owner } = await supabase.from('site_owners').select('site_id').eq('user_id', user.id).maybeSingle()
  if (!owner) return []
  const { data } = await supabase
    .from('site_customers')
    .select('*')
    .eq('site_id', owner.site_id)
    .order('last_visit', { ascending: false })
  return data || []
}

interface SiteContentInput {
  description?: string
  tagline?: string
  about?: string
  about_title?: string
  about_text?: string
  hero_headline?: string
  hero_subheadline?: string
  hero_image_url?: string
  chef_name?: string
  chef_role?: string
  chef_quote?: string
  chef_photo_url?: string
  chef_years?: number
  faq?: Array<{ q: string; a: string }>
  opening_hours?: Record<string, { open: string; close: string; closed: boolean }>
  theme_template?: string
  theme_accent?: string
  theme_font?: string
}

export async function saveSiteContent(input: SiteContentInput) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Non autenticato.' }
  const { data: owner } = await supabase.from('site_owners').select('site_id').eq('user_id', user.id).maybeSingle()
  if (!owner) return { ok: false, error: 'Nessun sito associato.' }

  // Filtra i campi 0008/0009 se la colonna non esiste sul DB live (retry pulito)
  const baseSafe = { site_id: owner.site_id, ...input }
  let { error } = await supabase
    .from('site_content')
    .upsert(baseSafe as any, { onConflict: 'site_id' })

  if (error && /column .* does not exist|Could not find the/i.test(error.message)) {
    // Rimuovi le colonne che probabilmente non esistono e riprova
    const safe: any = { site_id: owner.site_id }
    const allowed = ['restaurant_name', 'tagline', 'description', 'hero_headline', 'hero_subheadline', 'hero_image_url', 'about_title', 'about_text', 'about_image_url', 'team_photos', 'address', 'city', 'phone', 'email', 'whatsapp', 'google_place_id', 'google_maps_embed_url', 'opening_hours', 'gallery_images', 'style_override', 'social_links', 'seo_title', 'seo_description', 'seo_keywords']
    for (const k of allowed) if (k in (input as any)) safe[k] = (input as any)[k]
    const retry = await supabase.from('site_content').upsert(safe, { onConflict: 'site_id' })
    error = retry.error
  }

  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin')
  revalidatePath(`/sites/[slug]`, 'page')
  return { ok: true }
}

/**
 * Pubblica il sito: status='building' → 'live'.
 * Il sito diventa visibile su /sites/[slug].
 */
export async function publishSite() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Non autenticato.' }
  const { data: owner } = await supabase.from('site_owners').select('site_id').eq('user_id', user.id).maybeSingle()
  if (!owner) return { ok: false, error: 'Nessun sito associato.' }

  const { error } = await supabase
    .from('sites')
    .update({ status: 'live' })
    .eq('id', owner.site_id)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin')
  revalidatePath(`/sites/[slug]`, 'page')
  return { ok: true }
}

/**
 * Nasconde il sito dalla rete: status='live' → 'building'.
 * /sites/[slug] dà 404.
 */
export async function unpublishSite() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Non autenticato.' }
  const { data: owner } = await supabase.from('site_owners').select('site_id').eq('user_id', user.id).maybeSingle()
  if (!owner) return { ok: false, error: 'Nessun sito associato.' }

  const { error } = await supabase
    .from('sites')
    .update({ status: 'building' })
    .eq('id', owner.site_id)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin')
  revalidatePath(`/sites/[slug]`, 'page')
  return { ok: true }
}

interface MenuItemInput {
  id?: string
  category: string
  name: string
  description?: string
  price: number
  available: boolean
  allergens?: string[]
  display_order?: number
}

export async function saveMenuItems(items: MenuItemInput[]) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Non autenticato.' }
  const { data: owner } = await supabase.from('site_owners').select('site_id').eq('user_id', user.id).maybeSingle()
  if (!owner) return { ok: false, error: 'Nessun sito associato.' }

  // Replace strategy: delete all then re-insert (simple for now)
  await supabase.from('site_menus').delete().eq('site_id', owner.site_id)
  if (items.length) {
    const { error } = await supabase
      .from('site_menus')
      .insert(items.map((it, i) => ({ ...it, site_id: owner.site_id, display_order: it.display_order ?? i })))
    if (error) return { ok: false, error: error.message }
  }
  revalidatePath('/admin')
  return { ok: true }
}

export async function deleteMenuItem(id: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Non autenticato.' }
  const { error } = await supabase.from('site_menus').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin')
  return { ok: true }
}

interface EventInput {
  id?: string
  title: string
  description?: string
  event_date: string
  image_url?: string
  active: boolean
}

export async function saveEvents(events: EventInput[]) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Non autenticato.' }
  const { data: owner } = await supabase.from('site_owners').select('site_id').eq('user_id', user.id).maybeSingle()
  if (!owner) return { ok: false, error: 'Nessun sito associato.' }

  await supabase.from('site_events').delete().eq('site_id', owner.site_id)
  if (events.length) {
    const { error } = await supabase
      .from('site_events')
      .insert(events.map(ev => ({ ...ev, site_id: owner.site_id })))
    if (error) return { ok: false, error: error.message }
  }
  revalidatePath('/admin')
  return { ok: true }
}

export async function updateReservationStatus(id: string, status: 'pending' | 'confirmed' | 'cancelled') {
  const supabase = createClient()

  // Fetch reservation + restaurant info before update (need them for email)
  const { data: r } = await supabase
    .from('site_reservations')
    .select('id, guest_name, guest_email, date, time, guests_count, site_id, sites:site_id(slug, restaurant:restaurants(name), content:site_content(restaurant_name, address, phone))')
    .eq('id', id)
    .maybeSingle()

  const { error } = await supabase.from('site_reservations').update({ status }).eq('id', id)
  if (error) return { ok: false, error: error.message }

  // Fire email (don't block on it)
  if (r?.guest_email && (status === 'confirmed' || status === 'cancelled')) {
    const site = (r as any).sites
    const content = site?.content?.[0] || site?.content
    const restaurantName = content?.restaurant_name || site?.restaurant?.name || 'Il ristorante'
    const address = content?.address
    const phone = content?.phone
    const payload = {
      restaurantName,
      guestName: r.guest_name,
      date: r.date,
      time: r.time?.slice(0, 5) || '',
      persons: r.guests_count,
      address,
      phone,
    }
    try {
      if (status === 'confirmed') await sendReservationConfirmed(r.guest_email, payload)
      else await sendReservationCancelled(r.guest_email, payload)
    } catch (e) {
      console.warn('[reservation email] failed', e)
    }
  }

  revalidatePath('/admin')
  return { ok: true }
}
