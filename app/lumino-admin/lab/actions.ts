'use server'

/**
 * Server actions del Lumino Lab. Accessibili SOLO al super-admin.
 * Pattern return-data (niente redirect() throw nelle action).
 */

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { BUSINESS_TYPES } from './constants'
import { scrapeUrl } from '@/lib/lab/firecrawl'
import { findPlace, findCompetitors, type LabPlace } from '@/lib/lab/places'
import { extractResearch, chatTurn, type ResearchReport, type ChatMessage } from '@/lib/lab/research'
import { generateLayouts, layoutChatTurn, type LayoutProposal, type SectionKey } from '@/lib/lab/layout'
import { buildGlobalCss, generateSection, type BuildSection, type SiteBuild } from '@/lib/lab/builder'
import type { SupabaseClient } from '@supabase/supabase-js'

const SUPER_ADMINS = ['bylumino06@gmail.com', 'siwaky.assistance@gmail.com']

async function assertSuperAdmin() {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user || !SUPER_ADMINS.includes(user.email || '')) {
    throw new Error('Non autorizzato')
  }
  return user
}

const VALID_TYPES = BUSINESS_TYPES.map(t => t.key) as string[]

export interface CreateLabProjectResult {
  ok: boolean
  id?: string
  error?: string
}

/** Crea un nuovo progetto Lab (status bozza, step 1) e ritorna l'id. */
export async function createLabProject(input: {
  businessName: string
  businessType: string
  inputMode: 'url' | 'description'
  inputValue: string
}): Promise<CreateLabProjectResult> {
  try {
    const user = await assertSuperAdmin()

    const business_name = String(input.businessName || '').trim()
    const business_type = VALID_TYPES.includes(input.businessType) ? input.businessType : 'altro'
    const business_input_mode = input.inputMode === 'url' ? 'url' : 'description'
    const business_input_value = String(input.inputValue || '').trim() || null

    if (!business_name) return { ok: false, error: 'Inserisci il nome del business.' }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('lab_projects')
      .insert({
        business_name,
        business_type,
        business_input_mode,
        business_input_value,
        status: 'bozza',
        current_step: 1,
        created_by: user.id,
      })
      .select('id')
      .single()

    if (error) return { ok: false, error: error.message }

    revalidatePath('/lumino-admin/lab')
    return { ok: true, id: data.id }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Errore imprevisto.' }
  }
}

// ── Step 1 — Research ─────────────────────────────────────────

interface LabProjectRow {
  id: string
  business_name: string
  business_type: string
  business_input_mode: string | null
  business_input_value: string | null
  current_step: number
  project_data: any
}

async function loadProject(id: string): Promise<{ admin: SupabaseClient; project: LabProjectRow | null }> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('lab_projects')
    .select('id, business_name, business_type, business_input_mode, business_input_value, current_step, project_data')
    .eq('id', id)
    .maybeSingle()
  return { admin, project: (data as LabProjectRow) ?? null }
}

async function saveProjectData(admin: SupabaseClient, project: LabProjectRow, patch: Record<string, any>) {
  const merged = { ...(project.project_data || {}), ...patch }
  await admin.from('lab_projects').update({ project_data: merged, updated_at: new Date().toISOString() }).eq('id', project.id)
}

function buildPhotos(scraped: string[] | undefined, place: LabPlace | null): string[] {
  const placePhotos = (place?.photoNames || []).map(n => `/api/lab/place-photo?name=${encodeURIComponent(n)}`)
  const all = [...(scraped || []), ...placePhotos]
  return all.filter((u, i) => all.indexOf(u) === i).slice(0, 12)
}

async function competitorsFor(place: LabPlace | null, type: string) {
  if (place?.lat == null || place?.lng == null) return []
  try {
    return await findCompetitors(place.lat, place.lng, type, place.placeId)
  } catch {
    return []
  }
}

export interface ResearchResult {
  ok: boolean
  research?: ResearchReport
  fallback?: boolean
  error?: string
}

/** Modalità A: scrape URL + Google Places + analisi Claude → report. */
export async function runUrlResearch(projectId: string): Promise<ResearchResult> {
  try {
    await assertSuperAdmin()
    const { admin, project } = await loadProject(projectId)
    if (!project) return { ok: false, error: 'Progetto non trovato.' }

    const url = (project.business_input_value || '').trim()
    if (!url) return { ok: false, fallback: true, error: 'Nessun URL fornito.' }

    const scrape = await scrapeUrl(url)
    if (!scrape.ok) {
      return { ok: false, fallback: true, error: scrape.error || 'Scraping non riuscito.' }
    }

    const place = await findPlace(project.business_name).catch(() => null)
    const analysis = await extractResearch({
      businessName: project.business_name,
      businessType: project.business_type,
      source: scrape.markdown || '',
      place,
    })
    const competitors = await competitorsFor(place, project.business_type)

    const research: ResearchReport = {
      mode: 'url',
      sourceUrl: url,
      info: analysis.info,
      photos: buildPhotos(scrape.images, place),
      toneOfVoice: analysis.toneOfVoice,
      missing: analysis.missing,
      competitors,
      generatedAt: new Date().toISOString(),
    }

    await saveProjectData(admin, project, { research })
    revalidatePath(`/lumino-admin/lab/${projectId}`)
    return { ok: true, research }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Errore durante la ricerca.' }
  }
}

/** Modalità B: un turno di chat. Persiste la conversazione. */
export async function chatResearch(
  projectId: string,
  messages: ChatMessage[],
): Promise<{ ok: boolean; text?: string; ready?: boolean; error?: string }> {
  try {
    await assertSuperAdmin()
    const { admin, project } = await loadProject(projectId)
    if (!project) return { ok: false, error: 'Progetto non trovato.' }

    const r = await chatTurn(project.business_name, project.business_type, messages)
    const newMessages = [...messages, { role: 'assistant' as const, content: r.text }]
    await saveProjectData(admin, project, { research_chat: newMessages })
    return { ok: true, text: r.text, ready: r.ready }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Errore nella chat.' }
  }
}

/** Modalità B: dalla trascrizione chat → report finale. */
export async function finalizeResearch(
  projectId: string,
  messages: ChatMessage[],
): Promise<ResearchResult> {
  try {
    await assertSuperAdmin()
    const { admin, project } = await loadProject(projectId)
    if (!project) return { ok: false, error: 'Progetto non trovato.' }

    const transcript = messages.map(m => `${m.role === 'user' ? 'Utente' : 'AI'}: ${m.content}`).join('\n')
    const place = await findPlace(project.business_name).catch(() => null)
    const analysis = await extractResearch({
      businessName: project.business_name,
      businessType: project.business_type,
      source: transcript,
      place,
    })
    const competitors = await competitorsFor(place, project.business_type)

    const research: ResearchReport = {
      mode: 'description',
      info: analysis.info,
      photos: buildPhotos([], place),
      toneOfVoice: analysis.toneOfVoice,
      missing: analysis.missing,
      competitors,
      generatedAt: new Date().toISOString(),
    }

    await saveProjectData(admin, project, { research, research_chat: messages })
    revalidatePath(`/lumino-admin/lab/${projectId}`)
    return { ok: true, research }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Errore nel generare il report.' }
  }
}

/** Aggiorna manualmente parti del report (chat-driven tweaks dal lato). */
export async function patchResearch(
  projectId: string,
  research: ResearchReport,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertSuperAdmin()
    const { admin, project } = await loadProject(projectId)
    if (!project) return { ok: false, error: 'Progetto non trovato.' }
    await saveProjectData(admin, project, { research })
    revalidatePath(`/lumino-admin/lab/${projectId}`)
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Errore.' }
  }
}

/** Passa allo step successivo (es. Step 2 — Layout). */
export async function advanceToStep(
  projectId: string,
  step: number,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertSuperAdmin()
    const admin = createAdminClient()
    const safeStep = Math.min(Math.max(Math.round(step), 1), 5)
    const status = safeStep >= 2 ? 'in_costruzione' : 'bozza'
    const { error } = await admin
      .from('lab_projects')
      .update({ current_step: safeStep, status, updated_at: new Date().toISOString() })
      .eq('id', projectId)
    if (error) return { ok: false, error: error.message }
    revalidatePath(`/lumino-admin/lab/${projectId}`)
    revalidatePath('/lumino-admin/lab')
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Errore.' }
  }
}

// ── Step 2 — Layout ───────────────────────────────────────────

export interface LayoutsResult {
  ok: boolean
  proposals?: LayoutProposal[]
  error?: string
}

/** Genera 2-3 proposte di layout dal report dello Step 1. */
export async function generateLayoutProposals(projectId: string): Promise<LayoutsResult> {
  try {
    await assertSuperAdmin()
    const { admin, project } = await loadProject(projectId)
    if (!project) return { ok: false, error: 'Progetto non trovato.' }

    const research = (project.project_data || {}).research as ResearchReport | undefined
    if (!research) return { ok: false, error: 'Manca il report dello Step 1.' }

    const proposals = await generateLayouts(research)
    if (proposals.length === 0) return { ok: false, error: 'Nessuna proposta generata, riprova.' }

    await saveProjectData(admin, project, { layout_proposals: proposals })
    revalidatePath(`/lumino-admin/lab/${projectId}`)
    return { ok: true, proposals }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Errore nel generare i layout.' }
  }
}

/** Salva il layout scelto e avanza allo Step 3. */
export async function chooseLayout(
  projectId: string,
  layout: LayoutProposal,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertSuperAdmin()
    const { admin, project } = await loadProject(projectId)
    if (!project) return { ok: false, error: 'Progetto non trovato.' }

    await saveProjectData(admin, project, { layout })
    const { error } = await admin
      .from('lab_projects')
      .update({ current_step: 3, status: 'in_costruzione', updated_at: new Date().toISOString() })
      .eq('id', projectId)
    if (error) return { ok: false, error: error.message }

    revalidatePath(`/lumino-admin/lab/${projectId}`)
    revalidatePath('/lumino-admin/lab')
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Errore nel salvare il layout.' }
  }
}

/** Chat a lato dello Step 2. */
export async function chatLayout(
  projectId: string,
  messages: ChatMessage[],
): Promise<{ ok: boolean; text?: string; error?: string }> {
  try {
    await assertSuperAdmin()
    const { admin, project } = await loadProject(projectId)
    if (!project) return { ok: false, error: 'Progetto non trovato.' }

    const pdata = project.project_data || {}
    const research = pdata.research as ResearchReport
    const proposals = (pdata.layout_proposals as LayoutProposal[]) || []
    const r = await layoutChatTurn(project.business_name, research, proposals, messages)

    const newMessages = [...messages, { role: 'assistant' as const, content: r.text }]
    await saveProjectData(admin, project, { layout_chat: newMessages })
    return { ok: true, text: r.text }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Errore nella chat.' }
  }
}

// ── Step 3 — Builder ──────────────────────────────────────────

export interface BuildShell {
  ok: boolean
  sections?: SectionKey[]
  palette?: string[]
  globalCSS?: string
  businessName?: string
  error?: string
}

/** Prepara la build: ordine sezioni (dal layout), palette, globalCSS. */
export async function getBuildShell(projectId: string): Promise<BuildShell> {
  try {
    await assertSuperAdmin()
    const { project } = await loadProject(projectId)
    if (!project) return { ok: false, error: 'Progetto non trovato.' }
    const pdata = project.project_data || {}
    const layout = pdata.layout as LayoutProposal | undefined
    if (!layout) return { ok: false, error: 'Manca il layout dello Step 2.' }
    const sections = (layout.sections && layout.sections.length ? layout.sections : ['hero', 'about', 'contact']) as SectionKey[]
    return {
      ok: true,
      sections,
      palette: layout.palette,
      globalCSS: buildGlobalCss(layout.palette),
      businessName: project.business_name,
    }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Errore.' }
  }
}

/** Genera UNA sezione del sito (chiamata in loop dal client per la progress reale). */
export async function buildOneSection(
  projectId: string,
  sectionKey: SectionKey,
): Promise<{ ok: boolean; section?: BuildSection; error?: string }> {
  try {
    await assertSuperAdmin()
    const { project } = await loadProject(projectId)
    if (!project) return { ok: false, error: 'Progetto non trovato.' }
    const pdata = project.project_data || {}
    const research = pdata.research as ResearchReport
    const layout = pdata.layout as LayoutProposal
    if (!research || !layout) return { ok: false, error: 'Mancano research/layout.' }

    const { html, css } = await generateSection({
      sectionKey,
      businessName: project.business_name,
      businessType: project.business_type,
      research,
      layout,
    })
    return { ok: true, section: { name: sectionKey, html, css } }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Errore nella sezione.' }
  }
}

/** Salva la build completa in project_data.build. */
export async function saveBuild(
  projectId: string,
  build: { sections: BuildSection[]; globalCSS: string; palette: string[] },
): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertSuperAdmin()
    const { admin, project } = await loadProject(projectId)
    if (!project) return { ok: false, error: 'Progetto non trovato.' }
    const full: SiteBuild = { ...build, generatedAt: new Date().toISOString() }
    await saveProjectData(admin, project, { build: full })
    revalidatePath(`/lumino-admin/lab/${projectId}`)
    revalidatePath(`/lab-preview/${projectId}`)
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Errore nel salvataggio.' }
  }
}

/** Chat a lato dello Step 3. */
export async function chatBuild(
  projectId: string,
  messages: ChatMessage[],
): Promise<{ ok: boolean; text?: string; error?: string }> {
  try {
    await assertSuperAdmin()
    const { admin, project } = await loadProject(projectId)
    if (!project) return { ok: false, error: 'Progetto non trovato.' }
    const pdata = project.project_data || {}
    const research = pdata.research as ResearchReport
    const layout = pdata.layout as LayoutProposal
    const r = await layoutChatTurn(project.business_name, research, layout ? [layout] : [], messages)
    const newMessages = [...messages, { role: 'assistant' as const, content: r.text }]
    await saveProjectData(admin, project, { build_chat: newMessages })
    return { ok: true, text: r.text }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Errore nella chat.' }
  }
}
