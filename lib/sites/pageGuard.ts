import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { loadSiteBySlug, type LoadedSite } from './loader'
import { resolveLocale, LOCALE_COOKIE, type Locale } from './i18n'
import type { PageKey } from './pages'

/**
 * Guard comune delle 5 pagine dedicate (menu/chi-siamo/contatti/eventi/gallery):
 * 404 se il sito non esiste, se è Basic (resta landing singola) o se la
 * pagina non è stata attivata dal ristoratore.
 */
export async function loadSitePageOrNotFound(
  slug: string,
  key: PageKey,
): Promise<{ site: LoadedSite; locale: Locale }> {
  const locale = resolveLocale(cookies().get(LOCALE_COOKIE)?.value)
  const site = await loadSiteBySlug(slug, locale)
  if (!site) notFound()
  if (site.tier === 'basic') notFound()
  if (!site.pages[key]?.enabled) notFound()
  return { site, locale }
}
