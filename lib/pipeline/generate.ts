/**
 * Pipeline generazione contenuti sito — genera tutto il contenuto del sito ristorante dai dati che abbiamo.
 *
 * Input: site_id già creato in DB (dalla registrazione)
 * Output: site_content riempito + site_menus + template scelto + status='live'
 *
 * Step:
 *  1. Carica restaurant + client + sito + content esistente
 *  2. Sceglie template in base al tipo cucina (heuristic) — sostituibile dopo
 *  3. Chiama Claude con tool-use forzato per produrre JSON strutturato
 *  4. Sceglie 6 foto da Unsplash basate su cuisine/tipo locale
 *  5. Aggiorna site_content + crea/aggiorna site_menus
 *  6. Marca sito 'live' (solo se saldo 70% confermato, altrimenti resta 'building')
 *
 * Idempotente: rigenerare sovrascrive il contenuto precedente.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { getClaude } from '@/lib/ai/claude'
import { generateWordmarkLogo, type LogoTemplate } from '@/lib/integrations/logoGenerator'
import { searchHeroVideoForTemplate } from '@/lib/integrations/pexelsVideos'
import type { TemplateKey } from '@/lib/plans'

const MODEL = 'claude-sonnet-4-6'

interface GenerateOptions {
  siteId: string
  /** opzionale, sovrascrive il tipo cucina dedotto dal nome */
  cuisineOverride?: string
}

export interface GenerationResult {
  ok: boolean
  template?: TemplateKey
  accentColor?: string
  error?: string
}

export async function generateSiteContent(opts: GenerateOptions): Promise<GenerationResult> {
  const supabase = createAdminClient()

  // 1. Carica il sito + restaurant
  const { data: site, error: siteErr } = await supabase
    .from('sites')
    .select(`
      id, tier, slug, status, final_payment_confirmed,
      client_id,
      clients:client_id (
        id, name, email, phone,
        restaurant_id,
        restaurants:restaurant_id ( id, name, city, address, phone, email, category, photos_urls, google_place_id )
      ),
      content:site_content(*)
    `)
    .eq('id', opts.siteId)
    .maybeSingle()

  if (siteErr || !site) return { ok: false, error: siteErr?.message || 'Sito non trovato' }

  const client = Array.isArray((site as any).clients) ? (site as any).clients[0] : (site as any).clients
  const restaurant = client?.restaurants
    ? (Array.isArray(client.restaurants) ? client.restaurants[0] : client.restaurants)
    : null
  const content = Array.isArray((site as any).content) ? (site as any).content[0] : (site as any).content

  const restaurantName: string = content?.restaurant_name || restaurant?.name || client?.name || 'Il Ristorante'
  const city: string = content?.city || restaurant?.city || ''
  const phone: string = content?.phone || restaurant?.phone || client?.phone || ''
  const email: string = content?.email || restaurant?.email || client?.email || ''
  const address: string = content?.address || restaurant?.address || ''
  const tier: 'basic' | 'pro' | 'premium' = (site as any).tier || 'basic'

  const cuisine = opts.cuisineOverride
    || restaurant?.category
    || guessCuisineFromName(restaurantName)

  // 2. Sceglie template
  const template = pickTemplateForCuisine(cuisine)
  const accentColor = defaultAccentForTemplate(template)

  // 3. Chiama Claude per il contenuto strutturato
  const generated = await callClaudeForContent({
    restaurantName, city, cuisine, address, tier,
  })

  if (!generated) {
    return { ok: false, error: 'Generazione contenuti fallita' }
  }

  // 4. Foto da Unsplash (hero + about + 6 gallery)
  const photos = await pickPhotos(cuisine)

  // 4b. Logo wordmark SVG (sostituisce la vecchia generazione logo Ideogram).
  // Render text-based in font coerente col template scelto.
  const logo = generateWordmarkLogo({
    restaurantName,
    template: template as LogoTemplate,
    primaryColor: accentColor,
  })

  // 4c. Hero video gratis da Pexels (solo Premium).
  // DISATTIVATO: nessun template renderizza video_url al momento. Riattivare quando un template aggiunge il supporto.
  // Codice del fetch lasciato come riferimento, gated dal flag interno qui sotto.
  // Fail-soft: se manca PEXELS_API_KEY o Pexels è down, video resta null
  // e il sito usa la sola hero image. Non blocca mai la generazione.
  const HERO_VIDEO_ENABLED = false
  const heroVideo = HERO_VIDEO_ENABLED && tier === 'premium'
    ? await searchHeroVideoForTemplate(template as LogoTemplate)
    : null

  // 5. Aggiorna site_content (graceful: prova con tutti i campi, fallback ai campi base)
  const fullPayload: any = {
    site_id: site.id,
    restaurant_name: restaurantName,
    tagline: generated.tagline,
    description: generated.description,
    hero_image_url: photos.hero,
    about_image_url: photos.about,
    about_text: generated.about_text,
    about_title: generated.about_title || 'La nostra storia',
    address,
    city,
    phone,
    email,
    google_maps_embed_url: city ? buildMapsEmbedUrl(`${restaurantName} ${address || city}`) : null,
    gallery_images: photos.gallery.map((url, i) => ({ url, alt: `${restaurantName} foto ${i + 1}`, caption: '' })),
    social_links: content?.social_links || {},
    seo_title: `${restaurantName}${city ? ' · ' + city : ''}`,
    seo_description: generated.description?.slice(0, 160) || '',
    // Campi 0008 (opzionali): se la migrazione non è applicata vengono droppati dal retry
    faq: generated.faq || [],
    theme_template: template,
    theme_accent: accentColor,
    hero_images: [photos.hero, ...photos.gallery.slice(0, 2)],
    time_slots: generated.time_slots || ['19:00', '19:30', '20:00', '20:30', '21:00', '21:30'],
    // Logo wordmark SVG (data URL base64): storage diretto in site_content.
    // Premium puo sostituire da admin con upload custom.
    logo_url: logo.dataUrl,
  }

  const baseAllowed = new Set(['site_id', 'restaurant_name', 'tagline', 'description', 'hero_image_url', 'about_image_url', 'about_text', 'about_title', 'address', 'city', 'phone', 'email', 'google_maps_embed_url', 'gallery_images', 'social_links', 'seo_title', 'seo_description'])

  let { error: upErr } = await supabase
    .from('site_content')
    .upsert(fullPayload, { onConflict: 'site_id' })
  if (upErr && /column .* does not exist|Could not find the/i.test(upErr.message)) {
    const basePayload: any = {}
    for (const k of Object.keys(fullPayload)) if (baseAllowed.has(k)) basePayload[k] = fullPayload[k]
    const retry = await supabase.from('site_content').upsert(basePayload, { onConflict: 'site_id' })
    upErr = retry.error
  }
  if (upErr) return { ok: false, error: 'site_content: ' + upErr.message }

  // 6. Menu — sovrascrive completamente (delete + insert)
  await supabase.from('site_menus').delete().eq('site_id', site.id)
  if (generated.menuCategories?.length) {
    const { error: mErr } = await supabase
      .from('site_menus')
      .insert({ site_id: site.id, categories: generated.menuCategories })
    if (mErr) return { ok: false, error: 'site_menus: ' + mErr.message }
  }

  // 7. Salva eventuale hero video (Premium). Va 'live' SOLO se il saldo (70%)
  //    è confermato; altrimenti resta 'building' (pronto, in attesa di pubblicazione).
  const finalPaid = !!(site as any).final_payment_confirmed
  await supabase.from('sites').update({
    status: finalPaid ? 'live' : 'building',
    ...(heroVideo ? { video_url: heroVideo.url } : {}),
  }).eq('id', site.id)

  return { ok: true, template, accentColor }
}

// ─────────────── Helpers ───────────────

function pickTemplateForCuisine(cuisine: string): TemplateKey {
  const c = (cuisine || '').toLowerCase()
  if (/sushi|giapp|asian|fusion|nikkei|cocktail/.test(c)) return 'aurora'
  if (/tratt|nonna|tradizion|casalin|toscan|romagn|sicil/.test(c)) return 'mercato'
  if (/burger|fast|pizza|street|smash|kebab/.test(c)) return 'bento'
  if (/pesce|seafood|mare|fish|crud/.test(c)) return 'panoramico'
  if (/stell|gourmet|degust|chef|fine|alta cucina/.test(c)) return 'cinematico'
  return 'cinematico'
}

function defaultAccentForTemplate(template: TemplateKey): string {
  switch (template) {
    case 'aurora': return '#a78bfa'
    case 'mercato': return '#b8451f'
    case 'panoramico': return '#c9a84c'
    case 'bento': return '#22c55e'
    case 'cinematico':
    default: return '#e52d1d'
  }
}

function guessCuisineFromName(name: string): string {
  const n = (name || '').toLowerCase()
  if (/sushi|hanami|tokio|tokyo|nikkei|ramen/.test(n)) return 'Sushi giapponese'
  if (/pizza|pizzeria|napoli/.test(n)) return 'Pizzeria'
  if (/burger|grill|smash|steakhouse/.test(n)) return 'Burger e griglia'
  if (/trattoria|nonna|osteria/.test(n)) return 'Cucina italiana tradizionale'
  return 'Cucina italiana'
}

function buildMapsEmbedUrl(query: string): string {
  const key = process.env.GOOGLE_MAPS_API_KEY || ''
  const q = encodeURIComponent(query)
  if (key) return `https://www.google.com/maps/embed/v1/place?key=${key}&q=${q}`
  // Fallback senza chiave: link embed standard (potrebbe avere watermark)
  return `https://www.google.com/maps?q=${q}&output=embed`
}

interface UnsplashSet {
  hero: string
  about: string
  gallery: string[]
}

async function pickPhotos(cuisine: string): Promise<UnsplashSet> {
  // Query smart per Unsplash
  const queries = unsplashQueriesForCuisine(cuisine)
  const accessKey = process.env.UNSPLASH_ACCESS_KEY
  const photos: string[] = []

  if (accessKey) {
    try {
      const q = encodeURIComponent(queries[0])
      const res = await fetch(`https://api.unsplash.com/search/photos?query=${q}&per_page=10&orientation=landscape&content_filter=high&client_id=${accessKey}`)
      if (res.ok) {
        const json: any = await res.json()
        for (const p of (json.results || [])) {
          if (p.urls?.regular) photos.push(p.urls.regular)
        }
      }
    } catch {}
  }

  // Fallback statici curati (sempre Unsplash, hot-link, no API)
  if (photos.length < 8) {
    const fallback = fallbackPhotosForCuisine(cuisine)
    for (const url of fallback) if (!photos.includes(url)) photos.push(url)
  }

  while (photos.length < 8) photos.push(fallbackGenericFood())

  return {
    hero: photos[0],
    about: photos[1],
    gallery: photos.slice(2, 8),
  }
}

function unsplashQueriesForCuisine(cuisine: string): string[] {
  const c = (cuisine || '').toLowerCase()
  if (/sushi|giapp|nikkei/.test(c)) return ['sushi restaurant interior', 'japanese food']
  if (/pizz/.test(c)) return ['pizza restaurant', 'italian pizza']
  if (/burger|smash/.test(c)) return ['burger restaurant', 'gourmet burger']
  if (/tratt|nonna|toscan/.test(c)) return ['italian trattoria', 'pasta dish']
  if (/pesce|seafood|mare/.test(c)) return ['seafood restaurant', 'fresh fish']
  if (/gourmet|stell|fine/.test(c)) return ['fine dining restaurant', 'gourmet dish']
  return ['italian restaurant interior', 'mediterranean food']
}

function fallbackPhotosForCuisine(cuisine: string): string[] {
  const c = (cuisine || '').toLowerCase()
  if (/sushi|giapp/.test(c)) return [
    'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=1920&q=85',
    'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=1600&q=85',
    'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=1600&q=85',
    'https://images.unsplash.com/photo-1553621042-f6e147245754?w=1600&q=85',
    'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=1600&q=85',
    'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1600&q=85',
    'https://images.unsplash.com/photo-1564844536311-de546a28c87d?w=1600&q=85',
    'https://images.unsplash.com/photo-1617196034183-421b4917c92d?w=1600&q=85',
  ]
  if (/pizz/.test(c)) return [
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1920&q=85',
    'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=1600&q=85',
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1600&q=85',
    'https://images.unsplash.com/photo-1571066811602-716837d681de?w=1600&q=85',
    'https://images.unsplash.com/photo-1593504049359-74330189a345?w=1600&q=85',
    'https://images.unsplash.com/photo-1542528180-a1208c5169a5?w=1600&q=85',
    'https://images.unsplash.com/photo-1601924582970-9238bcb495d9?w=1600&q=85',
    'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=1600&q=85',
  ]
  if (/burger|smash/.test(c)) return [
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1920&q=85',
    'https://images.unsplash.com/photo-1535473895227-bdecb20fb157?w=1600&q=85',
    'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=1600&q=85',
    'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=1600&q=85',
    'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=1600&q=85',
    'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=1600&q=85',
    'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=1600&q=85',
    'https://images.unsplash.com/photo-1572441713132-c542fc4fe282?w=1600&q=85',
  ]
  // generic italian
  return [
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1920&q=85',
    'https://images.unsplash.com/photo-1481833761820-0509d3217039?w=1600&q=85',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=85',
    'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=1600&q=85',
    'https://images.unsplash.com/photo-1551782450-17144efb9c50?w=1600&q=85',
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=1600&q=85',
    'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1600&q=85',
    'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=1600&q=85',
  ]
}

function fallbackGenericFood(): string {
  return 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600&q=85'
}

// ─────────────── Claude call ───────────────

interface ClaudeContent {
  tagline: string
  description: string
  about_title: string
  about_text: string
  faq: Array<{ q: string; a: string }>
  menuCategories: Array<{
    name: string
    description?: string
    items: Array<{ name: string; description?: string; price: number; allergens?: string[] }>
  }>
  time_slots: string[]
}

async function callClaudeForContent(args: {
  restaurantName: string
  city: string
  cuisine: string
  address: string
  tier: 'basic' | 'pro' | 'premium'
}): Promise<ClaudeContent | null> {
  const client = getClaude()
  const { restaurantName, city, cuisine, address, tier } = args

  const systemPrompt = `Sei un copywriter italiano di altissimo livello specializzato in siti per ristoranti.
Scrivi sempre in italiano elegante, mai banale, con voce calda e mai vendereccia.
Genera testi e menu COERENTI tra di loro (la tagline deve riflettere la stessa anima del menu).
Inventare ricette plausibili per il tipo di cucina richiesto, con prezzi realistici italiani.

Stai scrivendo per il RISTORANTE (ne racconti la voce), rivolgendoti a chi lo leggerà.

Regole di scrittura obbligatorie:
- Frasi brevi. Verbi attivi.
- Usa sempre "tu", mai "Lei".
- Niente slogan, niente esclamativi multipli, niente emoji nei testi formali.
- Niente promesse di numeri (mai "+300%", "raddoppierai", ecc.).
- Niente inglesismi non necessari.
- Tono: competente, calmo, diretto, caldo ma non amichevole, concreto.
- Onestà tecnica (usa "dipende", "spesso", "in molti casi" invece di garantire).
- MAI usare queste parole: agenzia, automatico, automatizzato, piattaforma, algoritmo, intelligenza artificiale — nemmeno in negativo o tra virgolette.`

  const userPrompt = `Genera il contenuto del sito per questo ristorante:

Nome: ${restaurantName}
Città: ${city || 'Italia'}
Indirizzo: ${address || 'non specificato'}
Tipo cucina: ${cuisine}
Piano: ${tier}

Devi produrre:
- tagline: 4-7 parole, evocativa, NON commerciale
- description: 2-3 frasi sulla storia/identità, max 280 caratteri totali
- about_title: titolo della sezione "Chi siamo", 2-4 parole eleganti
- about_text: paragrafo di 80-130 parole sulla cucina, atmosfera, valori
- faq: 5 domande frequenti realistiche (vegano, prenotazioni, gruppi, parcheggio, animali). Risposte 1-2 frasi.
- menuCategories: 3-4 categorie coerenti col tipo cucina, ognuna con 4-6 piatti. Prezzi in EURO (numero, no €). Aggiungi allergens dove pertinente (valori: vegan, vegetarian, gf, spicy, signature, nuts).
- time_slots: ${tier === 'basic' ? '6 slot orari per il bottone prenotazione' : '8 slot orari'} per cena (formato HH:MM)

Restituisci SOLO l'oggetto JSON tramite il tool, niente testo extra.`

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: systemPrompt,
      tools: [
        {
          name: 'output_site_content',
          description: 'Output del contenuto del sito ristorante in formato strutturato',
          input_schema: {
            type: 'object',
            properties: {
              tagline: { type: 'string' },
              description: { type: 'string' },
              about_title: { type: 'string' },
              about_text: { type: 'string' },
              faq: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: { q: { type: 'string' }, a: { type: 'string' } },
                  required: ['q', 'a'],
                },
              },
              menuCategories: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    description: { type: 'string' },
                    items: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          name: { type: 'string' },
                          description: { type: 'string' },
                          price: { type: 'number' },
                          allergens: { type: 'array', items: { type: 'string' } },
                        },
                        required: ['name', 'price'],
                      },
                    },
                  },
                  required: ['name', 'items'],
                },
              },
              time_slots: { type: 'array', items: { type: 'string' } },
            },
            required: ['tagline', 'description', 'about_title', 'about_text', 'faq', 'menuCategories', 'time_slots'],
          },
        },
      ],
      tool_choice: { type: 'tool', name: 'output_site_content' },
      messages: [{ role: 'user', content: userPrompt }],
    })

    const toolUse: any = response.content.find((c: any) => c.type === 'tool_use')
    if (!toolUse) return null
    return toolUse.input as ClaudeContent
  } catch (err) {
    console.error('[pipeline] Claude error:', err)
    return null
  }
}
