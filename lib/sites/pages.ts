/**
 * Configurazione pagine dei siti multi-pagina (Pro/Premium).
 *
 * Basic resta landing singola scrollabile: non usa questo modulo.
 * Pro/Premium hanno 6 pagine (Home sempre attiva + 5 attivabili/rinominabili
 * dal ristoratore dal pannello admin). Persistenza: colonna JSONB
 * `site_content.pages` (stesso pattern delle altre colonne jsonb esistenti:
 * social_links, faq, reviews).
 */

import type { Locale } from '@/lib/sites/i18n'

export type PageKey = 'home' | 'menu' | 'chiSiamo' | 'contatti' | 'eventi' | 'gallery'

export const PAGE_KEYS: PageKey[] = ['home', 'menu', 'chiSiamo', 'contatti', 'eventi', 'gallery']

/** Slug della route pubblica per ogni pagina (home = '', root del sito). */
export const PAGE_SLUGS: Record<PageKey, string> = {
  home: '',
  menu: 'menu',
  chiSiamo: 'chi-siamo',
  contatti: 'contatti',
  eventi: 'eventi',
  gallery: 'gallery',
}

export type PageEntry = { enabled: boolean; label: string }
export type SitePages = Record<PageKey, PageEntry>

/** Label di default per lingua — usate quando il ristoratore non ha rinominato la pagina. */
export const PAGE_DEFAULT_LABELS: Record<Locale, Record<PageKey, string>> = {
  it: { home: 'Home', menu: 'Menu', chiSiamo: 'Chi siamo', contatti: 'Contatti', eventi: 'Eventi', gallery: 'Gallery' },
  en: { home: 'Home', menu: 'Menu', chiSiamo: 'About us', contatti: 'Contact', eventi: 'Events', gallery: 'Gallery' },
}

/** Quali pagine sono attive di default per un sito Pro/Premium nuovo. */
const DEFAULT_ENABLED: Record<PageKey, boolean> = {
  home: true,
  menu: true,
  chiSiamo: true,
  contatti: true,
  eventi: false,
  gallery: false,
}

/** Config di default (usata se il ristoratore non ha ancora salvato nulla, o su Basic). */
export function defaultSitePages(locale: Locale = 'it'): SitePages {
  const labels = PAGE_DEFAULT_LABELS[locale]
  const out = {} as SitePages
  for (const k of PAGE_KEYS) out[k] = { enabled: DEFAULT_ENABLED[k], label: labels[k] }
  return out
}

/**
 * Unisce il valore salvato in DB (parziale/malformato/assente) con i default.
 * Home è SEMPRE enabled, qualunque cosa arrivi dal DB.
 */
export function resolveSitePages(raw: unknown, locale: Locale = 'it'): SitePages {
  const base = defaultSitePages(locale)
  if (!raw || typeof raw !== 'object') return base
  const src = raw as Partial<Record<PageKey, Partial<PageEntry>>>
  for (const k of PAGE_KEYS) {
    const entry = src[k]
    if (entry && typeof entry === 'object') {
      if (typeof entry.enabled === 'boolean') base[k].enabled = entry.enabled
      if (typeof entry.label === 'string' && entry.label.trim()) base[k].label = entry.label.trim()
    }
  }
  base.home.enabled = true // vincolo non negoziabile
  return base
}

/** URL pubblico assoluto (relativo al sito) di una pagina, dato lo slug del sito. */
export function pageHref(siteSlug: string, key: PageKey): string {
  const seg = PAGE_SLUGS[key]
  return seg ? `/sites/${siteSlug}/${seg}` : `/sites/${siteSlug}`
}

/**
 * Modalità di rendering di un template (prop `page`):
 *  - 'landing' → comportamento storico: landing unica scrollabile (Basic, e
 *    default retro-compatibile). Tutte le sezioni, nessun header.
 *  - 'home'    → Home sintetica Pro/Premium: hero + anteprime + newsletter.
 *  - PageKey (menu/chiSiamo/contatti/eventi/gallery) → pagina dedicata: header
 *    + solo le sezioni pertinenti + footer.
 */
export type PageMode = 'landing' | PageKey

/** Sezioni renderizzabili in un template. */
export type SectionName =
  | 'hero' | 'about' | 'menu' | 'gallery' | 'chef'
  | 'reviews' | 'events' | 'faq' | 'newsletter' | 'contact'

/**
 * Quali sezioni mostra ogni pagina dedicata (e la Home sintetica).
 * 'landing' non è qui: mostra tutto (gestito da sectionVisible).
 */
export const SECTIONS_BY_PAGE: Record<Exclude<PageMode, 'landing'>, SectionName[]> = {
  // Home sintetica: solo hero come sezione "vera"; il resto sono anteprime
  // compatte (HomePreviews), quindi le sezioni full sono OFF qui.
  home:     ['hero'],
  menu:     ['menu', 'faq'],
  chiSiamo: ['about', 'chef', 'reviews'],
  contatti: ['contact'],
  eventi:   ['events'],
  gallery:  ['gallery'],
}

/** true se la sezione va renderizzata nella modalità corrente. */
export function sectionVisible(page: PageMode, section: SectionName): boolean {
  if (page === 'landing') return true
  return SECTIONS_BY_PAGE[page].includes(section)
}

/** true se siamo in una vista "sintetica" della Home (anteprime + link). */
export function isSyntheticHome(page: PageMode): boolean {
  return page === 'home'
}
