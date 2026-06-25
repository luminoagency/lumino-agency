/**
 * Lumino Agency — piani ufficiali (giugno 2026).
 * Fonte unica per landing, pagina prezzi, gating admin, calcolo prezzo dinamico.
 * NON duplicare prezzi o feature in altri file: importare sempre da qui.
 */

export type PlanKey = 'basic' | 'pro' | 'premium'

export interface Plan {
  key: PlanKey
  name: string
  tagline: string
  description: string
  accent: string
  priceFrom: number
  priceMax: number
  features: string[]
  excluded: string[]
  cta: string
  highlight: boolean
  badge?: string
}

export const PLANS: Plan[] = [
  {
    key: 'basic',
    name: 'Basic',
    tagline: 'il sito che funziona',
    description: 'Per chi vuole essere online in modo semplice e curato.',
    accent: '#888',
    priceFrom: 190,
    priceMax: 280,
    features: [
      'Sito completo pubblicato in pochi giorni',
      'Menu con foto e allergeni',
      'Orari, indirizzo e mappa Google',
      'Sezione domande frequenti',
      'Galleria fotografica',
      'Pulsante chiamata diretta',
      'Recensioni Google in vetrina',
      'Sito perfetto su smartphone',
      'Sito su tuonome.bylumino.com',
      'Pannello admin limitato (orari, contatti, contenuti base)',
    ],
    excluded: [
      'Sezione "Lo chef"',
      'Pulsante WhatsApp diretto',
      'Prenotazioni online',
      'Eventi pubblicati sul sito',
      'Newsletter clienti',
    ],
    cta: 'Inizia ora',
    highlight: false,
  },
  {
    key: 'pro',
    name: 'Pro',
    tagline: 'il sito che prende prenotazioni',
    description: 'Per chi vuole far entrare più clienti dal sito.',
    accent: '#a78bfa',
    priceFrom: 390,
    priceMax: 590,
    features: [
      'Tutto del piano Basic',
      'Sezione "Lo chef"',
      'Pulsante WhatsApp diretto',
      'Prenotazioni online dal sito',
      'Avviso a ogni nuova prenotazione',
      'Pubblicazione eventi sul sito',
      'Raccolta recensioni dal sito (con approvazione)',
      'Newsletter (lista iscritti + invio)',
      'Dominio personalizzato (es. tuoristorante.it)',
      'Statistiche visite al sito',
      'Pannello admin base',
    ],
    excluded: [
      'Upload foto e logo custom',
      'Modifica testi del sito',
      'CRM clienti con storico',
      'Cambio stile/template del sito',
    ],
    cta: 'Inizia ora',
    highlight: true,
    badge: 'Più scelto',
  },
  {
    key: 'premium',
    name: 'Premium',
    tagline: 'il sito che controlli tu',
    description: 'Per chi vuole gestire e cambiare tutto in autonomia.',
    accent: '#e52d1d',
    priceFrom: 590,
    priceMax: 850,
    features: [
      'Tutto del piano Pro',
      'Upload foto e logo custom',
      'Modifica tutti i testi del sito',
      'CRM clienti con storico prenotazioni',
      'Cambio stile del sito quando vuoi',
      'Personalizzazione colori + font',
      'Hero con più foto in evidenza',
      'Video cinematografici',
      'Animazioni avanzate + smooth scroll',
      'Supporto WhatsApp prioritario (entro 1h)',
      'Backup contenuti settimanale',
      'Export clienti / iscritti in CSV',
      'Pannello admin completo',
    ],
    excluded: [],
    cta: 'Inizia ora',
    highlight: false,
  },
]

export function getPlan(key: PlanKey): Plan {
  const p = PLANS.find(p => p.key === key)
  if (!p) throw new Error(`Unknown plan: ${key}`)
  return p
}

/**
 * Gating tecnico: cosa abilitare/disabilitare nella piattaforma per ogni piano.
 * Usato da pannello admin, pipeline di generazione siti, frontend pubblico.
 */
export interface TierCapabilities {
  adminScope: 'limited' | 'base' | 'full'
  customDomain: boolean
  // Sito pubblico
  chefSection: boolean
  whatsappButton: boolean
  bookings: boolean
  events: boolean
  newsletter: boolean
  reviewsCapture: boolean
  // Tech avanzato
  heroVideo: boolean
  advancedAnimations: boolean   // GSAP + Lenis smooth scroll
  multiHero: boolean
  // Asset / contenuti
  customAssetsUpload: boolean   // foto + logo custom (override sistema)
  editAllTexts: boolean
  changeTemplate: boolean
  customColorsAndFont: boolean
  // Admin avanzato
  crm: boolean
  weeklyBackup: boolean
  csvExport: boolean
  priorityWhatsappSupport: boolean
}

export const TIER_CAPS: Record<PlanKey, TierCapabilities> = {
  basic: {
    adminScope: 'limited',
    customDomain: false,
    chefSection: false,
    whatsappButton: false,
    bookings: false,
    events: false,
    newsletter: false,
    reviewsCapture: false,
    heroVideo: false,
    advancedAnimations: false,
    multiHero: false,
    customAssetsUpload: false,
    editAllTexts: false,
    changeTemplate: false,
    customColorsAndFont: false,
    crm: false,
    weeklyBackup: false,
    csvExport: false,
    priorityWhatsappSupport: false,
  },
  pro: {
    adminScope: 'base',
    customDomain: true,
    chefSection: true,
    whatsappButton: true,
    bookings: true,
    events: true,
    newsletter: true,
    reviewsCapture: true,
    heroVideo: false,
    advancedAnimations: false,
    multiHero: false,
    customAssetsUpload: false,
    editAllTexts: false,
    changeTemplate: false,
    customColorsAndFont: false,
    crm: false,
    weeklyBackup: false,
    csvExport: false,
    priorityWhatsappSupport: false,
  },
  premium: {
    adminScope: 'full',
    customDomain: true,
    chefSection: true,
    whatsappButton: true,
    bookings: true,
    events: true,
    newsletter: true,
    reviewsCapture: true,
    heroVideo: true,
    advancedAnimations: true,
    multiHero: true,
    customAssetsUpload: true,
    editAllTexts: true,
    changeTemplate: true,
    customColorsAndFont: true,
    crm: true,
    weeklyBackup: true,
    csvExport: true,
    priorityWhatsappSupport: true,
  },
}

/**
 * Feature toggles — il ristoratore puo accendere/spegnere singole sezioni
 * del sito (es. "non voglio prenotazioni online" anche se il piano le include).
 *
 * Default per piano: la colonna site_content.feature_<key>_enabled (boolean)
 * può essere:
 *   null  → usa il default del piano
 *   true  → forza ON (se il piano lo permette)
 *   false → forza OFF (override esplicito del ristoratore)
 */
export type FeatureKey =
  | 'reservations'
  | 'newsletter'
  | 'events'
  | 'whatsappButton'
  | 'reviews'
  | 'chef'

export const PLAN_FEATURE_DEFAULTS: Record<PlanKey, Record<FeatureKey, boolean>> = {
  basic: {
    reservations: false,
    newsletter: false,
    events: false,
    whatsappButton: false,
    reviews: true,
    chef: false,
  },
  pro: {
    reservations: true,
    newsletter: true,
    events: true,
    whatsappButton: true,
    reviews: true,
    chef: true,
  },
  premium: {
    reservations: true,
    newsletter: true,
    events: true,
    whatsappButton: true,
    reviews: true,
    chef: true,
  },
}

const FEATURE_COLUMN_MAP: Record<FeatureKey, string> = {
  reservations:   'feature_reservations_enabled',
  newsletter:     'feature_newsletter_enabled',
  events:         'feature_events_enabled',
  whatsappButton: 'feature_whatsapp_button_enabled',
  reviews:        'feature_reviews_enabled',
  chef:           'feature_chef_section_enabled',
}

/**
 * Verifica se una feature è attiva per un sito.
 *  - Se il piano non la include → false (override non possibile)
 *  - Se il piano la include e l'override è esplicitamente false → false
 *  - Altrimenti → true
 */
export function isFeatureActive(
  tier: PlanKey,
  content: Record<string, unknown> | null | undefined,
  feature: FeatureKey,
): boolean {
  const planAllows = PLAN_FEATURE_DEFAULTS[tier]?.[feature]
  if (!planAllows) return false
  if (!content) return true
  const col = FEATURE_COLUMN_MAP[feature]
  const override = content[col]
  if (override === false) return false
  return true
}

/**
 * Prezzo dinamico interno (NON mostrare al cliente).
 * Prezzo finale = prezzo base × moltiplicatore zona × livello ristorante.
 * Si applica per arrivare al numero finale dentro al range del piano.
 */
export const ZONE_MULTIPLIERS = {
  milano: 1.4,
  romaCentro: 1.35,
  grandeCitta: 1.2,
  cittaMedia: 1.05,
  provincia: 0.95,
  paeseRurale: 0.85,
} as const

export const RESTAURANT_LEVEL_MULTIPLIERS = {
  cinqueStelle: 1.3,
  altaFascia: 1.2,
  mediaFascia: 1.0,
  trattoria: 0.95,
  nuovoApertura: 0.9,
} as const

export function computeDynamicPrice(
  planKey: PlanKey,
  zone: keyof typeof ZONE_MULTIPLIERS,
  level: keyof typeof RESTAURANT_LEVEL_MULTIPLIERS,
): number {
  const plan = getPlan(planKey)
  const raw = plan.priceFrom * ZONE_MULTIPLIERS[zone] * RESTAURANT_LEVEL_MULTIPLIERS[level]
  const clamped = Math.max(plan.priceFrom, Math.min(plan.priceMax, raw))
  return Math.round(clamped / 10) * 10
}

/**
 * Template disponibili — scelta dall'AI in base al tipo di locale, indipendente dal piano.
 */
export const TEMPLATES = ['cinematico', 'bento', 'panoramico', 'aurora', 'mercato'] as const
export type TemplateKey = typeof TEMPLATES[number]

/**
 * Riferimenti visivi — qualità minima per ogni sito cliente.
 */
export const QUALITY_REFERENCES = [
  'https://mont-fort.com',
  'https://duyvenvoorde.nl',
  'https://lxtrendship.com',
  'https://okapa.com',
]

export const SALES_TERMS = {
  upfrontPercent: 50,
  isOneShot: true,
  publicNote: 'Il prezzo varia in base alla zona e al tipo di locale. Si parte con il 50% all\'avvio del lavoro.',
}
