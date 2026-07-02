/**
 * Step 1 Research — analisi e chat con Claude Sonnet 4.6.
 * Produce il report strutturato salvato in project_data.research.
 */

import { getClaude } from '@/lib/ai/claude'
import type { Competitor, LabPlace } from './places'

const MODEL = 'claude-opus-4-7'

export interface ResearchInfo {
  name: string
  type: string
  description: string
  address?: string
  phone?: string
  email?: string
  website?: string
  hours?: string
}

export interface ResearchReport {
  mode: 'url' | 'description'
  sourceUrl?: string
  info: ResearchInfo
  photos: string[]
  toneOfVoice: string
  missing: string[]
  competitors: Competitor[]
  generatedAt: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

/** Estrae JSON robusto da una risposta del modello (rimuove fence ```json). */
function parseJson<T>(text: string): T | null {
  let t = text.trim()
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence) t = fence[1].trim()
  const start = t.indexOf('{')
  const end = t.lastIndexOf('}')
  if (start >= 0 && end > start) t = t.slice(start, end + 1)
  try {
    return JSON.parse(t) as T
  } catch {
    return null
  }
}

export interface ExtractInput {
  businessName: string
  businessType: string
  /** markdown scrapato (mode url) oppure trascrizione chat (mode description) */
  source: string
  place?: LabPlace | null
}

export interface ExtractOutput {
  info: ResearchInfo
  toneOfVoice: string
  missing: string[]
}

/** Analizza il materiale (scrape o chat) → info strutturate + tono + cosa manca. */
export async function extractResearch(input: ExtractInput): Promise<ExtractOutput> {
  const claude = getClaude()

  const placeBlock = input.place
    ? `\n\nDati Google My Business (autorevoli, usali per indirizzo/telefono/orari/sito):\n${JSON.stringify(
        {
          name: input.place.name,
          address: input.place.address,
          phone: input.place.phone,
          website: input.place.website,
          rating: input.place.rating,
          reviewsCount: input.place.reviewsCount,
          hours: input.place.hours,
        },
        null,
        2,
      )}`
    : ''

  const msg = await claude.messages.create({
    model: MODEL,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'medium' },
    max_tokens: 1600,
    system:
      'Sei un analista che prepara la ricerca per costruire il sito di un business locale italiano. ' +
      'Estrai SOLO informazioni presenti nel materiale fornito; non inventare. ' +
      'Rispondi ESCLUSIVAMENTE con un oggetto JSON valido, senza testo prima o dopo.',
    messages: [
      {
        role: 'user',
        content:
          `Business: "${input.businessName}" (tipo: ${input.businessType}).${placeBlock}\n\n` +
          `Materiale:\n"""\n${input.source.slice(0, 11000)}\n"""\n\n` +
          'Produci questo JSON:\n' +
          '{\n' +
          '  "info": {\n' +
          '    "name": string, "type": string, "description": string (2-4 frasi sul business),\n' +
          '    "address": string|null, "phone": string|null, "email": string|null,\n' +
          '    "website": string|null, "hours": string|null (orari in forma leggibile)\n' +
          '  },\n' +
          '  "toneOfVoice": string (es: "elegante e accogliente", "giovane e diretto"),\n' +
          '  "missing": string[] (cosa manca per un buon sito: es "nessun menu digitale", "niente prenotazioni online", "foto di bassa qualità", "nessuna sezione chi siamo")\n' +
          '}',
      },
    ],
  })

  const block = msg.content.find(b => b.type === 'text')
  const text = block?.type === 'text' ? block.text : '{}'
  const parsed = parseJson<ExtractOutput>(text)

  if (!parsed || !parsed.info) {
    return {
      info: {
        name: input.businessName,
        type: input.businessType,
        description: input.place?.address ? `Business a ${input.place.address}.` : '',
        address: input.place?.address,
        phone: input.place?.phone,
        website: input.place?.website,
        hours: input.place?.hours?.join(' · '),
      },
      toneOfVoice: '—',
      missing: ['Analisi AI non disponibile, ricontrolla i dati manualmente.'],
    }
  }

  // Fallback ai dati Places per i campi mancanti.
  const p = input.place
  parsed.info.address = parsed.info.address || p?.address
  parsed.info.phone = parsed.info.phone || p?.phone
  parsed.info.website = parsed.info.website || p?.website
  parsed.info.hours = parsed.info.hours || p?.hours?.join(' · ')
  parsed.info.name = parsed.info.name || input.businessName
  parsed.info.type = parsed.info.type || input.businessType
  parsed.missing = Array.isArray(parsed.missing) ? parsed.missing : []
  parsed.toneOfVoice = parsed.toneOfVoice || '—'
  return parsed
}

const READY_MARKER = '[PRONTO]'

/** Un turno di chat (Modalità B). Ritorna il testo + se l'AI ritiene di avere abbastanza info. */
export async function chatTurn(
  businessName: string,
  businessType: string,
  messages: ChatMessage[],
): Promise<{ text: string; ready: boolean }> {
  const claude = getClaude()

  const msg = await claude.messages.create({
    model: MODEL,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'medium' },
    max_tokens: 500,
    system:
      `Sei l'assistente di ricerca di Lumino. Stai raccogliendo le informazioni per costruire il sito di "${businessName}" (tipo: ${businessType}). ` +
      'Fai UNA domanda mirata alla volta, in italiano, tono amichevole e conciso. ' +
      'Devi raccogliere: descrizione/servizi offerti, atmosfera e tono desiderato, disponibilità di logo e foto, contatti e orari. ' +
      `Quando hai abbastanza per tutti questi punti, scrivi un breve riepilogo e termina il messaggio con una riga che contiene SOLO "${READY_MARKER}". ` +
      'Non usare quel marcatore finché non sei davvero pronto.',
    messages: messages.map(m => ({ role: m.role, content: m.content })),
  })

  const block = msg.content.find(b => b.type === 'text')
  let text = block?.type === 'text' ? block.text : ''
  const ready = text.includes(READY_MARKER)
  text = text.replace(READY_MARKER, '').trim()
  return { text, ready }
}
