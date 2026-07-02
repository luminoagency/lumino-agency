/**
 * Lingua dei siti dei ristoratori (IT/EN).
 *
 * I siti dei ristoratori vivono su domini propri e mostrano banner cookie +
 * Cookie/Privacy Policy nella lingua scelta dal visitatore.
 *
 * Persistenza: cookie `restaurant_locale` (30 giorni). NON confondere con il
 * consenso cookie (localStorage `restaurant_cookie_consent`).
 */

export type Locale = 'it' | 'en'

export const DEFAULT_LOCALE: Locale = 'it'

/** Nome del cookie di lingua. */
export const LOCALE_COOKIE = 'restaurant_locale'

/** 30 giorni in secondi (max-age del cookie). */
export const LOCALE_MAX_AGE = 60 * 60 * 24 * 30

/** Normalizza un valore qualsiasi in un Locale valido (fallback IT). */
export function resolveLocale(value: string | null | undefined): Locale {
  return value === 'en' ? 'en' : 'it'
}

/**
 * Legge la lingua dal cookie lato client (document.cookie).
 * Lato server ritorna il default: le pagine server leggono il cookie con
 * `resolveLocale(cookies().get(LOCALE_COOKIE)?.value)` da 'next/headers'.
 */
export function getLocaleFromCookie(): Locale {
  if (typeof document === 'undefined') return DEFAULT_LOCALE
  const m = document.cookie.match(/(?:^|;\s*)restaurant_locale=(it|en)\b/)
  return resolveLocale(m?.[1])
}

/** Imposta il cookie di lingua lato client (30 giorni). */
export function setLocaleCookie(locale: Locale): void {
  if (typeof document === 'undefined') return
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${LOCALE_MAX_AGE}; SameSite=Lax`
}
