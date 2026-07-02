/**
 * Layer WOW — motore DETERMINISTICO di effetti "wow" (nessuna chiamata LLM).
 *
 * Scopo: i siti generati pescavano sempre gli stessi 8-10 componenti "safe" e
 * risultavano statici. Qui aggiungiamo, in modo prevedibile e ripetibile, dei
 * layer overlay che NON richiedono refactor dei componenti né serializzazione di
 * children (approccio "overlay data-driven"):
 *
 *   1. UN cursore custom globale (position:fixed)         → build.wow.cursor
 *   2. UN background animato dietro l'hero di ogni pagina → page.effects.heroBackground
 *   3. UNA sezione showcase 3D sulla home (se ci sono ≥4 immagini) → particle-sphere
 *
 * NON gestiti qui (richiederebbero refactor dei componenti, fuori scope):
 *   - hover effects sulle card (star-border/tilted-card sono wrapper con children)
 *   - text-animation che sostituisce il titolo <h1> dell'hero
 *
 * Tutti i componenti usati sono SAFE, serializzabili (solo props primitive) e
 * hanno già un loader in render.tsx. Il motore è idempotente: ripetibile ad ogni
 * salvataggio senza accumulare sezioni o effetti duplicati.
 */

import type { SiteBuild, SitePage, SiteSection, WowConfig, WowLayer, PageEffects, Tone } from './builder'
import { isHotelBusinessType } from './builder'

export const WOW_SHOWCASE_KEY = 'wow-showcase'

/** Cursori disponibili (tutti con loader + props primitive). */
const CURSORS = {
  subtle: 'cursors/ghost-cursor',
  soft: 'cursors/blob-cursor',
  bold: 'cursors/target-cursor',
} as const

/** Background animati (decorativi, absolute inset-0 → nidificati dietro l'hero). */
const BACKGROUNDS = {
  aurora: 'backgrounds/aurora',
  rings: 'backgrounds/magic-rings',
  laser: 'backgrounds/laser-flow',
  subtle: 'backgrounds/gradual-blur',
} as const

/**
 * Mappa tono → preset di effetti. Tono "elegante" (classic/editorial, tipico
 * degli hotel di charme) = effetti sobri; tono audace = più marcati.
 */
function presetForTone(tone: Tone | undefined): { cursor: string; background: string; bgProps: Record<string, unknown> } {
  switch (tone) {
    case 'classic':
    case 'editorial':
      return { cursor: CURSORS.subtle, background: BACKGROUNDS.aurora, bgProps: { intensity: 0.35 } }
    case 'playful':
      return { cursor: CURSORS.bold, background: BACKGROUNDS.rings, bgProps: { ringsCount: 5, speed: 8 } }
    case 'professional':
    case 'friendly':
      return { cursor: CURSORS.subtle, background: BACKGROUNDS.subtle, bgProps: { direction: 'bottom', intensity: 1 } }
    case 'modern':
    default:
      return { cursor: CURSORS.soft, background: BACKGROUNDS.aurora, bgProps: { intensity: 0.5 } }
  }
}

/** True se l'hero ha già un background animato interno → non ne aggiungiamo un altro. */
function heroHasBuiltinBackground(component: string): boolean {
  // aurora-hero (aurora), pixel-hero (canvas pixel), aether-hero (shader WebGL)
  return /hero\/(aurora-hero|pixel-hero|aether-hero)$/.test(component)
}

/** Indice della prima sezione hero di una pagina (o -1). */
function heroIndex(page: SitePage): number {
  const byHero = page.sections.findIndex(s => s.type === 'library' && s.component.startsWith('hero/'))
  if (byHero >= 0) return byHero
  // fallback: prima sezione libreria
  return page.sections.findIndex(s => s.type === 'library')
}

/** Raccoglie URL immagini uniche dalle sezioni + assets (per lo showcase 3D). */
function collectImages(build: SiteBuild, max = 8): Array<{ src: string; alt: string }> {
  const out: Array<{ src: string; alt: string }> = []
  const seen = new Set<string>()
  const push = (src: unknown, alt: unknown) => {
    if (typeof src === 'string' && src && !seen.has(src)) { seen.add(src); out.push({ src, alt: typeof alt === 'string' ? alt : '' }) }
  }
  const scanArray = (arr: unknown) => {
    if (!Array.isArray(arr)) return
    for (const it of arr) {
      if (it && typeof it === 'object' && 'src' in (it as any)) push((it as any).src, (it as any).alt)
    }
  }
  for (const page of build.pages) {
    for (const s of page.sections) {
      if (s.type !== 'library' || Array.isArray(s.props)) continue
      const p = s.props as Record<string, unknown>
      for (const key of ['images', 'gallery', 'photos', 'logos']) scanArray(p[key])
      if (p.image && typeof p.image === 'object' && 'src' in (p.image as any)) push((p.image as any).src, (p.image as any).alt)
    }
  }
  for (const a of build.assets || []) push(a.url, a.alt)
  return out.slice(0, max)
}

/** Rimuove ogni traccia di effetti wow (cursore, background hero, sezione showcase). */
function stripWow(build: SiteBuild): SiteBuild {
  return {
    ...build,
    wow: { enabled: false },
    pages: build.pages.map(p => {
      const { effects, ...rest } = p
      return { ...rest, sections: p.sections.filter(s => s.sectionKey !== WOW_SHOWCASE_KEY) }
    }),
  }
}

/**
 * Applica gli effetti wow deterministici a una build.
 *
 * @param build         build assemblata (già con footer hotel ecc.)
 * @param businessType  tipo di business (per il default abilitazione)
 * @returns             nuova build con build.wow, page.effects e showcase.
 *
 * L'abilitazione segue build.wow.enabled se presente; altrimenti default:
 * ON per hotel/strutture ricettive, OFF per gli altri (per ora).
 */
export function computeWowForBuild(build: SiteBuild, businessType?: string): SiteBuild {
  const enabled = build.wow?.enabled ?? isHotelBusinessType(businessType)

  // Parto sempre da una build "pulita" → idempotenza (niente duplicati ad ogni save).
  const clean = stripWow(build)
  if (!enabled) return clean

  const tone = clean.globalConfig.tone
  const accent = clean.globalConfig.palette?.accent
  const preset = presetForTone(tone)

  // 1) Cursore globale (sito)
  const cursor: WowLayer = { component: preset.cursor, props: accent ? { color: accent } : {} }
  const wow: WowConfig = { enabled: true, cursor }

  // 2) Background hero per ogni pagina (solo se l'hero non ne ha già uno interno)
  const pages: SitePage[] = clean.pages.map(page => {
    const hi = heroIndex(page)
    if (hi < 0) return page
    const heroSec = page.sections[hi]
    if (heroSec.type !== 'library' || heroHasBuiltinBackground(heroSec.component)) return page
    const heroBackground: WowLayer = { component: preset.background, props: { ...(accent ? { color: accent } : {}), ...preset.bgProps } }
    const effects: PageEffects = { ...(page.effects || {}), heroBackground }
    return { ...page, effects }
  })

  // 3) Showcase 3D sulla home (particle-sphere) — solo se abbiamo ≥4 immagini
  const images = collectImages(clean, 8)
  if (images.length >= 4) {
    const homeIdx = pages.findIndex(p => p.isHomepage) >= 0 ? pages.findIndex(p => p.isHomepage) : 0
    const home = pages[homeIdx]
    const showcase: SiteSection = {
      type: 'library',
      sectionKey: WOW_SHOWCASE_KEY,
      component: 'premium-3d/particle-sphere',
      props: {
        title: 'La nostra struttura',
        images,
        autoRotate: true,
        size: 'normal',
        tone: tone || 'modern',
        palette: clean.globalConfig.palette,
      },
    }
    // Inserisco prima del footer se presente, altrimenti in coda.
    const footerAt = home.sections.findIndex(s => s.type === 'library' && s.component.startsWith('footer/'))
    const at = footerAt >= 0 ? footerAt : home.sections.length
    const sections = [...home.sections.slice(0, at), showcase, ...home.sections.slice(at)]
    pages[homeIdx] = { ...home, sections }
  }

  return { ...clean, wow, pages }
}
