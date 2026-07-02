import Script from 'next/script'
import { createAdminClient } from '@/lib/supabase/admin'
import { normalizeBuild } from '@/lib/lab/builder'
import { RenderSite } from '@/lib/lab/render'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: { id: string } }) {
  const admin = createAdminClient()
  const { data } = await admin.from('lab_projects').select('business_name').eq('id', params.id).maybeSingle()
  return { title: data?.business_name ? `${data.business_name} — anteprima` : 'Anteprima', robots: { index: false } }
}

export default async function LabPreviewPage({ params }: { params: { id: string } }) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('lab_projects')
    .select('business_name, project_data')
    .eq('id', params.id)
    .maybeSingle()

  const raw = data?.project_data?.build
  const build = raw ? normalizeBuild(raw) : null
  const hasContent = !!build && build.pages.some(p => p.sections.length > 0)

  if (!data || !build || !hasContent) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif', textAlign: 'center', padding: '2rem' }}>
        <div>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏗️</div>
          <p style={{ color: 'rgba(255,255,255,0.6)' }}>Sito non ancora generato.</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Tailwind Play CDN: compila a runtime le classi Tailwind dei componenti libreria (solo preview). */}
      <Script src="https://cdn.tailwindcss.com" strategy="afterInteractive" />
      <div className="lab-site">
        <RenderSite build={build} projectId={params.id} />
      </div>
    </>
  )
}
