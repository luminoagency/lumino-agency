import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getDemoBySlug, DEMO_RESTAURANTS } from '@/templates/_shared/demoData'
import { CinematicoTemplate } from '@/templates/cinematico/CinematicoTemplate'
import { BentoTemplate } from '@/templates/bento/BentoTemplate'
import { PanoramicoTemplate } from '@/templates/panoramico/PanoramicoTemplate'
import { AuroraTemplate } from '@/templates/aurora/AuroraTemplate'
import { MercatoTemplate } from '@/templates/mercato/MercatoTemplate'

export default function DemoPage({ params }: { params: { slug: string } }) {
  const demo = getDemoBySlug(params.slug)
  if (!demo) return notFound()

  const Template = ({
    cinematico: CinematicoTemplate,
    bento: BentoTemplate,
    panoramico: PanoramicoTemplate,
    aurora: AuroraTemplate,
    mercato: MercatoTemplate,
  }[demo.template]) as any

  return (
    <>
      {/* Demo banner (always visible, sticky on top) */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        background: 'rgba(11, 11, 11, 0.92)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        color: '#fff',
        padding: '10px 16px',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 13,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <Link href="/portfolio" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 12 }}>
            ← Portfolio
          </Link>
          <span style={{ color: 'rgba(255,255,255,0.3)' }}>·</span>
          <span style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: demo.accentColor, fontWeight: 600 }}>Esempio · {demo.cuisine}</span>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Esempio: <strong style={{ color: '#fff' }}>{demo.data.restaurantName}</strong></span>
        </div>
        <Link href="/register" style={{
          padding: '7px 16px',
          background: demo.accentColor,
          color: '#fff',
          textDecoration: 'none',
          fontSize: 12,
          fontWeight: 700,
          borderRadius: 100,
          letterSpacing: '0.05em',
        }}>
          Inizia il tuo sito →
        </Link>
      </div>

      <div style={{ paddingTop: 44 }}>
        <Template {...demo.data} accentColor={demo.accentColor} />
      </div>
    </>
  )
}

export async function generateStaticParams() {
  return DEMO_RESTAURANTS.map(d => ({ slug: d.slug }))
}
