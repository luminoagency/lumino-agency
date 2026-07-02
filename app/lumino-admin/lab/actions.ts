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
import { generateLayouts, layoutChatTurn, localesForBusiness, type LayoutProposal, type SectionKey } from '@/lib/lab/layout'
import path from 'path'
import { randomUUID } from 'crypto'
import { generateSection, paletteRoles, normalizeBuild, makeHotelFooterSection, isHotelBusinessType, type SiteSection, type SiteBuild, type SitePage, type GlobalConfig, type NavLink, type EditorState, type ProjectAsset } from '@/lib/lab/builder'
import { computeWowForBuild } from '@/lib/lab/wow'
import { uploadLogo, extractPaletteFromLogo, uploadAsset, deleteAsset } from '@/lib/lab/branding'
import { exportSiteToStatic } from '@/lib/lab/static-export'
import { getOrCreateVercelProject, deploySite, addCustomDomain, removeCustomDomain } from '@/lib/lab/vercel'
import { translateAllSections, translateSectionProps } from '@/lib/lab/translate'
import type { Locale } from '@/lib/lab/builder'
import { calculateNextBilling, generateInvoiceNumber, type Subscription, type Invoice, type PaymentMethod } from '@/lib/lab/subscriptions'
import { checkOverdueSubscriptions, generateMonthlyInvoices } from '@/lib/lab/subscription-cron'
import { importPhotosForProject, type PhotoSource, type PhotoImportResult } from '@/lib/lab/photo-import'
import { createClientUser, generateTempPassword, setClientPassword, type ClientUser } from '@/lib/lab/client-auth'
import { auditProject, type AuditReport } from '@/lib/lab/audit'
import type { SupabaseClient } from '@supabase/supabase-js'

const SUPER_ADMINS = ['bylumino06@gmail.com']

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
    const safeStep = Math.min(Math.max(Math.round(step), 1), 6)
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
  pages?: Array<{ slug: string; title: string; sections: string[]; isHomepage?: boolean }>
  globalConfig?: GlobalConfig
  navigation?: { header: NavLink[]; footer: NavLink[] }
  businessName?: string
  locales?: Locale[]
  defaultLocale?: Locale
  error?: string
}

/** Prepara la build multi-pagina: pagine (dal layout), globalConfig (palette), navigation. */
export async function getBuildShell(projectId: string): Promise<BuildShell> {
  try {
    await assertSuperAdmin()
    const { project } = await loadProject(projectId)
    if (!project) return { ok: false, error: 'Progetto non trovato.' }
    const pdata = project.project_data || {}
    const layout = pdata.layout as LayoutProposal | undefined
    if (!layout) return { ok: false, error: 'Manca il layout dello Step 2.' }

    const pages = (layout.pages && layout.pages.length)
      ? layout.pages
      : [{ slug: 'home', title: 'Home', sections: (layout.sections && layout.sections.length ? layout.sections : ['hero', 'about', 'contact']), isHomepage: true }]
    const navigation = layout.navigation && layout.navigation.header
      ? layout.navigation
      : { header: pages.map(p => ({ label: p.title, slug: p.slug })), footer: pages.map(p => ({ label: p.title, slug: p.slug })) }

    const roles = paletteRoles(layout.palette)
    const palette = { bg: roles.bg, ink: roles.ink, accent: roles.accent, muted: layout.palette[3] || (roles.isDark ? '#222222' : '#f5f5f5') }
    const globalConfig: GlobalConfig = { palette, businessName: project.business_name }

    return { ok: true, pages, globalConfig, navigation, businessName: project.business_name, locales: localesForBusiness(project.business_type), defaultLocale: 'it' }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Errore.' }
  }
}

/** Genera UNA sezione del sito (chiamata in loop dal client per la progress reale). */
export async function buildOneSection(
  projectId: string,
  sectionKey: string,
): Promise<{ ok: boolean; section?: SiteSection; error?: string }> {
  try {
    await assertSuperAdmin()
    const { project } = await loadProject(projectId)
    if (!project) return { ok: false, error: 'Progetto non trovato.' }
    const pdata = project.project_data || {}
    const research = pdata.research as ResearchReport
    const layout = pdata.layout as LayoutProposal
    if (!research || !layout) return { ok: false, error: 'Mancano research/layout.' }

    // Branding + asset reali del cliente (Layer 2/3) per i contenuti.
    const cb = normalizeBuild(pdata.build)
    const assets = (cb.assets || []).map(a => ({ url: a.url, alt: a.alt, category: a.category, tags: a.tags }))

    // generateSection ora ritorna direttamente un SiteSection (library | custom).
    const section = await generateSection({
      sectionKey,
      businessName: project.business_name,
      businessType: project.business_type,
      research,
      layout,
      tone: cb.globalConfig.tone,
      assets,
    })
    return { ok: true, section }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Errore nella sezione.' }
  }
}

/** Salva la build multi-pagina completa in project_data.build. */
export async function saveBuild(
  projectId: string,
  build: { pages: SitePage[]; globalConfig: GlobalConfig; navigation: { header: NavLink[]; footer: NavLink[] }; locales?: Locale[]; defaultLocale?: Locale },
): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertSuperAdmin()
    const { admin, project } = await loadProject(projectId)
    if (!project) return { ok: false, error: 'Progetto non trovato.' }
    let full: SiteBuild = { ...build, generatedAt: new Date().toISOString() }

    // Hotel: garantisci un site-footer ricco (Booking/social/legali) su ogni pagina.
    if (isHotelBusinessType(project.business_type)) {
      const footer = makeHotelFooterSection(full)
      full = {
        ...full,
        pages: full.pages.map(p =>
          p.sections.some(s => s.type === 'library' && s.component.startsWith('footer/'))
            ? p
            : { ...p, sections: [...p.sections, footer] }
        ),
      }
    }

    // Layer WOW — applica cursore/background/showcase in modo deterministico e idempotente.
    full = computeWowForBuild(full, project.business_type)

    await saveProjectData(admin, project, { build: full })
    revalidatePath(`/lumino-admin/lab/${projectId}`)
    revalidatePath(`/lab-preview/${projectId}`)
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Errore nel salvataggio.' }
  }
}

/** Step 4 — attiva/disattiva gli effetti WOW e ricalcola la build (idempotente). */
export async function setWowEnabled(
  projectId: string,
  enabled: boolean,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertSuperAdmin()
    const { admin, project } = await loadProject(projectId)
    if (!project) return { ok: false, error: 'Progetto non trovato.' }
    const build = normalizeBuild(project.project_data?.build)
    build.wow = { ...(build.wow || {}), enabled }
    const full = computeWowForBuild(build, project.business_type)
    await saveProjectData(admin, project, { build: full })
    revalidatePath(`/lumino-admin/lab/${projectId}`)
    revalidatePath(`/lab-preview/${projectId}`)
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Errore nel toggle WOW.' }
  }
}

/** Step 4 — cambia la pagina attiva nell'editor (persiste editorState.activePage). */
export async function setActivePage(
  projectId: string,
  slug: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertSuperAdmin()
    const { admin, project } = await loadProject(projectId)
    if (!project) return { ok: false, error: 'Progetto non trovato.' }
    const pdata = project.project_data || {}
    const currentBuild = pdata.build as SiteBuild | undefined
    if (!currentBuild) return { ok: false, error: 'Build mancante.' }
    const prevEditor: EditorState = currentBuild.editorState || { pages: {} }
    const editorState: EditorState = { ...prevEditor, activePage: slug }
    await saveProjectData(admin, project, { build: { ...currentBuild, editorState } })
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Errore.' }
  }
}

// ── Step 4 — Branding (Layer 2) ───────────────────────────────

/** Upload logo + estrazione palette automatica. Salva in build.globalConfig.logo + .palette. */
export async function uploadLogoAction(
  projectId: string,
  formData: FormData,
): Promise<{ ok: boolean; url?: string; palette?: GlobalConfig['palette']; error?: string }> {
  try {
    await assertSuperAdmin()
    const file = formData.get('file')
    if (!(file instanceof File)) return { ok: false, error: 'Nessun file ricevuto.' }
    if (!file.type.startsWith('image/')) return { ok: false, error: 'Il file deve essere un\'immagine.' }
    if (file.size > 5 * 1024 * 1024) return { ok: false, error: 'Immagine troppo grande (max 5MB).' }

    const { admin, project } = await loadProject(projectId)
    if (!project) return { ok: false, error: 'Progetto non trovato.' }

    const up = await uploadLogo(file, projectId)
    const buf = Buffer.from(await file.arrayBuffer())
    const palette = await extractPaletteFromLogo(buf)

    const currentBuild = normalizeBuild(project.project_data?.build)
    const globalConfig: GlobalConfig = {
      ...currentBuild.globalConfig,
      palette,
      logo: { url: up.url, alt: `${project.business_name} logo`, width: up.width, height: up.height },
    }
    await saveProjectData(admin, project, { build: { ...currentBuild, globalConfig } })
    revalidatePath(`/lumino-admin/lab/${projectId}`)
    revalidatePath(`/lab-preview/${projectId}`)
    return { ok: true, url: up.url, palette }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Errore upload logo.' }
  }
}

/** Aggiorna (merge) la configurazione globale del sito: font, tono, palette, contatti, social. */
export async function updateGlobalConfig(
  projectId: string,
  config: Partial<GlobalConfig>,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertSuperAdmin()
    const { admin, project } = await loadProject(projectId)
    if (!project) return { ok: false, error: 'Progetto non trovato.' }
    const currentBuild = normalizeBuild(project.project_data?.build)
    const globalConfig: GlobalConfig = { ...currentBuild.globalConfig, ...config }
    await saveProjectData(admin, project, { build: { ...currentBuild, globalConfig } })
    revalidatePath(`/lumino-admin/lab/${projectId}`)
    revalidatePath(`/lab-preview/${projectId}`)
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Errore aggiornamento config.' }
  }
}

// ── Step 4 — Asset library (Layer 3) ──────────────────────────

const ASSET_CATEGORIES = ['food', 'interior', 'people', 'product', 'logo', 'other', 'rooms', 'spa', 'restaurant', 'exterior', 'common-areas', 'amenities'] as const

/** Upload di una foto cliente. Salva il ProjectAsset in build.assets[]. */
export async function uploadAssetAction(
  projectId: string,
  formData: FormData,
): Promise<{ ok: boolean; asset?: ProjectAsset; error?: string }> {
  try {
    await assertSuperAdmin()
    const file = formData.get('file')
    if (!(file instanceof File)) return { ok: false, error: 'Nessun file ricevuto.' }
    if (!file.type.startsWith('image/')) return { ok: false, error: 'Il file deve essere un\'immagine.' }
    if (file.size > 10 * 1024 * 1024) return { ok: false, error: 'Immagine troppo grande (max 10MB).' }

    const { admin, project } = await loadProject(projectId)
    if (!project) return { ok: false, error: 'Progetto non trovato.' }

    const rawCat = String(formData.get('category') || '')
    const category = (ASSET_CATEGORIES as readonly string[]).includes(rawCat) ? (rawCat as ProjectAsset['category']) : 'other'

    const up = await uploadAsset(file, projectId, category)
    const asset: ProjectAsset = {
      id: randomUUID(),
      url: up.url,
      alt: (file.name || 'foto').replace(/\.[^.]+$/, ''),
      category,
      width: up.width,
      height: up.height,
      uploadedAt: new Date().toISOString(),
      tags: [],
    }

    const currentBuild = normalizeBuild(project.project_data?.build)
    const assets = [...(currentBuild.assets || []), asset]
    await saveProjectData(admin, project, { build: { ...currentBuild, assets } })
    revalidatePath(`/lumino-admin/lab/${projectId}`)
    revalidatePath(`/lab-preview/${projectId}`)
    return { ok: true, asset }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Errore upload asset.' }
  }
}

/** Elimina un asset (DB + Storage). */
export async function deleteAssetAction(projectId: string, assetId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertSuperAdmin()
    const { admin, project } = await loadProject(projectId)
    if (!project) return { ok: false, error: 'Progetto non trovato.' }
    const currentBuild = normalizeBuild(project.project_data?.build)
    const target = (currentBuild.assets || []).find(a => a.id === assetId)
    if (target) { try { await deleteAsset(target.url) } catch { /* best-effort */ } }
    const assets = (currentBuild.assets || []).filter(a => a.id !== assetId)
    await saveProjectData(admin, project, { build: { ...currentBuild, assets } })
    revalidatePath(`/lumino-admin/lab/${projectId}`)
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Errore eliminazione asset.' }
  }
}

/** Aggiorna i metadati di un asset (alt, category, tags). */
export async function updateAssetAction(
  projectId: string,
  assetId: string,
  updates: Partial<ProjectAsset>,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertSuperAdmin()
    const { admin, project } = await loadProject(projectId)
    if (!project) return { ok: false, error: 'Progetto non trovato.' }
    const currentBuild = normalizeBuild(project.project_data?.build)
    const assets = (currentBuild.assets || []).map(a =>
      a.id === assetId ? { ...a, ...updates, id: a.id, url: a.url } : a
    )
    await saveProjectData(admin, project, { build: { ...currentBuild, assets } })
    revalidatePath(`/lumino-admin/lab/${projectId}`)
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Errore aggiornamento asset.' }
  }
}

// ── Step 5 — Publish / Deploy (Layer 4) ───────────────────────

export interface PublishResult {
  ok: boolean
  url?: string
  testMode?: boolean
  customDomainStatus?: { nameservers?: string[]; error?: string }
  error?: string
}

/** Pubblica il sito: snapshot + export statico → Vercel (o local test mode se manca VERCEL_TOKEN). */
export async function publishProject(projectId: string, customDomain?: string): Promise<PublishResult> {
  try {
    await assertSuperAdmin()
    const { admin, project } = await loadProject(projectId)
    if (!project) return { ok: false, error: 'Progetto non trovato.' }

    const pdata = project.project_data || {}
    const build = normalizeBuild(pdata.build)
    if (!build.pages.some(p => p.sections.length > 0)) return { ok: false, error: 'Build vuota: genera prima il sito (Step 3).' }

    // Audit pre-publish (Layer 6): blocca se ci sono errori critici.
    const audit = auditProject(build, project)
    if (!audit.canPublish) {
      const crit = audit.checks.filter(c => c.severity === 'critical' && !c.passed).map(c => c.message)
      return { ok: false, error: `Audit: ${audit.criticalCount} errori critici da risolvere — ${crit.join('; ')}` }
    }

    // 1. Snapshot pre-publish (store primario in project_data + best-effort tabella).
    const snapshot = { id: randomUUID(), snapshot_data: { build }, reason: 'pre-publish', created_at: new Date().toISOString() }
    const snapshots = [...((pdata.snapshots as any[]) || []), snapshot].slice(-10)
    try { await admin.from('lab_project_snapshots').insert({ project_id: projectId, snapshot_data: snapshot.snapshot_data, reason: snapshot.reason }) } catch { /* tabella non ancora creata */ }

    // 2. Export statico.
    const files = await exportSiteToStatic(build, projectId)

    const token = process.env.VERCEL_TOKEN
    let url = ''
    let testMode = false
    let vercelProjectId = pdata.publish?.vercelProjectId as string | undefined
    let deploymentId: string | undefined
    let customDomainStatus: PublishResult['customDomainStatus']

    if (!token) {
      // 8. TEST MODE — scrivi i file in public/published/{projectId}/
      testMode = true
      const baseDir = path.join(process.cwd(), 'public', 'published', projectId)
      const { writeFile, mkdir, rm } = await import('fs/promises')
      await rm(baseDir, { recursive: true, force: true }).catch(() => {})
      for (const f of files) {
        const full = path.join(baseDir, f.path)
        await mkdir(path.dirname(full), { recursive: true })
        await writeFile(full, f.content)
      }
      url = `/published/${projectId}/index.html`
    } else {
      const config = { token, teamId: process.env.VERCEL_TEAM_ID || undefined }
      const slug = `${process.env.VERCEL_PROJECT_PREFIX || 'lumino-client'}-${projectId.slice(0, 8)}`
      const proj = await getOrCreateVercelProject(config, slug, vercelProjectId)
      vercelProjectId = proj.projectId
      const dep = await deploySite(config, slug, files)
      if (!dep.ok) return { ok: false, error: dep.error }
      url = dep.url || ''
      deploymentId = dep.deploymentId
      if (customDomain) {
        const dom = await addCustomDomain(config, vercelProjectId, customDomain)
        customDomainStatus = dom.ok ? { nameservers: dom.nameservers } : { error: dom.error }
      }
    }

    // 9. Salva stato pubblicazione.
    const publishedAt = new Date().toISOString()
    const publish = {
      url, vercelProjectId, deploymentId, publishedAt, testMode,
      customDomain: customDomain || pdata.publish?.customDomain,
      lastAudit: { score: audit.overallScore, warningCount: audit.warningCount, at: publishedAt },
      history: [...((pdata.publish?.history as any[]) || []), { url, deploymentId, at: publishedAt, testMode, auditScore: audit.overallScore }].slice(-10),
    }
    await saveProjectData(admin, project, { build, publish, snapshots })

    // best-effort: colonne dedicate (solo se migration 0019 applicata)
    try {
      await admin.from('lab_projects').update({
        published_url: url, vercel_project_id: vercelProjectId || null, vercel_deployment_id: deploymentId || null,
        published_at: publishedAt, custom_domain: customDomain || null,
      }).eq('id', projectId)
    } catch { /* colonne non presenti */ }
    // 10. avanza step 5 (update isolato per non dipendere dalle colonne nuove)
    try { await admin.from('lab_projects').update({ current_step: 5, status: 'in_costruzione' }).eq('id', projectId) } catch { /* noop */ }

    revalidatePath(`/lumino-admin/lab/${projectId}`)
    return { ok: true, url, testMode, customDomainStatus }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Errore pubblicazione.' }
  }
}

/** Ripristina un build da snapshot (crea uno snapshot pre-rollback per sicurezza). */
export async function rollbackToSnapshot(projectId: string, snapshotId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertSuperAdmin()
    const { admin, project } = await loadProject(projectId)
    if (!project) return { ok: false, error: 'Progetto non trovato.' }
    const pdata = project.project_data || {}
    const snaps = (pdata.snapshots as any[]) || []
    const snap = snaps.find(s => s.id === snapshotId)
    if (!snap) return { ok: false, error: 'Snapshot non trovato.' }

    const currentBuild = normalizeBuild(pdata.build)
    const pre = { id: randomUUID(), snapshot_data: { build: currentBuild }, reason: 'pre-rollback', created_at: new Date().toISOString() }
    const restored = normalizeBuild(snap.snapshot_data?.build)
    const snapshots = [...snaps, pre].slice(-10)
    await saveProjectData(admin, project, { build: restored, snapshots })
    revalidatePath(`/lumino-admin/lab/${projectId}`)
    revalidatePath(`/lab-preview/${projectId}`)
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Errore rollback.' }
  }
}

// ── Step 4.5 — Multi-lingua (Layer 4.5) ───────────────────────

/** Imposta le lingue attive del progetto (italiano sempre incluso come base). */
export async function setProjectLocales(projectId: string, locales: Locale[]): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertSuperAdmin()
    const { admin, project } = await loadProject(projectId)
    if (!project) return { ok: false, error: 'Progetto non trovato.' }
    const build = normalizeBuild(project.project_data?.build)
    const uniq = Array.from(new Set<Locale>(['it', ...locales]))
    await saveProjectData(admin, project, { build: { ...build, locales: uniq, defaultLocale: 'it' } })
    revalidatePath(`/lumino-admin/lab/${projectId}`)
    return { ok: true }
  } catch (e: any) { return { ok: false, error: e?.message || 'Errore.' } }
}

/** Traduce automaticamente tutte le sezioni nelle lingue target (Opus). */
export async function autoTranslateProject(projectId: string, targetLocales: Locale[]): Promise<{ ok: boolean; sectionsTranslated: number; error?: string }> {
  try {
    await assertSuperAdmin()
    const { admin, project } = await loadProject(projectId)
    if (!project) return { ok: false, sectionsTranslated: 0, error: 'Progetto non trovato.' }
    const build = normalizeBuild(project.project_data?.build)
    const targets = targetLocales.filter(l => l !== 'it')
    const ctx = `${project.business_name} (${project.business_type})`
    const { build: translatedBuild, translated } = await translateAllSections(build, targets, ctx)
    const locales = Array.from(new Set<Locale>(['it', ...(build.locales || ['it']), ...targets]))
    await saveProjectData(admin, project, { build: { ...translatedBuild, locales } })
    revalidatePath(`/lumino-admin/lab/${projectId}`)
    return { ok: true, sectionsTranslated: translated }
  } catch (e: any) { return { ok: false, sectionsTranslated: 0, error: e?.message || 'Errore traduzione.' } }
}

/** Salva manualmente la traduzione di UNA sezione per una lingua. */
export async function updateSectionTranslation(projectId: string, pageSlug: string, sectionIndex: number, locale: Locale, props: Record<string, any>): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertSuperAdmin()
    if (locale === 'it') return { ok: false, error: 'Italiano è la lingua base (modifica le props dirette).' }
    const { admin, project } = await loadProject(projectId)
    if (!project) return { ok: false, error: 'Progetto non trovato.' }
    const build = normalizeBuild(project.project_data?.build)
    const section = build.pages.find(p => p.slug === pageSlug)?.sections[sectionIndex]
    if (!section || section.type !== 'library') return { ok: false, error: 'Sezione non trovata.' }
    const loc = locale as Exclude<Locale, 'it'>
    section.translations = { ...(section.translations || {}), [loc]: { props } }
    await saveProjectData(admin, project, { build })
    revalidatePath(`/lumino-admin/lab/${projectId}`)
    return { ok: true }
  } catch (e: any) { return { ok: false, error: e?.message || 'Errore.' } }
}

/** Traduce UNA sezione da IT (per il bottone "Traduci da IT"). Ritorna le props tradotte. */
export async function translateOneSection(projectId: string, pageSlug: string, sectionIndex: number, locale: Locale): Promise<{ ok: boolean; props?: Record<string, any>; error?: string }> {
  try {
    await assertSuperAdmin()
    if (locale === 'it') return { ok: false, error: 'Niente da tradurre per la lingua base.' }
    const { admin, project } = await loadProject(projectId)
    if (!project) return { ok: false, error: 'Progetto non trovato.' }
    const build = normalizeBuild(project.project_data?.build)
    const section = build.pages.find(p => p.slug === pageSlug)?.sections[sectionIndex]
    if (!section || section.type !== 'library') return { ok: false, error: 'Sezione non trovata.' }
    const loc = locale as Exclude<Locale, 'it'>
    const props = await translateSectionProps({ sourceLocale: 'it', targetLocale: loc, props: section.props, componentName: section.component, context: `${project.business_name} (${project.business_type})`, tone: build.globalConfig.tone })
    section.translations = { ...(section.translations || {}), [loc]: { props } }
    await saveProjectData(admin, project, { build })
    revalidatePath(`/lumino-admin/lab/${projectId}`)
    return { ok: true, props }
  } catch (e: any) { return { ok: false, error: e?.message || 'Errore traduzione.' } }
}

// ── Step 6 — Subscription management (Layer 4.6, parte neutra) ──

const SUSPENDED_HTML = `<!DOCTYPE html><html lang="it"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Sito temporaneamente sospeso</title><style>body{font-family:system-ui,sans-serif;background:#0a0a0a;color:#fff;display:flex;min-height:100vh;align-items:center;justify-content:center;text-align:center;margin:0;padding:2rem}a{color:#c9a227}</style></head><body><div><h1>Sito temporaneamente sospeso</h1><p style="opacity:.7">Per riattivare il servizio contatta Lumino.</p><p><a href="mailto:bylumino06@gmail.com">bylumino06@gmail.com</a></p></div></body></html>`

async function nextInvoiceSeq(admin: SupabaseClient, year: number): Promise<number> {
  const { count } = await admin.from('lab_invoices').select('*', { count: 'exact', head: true }).like('invoice_number', `LMN-${year}-%`)
  return (count || 0) + 1
}

async function suspendSiteForProject(projectId: string): Promise<void> {
  try {
    const token = process.env.VERCEL_TOKEN
    if (!token) return
    const { project } = await loadProject(projectId)
    const pub = (project?.project_data as any)?.publish
    if (!pub?.vercelProjectId) return
    const config = { token, teamId: process.env.VERCEL_TEAM_ID || undefined }
    if (pub.customDomain) await removeCustomDomain(config, pub.vercelProjectId, pub.customDomain)
    const slug = `${process.env.VERCEL_PROJECT_PREFIX || 'lumino-client'}-${projectId.slice(0, 8)}`
    await deploySite(config, slug, [{ path: 'index.html', content: SUSPENDED_HTML, encoding: 'utf-8' }])
  } catch { /* best-effort */ }
}

async function reactivateSiteForProject(projectId: string): Promise<void> {
  try {
    const token = process.env.VERCEL_TOKEN
    if (!token) return
    const { project } = await loadProject(projectId)
    const pub = (project?.project_data as any)?.publish
    if (!pub?.vercelProjectId || !pub?.customDomain) return
    const config = { token, teamId: process.env.VERCEL_TEAM_ID || undefined }
    await addCustomDomain(config, pub.vercelProjectId, pub.customDomain)
    // TODO: redeploy del sito originale (republish) per ripristinare i contenuti.
  } catch { /* best-effort */ }
}

/** Crea l'abbonamento (manuale) + prima fattura setup e prima mensile. */
export async function createSubscription(
  projectId: string,
  input: { setupFee: number; monthlyAmount: number; billingDay?: number; notes?: string },
): Promise<{ ok: boolean; subscriptionId?: string; error?: string }> {
  try {
    await assertSuperAdmin()
    const admin = createAdminClient()
    const billingDay = input.billingDay && input.billingDay >= 1 && input.billingDay <= 28 ? input.billingDay : 1
    const next = calculateNextBilling(billingDay)
    const nextStr = next.toISOString().slice(0, 10)
    const today = new Date().toISOString().slice(0, 10)
    const { data: sub, error } = await admin.from('lab_subscriptions').insert({
      project_id: projectId, setup_fee_amount: input.setupFee, monthly_amount: input.monthlyAmount,
      billing_day: billingDay, status: 'active', next_billing_date: nextStr, provider: 'manual', notes: input.notes || null,
    }).select('id').single()
    if (error || !sub) return { ok: false, error: error?.message || 'Errore creazione abbonamento.' }

    const year = new Date().getFullYear()
    let seq = await nextInvoiceSeq(admin, year)
    if (input.setupFee && input.setupFee > 0) {
      await admin.from('lab_invoices').insert({ subscription_id: sub.id, project_id: projectId, invoice_number: generateInvoiceNumber(year, seq++), invoice_type: 'setup', amount: input.setupFee, status: 'pending', due_date: today })
    }
    await admin.from('lab_invoices').insert({ subscription_id: sub.id, project_id: projectId, invoice_number: generateInvoiceNumber(year, seq++), invoice_type: 'monthly', amount: input.monthlyAmount, status: 'pending', due_date: nextStr })

    revalidatePath(`/lumino-admin/lab/${projectId}`)
    revalidatePath('/lumino-admin/subscriptions')
    return { ok: true, subscriptionId: sub.id }
  } catch (e: any) { return { ok: false, error: e?.message || 'Errore.' } }
}

/** Marca una fattura come pagata (manuale) + riattiva abbonamento + genera prossima mensile. */
export async function markInvoicePaid(invoiceId: string, paymentMethod: PaymentMethod, paidAt?: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertSuperAdmin()
    const admin = createAdminClient()
    const paid = paidAt || new Date().toISOString()
    const { data: inv } = await admin.from('lab_invoices').select('*').eq('id', invoiceId).maybeSingle()
    if (!inv) return { ok: false, error: 'Fattura non trovata.' }
    await admin.from('lab_invoices').update({ status: 'paid', paid_at: paid, payment_method: paymentMethod }).eq('id', invoiceId)

    const { data: sub } = await admin.from('lab_subscriptions').select('*').eq('id', inv.subscription_id).maybeSingle()
    if (sub) {
      const patch: any = { last_paid_at: paid, updated_at: new Date().toISOString() }
      if (sub.status === 'past_due' || sub.status === 'suspended') patch.status = 'active'
      if (inv.invoice_type === 'setup') { patch.setup_fee_paid = true; patch.setup_paid_at = paid }
      await admin.from('lab_subscriptions').update(patch).eq('id', sub.id)
      if (sub.status === 'suspended') await reactivateSiteForProject(sub.project_id)
      if (inv.invoice_type === 'monthly') {
        const base = sub.next_billing_date ? new Date(new Date(sub.next_billing_date).getTime() + 86_400_000) : new Date()
        const next = calculateNextBilling(sub.billing_day, base)
        const year = new Date().getFullYear()
        const seq = await nextInvoiceSeq(admin, year)
        await admin.from('lab_invoices').insert({ subscription_id: sub.id, project_id: sub.project_id, invoice_number: generateInvoiceNumber(year, seq), invoice_type: 'monthly', amount: sub.monthly_amount, status: 'pending', due_date: next.toISOString().slice(0, 10) })
        await admin.from('lab_subscriptions').update({ next_billing_date: next.toISOString().slice(0, 10) }).eq('id', sub.id)
      }
    }
    revalidatePath('/lumino-admin/subscriptions')
    return { ok: true }
  } catch (e: any) { return { ok: false, error: e?.message || 'Errore.' } }
}

export async function suspendSubscription(subscriptionId: string, reason: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertSuperAdmin()
    const admin = createAdminClient()
    const { data: sub } = await admin.from('lab_subscriptions').select('project_id').eq('id', subscriptionId).maybeSingle()
    await admin.from('lab_subscriptions').update({ status: 'suspended', suspended_at: new Date().toISOString(), suspension_reason: reason, updated_at: new Date().toISOString() }).eq('id', subscriptionId)
    if (sub?.project_id) await suspendSiteForProject(sub.project_id)
    revalidatePath('/lumino-admin/subscriptions')
    return { ok: true }
  } catch (e: any) { return { ok: false, error: e?.message || 'Errore.' } }
}

export async function reactivateSubscription(subscriptionId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertSuperAdmin()
    const admin = createAdminClient()
    const { data: sub } = await admin.from('lab_subscriptions').select('project_id').eq('id', subscriptionId).maybeSingle()
    await admin.from('lab_subscriptions').update({ status: 'active', suspended_at: null, suspension_reason: null, updated_at: new Date().toISOString() }).eq('id', subscriptionId)
    if (sub?.project_id) await reactivateSiteForProject(sub.project_id)
    revalidatePath('/lumino-admin/subscriptions')
    return { ok: true }
  } catch (e: any) { return { ok: false, error: e?.message || 'Errore.' } }
}

export async function cancelSubscription(subscriptionId: string, reason: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertSuperAdmin()
    const admin = createAdminClient()
    await admin.from('lab_subscriptions').update({ status: 'canceled', suspension_reason: reason, updated_at: new Date().toISOString() }).eq('id', subscriptionId)
    revalidatePath('/lumino-admin/subscriptions')
    return { ok: true }
  } catch (e: any) { return { ok: false, error: e?.message || 'Errore.' } }
}

export async function updateSubscriptionAmount(subscriptionId: string, newMonthlyAmount: number): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertSuperAdmin()
    const admin = createAdminClient()
    await admin.from('lab_subscriptions').update({ monthly_amount: newMonthlyAmount, updated_at: new Date().toISOString() }).eq('id', subscriptionId)
    revalidatePath('/lumino-admin/subscriptions')
    return { ok: true }
  } catch (e: any) { return { ok: false, error: e?.message || 'Errore.' } }
}

export async function updateSubscriptionNotes(subscriptionId: string, notes: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertSuperAdmin()
    const admin = createAdminClient()
    await admin.from('lab_subscriptions').update({ notes, updated_at: new Date().toISOString() }).eq('id', subscriptionId)
    return { ok: true }
  } catch (e: any) { return { ok: false, error: e?.message || 'Errore.' } }
}

/** Carica subscription + fatture di un progetto per la UI admin. */
export async function getSubscriptionWithInvoices(projectId: string): Promise<{ subscription?: Subscription; invoices: Invoice[] }> {
  try {
    await assertSuperAdmin()
    const admin = createAdminClient()
    const { data: sub } = await admin.from('lab_subscriptions').select('*').eq('project_id', projectId).maybeSingle()
    const { data: inv } = await admin.from('lab_invoices').select('*').eq('project_id', projectId).order('created_at', { ascending: false })
    return { subscription: (sub as Subscription) || undefined, invoices: (inv || []) as Invoice[] }
  } catch { return { invoices: [] } }
}

/** Wrapper manuali per la dashboard (logica cron). */
export async function runOverdueCheck(): Promise<{ ok: boolean; notified: number; suspended: number }> {
  try { await assertSuperAdmin(); const r = await checkOverdueSubscriptions(); revalidatePath('/lumino-admin/subscriptions'); return { ok: true, ...r } }
  catch { return { ok: false, notified: 0, suspended: 0 } }
}
export async function runGenerateInvoices(): Promise<{ ok: boolean; generated: number }> {
  try { await assertSuperAdmin(); const r = await generateMonthlyInvoices(); revalidatePath('/lumino-admin/subscriptions'); return { ok: true, ...r } }
  catch { return { ok: false, generated: 0 } }
}

// ── Step 4.7 — Photo Import multi-fonte (hotel) ───────────────

export interface PhotoImportJob {
  id: string
  project_id: string
  status: string
  source_type?: string
  business_name?: string
  photos_found: number
  photos_imported: number
  photos_skipped: number
  error_message?: string
  created_at?: string
  completed_at?: string
}

/** Avvia l'import foto multi-fonte: scrape/Google → categorizza → carica in galleria. */
export async function startPhotoImport(
  projectId: string,
  input: { bookingUrl?: string; tripadvisorUrl?: string; websiteUrl?: string; useGooglePlaces?: boolean; maxPhotos?: number },
): Promise<{ ok: boolean; jobId?: string; result?: PhotoImportResult; assets?: ProjectAsset[]; error?: string }> {
  try {
    await assertSuperAdmin()
    const { admin, project } = await loadProject(projectId)
    if (!project) return { ok: false, error: 'Progetto non trovato.' }

    const sources: PhotoSource[] = []
    if (input.bookingUrl) sources.push({ name: 'booking', url: input.bookingUrl })
    if (input.tripadvisorUrl) sources.push({ name: 'tripadvisor', url: input.tripadvisorUrl })
    if (input.websiteUrl) sources.push({ name: 'website', url: input.websiteUrl })
    if (input.useGooglePlaces) sources.push({ name: 'google' })
    if (!sources.length) return { ok: false, error: 'Fornisci almeno una fonte (URL Booking/TripAdvisor/sito o Google Places).' }

    const pdata = project.project_data || {}
    const address = pdata.research?.info?.address as string | undefined

    const jobId = randomUUID()
    try {
      await admin.from('lab_photo_imports').insert({
        id: jobId, project_id: projectId, status: 'running', source_type: sources.map(s => s.name).join(','),
        business_name: project.business_name, business_address: address, started_at: new Date().toISOString(),
      })
    } catch { /* tabella 0021 non applicata */ }

    const { result, assets } = await importPhotosForProject({ projectId, businessName: project.business_name, businessAddress: address, sources, maxPhotos: input.maxPhotos })

    // Persisti gli asset nella galleria del progetto.
    const build = normalizeBuild(pdata.build)
    const merged = [...(build.assets || []), ...assets]
    await saveProjectData(admin, project, { build: { ...build, assets: merged } })

    const status = result.imported > 0 ? (result.errors.length ? 'partial' : 'completed') : (result.errors.length ? 'failed' : 'completed')
    try {
      await admin.from('lab_photo_imports').update({
        status, photos_found: result.found, photos_imported: result.imported, photos_skipped: result.skipped,
        error_message: result.errors.join('; ') || null, completed_at: new Date().toISOString(),
      }).eq('id', jobId)
    } catch { /* noop */ }

    revalidatePath(`/lumino-admin/lab/${projectId}`)
    return { ok: true, jobId, result, assets }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Errore import foto.' }
  }
}

export async function getPhotoImportStatus(jobId: string): Promise<PhotoImportJob | null> {
  try {
    await assertSuperAdmin()
    const admin = createAdminClient()
    const { data } = await admin.from('lab_photo_imports').select('*').eq('id', jobId).maybeSingle()
    return (data as PhotoImportJob) || null
  } catch { return null }
}

export async function getProjectPhotoImports(projectId: string): Promise<PhotoImportJob[]> {
  try {
    await assertSuperAdmin()
    const admin = createAdminClient()
    const { data } = await admin.from('lab_photo_imports').select('*').eq('project_id', projectId).order('created_at', { ascending: false })
    return (data || []) as PhotoImportJob[]
  } catch { return [] }
}

// ── Layer 5 — Accesso cliente (admin Lumino) ──────────────────

function portalLoginUrl(project: any): string {
  const pub = project?.project_data?.publish
  const cd = pub?.customDomain
  if (cd) return `https://${cd}/portal/login`
  if (typeof pub?.url === 'string' && pub.url.startsWith('http')) {
    try { return `${new URL(pub.url).origin}/portal/login` } catch { /* noop */ }
  }
  return '/portal/login'
}

/** Crea l'accesso cliente per un progetto e ritorna credenziali + login URL da inoltrare. */
export async function createClientAccessForProject(
  projectId: string,
  input: { email: string; fullName?: string },
): Promise<{ ok: boolean; temporaryPassword?: string; loginUrl?: string; error?: string }> {
  try {
    await assertSuperAdmin()
    const { project } = await loadProject(projectId)
    if (!project) return { ok: false, error: 'Progetto non trovato.' }
    const temporaryPassword = generateTempPassword(12)
    const r = await createClientUser({ projectId, email: input.email, password: temporaryPassword, fullName: input.fullName, role: 'owner' })
    if (!r.ok) return { ok: false, error: r.error || 'Errore creazione accesso.' }
    revalidatePath(`/lumino-admin/lab/${projectId}`)
    return { ok: true, temporaryPassword, loginUrl: portalLoginUrl(project) }
  } catch (e: any) { return { ok: false, error: e?.message || 'Errore.' } }
}

export async function resetClientPasswordAdmin(userId: string): Promise<{ ok: boolean; newPassword?: string; error?: string }> {
  try {
    await assertSuperAdmin()
    const newPassword = generateTempPassword(12)
    const r = await setClientPassword(userId, newPassword)
    return r.ok ? { ok: true, newPassword } : { ok: false, error: r.error }
  } catch (e: any) { return { ok: false, error: e?.message || 'Errore.' } }
}

export async function listClientUsers(projectId: string): Promise<ClientUser[]> {
  try {
    await assertSuperAdmin()
    const admin = createAdminClient()
    const { data } = await admin.from('lab_client_users').select('id, project_id, email, full_name, role, last_login_at').eq('project_id', projectId).order('created_at', { ascending: true })
    return (data || []) as ClientUser[]
  } catch { return [] }
}

export async function deleteClientUser(userId: string): Promise<{ ok: boolean }> {
  try {
    await assertSuperAdmin()
    const admin = createAdminClient()
    await admin.from('lab_client_users').delete().eq('id', userId)
    return { ok: true }
  } catch { return { ok: false } }
}

// ── Layer 6 — Audit pre-publish ───────────────────────────────

/** Esegue l'audit qualità del progetto (usato dall'UI dello Step 5). */
export async function runAuditForProject(projectId: string): Promise<AuditReport> {
  await assertSuperAdmin()
  const { project } = await loadProject(projectId)
  const build = normalizeBuild(project?.project_data?.build)
  return auditProject(build, project)
}

/** Step 4 — Editor. Salva editorState dentro project_data.build (no nuove colonne). */
export async function saveEditorState(
  projectId: string,
  editorState: EditorState,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertSuperAdmin()
    const { admin, project } = await loadProject(projectId)
    if (!project) return { ok: false, error: 'Progetto non trovato.' }
    const pdata = project.project_data || {}
    const currentBuild = pdata.build as SiteBuild | undefined
    if (!currentBuild) return { ok: false, error: 'Build mancante: genera prima lo Step 3.' }
    await saveProjectData(admin, project, { build: { ...currentBuild, editorState } })
    revalidatePath(`/lumino-admin/lab/${projectId}`)
    revalidatePath(`/lab-preview/${projectId}`)
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Errore nel salvataggio editor.' }
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
