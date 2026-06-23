/**
 * Step 2 — Layout. Genera proposte di layout ad-hoc con Claude Sonnet 4.6
 * a partire dal report dello Step 1. NON template fissi.
 */

import { getClaude } from '@/lib/ai/claude'
import type { ResearchReport } from './research'
import type { ChatMessage } from './research'

const SONNET = 'claude-sonnet-4-6'

/** Vocabolario chiuso di sezioni → così il mockup SVG è renderizzabile. */
export const ALLOWED_SECTIONS = [
  'hero', 'gallery', 'menu', 'about', 'services', 'reviews',
  'events', 'booking', 'contact', 'map', 'team', 'newsletter',
] as const
export type SectionKey = (typeof ALLOWED_SECTIONS)[number]

export type HeroStyle = 'fullbleed' | 'split' | 'centered' | 'minimal'

export interface LayoutProposal {
  name: string
  description: string
  why: string
  palette: string[]      // 3-5 hex
  sections: SectionKey[] // ordinate
  heroStyle: HeroStyle
}

function parseJson<T>(text: string): T | null {
  let t = text.trim()
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence) t = fence[1].trim()
  const start = t.search(/[[{]/)
  const lastArr = t.lastIndexOf(']')
  const lastObj = t.lastIndexOf('}')
  const end = Math.max(lastArr, lastObj)
  if (start >= 0 && end > start) t = t.slice(start, end + 1)
  try { return JSON.parse(t) as T } catch { return null }
}

function sanitizeHex(c: string): string | null {
  const m = String(c).trim().match(/^#?([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/)
  if (!m) return null
  return '#' + m[1].toLowerCase()
}

function sanitizeProposal(raw: any): LayoutProposal | null {
  if (!raw || typeof raw !== 'object') return null
  const name = String(raw.name || '').trim()
  if (!name) return null
  const palette = (Array.isArray(raw.palette) ? raw.palette : [])
    .map(sanitizeHex).filter(Boolean).slice(0, 5) as string[]
  const sections = (Array.isArray(raw.sections) ? raw.sections : [])
    .map((s: any) => String(s).toLowerCase().trim())
    .filter((s: string) => (ALLOWED_SECTIONS as readonly string[]).includes(s)) as SectionKey[]
  const heroStyles: HeroStyle[] = ['fullbleed', 'split', 'centered', 'minimal']
  const heroStyle: HeroStyle = heroStyles.includes(raw.heroStyle) ? raw.heroStyle : 'fullbleed'

  return {
    name,
    description: String(raw.description || '').trim(),
    why: String(raw.why || '').trim(),
    palette: palette.length >= 3 ? palette : ['#1a1a1a', '#e52d1d', '#f5f0e8', '#888888'],
    sections: sections.length > 0 ? (sections.includes('hero') ? sections : (['hero', ...sections] as SectionKey[])) : ['hero', 'gallery', 'about', 'contact'],
    heroStyle,
  }
}

function reportDigest(report: ResearchReport): string {
  return JSON.stringify({
    nome: report.info?.name,
    tipo: report.info?.type,
    descrizione: report.info?.description,
    tonoDiVoce: report.toneOfVoice,
    fotoDisponibili: report.photos?.length ?? 0,
    cosaManca: report.missing,
    competitorConSito: report.competitors?.filter(c => c.website).length ?? 0,
    competitorTotali: report.competitors?.length ?? 0,
  }, null, 2)
}

/** Genera 2-3 proposte di layout uniche per il business. */
export async function generateLayouts(report: ResearchReport): Promise<LayoutProposal[]> {
  const claude = getClaude()

  const msg = await claude.messages.create({
    model: SONNET,
    max_tokens: 2200,
    system:
      'Sei un art director che progetta siti per attività locali italiane. ' +
      'Proponi layout SU MISURA per il business specifico (non template generici): ' +
      'le scelte di struttura, sezioni e palette devono nascere dal tipo di attività, dal tono di voce e da cosa manca. ' +
      'Rispondi ESCLUSIVAMENTE con un array JSON valido, senza testo prima o dopo.',
    messages: [
      {
        role: 'user',
        content:
          `Report di ricerca del business:\n${reportDigest(report)}\n\n` +
          `Sezioni disponibili (usa SOLO queste chiavi): ${ALLOWED_SECTIONS.join(', ')}.\n` +
          `Stili hero disponibili: fullbleed, split, centered, minimal.\n\n` +
          'Genera 3 proposte di layout DIVERSE tra loro e su misura. JSON array, ogni elemento:\n' +
          '{\n' +
          '  "name": string (nome evocativo in italiano, es "Cinematico Caldo", "Mercato Luminoso"),\n' +
          '  "description": string (1 frase sintetica),\n' +
          '  "why": string (2-3 frasi sul PERCHÉ è adatto a QUESTO business specifico, citando tipo/tono/foto/cosa manca),\n' +
          '  "palette": string[] (3-5 colori HEX coerenti col tono; includi sfondo, accento, eventuale colore caldo),\n' +
          '  "sections": string[] (ordine reale delle sezioni della homepage; inizia da "hero"),\n' +
          '  "heroStyle": "fullbleed" | "split" | "centered" | "minimal"\n' +
          '}',
      },
    ],
  })

  const block = msg.content[0]
  const text = block.type === 'text' ? block.text : '[]'
  const parsed = parseJson<any[]>(text)
  if (!Array.isArray(parsed)) return []
  return parsed.map(sanitizeProposal).filter((x): x is LayoutProposal => !!x).slice(0, 3)
}

/** Chat a lato per modifiche/variazioni sul layout. */
export async function layoutChatTurn(
  businessName: string,
  report: ResearchReport,
  proposals: LayoutProposal[],
  messages: ChatMessage[],
): Promise<{ text: string }> {
  const claude = getClaude()
  const ctx = proposals.length
    ? `Proposte attuali: ${proposals.map(p => p.name).join(', ')}.`
    : 'Nessuna proposta ancora generata.'

  const msg = await claude.messages.create({
    model: SONNET,
    max_tokens: 500,
    system:
      `Sei l'art director di Lumino che discute il layout del sito di "${businessName}" (tipo: ${report.info?.type || '—'}, tono: ${report.toneOfVoice || '—'}). ` +
      `${ctx} Rispondi in italiano, conciso e concreto. Se l'utente chiede una variazione, descrivi a parole come cambieresti struttura/sezioni/palette. ` +
      'Suggerisci di premere "Rigenera proposte" se vuole nuove varianti complete.',
    messages: messages.map(m => ({ role: m.role, content: m.content })),
  })
  const block = msg.content[0]
  return { text: block.type === 'text' ? block.text.trim() : '' }
}
