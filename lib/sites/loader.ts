/**
 * Public site loader — carica un sito ristorante pubblicato dato lo slug.
 *
 * Usa il client server (anon key) → RLS lascia passare solo `status='live' AND active=true`.
 * Se il sito non esiste o è draft, ritorna null.
 *
 * Output: { template, props } pronti per essere renderizzati.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import type { TemplateKey } from '@/lib/plans'

const TEMPLATE_FALLBACK: TemplateKey = 'cinematico'

export interface LoadedSite {
  template: TemplateKey
  accentColor: string
  tier: 'basic' | 'pro' | 'premium'
  seo: { title: string; description?: string }
  props: any  // shape: vedi templates/_shared (matches DemoRestaurant.data)
}

export async function loadSiteBySlug(slug: string): Promise<LoadedSite | null> {
  if (!slug || typeof slug !== 'string') return null
  // Usa il client admin (bypassa RLS). Sicuro perché:
  //   - filtra esplicitamente active=true AND status='live'
  //   - esposto via Server Component (mai inviato al browser)
  //   - performance migliore (no cookie auth check per ogni visitatore)
  const supabase = createAdminClient()

  // 1. Sito + tier
  const { data: site, error: siteErr } = await supabase
    .from('sites')
    .select('id, tier, active, status, video_url')
    .eq('slug', slug)
    .eq('active', true)
    .eq('status', 'live')
    .maybeSingle()

  if (siteErr || !site) return null

  // 2. site_content (testi, foto, contatti, chef, faq, reviews, theme overrides)
  const { data: content } = await supabase
    .from('site_content')
    .select('*')
    .eq('site_id', site.id)
    .maybeSingle()

  if (!content) return null

  // 3. Menu (jsonb di categories+items)
  const { data: menu } = await supabase
    .from('site_menus')
    .select('categories')
    .eq('site_id', site.id)
    .maybeSingle()

  // 4. Eventi (solo attivi, ordinati per data più vicina)
  const { data: events } = await supabase
    .from('site_events')
    .select('title, description, event_date, image_url')
    .eq('site_id', site.id)
    .eq('active', true)
    .order('event_date', { ascending: true })

  // Template selection
  const template = (
    isValidTemplate(content.theme_template) ? content.theme_template : TEMPLATE_FALLBACK
  ) as TemplateKey

  const accentColor = content.theme_accent || defaultAccent(template)

  // Chef: solo se il ristoratore l'ha attivato in onboarding e ha messo un nome
  const chef = content.chef_active && content.chef_name
    ? {
        name: content.chef_name,
        role: content.chef_role || 'Chef',
        quote: content.chef_quote || '',
        photo: content.chef_photo_url || undefined,
        years: content.chef_years || undefined,
      }
    : undefined

  // Reviews — array dalla cache + score totale
  const reviews = (content.reviews_count || (content.reviews?.length ?? 0) > 0)
    ? {
        score: Number(content.reviews_score || 0),
        count: content.reviews_count || (content.reviews?.length ?? 0),
        source: content.reviews_source || 'Google',
        items: Array.isArray(content.reviews) ? content.reviews : [],
      }
    : undefined

  // WhatsApp: priority a colonna nuova (0009), fallback a quella vecchia
  const whatsappNumber = content.whatsapp_number || content.whatsapp || undefined

  const props = {
    restaurantName: content.restaurant_name,
    tagline: content.tagline || undefined,
    description: content.description || undefined,
    heroImage: content.hero_image_url || undefined,
    heroImages: Array.isArray(content.hero_images) && content.hero_images.length > 0
      ? content.hero_images
      : (content.hero_image_url ? [content.hero_image_url] : []),
    aboutImage: content.about_image_url || undefined,
    aboutText: content.about_text || undefined,
    aboutTitle: content.about_title || undefined,
    menuCategories: Array.isArray(menu?.categories) ? menu!.categories : [],
    galleryImages: Array.isArray(content.gallery_images) ? content.gallery_images : [],
    address: content.address || undefined,
    phone: content.phone || undefined,
    email: content.email || undefined,
    hours: content.opening_hours || {},
    mapsUrl: content.google_maps_embed_url || undefined,
    socialLinks: content.social_links || {},
    tier: site.tier as 'basic' | 'pro' | 'premium',
    events: (events || []).map(e => ({
      title: e.title,
      description: e.description || '',
      date: e.event_date,
      image: e.image_url || undefined,
    })),
    whatsappNumber,
    chef,
    reviews,
    faq: Array.isArray(content.faq) ? content.faq : [],
    timeSlots: Array.isArray(content.time_slots) ? content.time_slots : [],
    videoUrl: site.video_url || undefined,
    logoUrl: content.logo_url || undefined,
    accentColor,
  }

  return {
    template,
    accentColor,
    tier: site.tier as 'basic' | 'pro' | 'premium',
    seo: {
      title: content.seo_title || `${content.restaurant_name}${content.city ? ' · ' + content.city : ''}`,
      description: content.seo_description || content.description || undefined,
    },
    props,
  }
}

function isValidTemplate(t: unknown): t is TemplateKey {
  return typeof t === 'string' && ['cinematico', 'bento', 'panoramico', 'aurora', 'mercato'].includes(t)
}

function defaultAccent(template: TemplateKey): string {
  switch (template) {
    case 'aurora': return '#a78bfa'
    case 'mercato': return '#b8451f'
    case 'panoramico': return '#c9a84c'
    case 'bento': return '#22c55e'
    case 'cinematico':
    default: return '#e52d1d'
  }
}
