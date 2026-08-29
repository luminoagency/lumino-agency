/**
 * Le tre lingue del sito, e le regole per sceglierne una.
 *
 * FONTE UNICA: qui dentro c'è l'elenco delle lingue, quale sia quella di
 * default, come si chiama il cookie della preferenza e quali paesi mandano
 * dove. Middleware, selettore, sitemap e hreflang leggono tutti da qui: se una
 * lingua si aggiunge, si aggiunge in un posto solo.
 */

export const LOCALES = ['en', 'fr', 'it'] as const
export type Locale = (typeof LOCALES)[number]

/**
 * L'inglese è la lingua di default e vive sulla radice, senza prefisso.
 *
 * Le altre due hanno un prefisso proprio — /fr, /it — perché servire lingue
 * diverse sullo stesso URL significa che Googlebot, che scansiona dagli Stati
 * Uniti, vedrebbe solo l'inglese e non indicizzerebbe mai le altre due.
 */
export const DEFAULT_LOCALE: Locale = 'en'

/** Nome del cookie che ricorda la scelta. Convenzione Next. */
export const LOCALE_COOKIE = 'NEXT_LOCALE'

/** Un anno: la preferenza di lingua non è una sessione. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

/**
 * Da quale paese si arriva a quale lingua.
 *
 * Il Marocco al francese: è la lingua commerciale del paese. L'Italia
 * all'italiano. Tutto il resto del mondo resta sull'inglese, che è il default
 * e non ha bisogno di essere elencato.
 *
 * Vale SOLO al primo ingresso e solo sulla radice: chi ha già un cookie, o ha
 * scritto /fr a mano, ha già deciso (vedi middleware.ts).
 */
export const COUNTRY_TO_LOCALE: Record<string, Locale> = {
  MA: 'fr',
  IT: 'it',
}

/** Nome della lingua nella lingua stessa, per il selettore. */
export const LOCALE_LABEL: Record<Locale, string> = {
  en: 'EN',
  fr: 'FR',
  it: 'IT',
}

/** Etichetta lunga, per gli aria-label del selettore. */
export const LOCALE_NAME: Record<Locale, string> = {
  en: 'English',
  fr: 'Français',
  it: 'Italiano',
}

/** Codice per l'attributo lang e per hreflang. */
export const LOCALE_HREFLANG: Record<Locale, string> = {
  en: 'en',
  fr: 'fr',
  it: 'it',
}

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value)
}

/**
 * Il percorso di `path` nella lingua `locale`.
 *
 * L'inglese non porta prefisso perché è il default e sta sulla radice; le
 * altre sì. `path` è sempre il percorso "nudo", quello senza lingua.
 */
export function localePath(locale: Locale, path = '/'): string {
  const clean = path === '/' ? '' : path.startsWith('/') ? path : `/${path}`
  if (locale === DEFAULT_LOCALE) return clean || '/'
  return `/${locale}${clean}`
}

/**
 * L'inverso: da un percorso completo, la lingua e il percorso nudo.
 * Serve al selettore, che deve poter cambiare lingua restando sulla stessa
 * pagina, e al middleware per capire se una lingua è già stata scelta.
 */
export function splitLocale(pathname: string): { locale: Locale; path: string } {
  const parts = pathname.split('/').filter(Boolean)
  if (parts.length && isLocale(parts[0])) {
    return { locale: parts[0], path: '/' + parts.slice(1).join('/') }
  }
  return { locale: DEFAULT_LOCALE, path: pathname || '/' }
}

/**
 * I bot non vanno MAI reindirizzati.
 *
 * Se Googlebot chiede la radice e gli si risponde con un 307 verso /it perché
 * l'IP risulta italiano, l'inglese non viene indicizzato — e siccome i
 * crawler arrivano da paesi diversi, ogni lingua rischia di sparire a turno.
 * Chi scansiona riceve esattamente la pagina che ha chiesto.
 */
const BOT_PATTERN =
  /bot|crawler|spider|crawling|googlebot|bingbot|slurp|duckduckbot|baiduspider|yandex|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegrambot|applebot|petalbot|ia_archiver|semrush|ahrefs|lighthouse|chrome-lighthouse|gtmetrix|pingdom/i

export function isBot(userAgent: string | null | undefined): boolean {
  return !!userAgent && BOT_PATTERN.test(userAgent)
}

/**
 * Seconda scelta dopo il paese: la lingua del browser.
 *
 * Il paese ha la precedenza — un marocchino con il telefono in inglese sta
 * comunque comprando in Marocco — ma se il paese non dice niente, questo
 * evita di servire l'inglese a chi non lo parla.
 */
export function localeFromAcceptLanguage(header: string | null | undefined): Locale | null {
  if (!header) return null

  const ranked = header
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';')
      const q = params.find((p) => p.trim().startsWith('q='))
      return { tag: tag.trim().toLowerCase(), q: q ? parseFloat(q.split('=')[1]) || 0 : 1 }
    })
    .filter((x) => x.tag)
    .sort((a, b) => b.q - a.q)

  for (const { tag } of ranked) {
    const base = tag.split('-')[0]
    if (isLocale(base)) return base
  }
  return null
}
