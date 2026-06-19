'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
// Email transazionali: passano da Gmail + Apps Script (tracking layer).
// Quando aggiungeremo notifiche ai clienti sostituiremo questo posto.
import { trackEvent } from '@/lib/tracking'

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
 * Feature toggles del ristoratore (6 booleani in site_content).
 */
import type { FeatureKey } from '@/lib/plans'

export interface FeatureFlags {
  feature_reservations_enabled: boolean | null
  feature_newsletter_enabled: boolean | null
  feature_events_enabled: boolean | null
  feature_whatsapp_button_enabled: boolean | null
  feature_reviews_enabled: boolean | null
  feature_chef_section_enabled: boolean | null
}

const FEATURE_COL: Record<FeatureKey, keyof FeatureFlags> = {
  reservations:   'feature_reservations_enabled',
  newsletter:     'feature_newsletter_enabled',
  events:         'feature_events_enabled',
  whatsappButton: 'feature_whatsapp_button_enabled',
  reviews:        'feature_reviews_enabled',
  chef:           'feature_chef_section_enabled',
}

export async function setFeatureFlag(feature: FeatureKey, enabled: boolean | null): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Non autenticato.' }
  const { data: owner } = await supabase.from('site_owners').select('site_id').eq('user_id', user.id).maybeSingle()
  if (!owner) return { ok: false, error: 'Nessun sito associato.' }

  const col = FEATURE_COL[feature]
  const payload: any = { site_id: owner.site_id, [col]: enabled }
  const { error } = await supabase.from('site_content').upsert(payload, { onConflict: 'site_id' })
  if (error) {
    if (/column .* does not exist|Could not find the/i.test(error.message)) {
      return { ok: false, error: 'Migrazione 0013 non applicata: applicala dal SQL editor di Supabase.' }
    }
    return { ok: false, error: error.message }
  }
  revalidatePath('/admin')
  revalidatePath('/sites/[slug]', 'page')
  return { ok: true }
}

/**
 * Triggera la pipeline AI per generare il contenuto del sito dell'utente loggato.
 * Sovrascrive tagline/descrizione/menu/foto. Lo status passa a 'live' al successo.
 */
export async function generateMySiteContent() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Non autenticato.' }
  const { data: owner } = await supabase.from('site_owners').select('site_id').eq('user_id', user.id).maybeSingle()
  if (!owner) return { ok: false, error: 'Nessun sito associato.' }

  const { generateSiteContent } = await import('@/lib/pipeline/generate')
  const result = await generateSiteContent({ siteId: owner.site_id })
  if (!result.ok) return { ok: false, error: result.error || 'Generazione fallita' }

  revalidatePath('/admin')
  revalidatePath('/sites/[slug]', 'page')
  return { ok: true, template: result.template, accent: result.accentColor }
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

  // Tracking
  const { data: site } = await supabase
    .from('sites')
    .select('slug, clients:client_id(name)')
    .eq('id', owner.site_id)
    .maybeSingle()
  const restaurantName = site ? ((Array.isArray((site as any).clients) ? (site as any).clients[0] : (site as any).clients)?.name || '') : ''
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://bylumino.com'
  trackEvent('site_published', {
    email: user.email || '',
    restaurantName,
    siteUrl: `${origin}/sites/${site?.slug || ''}`,
  }).catch(() => {})

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

export interface MenuItemDTO {
  name: string
  description?: string
  price: number
  allergens?: string[]
}
export interface MenuCategoryDTO {
  name: string
  description?: string
  items: MenuItemDTO[]
}

/**
 * Restituisce le categorie correnti del menu del sito dell'utente.
 * site_menus.categories è un jsonb; tipologia matched a MenuCategoryDTO[].
 */
export async function getMyMenu(): Promise<{ ok: boolean; categories?: MenuCategoryDTO[]; error?: string }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Non autenticato.' }
  const { data: owner } = await supabase.from('site_owners').select('site_id').eq('user_id', user.id).maybeSingle()
  if (!owner) return { ok: false, error: 'Nessun sito associato.' }
  const { data: menu } = await supabase.from('site_menus').select('categories').eq('site_id', owner.site_id).maybeSingle()
  const categories: MenuCategoryDTO[] = Array.isArray(menu?.categories) ? (menu!.categories as any) : []
  return { ok: true, categories }
}

/**
 * Sovrascrive l'intero menu (delete + insert).
 * Le categorie sono tutte salvate come singola riga jsonb in site_menus.categories.
 */
export async function saveMyMenu(categories: MenuCategoryDTO[]) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Non autenticato.' }
  const { data: owner } = await supabase.from('site_owners').select('site_id').eq('user_id', user.id).maybeSingle()
  if (!owner) return { ok: false, error: 'Nessun sito associato.' }

  await supabase.from('site_menus').delete().eq('site_id', owner.site_id)
  if (categories.length) {
    const { error } = await supabase.from('site_menus').insert({ site_id: owner.site_id, categories })
    if (error) return { ok: false, error: error.message }
  }
  revalidatePath('/admin')
  revalidatePath('/sites/[slug]', 'page')
  return { ok: true }
}

export interface EventDTO {
  title: string
  description?: string
  event_date: string  // YYYY-MM-DD
  image_url?: string
  active?: boolean
}

export async function getMyEvents(): Promise<{ ok: boolean; events?: EventDTO[]; error?: string }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Non autenticato.' }
  const { data: owner } = await supabase.from('site_owners').select('site_id').eq('user_id', user.id).maybeSingle()
  if (!owner) return { ok: false, error: 'Nessun sito associato.' }
  const { data } = await supabase
    .from('site_events')
    .select('title, description, event_date, image_url, active')
    .eq('site_id', owner.site_id)
    .order('event_date', { ascending: true })
  return { ok: true, events: (data as EventDTO[]) || [] }
}

export async function saveMyEvents(events: EventDTO[]) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Non autenticato.' }
  const { data: owner } = await supabase.from('site_owners').select('site_id').eq('user_id', user.id).maybeSingle()
  if (!owner) return { ok: false, error: 'Nessun sito associato.' }

  // Replace strategy
  await supabase.from('site_events').delete().eq('site_id', owner.site_id)
  if (events.length) {
    const rows = events
      .filter(e => e.title && e.event_date)
      .map(e => ({
        site_id: owner.site_id,
        title: e.title,
        description: e.description || null,
        event_date: e.event_date,
        image_url: e.image_url || null,
        active: e.active !== false,
      }))
    if (rows.length) {
      const { error } = await supabase.from('site_events').insert(rows)
      if (error) return { ok: false, error: error.message }
    }
  }
  revalidatePath('/admin')
  revalidatePath('/sites/[slug]', 'page')
  return { ok: true }
}

/**
 * Salva la sezione "Lo chef" (richiede migrazione 0008 applicata — graceful retry altrimenti).
 */
export interface ChefDTO {
  chef_active: boolean
  chef_name?: string
  chef_role?: string
  chef_quote?: string
  chef_photo_url?: string
}

export async function saveMyChef(input: ChefDTO) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Non autenticato.' }
  const { data: owner } = await supabase.from('site_owners').select('site_id').eq('user_id', user.id).maybeSingle()
  if (!owner) return { ok: false, error: 'Nessun sito associato.' }

  const payload: any = {
    site_id: owner.site_id,
    chef_active: input.chef_active,
    chef_name: input.chef_name || null,
    chef_role: input.chef_role || null,
    chef_quote: input.chef_quote || null,
    chef_photo_url: input.chef_photo_url || null,
  }
  const { error } = await supabase.from('site_content').upsert(payload, { onConflict: 'site_id' })
  if (error) {
    if (/column .* does not exist|Could not find the/i.test(error.message)) {
      return { ok: false, error: 'Sezione chef richiede la migrazione 0008 applicata al DB.' }
    }
    return { ok: false, error: error.message }
  }
  revalidatePath('/admin')
  revalidatePath('/sites/[slug]', 'page')
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

  // TODO: notifica al cliente via Gmail + Apps Script (non bloccante).
  // Per ora il ristoratore aggiorna lo status; nessuna mail in uscita al guest.

  revalidatePath('/admin')
  return { ok: true }
}
