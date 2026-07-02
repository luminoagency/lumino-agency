import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireSuperAdmin } from '../guard'
import { businessTypeMeta, stepLabel, TOTAL_STEPS } from '../constants'
import { Step1Research } from './Step1Research'
import { Step2Layout } from './Step2Layout'
import { Step3Builder } from './Step3Builder'
import Step4Editor from '../Step4Editor'
import Step5Publish from '../Step5Publish'
import Step6Subscription from '../Step6Subscription'
import type { ResearchReport, ChatMessage } from '@/lib/lab/research'
import type { LayoutProposal } from '@/lib/lab/layout'
import { normalizeBuild } from '@/lib/lab/builder'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const maxDuration = 60

export async function generateMetadata({ params }: { params: { id: string } }) {
  try {
    const admin = createAdminClient()
    const { data } = await admin.from('lab_projects').select('business_name').eq('id', params.id).maybeSingle()
    return { title: data?.business_name ? `${data.business_name} | Lumino Admin` : 'Progetto | Lumino Admin' }
  } catch {
    return { title: 'Lumino Admin' }
  }
}

const serif = { fontFamily: '"Cormorant Garamond", Georgia, serif' }

export default async function LabProjectPage({ params }: { params: { id: string } }) {
  await requireSuperAdmin('/lumino-admin/lab/' + params.id)
  const admin = createAdminClient()

  const { data: project } = await admin
    .from('lab_projects')
    .select('id, business_name, business_type, status, current_step, business_input_mode, business_input_value, project_data')
    .eq('id', params.id)
    .maybeSingle()

  if (!project) notFound()

  const step = project.current_step ?? 1
  const pdata = (project.project_data || {}) as any
  const research = (pdata.research as ResearchReport) || null
  const chat = (pdata.research_chat as ChatMessage[]) || []

  // Step 1 — Research (UI interattiva)
  if (step === 1) {
    return (
      <Step1Research
        projectId={project.id}
        businessName={project.business_name}
        businessType={project.business_type}
        inputMode={project.business_input_mode === 'url' ? 'url' : 'description'}
        inputValue={project.business_input_value || ''}
        initialResearch={research}
        initialChat={chat}
      />
    )
  }

  // Step 2 — Layout
  if (step === 2) {
    return (
      <Step2Layout
        projectId={project.id}
        businessName={project.business_name}
        businessType={project.business_type}
        initialProposals={(pdata.layout_proposals as LayoutProposal[]) || []}
        initialChat={(pdata.layout_chat as ChatMessage[]) || []}
      />
    )
  }

  // Step 3 — Builder
  if (step === 3) {
    return (
      <Step3Builder
        projectId={project.id}
        businessName={project.business_name}
        businessType={project.business_type}
        hasBuild={!!pdata.build}
        initialChat={(pdata.build_chat as ChatMessage[]) || []}
      />
    )
  }

  // Step 4 — Editor
  if (step === 4) {
    if (!pdata.build) {
      return <div className="min-h-screen bg-[#050505] p-8 text-white/60">Errore: build mancante. Torna allo Step 3.</div>
    }
    return (
      <Step4Editor
        projectId={project.id}
        build={normalizeBuild(pdata.build)}
        businessName={project.business_name}
        businessType={project.business_type}
      />
    )
  }

  // Step 5 — Publish
  if (step === 5) {
    if (!pdata.build) {
      return <div className="min-h-screen bg-[#050505] p-8 text-white/60">Errore: build mancante. Torna allo Step 3.</div>
    }
    return (
      <Step5Publish
        projectId={project.id}
        build={normalizeBuild(pdata.build)}
        businessName={project.business_name}
        businessType={project.business_type}
        publishedUrl={pdata.publish?.url}
        customDomain={pdata.publish?.customDomain}
        publishedAt={pdata.publish?.publishedAt}
        history={pdata.publish?.history || []}
        snapshots={(pdata.snapshots || []).map((s: any) => ({ id: s.id, reason: s.reason, created_at: s.created_at }))}
      />
    )
  }

  // Step 6 — Subscription (hotel)
  if (step === 6) {
    return (
      <Step6Subscription
        projectId={project.id}
        businessName={project.business_name}
        businessType={project.business_type}
      />
    )
  }

  // Step ≥ 2 — non ancora costruito: mostra che lo Step 1 è completo.
  const meta = businessTypeMeta(project.business_type)
  return (
    <div className="min-h-screen bg-[#050505] text-white" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap" />
      <div className="mx-auto max-w-[1000px] px-5 py-6">
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
                Step {Math.min(step, TOTAL_STEPS)}/{TOTAL_STEPS} — {stepLabel(step)}
              </span>
            </div>
          </div>
        </div>

        {research && (
          <div className="mt-6 rounded-xl border border-green-500/25 bg-green-500/[0.06] px-4 py-3 text-sm text-green-300">
            ✓ Step 1 — Research completato. {research.competitors.length} competitor analizzati · {research.photos.length} foto.
          </div>
        )}

        <div className="mt-8 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center">
          <div className="mb-3 text-4xl">🚧</div>
          <h2 className="m-0 text-2xl font-normal italic text-white" style={serif}>Step {Math.min(step, TOTAL_STEPS)} — {stepLabel(step)} in costruzione</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/50">
            Questo step verrà costruito prossimamente. La ricerca dello Step 1 è salvata e disponibile.
          </p>
        </div>
      </div>
    </div>
  )
}
