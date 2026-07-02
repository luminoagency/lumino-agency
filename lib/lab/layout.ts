/**
 * Step 2 — Layout. Genera proposte di layout ad-hoc con Claude Sonnet 4.6
 * a partire dal report dello Step 1. NON template fissi.
 */

import { getClaude } from '@/lib/ai/claude'
import type { ResearchReport } from './research'
import type { ChatMessage } from './research'
import type { Locale } from './builder'

const MODEL = 'claude-opus-4-7'

/** Vocabolario chiuso di sezioni → così il mockup SVG è renderizzabile. */
export const ALLOWED_SECTIONS = [
  'hero', 'gallery', 'menu', 'about', 'services', 'reviews',
  'events', 'booking', 'contact', 'map', 'team', 'newsletter',
] as const
export type SectionKey = (typeof ALLOWED_SECTIONS)[number]

export type HeroStyle = 'fullbleed' | 'split' | 'centered' | 'minimal'

/** Spec di una pagina nel layout multi-pagina (le sezioni sono label libere, non solo ALLOWED_SECTIONS). */
export type LayoutPageSpec = { slug: string; title: string; sections: string[]; isHomepage?: boolean }
export type LayoutNavLink = { label: string; slug: string }

export interface LayoutProposal {
  name: string
  description: string
  why: string
  palette: string[]      // 3-5 hex
  sections: SectionKey[] // sezioni della HOMEPAGE (per il mockup Step 2)
  heroStyle: HeroStyle
  pages: LayoutPageSpec[]                                   // sito multi-pagina
  navigation: { header: LayoutNavLink[]; footer: LayoutNavLink[] }
}

function parseJson<T>(text: string): T | null {
  let t = text.trim()
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence) t = fence[1].trim()
  const start = t.search(/[[{]/)
  const lastArr = t.lastIndexOf(']')
  const lastObj = t.lastIndexOf('}')
  const end = Math.max(lastArr, lastObj)
  if (start >= 0 && end > start) t = t.slice(start, end + 1)
  try { return JSON.parse(t) as T } catch { return null }
}

function sanitizeHex(c: string): string | null {
  const m = String(c).trim().match(/^#?([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/)
  if (!m) return null
  return '#' + m[1].toLowerCase()
}

function sanitizeSlug(s: any): string {
  return String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function sanitizePages(raw: any, homeSections: string[]): LayoutPageSpec[] {
  const arr = Array.isArray(raw) ? raw : []
  const pages = arr.map((p: any): LayoutPageSpec | null => {
    const slug = sanitizeSlug(p?.slug)
    const title = String(p?.title || '').trim()
    const sections = (Array.isArray(p?.sections) ? p.sections : [])
      .map((s: any) => String(s).toLowerCase().trim()).filter(Boolean) as string[]
    if (!slug || !title || !sections.length) return null
    return { slug, title, sections }
  }).filter((x: LayoutPageSpec | null): x is LayoutPageSpec => !!x)

  if (!pages.length) {
    // Fallback multi-pagina di base (Opus non ha fornito pages).
    return [
      { slug: 'home', title: 'Home', sections: homeSections, isHomepage: true },
      { slug: 'chi-siamo', title: 'Chi siamo', sections: ['hero', 'about', 'team'] },
      { slug: 'contatti', title: 'Contatti', sections: ['hero', 'contact', 'map'] },
    ]
  }
  if (!pages.some(p => p.slug === 'home')) pages[0].slug = 'home'
  pages.forEach(p => { if (p.slug === 'home') p.isHomepage = true })
  return pages
}

function sanitizeNav(raw: any, pages: LayoutPageSpec[]): { header: LayoutNavLink[]; footer: LayoutNavLink[] } {
  const mk = (a: any): LayoutNavLink[] => (Array.isArray(a) ? a : [])
    .map((l: any) => ({ label: String(l?.label || '').trim(), slug: sanitizeSlug(l?.slug) }))
    .filter((l: LayoutNavLink) => !!l.label && !!l.slug)
  let header = mk(raw?.header)
  let footer = mk(raw?.footer)
  if (!header.length) header = pages.map(p => ({ label: p.title, slug: p.slug }))
  if (!footer.length) footer = [...pages.map(p => ({ label: p.title, slug: p.slug })), { label: 'Privacy', slug: 'privacy' }]
  return { header, footer }
}

function sanitizeProposal(raw: any): LayoutProposal | null {
  if (!raw || typeof raw !== 'object') return null
  const name = String(raw.name || '').trim()
  if (!name) return null
  const palette = (Array.isArray(raw.palette) ? raw.palette : [])
    .map(sanitizeHex).filter(Boolean).slice(0, 5) as string[]
  const sections = (Array.isArray(raw.sections) ? raw.sections : [])
    .map((s: any) => String(s).toLowerCase().trim())
    .filter((s: string) => (ALLOWED_SECTIONS as readonly string[]).includes(s)) as SectionKey[]
  const heroStyles: HeroStyle[] = ['fullbleed', 'split', 'centered', 'minimal']
  const heroStyle: HeroStyle = heroStyles.includes(raw.heroStyle) ? raw.heroStyle : 'fullbleed'

  const homeSections = sections.length > 0 ? (sections.includes('hero') ? sections : (['hero', ...sections] as SectionKey[])) : (['hero', 'gallery', 'about', 'contact'] as SectionKey[])
  const pages = sanitizePages(raw.pages, homeSections)
  const navigation = sanitizeNav(raw.navigation, pages)

  return {
    name,
    description: String(raw.description || '').trim(),
    why: String(raw.why || '').trim(),
    palette: palette.length >= 3 ? palette : ['#1a1a1a', '#e52d1d', '#f5f0e8', '#888888'],
    sections: homeSections,
    heroStyle,
    pages,
    navigation,
  }
}

function reportDigest(report: ResearchReport): string {
  return JSON.stringify({
    nome: report.info?.name,
    tipo: report.info?.type,
    descrizione: report.info?.description,
    tonoDiVoce: report.toneOfVoice,
    fotoDisponibili: report.photos?.length ?? 0,
    cosaManca: report.missing,
    competitorConSito: report.competitors?.filter(c => c.website).length ?? 0,
    competitorTotali: report.competitors?.length ?? 0,
  }, null, 2)
}

/** Preset multi-pagina "Hotel Boutique" per strutture ricettive (hotel/b&b/resort). */
function hotelBoutiquePreset(report: ResearchReport): LayoutProposal {
  const raw = {
    name: 'Hotel Boutique',
    description: 'Layout elegante: immagine prominente, camere in evidenza, prenotazioni via portali esterni.',
    why: `Pensato per ${report.info?.name || 'la struttura'}: focus su atmosfera, camere e prenotazioni (Booking/Expedia), con tono editoriale.`,
    palette: ['#1f1a17', '#c9a227', '#f5f0e8', '#8b6f47', '#2c2622'],
    heroStyle: 'fullbleed',
    sections: ['hero', 'booking', 'about', 'services', 'reviews', 'contact'],
    pages: [
      { slug: 'home', title: 'Home', sections: ['hero-floating', 'booking-links', 'about-3', 'hotel-amenities', 'client-feedback', 'contact-cta'] },
      { slug: 'camere', title: 'Camere', sections: ['hero-small', 'room-card', 'booking-links'] },
      { slug: 'servizi', title: 'Servizi', sections: ['hero-small', 'hotel-amenities', 'feature-section'] },
      { slug: 'esperienze', title: 'Esperienze', sections: ['hero-small', 'grid-modal-detail', 'zoom-parallax'] },
      { slug: 'contatti', title: 'Contatti', sections: ['hero-small', 'contact', 'mapcn-map', 'booking-links'] },
      { slug: 'privacy', title: 'Privacy', sections: ['hero-small', 'privacy-text'] },
    ],
    navigation: {
      header: [
        { label: 'Home', slug: 'home' }, { label: 'Camere', slug: 'camere' }, { label: 'Servizi', slug: 'servizi' },
        { label: 'Esperienze', slug: 'esperienze' }, { label: 'Contatti', slug: 'contatti' },
      ],
      footer: [{ label: 'Privacy', slug: 'privacy' }, { label: 'Contatti', slug: 'contatti' }],
    },
  }
  return sanitizeProposal(raw) as LayoutProposal
}

function isHotelBusiness(report: ResearchReport): boolean {
  const t = `${report.info?.type || ''}`.toLowerCase()
  return /hotel|b&b|b\.?n\.?b|bnb|resort|agriturismo|ostello|locanda|relais/.test(t)
}

/** Lingue di default per il business: hotel & affini → IT/EN/DE, altrimenti solo IT (Layer 4.5). */
export function localesForBusiness(businessType?: string): Locale[] {
  const t = `${businessType || ''}`.toLowerCase()
  return /hotel|b&b|b\.?n\.?b|bnb|resort|agriturismo|ostello|locanda|relais/.test(t) ? ['it', 'en', 'de'] : ['it']
}

/** Genera 2-3 proposte di layout uniche per il business. */
export async function generateLayouts(report: ResearchReport): Promise<LayoutProposal[]> {
  const claude = getClaude()

  const msg = await claude.messages.create({
    model: MODEL,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'medium' },
    max_tokens: 4000,
    system:
      'Sei un art director che progetta siti MULTI-PAGINA per attività locali italiane. ' +
      'Proponi layout SU MISURA per il business specifico (non template generici): ' +
      'le scelte di struttura, pagine, sezioni e palette devono nascere dal tipo di attività, dal tono di voce e da cosa manca. ' +
      'Rispondi ESCLUSIVAMENTE con un array JSON valido, senza testo prima o dopo.',
    messages: [
      {
        role: 'user',
        content:
          `Report di ricerca del business:\n${reportDigest(report)}\n\n` +
          `Sezioni della HOMEPAGE (campo "sections"): usa SOLO queste chiavi: ${ALLOWED_SECTIONS.join(', ')}.\n` +
          `Per le altre pagine puoi usare label di sezione libere e descrittive (es. "hero-small", "about-story", "team", "values", "menu-full", "allergens", "contact-form", "hours", "privacy-text").\n` +
          `Stili hero disponibili: fullbleed, split, centered, minimal.\n\n` +
          'Genera 3 proposte di layout DIVERSE tra loro e su misura. Ogni sito ha PIÙ PAGINE: tipicamente Home + Chi siamo + (Menu/Servizi/Prodotti, in base al business) + Contatti + Privacy. Adatta i nomi al business (es. un dentista ha "I nostri servizi" invece di "Menu").\n\n' +
          'JSON array, ogni elemento:\n' +
          '{\n' +
          '  "name": string (nome evocativo in italiano, es "Cinematico Caldo"),\n' +
          '  "description": string (1 frase sintetica),\n' +
          '  "why": string (2-3 frasi sul PERCHÉ è adatto a QUESTO business specifico),\n' +
          '  "palette": string[] (3-5 colori HEX coerenti col tono),\n' +
          '  "sections": string[] (sezioni della homepage, inizia da "hero", solo chiavi ammesse),\n' +
          '  "heroStyle": "fullbleed" | "split" | "centered" | "minimal",\n' +
          '  "pages": [ { "slug": "home", "title": "Home", "sections": ["hero", ...] }, { "slug": "chi-siamo", "title": "Chi siamo", "sections": ["hero-small","about-story","team"] }, { "slug": "contatti", "title": "Contatti", "sections": ["hero-small","contact-form","map","hours"] }, ... ],\n' +
          '  "navigation": { "header": [ { "label": "Home", "slug": "home" }, ... ], "footer": [ ... ] }\n' +
          '}',
      },
    ],
  })

  const block = msg.content.find(b => b.type === 'text')
  const text = block?.type === 'text' ? block.text : '[]'
  const parsed = parseJson<any[]>(text)
  const proposals = Array.isArray(parsed) ? parsed.map(sanitizeProposal).filter((x): x is LayoutProposal => !!x) : []

  // Per hotel/b&b/resort: garantisci il preset "Hotel Boutique" come prima proposta.
  if (isHotelBusiness(report)) {
    const preset = hotelBoutiquePreset(report)
    return [preset, ...proposals.filter(p => p.name !== preset.name)].slice(0, 3)
  }
  return proposals.slice(0, 3)
}

/** Chat a lato per modifiche/variazioni sul layout. */
export async function layoutChatTurn(
  businessName: string,
  report: ResearchReport,
  proposals: LayoutProposal[],
  messages: ChatMessage[],
): Promise<{ text: string }> {
  const claude = getClaude()
  const ctx = proposals.length
    ? `Proposte attuali: ${proposals.map(p => p.name).join(', ')}.`
    : 'Nessuna proposta ancora generata.'

  const msg = await claude.messages.create({
    model: MODEL,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'medium' },
    max_tokens: 500,
    system:
      `Sei l'art director di Lumino che discute il layout del sito di "${businessName}" (tipo: ${report.info?.type || '—'}, tono: ${report.toneOfVoice || '—'}). ` +
      `${ctx} Rispondi in italiano, conciso e concreto. Se l'utente chiede una variazione, descrivi a parole come cambieresti struttura/sezioni/palette. ` +
      'Suggerisci di premere "Rigenera proposte" se vuole nuove varianti complete.',
    messages: messages.map(m => ({ role: m.role, content: m.content })),
  })
  const block = msg.content.find(b => b.type === 'text')
  return { text: block?.type === 'text' ? block.text.trim() : '' }
}
