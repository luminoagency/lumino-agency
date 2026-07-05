import type { Metadata } from 'next'
import { loadSitePageOrNotFound } from '@/lib/sites/pageGuard'
import RenderSiteTemplate from '@/components/restaurant/RenderSiteTemplate'

export const revalidate = 3600

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { site } = await loadSitePageOrNotFound(params.slug, 'chiSiamo')
  return { title: `${site.pages.chiSiamo.label} · ${site.props.restaurantName}` }
}

export default async function SiteChiSiamoPage({ params }: { params: { slug: string } }) {
  const { site, locale } = await loadSitePageOrNotFound(params.slug, 'chiSiamo')
  return <RenderSiteTemplate site={site} page="chiSiamo" locale={locale} />
}
