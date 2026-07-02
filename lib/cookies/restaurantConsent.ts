/**
 * Consenso cookie per i SITI DEI RISTORATORI (GDPR + Linee Guida Garante 2021).
 *
 * Identico nella logica a lib/cookies/consent.ts (quello di bylumino.com) ma con
 * chiavi ed eventi SEPARATI, così i due banner non si calpestano quando girano
 * sulla stessa origin (es. bylumino.com/sites/<slug> in preview).
 *
 * Persistenza: localStorage `restaurant_cookie_consent`, durata 6 mesi.
 */

export type ConsentCategory = 'technical' | 'analytics' | 'marketing'

export type ConsentState = {
  technical: true
  analytics: boolean
  marketing: boolean
  decidedAt: string | null
}

export const RESTAURANT_CONSENT_KEY = 'restaurant_cookie_consent'
export const RESTAURANT_CONSENT_CHANGE_EVENT = 'restaurant-consent-change'
export const RESTAURANT_OPEN_PREFERENCES_EVENT = 'restaurant-open-cookie-preferences'

/** 6 mesi in millisecondi (~183 giorni). */
const SIX_MONTHS_MS = 1000 * 60 * 60 * 24 * 183

const CATEGORY_COOKIES: Record<Exclude<ConsentCategory, 'technical'>, string[]> = {
  analytics: ['_ga', '_gid', '_gat'],
  marketing: ['_fbp', '_fbc', '_gcl_au'],
}

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

export function defaultConsent(): ConsentState {
  return { technical: true, analytics: false, marketing: false, decidedAt: null }
}

/** Legge il consenso salvato. null se mai deciso o scaduto (>6 mesi). */
export function getConsent(): ConsentState | null {
  if (!isBrowser()) return null
  try {
    const raw = window.localStorage.getItem(RESTAURANT_CONSENT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<ConsentState>
    if (!parsed.decidedAt) return null
    if (Date.now() - new Date(parsed.decidedAt).getTime() > SIX_MONTHS_MS) {
      window.localStorage.removeItem(RESTAURANT_CONSENT_KEY)
      return null
    }
    return {
      technical: true,
      analytics: parsed.analytics === true,
      marketing: parsed.marketing === true,
      decidedAt: parsed.decidedAt,
    }
  } catch {
    return null
  }
}

/** true se il visitatore ha già fatto una scelta valida (non scaduta). */
export function hasDecided(): boolean {
  return getConsent() !== null
}

/** Salva (merge) il consenso e segna decidedAt = adesso. Emette l'evento di cambio. */
export function setConsent(state: Partial<ConsentState>): void {
  if (!isBrowser()) return
  const prev = getConsent() ?? defaultConsent()
  const next: ConsentState = {
    technical: true,
    analytics: state.analytics ?? prev.analytics,
    marketing: state.marketing ?? prev.marketing,
    decidedAt: new Date().toISOString(),
  }
  if (prev.analytics && !next.analytics) clearCategoryCookies('analytics')
  if (prev.marketing && !next.marketing) clearCategoryCookies('marketing')
  try {
    window.localStorage.setItem(RESTAURANT_CONSENT_KEY, JSON.stringify(next))
  } catch {
    // storage non disponibile (es. modalità privata)
  }
  emitChange()
}

/** true se la categoria è consentita (i tecnici sempre, le altre solo con consenso). */
export function isAllowed(category: ConsentCategory): boolean {
  if (category === 'technical') return true
  const c = getConsent()
  if (!c) return false
  return c[category] === true
}

function emitChange(): void {
  if (!isBrowser()) return
  window.dispatchEvent(new CustomEvent(RESTAURANT_CONSENT_CHANGE_EVENT))
}

function clearCategoryCookies(category: Exclude<ConsentCategory, 'technical'>): void {
  if (!isBrowser()) return
  const names = CATEGORY_COOKIES[category]
  const host = window.location.hostname
  const domains = ['', host, `.${host}`, `.${host.split('.').slice(-2).join('.')}`]
  for (const name of names) {
    for (const domain of domains) {
      document.cookie =
        `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/` +
        (domain ? `; domain=${domain}` : '')
    }
  }
}
