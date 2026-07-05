import { CinematicoTemplate } from '@/templates/cinematico/CinematicoTemplate'
import { BentoTemplate } from '@/templates/bento/BentoTemplate'
import { PanoramicoTemplate } from '@/templates/panoramico/PanoramicoTemplate'
import { AuroraTemplate } from '@/templates/aurora/AuroraTemplate'
import { MercatoTemplate } from '@/templates/mercato/MercatoTemplate'
import type { LoadedSite } from '@/lib/sites/loader'
import type { PageMode } from '@/lib/sites/pages'
import type { Locale } from '@/lib/sites/i18n'

/**
 * Seleziona il template del sito e lo renderizza nella modalità pagina richiesta.
 * Usato da Home e dalle 5 sotto-pagine, così il dispatch template→componente
 * vive in un solo posto.
 */

const TEMPLATES = {
  cinematico: CinematicoTemplate,
  bento: BentoTemplate,
  panoramico: PanoramicoTemplate,
  aurora: AuroraTemplate,
  mercato: MercatoTemplate,
} as const

export default function RenderSiteTemplate({
  site, page, locale,
}: { site: LoadedSite; page: PageMode; locale: Locale }) {
  const Template = TEMPLATES[site.template] as any
  return <Template {...site.props} page={page} locale={locale} />
}
