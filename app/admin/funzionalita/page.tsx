import { loadAdminContent } from '../_loadContent'
import { FunzionalitaEditor } from './FunzionalitaEditor'

export const dynamic = 'force-dynamic'

export default async function FunzionalitaPage() {
  const { site, content } = await loadAdminContent('/admin/funzionalita')
  return (
    <FunzionalitaEditor
      tier={site.tier}
      featureFlags={{
        feature_reservations_enabled:    content.feature_reservations_enabled ?? null,
        feature_newsletter_enabled:      content.feature_newsletter_enabled ?? null,
        feature_events_enabled:          content.feature_events_enabled ?? null,
        feature_whatsapp_button_enabled: content.feature_whatsapp_button_enabled ?? null,
        feature_reviews_enabled:         content.feature_reviews_enabled ?? null,
        feature_chef_section_enabled:    content.feature_chef_section_enabled ?? null,
      }}
    />
  )
}
