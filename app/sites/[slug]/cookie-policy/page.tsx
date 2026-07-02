import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import type { Metadata } from 'next'
import { loadSiteBySlug } from '@/lib/sites/loader'
import { resolveLocale, LOCALE_COOKIE } from '@/lib/sites/i18n'
import { getCookiePolicyContent, type RestaurantPolicyData } from '@/lib/policies/policyContent'
import PolicyPage from '@/components/restaurant/PolicyPage'

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

  const data: RestaurantPolicyData = {
    name: site.policy.name,
    address: site.policy.address || '',
    email: site.policy.email || '',
    city: site.policy.city,
  }
  const sections = getCookiePolicyContent(data, locale)

  return (
    <PolicyPage
      restaurantName={site.policy.name}
      accentColor={site.accentColor}
      locale={locale}
      kind="cookie"
      sections={sections}
      slug={params.slug}
    />
  )
}
