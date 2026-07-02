/**
 * Traduzione contenuti (Layer 4.5) — SERVER ONLY. Opus traduce le props testuali
 * IT → EN/DE mantenendo struttura, URL, numeri, enum invariati.
 */

import 'server-only'
import { getClaude } from '@/lib/ai/claude'
import type { Locale, SiteBuild } from './builder'

const MODEL = 'claude-opus-4-7'

const TONE_HINTS: Record<string, string> = {
  modern: 'diretto, contemporaneo',
  classic: 'elegante, raffinato',
  editorial: 'narrativo, magazine-style',
  playful: 'informale, vibrante',
  professional: 'autorevole, business',
  friendly: 'caldo, accogliente',
}
const LOCALE_NAMES: Record<Locale, string> = { it: 'italiano', en: 'inglese', de: 'tedesco' }

// Chiavi i cui valori NON vanno tradotti (URL, enum, icone, identificatori, nomi propri).
const NON_TRANSLATABLE_KEYS = new Set([
  'src', 'href', 'url', 'icon', 'buttonIcon', 'layout', 'size', 'tone', 'palette',
  'platform', 'id', 'slug', 'name', 'formAction', 'mapsUrl', 'privacyUrl', 'bookingUrl',
  'animation', 'direction', 'category', 'color', 'colors', 'aspect',
])

function isTranslatableValue(v: unknown): v is string {
  if (typeof v !== 'string') return false
  const s = v.trim()
  if (s.length <= 2) return false
  if (/^https?:\/\//i.test(s) || s.startsWith('/')) return false
  if (/^#[0-9a-fA-F]{3,8}$/.test(s)) return false
  if (/^\d+([.,]\d+)?\s*\w{0,3}$/.test(s)) return false // numeri/prezzi semplici
  return true
}

type Leaf = { path: Array<string | number>; value: string }

function collectLeaves(node: any, path: Array<string | number>, out: Leaf[], parentKey?: string): void {
  if (Array.isArray(node)) {
    node.forEach((item, i) => collectLeaves(item, [...path, i], out, parentKey))
    return
  }
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) collectLeaves(v, [...path, k], out, k)
    return
  }
  if (typeof node === 'string' && !NON_TRANSLATABLE_KEYS.has(String(parentKey)) && isTranslatableValue(node)) {
    out.push({ path, value: node })
  }
}

function cloneDeep<T>(o: T): T { return JSON.parse(JSON.stringify(o)) as T }

function setAtPath(target: any, path: Array<string | number>, value: unknown): void {
  let cur = target
  for (let i = 0; i < path.length - 1; i++) cur = cur[path[i]]
  cur[path[path.length - 1]] = value
}

export interface TranslateSectionInput {
  sourceLocale: Locale
  targetLocale: Locale
  props: any
  componentName: string
  context?: string
  tone?: string
}

/** Traduce le sole stringhe traducibili di un oggetto props, preservando struttura/URL/numeri. */
export async function translateSectionProps(input: TranslateSectionInput): Promise<any> {
  const { targetLocale, props, componentName, context, tone } = input
  const leaves: Leaf[] = []
  collectLeaves(props, [], leaves)
  if (!leaves.length) return props

  const toneHint = TONE_HINTS[tone || 'modern'] || TONE_HINTS.modern
  const targetName = LOCALE_NAMES[targetLocale]
  const formality = targetLocale === 'de'
    ? 'Per il tedesco: usa "Du" (informale) per hospitality/ristorazione/retail; "Sie" (formale) per medico/legale/consulenza.'
    : ''

  const claude = getClaude()
  const msg = await claude.messages.create({
    model: MODEL,
    max_tokens: 4000,
    system:
      `Sei un traduttore professionista di marketing dall'italiano al ${targetName}. ` +
      `Mantieni un tono ${toneHint}. ${context ? `Contesto business: ${context}. ` : ''}${formality} ` +
      `Traduci SOLO i valori testuali, mantieni nomi propri e termini di marca. ` +
      `Rispondi ESCLUSIVAMENTE con un array JSON di stringhe tradotte, stessa lunghezza e stesso ordine dell'input, senza testo prima o dopo.`,
    messages: [
      { role: 'user', content: `Componente: ${componentName}\nTraduci questi ${leaves.length} testi in ${targetName} (array JSON, stesso ordine):\n${JSON.stringify(leaves.map(l => l.value), null, 2)}` },
    ],
  })

  const block = msg.content.find((b: any) => b.type === 'text')
  let text = block?.type === 'text' ? block.text.trim() : '[]'
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence) text = fence[1].trim()
  const s = text.indexOf('['); const e = text.lastIndexOf(']')
  if (s >= 0 && e > s) text = text.slice(s, e + 1)

  let translated: string[]
  try { translated = JSON.parse(text) } catch { return props }
  if (!Array.isArray(translated) || translated.length !== leaves.length) return props

  const result = cloneDeep(props)
  leaves.forEach((leaf, i) => { if (typeof translated[i] === 'string') setAtPath(result, leaf.path, translated[i]) })
  return result
}

/** Traduce tutte le sezioni library del build nelle lingue target. Skippa custom e già-tradotte. */
export async function translateAllSections(
  build: SiteBuild,
  targetLocales: Locale[],
  context?: string,
): Promise<{ build: SiteBuild; translated: number }> {
  const out = cloneDeep(build)
  const tone = out.globalConfig?.tone
  let translated = 0

  for (const page of out.pages) {
    for (const section of page.sections) {
      if (section.type !== 'library') continue
      for (const locale of targetLocales) {
        if (locale === 'it') continue
        const loc = locale as Exclude<Locale, 'it'>
        section.translations = section.translations || {}
        if (section.translations[loc]?.props) continue // già tradotta
        const props = await translateSectionProps({
          sourceLocale: 'it', targetLocale: loc, props: section.props,
          componentName: section.component, context, tone,
        })
        section.translations[loc] = { props }
        translated++
      }
    }
  }
  return { build: out, translated }
}
