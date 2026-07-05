import type { Metadata } from 'next'
import { loadSitePageOrNotFound } from '@/lib/sites/pageGuard'
import RenderSiteTemplate from '@/components/restaurant/RenderSiteTemplate'

export const revalidate = 3600

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { site } = await loadSitePageOrNotFound(params.slug, 'contatti')
  return { title: `${site.pages.contatti.label} · ${site.props.restaurantName}` }
}

export default async function SiteContattiPage({ params }: { params: { slug: string } }) {
  const { site, locale } = await loadSitePageOrNotFound(params.slug, 'contatti')
  return <RenderSiteTemplate site={site} page="contatti" locale={locale} />
}
