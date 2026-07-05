import { redirect } from 'next/navigation'
import { getMySite } from '../actions/site'
import { resolveSitePages } from '@/lib/sites/pages'
import { PagesEditor } from './PagesEditor'

export const dynamic = 'force-dynamic'

export default async function PagesPage() {
  const site = await getMySite()
  if (!site) {
    redirect('/login?next=' + encodeURIComponent('/admin/pagine') + '&error=' + encodeURIComponent('Accedi per gestire le pagine.'))
  }
  const tier = (site as any).tier as string
  if (tier === 'basic') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif', padding: '2rem' }}>
        <div style={{ textAlign: 'center', maxWidth: 460 }}>
          <h1 style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: 32, fontStyle: 'italic', marginBottom: 12 }}>Pagine del sito incluse nei piani Pro e Premium</h1>
          <p style={{ color: '#aaa', lineHeight: 1.6 }}>Passa al piano Pro o Premium per trasformare il tuo sito in più pagine dedicate e gestirle da qui.</p>
          <a href="/admin" style={{ color: '#e52d1d', display: 'inline-block', marginTop: 18 }}>← Torna al pannello</a>
        </div>
      </div>
    )
  }

  const content = Array.isArray((site as any).content) ? (site as any).content[0] : (site as any).content
  const pages = resolveSitePages(content?.pages, 'it')
  return <PagesEditor initial={pages} siteSlug={(site as any).slug} />
}
