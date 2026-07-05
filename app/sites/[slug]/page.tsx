import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import type { Metadata } from 'next'
import { loadSiteBySlug } from '@/lib/sites/loader'
import { resolveLocale, LOCALE_COOKIE } from '@/lib/sites/i18n'
import RenderSiteTemplate from '@/components/restaurant/RenderSiteTemplate'

// ISR: la pagina si rigenera ogni ora — il ristoratore vede le sue modifiche al massimo dopo 60min,
// ma i visitatori la prendono dalla cache CDN (velocissima).
export const revalidate = 3600

export async function generateMetadata(
  { params }: { params: { slug: string } },
): Promise<Metadata> {
  const site = await loadSiteBySlug(params.slug)
  if (!site) return { title: 'Sito non trovato · Lumino' }
  return {
    title: site.seo.title,
    description: site.seo.description,
  }
}

export default async function PublicSitePage({ params }: { params: { slug: string } }) {
  const locale = resolveLocale(cookies().get(LOCALE_COOKIE)?.value)
  const site = await loadSiteBySlug(params.slug, locale)
  if (!site) return notFound()

  // Basic → landing singola (invariata). Pro/Premium → Home sintetica multi-pagina.
  const page = site.tier === 'basic' ? 'landing' : 'home'
  return <RenderSiteTemplate site={site} page={page} locale={locale} />
}
