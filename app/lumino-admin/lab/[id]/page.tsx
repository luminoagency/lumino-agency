import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireSuperAdmin } from '../guard'
import { businessTypeMeta, stepLabel, TOTAL_STEPS } from '../constants'

export const dynamic = 'force-dynamic'

const serif = { fontFamily: '"Cormorant Garamond", Georgia, serif' }

export default async function LabProjectPage({ params }: { params: { id: string } }) {
  await requireSuperAdmin('/lumino-admin/lab/' + params.id)
  const admin = createAdminClient()

  const { data: project } = await admin
    .from('lab_projects')
    .select('id, business_name, business_type, status, current_step, business_input_mode, business_input_value')
    .eq('id', params.id)
    .maybeSingle()

  if (!project) notFound()

  const meta = businessTypeMeta(project.business_type)

  return (
    <div className="min-h-screen bg-[#050505] text-white" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap" />
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{ background: 'radial-gradient(800px circle at 12% 18%, rgba(229,45,29,0.06), transparent 50%), radial-gradient(700px circle at 88% 75%, rgba(167,139,250,0.05), transparent 50%)' }}
      />
      <div className="relative z-10 mx-auto max-w-[1000px] px-5 py-6">
        <div className="mb-8 flex items-center gap-4 border-b border-white/10 pb-5">
          <Link href="/lumino-admin/lab" className="text-xs text-white/50 transition-colors hover:text-white">← Lab</Link>
        </div>

        <div className="flex items-start gap-4">
          <span className="text-5xl leading-none">{meta.icon}</span>
          <div>
            <h1 className="m-0 text-4xl font-normal italic tracking-tight" style={serif}>{project.business_name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/50">
              <span>{meta.label}</span>
              <span className="text-white/20">·</span>
              <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[12px] font-medium text-white/70">
                Step {Math.min(project.current_step ?? 1, TOTAL_STEPS)}/{TOTAL_STEPS} — {stepLabel(project.current_step ?? 1)}
              </span>
              <span className="text-white/20">·</span>
              <span className="capitalize">{String(project.status).replace('_', ' ')}</span>
            </div>
          </div>
        </div>

        {project.business_input_value && (
          <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-white/40">
              Input ({project.business_input_mode === 'url' ? 'URL' : 'Descrizione'})
            </div>
            <div className="break-words text-sm text-white/80">{project.business_input_value}</div>
          </div>
        )}

        <div className="mt-10 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center">
          <div className="mb-3 text-4xl">🚧</div>
          <h2 className="m-0 text-2xl font-normal italic text-white" style={serif}>Lab in costruzione</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/50">
            Questo è il segnaposto dello Step 0. I prossimi step (Research → Layout → Builder → Editor → Publish)
            verranno costruiti qui sopra.
          </p>
        </div>
      </div>
    </div>
  )
}
