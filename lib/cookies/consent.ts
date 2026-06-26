/**
 * Gestione del consenso cookie (GDPR + Linee Guida Garante Privacy 2021).
 *
 * Principio chiave: i cookie di analisi e marketing partono di default OFF e
 * vengono attivati SOLO con consenso esplicito. I tecnici sono sempre attivi.
 *
 * Persistenza: localStorage (chiave `lumino_cookie_consent`), durata 6 mesi.
 * Dopo 6 mesi getConsent() torna null → il banner riappare.
 *
 * Reattività: ogni cambio emette l'evento window `lumino-consent-change`
 * (oltre all'evento `storage` cross-tab nativo), così i ConsentGate si
 * aggiornano subito senza ricaricare la pagina.
 */

export type ConsentCategory = 'technical' | 'analytics' | 'marketing'

export type ConsentState = {
  technical: true // sempre true
  analytics: boolean
  marketing: boolean
  decidedAt: string | null // ISO timestamp
}

export const CONSENT_STORAGE_KEY = 'lumino_cookie_consent'
export const CONSENT_CHANGE_EVENT = 'lumino-consent-change'
export const OPEN_PREFERENCES_EVENT = 'lumino-open-cookie-preferences'

/** 6 mesi in millisecondi (~183 giorni). */
const SIX_MONTHS_MS = 1000 * 60 * 60 * 24 * 183

/** Stato di default: tutto OFF tranne i tecnici, nessuna decisione presa. */
export function defaultConsent(): ConsentState {
  return { technical: true, analytics: false, marketing: false, decidedAt: null }
}

/** Cookie tipici piazzati da analytics/marketing, da rimuovere al revoke. */
const CATEGORY_COOKIES: Record<Exclude<ConsentCategory, 'technical'>, string[]> = {
  analytics: ['_ga', '_gid', '_gat'],
  marketing: ['_fbp', '_fbc', '_gcl_au'],
}

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

/** Legge il consenso salvato. null se mai deciso o scaduto (>6 mesi). */
export function getConsent(): ConsentState | null {
  if (!isBrowser()) return null
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<ConsentState>
    if (!parsed.decidedAt) return null
    // Scadenza 6 mesi → torna null così il banner riappare.
    if (Date.now() - new Date(parsed.decidedAt).getTime() > SIX_MONTHS_MS) {
      window.localStorage.removeItem(CONSENT_STORAGE_KEY)
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

/** true se l'utente ha già fatto una scelta (valida, non scaduta). */
export function hasDecided(): boolean {
  return getConsent() !== null
}

/**
 * Salva (merge) il consenso e segna decidedAt = adesso.
 * Se una categoria passa da attiva a disattiva, prova a rimuovere i cookie
 * già piazzati da quegli script. Emette l'evento di cambio consenso.
 */
export function setConsent(state: Partial<ConsentState>): void {
  if (!isBrowser()) return
  const prev = getConsent() ?? defaultConsent()
  const next: ConsentState = {
    technical: true,
    analytics: state.analytics ?? prev.analytics,
    marketing: state.marketing ?? prev.marketing,
    decidedAt: new Date().toISOString(),
  }

  // Revoca → pulizia cookie della categoria disattivata.
  if (prev.analytics && !next.analytics) clearCategoryCookies('analytics')
  if (prev.marketing && !next.marketing) clearCategoryCookies('marketing')

  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(next))
  } catch {
    // storage non disponibile (es. modalità privata): nessuna persistenza.
  }
  emitChange()
}

/** Azzera completamente il consenso → il banner riapparirà. */
export function clearConsent(): void {
  if (!isBrowser()) return
  clearCategoryCookies('analytics')
  clearCategoryCookies('marketing')
  try {
    window.localStorage.removeItem(CONSENT_STORAGE_KEY)
  } catch {
    // no-op
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
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGE_EVENT))
}

/** Rimuove i cookie noti di una categoria da tutte le combinazioni path/domain plausibili. */
function clearCategoryCookies(category: Exclude<ConsentCategory, 'technical'>): void {
  if (!isBrowser()) return
  const names = CATEGORY_COOKIES[category]
  const host = window.location.hostname
  // dominio nudo + dominio con punto iniziale (es. .bylumino.com) per i cookie di terze parti
  const domains = ['', host, `.${host}`, `.${host.split('.').slice(-2).join('.')}`]
  for (const name of names) {
    for (const domain of domains) {
      document.cookie =
        `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/` +
        (domain ? `; domain=${domain}` : '')
    }
  }
}
