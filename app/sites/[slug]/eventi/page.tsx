import type { Metadata } from 'next'
import { loadSitePageOrNotFound } from '@/lib/sites/pageGuard'
import RenderSiteTemplate from '@/components/restaurant/RenderSiteTemplate'

export const revalidate = 3600

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { site } = await loadSitePageOrNotFound(params.slug, 'eventi')
  return { title: `${site.pages.eventi.label} · ${site.props.restaurantName}` }
}

export default async function SiteEventiPage({ params }: { params: { slug: string } }) {
  const { site, locale } = await loadSitePageOrNotFound(params.slug, 'eventi')
  return <RenderSiteTemplate site={site} page="eventi" locale={locale} />
}
