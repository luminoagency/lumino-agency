import Script from 'next/script'
import { createAdminClient } from '@/lib/supabase/admin'
import type { SiteBuild } from '@/lib/lab/builder'

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

  const build = (data?.project_data?.build as SiteBuild | undefined) || null

  if (!data || !build || !build.sections?.length) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif', textAlign: 'center', padding: '2rem' }}>
        <div>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏗️</div>
          <p style={{ color: 'rgba(255,255,255,0.6)' }}>Sito non ancora generato.</p>
        </div>
      </div>
    )
  }

  const css = [build.globalCSS, ...build.sections.map(s => s.css || '')].join('\n\n')

  return (
    <>
      {/* Tailwind Play CDN: compila a runtime le classi generate dall'AI (solo per preview). */}
      <Script src="https://cdn.tailwindcss.com" strategy="afterInteractive" />
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="lab-site">
        {build.sections.map((s, i) => (
          <div key={i} dangerouslySetInnerHTML={{ __html: s.html }} />
        ))}
      </div>
    </>
  )
}
