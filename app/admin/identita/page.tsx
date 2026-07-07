import { loadAdminContent } from '../_loadContent'
import { IdentitaEditor } from './IdentitaEditor'

export const dynamic = 'force-dynamic'

export default async function IdentitaPage() {
  const { content } = await loadAdminContent('/admin/identita')
  return (
    <IdentitaEditor
      initial={{
        restaurant_name: content.restaurant_name || '',
        tagline: content.tagline || '',
        description: content.description || '',
      }}
    />
  )
}
