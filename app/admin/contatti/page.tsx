import { loadAdminContent } from '../_loadContent'
import { ContattiEditor } from './ContattiEditor'

export const dynamic = 'force-dynamic'

export default async function ContattiPage() {
  const { content } = await loadAdminContent('/admin/contatti')
  return (
    <ContattiEditor
      initial={{
        address: content.address || '',
        city: content.city || '',
        phone: content.phone || '',
        email: content.email || '',
        whatsapp: content.whatsapp || '',
        opening_hours: content.opening_hours || {},
      }}
    />
  )
}
