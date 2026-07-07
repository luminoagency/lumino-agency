import { redirect } from 'next/navigation'
import { getMySite } from '../actions/site'
import { GalleryManager } from './GalleryManager'
import type { GalleryImage } from '@/lib/images/gallery'

export const dynamic = 'force-dynamic'

/** Normalizza gli item della gallery salvati (stringa o oggetto) in {url, alt, caption?}. */
function normalize(raw: unknown): GalleryImage[] {
  if (!Array.isArray(raw)) return []
  const out: GalleryImage[] = []
  for (const g of raw) {
    if (typeof g === 'string' && g.trim()) out.push({ url: g, alt: '' })
    else if (g && typeof g === 'object' && typeof (g as any).url === 'string') {
      out.push({ url: (g as any).url, alt: (g as any).alt || '', ...((g as any).caption ? { caption: (g as any).caption } : {}) })
    }
  }
  return out
}

export default async function GalleryAdminPage() {
  const site = await getMySite()
  if (!site) {
    redirect('/login?next=' + encodeURIComponent('/admin/gallery-admin') + '&error=' + encodeURIComponent('Accedi per gestire la gallery.'))
  }
  const tier = (site as any).tier as string
  if (tier === 'basic') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ textAlign: 'center', maxWidth: 460 }}>
          <h1 style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: 32, fontStyle: 'italic', color: '#fff', marginBottom: 12 }}>Gallery inclusa nei piani Pro e Premium</h1>
          <p style={{ color: '#aaa', lineHeight: 1.6 }}>Passa al piano Pro o Premium per caricare e gestire le foto della gallery del tuo sito.</p>
          <a href="/pricing" style={{ color: '#e52d1d', display: 'inline-block', marginTop: 18 }}>Scopri i piani →</a>
        </div>
      </div>
    )
  }

  const content = Array.isArray((site as any).content) ? (site as any).content[0] : (site as any).content
  return <GalleryManager initial={normalize(content?.gallery_images)} siteSlug={(site as any).slug} />
}
