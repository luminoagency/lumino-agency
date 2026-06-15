import { redirect } from 'next/navigation'
import { getMySite } from '../actions/site'
import { ChefEditor } from './ChefEditor'

export const dynamic = 'force-dynamic'

export default async function ChefPage() {
  const site = await getMySite()
  if (!site) {
    redirect('/login?next=' + encodeURIComponent('/admin/chef') + '&error=' + encodeURIComponent('Accedi per gestire la sezione chef.'))
  }
  const tier = (site as any).tier as string
  if (tier === 'basic') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif', padding: '2rem' }}>
        <div style={{ textAlign: 'center', maxWidth: 460 }}>
          <h1 style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: 32, fontStyle: 'italic', marginBottom: 12 }}>Sezione "Lo chef" non inclusa nel piano Basic</h1>
          <p style={{ color: '#aaa', lineHeight: 1.6 }}>Passa al piano Pro o Premium per aggiungere lo chef sul tuo sito.</p>
          <a href="/admin" style={{ color: '#e52d1d', display: 'inline-block', marginTop: 18 }}>← Torna al pannello</a>
        </div>
      </div>
    )
  }
  const content = Array.isArray((site as any).content) ? (site as any).content[0] : (site as any).content
  return (
    <ChefEditor
      siteSlug={(site as any).slug}
      initial={{
        chef_active: !!content?.chef_active,
        chef_name: content?.chef_name || '',
        chef_role: content?.chef_role || '',
        chef_quote: content?.chef_quote || '',
        chef_photo_url: content?.chef_photo_url || '',
      }}
    />
  )
}
