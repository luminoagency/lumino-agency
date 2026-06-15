import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { loadSiteBySlug } from '@/lib/sites/loader'
import { CinematicoTemplate } from '@/templates/cinematico/CinematicoTemplate'
import { BentoTemplate } from '@/templates/bento/BentoTemplate'
import { PanoramicoTemplate } from '@/templates/panoramico/PanoramicoTemplate'
import { AuroraTemplate } from '@/templates/aurora/AuroraTemplate'
import { MercatoTemplate } from '@/templates/mercato/MercatoTemplate'

// ISR: la pagina si rigenera ogni ora — il ristoratore vede le sue modifiche al massimo dopo 60min,
// ma i visitatori la prendono dalla cache CDN (velocissima).
export const revalidate = 3600

const TEMPLATES = {
  cinematico: CinematicoTemplate,
  bento: BentoTemplate,
  panoramico: PanoramicoTemplate,
  aurora: AuroraTemplate,
  mercato: MercatoTemplate,
} as const

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
  const site = await loadSiteBySlug(params.slug)
  if (!site) return notFound()

  const Template = TEMPLATES[site.template] as any
  return <Template {...site.props} />
}
