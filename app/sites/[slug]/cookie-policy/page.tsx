import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import type { Metadata } from 'next'
import { loadSiteBySlug } from '@/lib/sites/loader'
import { resolveLocale, LOCALE_COOKIE } from '@/lib/sites/i18n'

export const revalidate = 3600

export async function generateMetadata(
  { params }: { params: { slug: string } },
): Promise<Metadata> {
  const site = await loadSiteBySlug(params.slug)
  if (!site) return { title: 'Cookie Policy' }
  return { title: `Cookie Policy · ${site.policy.name}` }
}

export default async function SiteCookiePolicyPage({ params }: { params: { slug: string } }) {
  const site = await loadSiteBySlug(params.slug)
  if (!site) return notFound()
  const locale = resolveLocale(cookies().get(LOCALE_COOKIE)?.value)

  // STEP C completerà: contenuto policy generato + chrome del ristoratore.
  return (
    <main data-locale={locale} style={{ padding: '2rem' }}>
      <h1>Cookie Policy — {site.policy.name}</h1>
    </main>
  )
}
