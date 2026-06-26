import { getClaude } from '../ai/claude'
import { outreachConfig } from './config'
import { renderSubject } from './strategies'
import { appendTracking, generateToken } from './tracking'
import type { ComposeInput, EmailDraft, SenderVoice } from './types'

/**
 * Haiku for high-volume composition (200 emails/night).
 * Opus (CLAUDE_MODEL) is reserved for the weekly strategic learner.
 */
const COMPOSE_MODEL = 'claude-haiku-4-5-20251001'

/** Parole vietate: triggher classici dei filtri anti-spam o segnali "automation" */
const BANNED_WORDS = [
  'AI', 'agency', 'automatizzato', 'automatizzata',
  'intelligenza artificiale', 'automatico', 'automatica',
  'piattaforma', 'platform',
  'newsletter', // troppo "marketing", usiamo "comunicazione"
]

/**
 * 4 voci diverse, una per mittente. Ognuna ha:
 *  - greeting (saluto iniziale, uguale per tutti: "Buongiorno")
 *  - tone_hint (consegna a Claude)
 *  - sentence_style (frasi brevi / lunghe / domande)
 * I toni storici sono mantenuti, solo riassegnati ai nuovi nomi.
 */
const VOICES: Record<SenderVoice, { greeting: string; toneHint: string }> = {
  // Tono amichevole corto
  matteo: {
    greeting: 'Buongiorno',
    toneHint:
      'Voce: amichevole, frasi corte (max 12-14 parole), prima persona singolare. ' +
      'Usa "buongiorno" come saluto. Niente formalismi. Niente domande retoriche. ' +
      'Stile pratico, "ti scrivo perché", "ho dato un\'occhiata", "se ti va".',
  },
  // Tono professionale Lei
  francesca: {
    greeting: 'Buongiorno',
    toneHint:
      'Voce: professionale, sobria. Saluto "buongiorno". ' +
      'Frasi di media lunghezza (15-18 parole), terza persona del verbo (Lei). ' +
      'Niente trucchetti commerciali. Concedi al lettore di ignorarti senza colpa.',
  },
  // Tono caldo curioso con domanda
  davide: {
    greeting: 'Buongiorno',
    toneHint:
      'Voce: calda, curiosa. Saluto "buongiorno". Una domanda nel testo (genuina, non retorica). ' +
      'Es. "Avete mai pensato a...?". Tono empatico, mai pressante.',
  },
  // Tono diretto basato su dati
  sara: {
    greeting: 'Buongiorno',
    toneHint:
      'Voce: diretta, basata su dati. Saluto "buongiorno". ' +
      'Cita un numero verificato del ristorante (stelle, n. recensioni) per dimostrare ' +
      'che hai guardato davvero. Niente aggettivi vuoti. Concretezza.',
  },
}

/** Email del mittente per la firma, derivata dalla voce. */
const VOICE_EMAILS: Record<SenderVoice, string> = {
  matteo: 'matteo@bylumino.com',
  francesca: 'francesca@bylumino.com',
  davide: 'davide@bylumino.com',
  sara: 'sara@bylumino.com',
}

function nameToVoice(name?: string): SenderVoice {
  const n = (name || '').toLowerCase().trim()
  // Match sul nome di battesimo (sender_name nel DB è "Matteo Conti", ecc.)
  if (n.includes('matteo')) return 'matteo'
  if (n.includes('francesca')) return 'francesca'
  if (n.includes('davide')) return 'davide'
  if (n.includes('sara')) return 'sara'
  // Default round-robin sicuro
  return 'matteo'
}

const GUARDRAILS_BASE = `
Scrivi una cold email a un ristorante italiano. Sei un piccolo studio specializzato in siti per la ristorazione.

REGOLE — ogni regola vale sempre, senza eccezioni:
- Lingua: italiano. Mai parole inglesi.
- Lunghezza: ${outreachConfig.targetLines.min}-${outreachConfig.targetLines.max} righe di body. Tra 50 e 125 parole TOTALI.
- Tono: piano, umano, una persona che ne scrive a un'altra. Niente marketing, mai punti esclamativi, mai emoji, mai caps.
- Niente parole proibite: AI, agency, automatizzato, intelligenza artificiale, automatico, piattaforma.
- Mai inventare fatti, testimonianze, statistiche. Solo cio che ti e stato dato.
- NON includere subject, NON includere saluto iniziale, NON includere firma. Solo il corpo.
- Niente link "www." o "https://". Se devi citare il sito di Lumino scrivi solo "bylumino.com" nel testo (senza http).
- Niente paragrafi lunghi: max 2 righe per paragrafo. Linee vuote per separare.
`.trim()

export async function compose(input: ComposeInput): Promise<EmailDraft> {
  const { lead, strategy, step, priorSubject, senderName } = input
  const voiceKey = nameToVoice(senderName)
  const voice = VOICES[voiceKey]
  const displayName = senderName || 'Matteo Conti'
  const senderEmail = VOICE_EMAILS[voiceKey]

  // Subject: max 6 parole, niente emoji, niente caps, niente "!"
  const rawSubject =
    step === 'initial'
      ? renderSubject(strategy, { name: lead.name, city: lead.city })
      : (priorSubject ?? renderSubject(strategy, { name: lead.name, city: lead.city }))
  const subject = cleanSubject(rawSubject)

  const leadContext = [
    `Nome ristorante: ${lead.name}`,
    `Citta: ${lead.city ?? 'Italia'}`,
    lead.stars != null ? `Stelle Google: ${lead.stars}` : null,
    lead.reviews_count != null ? `Recensioni: ${lead.reviews_count}` : null,
  ].filter(Boolean).join('\n')

  const stepInstruction =
    step === 'initial'
      ? strategy.prompt_brief
      : step === 'followup_3'
        ? `Follow-up a 3 giorni. Il ristorante non ha risposto. Fai riferimento brevemente al fatto di aver scritto qualche giorno fa. Stesso angolo: ${strategy.angle_description}`
        : `Secondo e ultimo follow-up (7 giorni). Hai gia scritto due volte. Sii molto breve e senza pressione: offri di non scrivere piu se non sono interessati, ma lascia la porta aperta.`

  const claude = getClaude()
  const message = await claude.messages.create({
    model: COMPOSE_MODEL,
    max_tokens: 400,
    system: `${GUARDRAILS_BASE}\n\nVOCE DEL MITTENTE (${displayName}):\n${voice.toneHint}`,
    messages: [
      {
        role: 'user',
        content: `Dati lead:\n${leadContext}\n\nIstruzione:\n${stepInstruction}`,
      },
    ],
  })

  let body = message.content[0].type === 'text' ? message.content[0].text.trim() : ''

  // Post-processing humanization
  body = sanitizeBody(body)
  body = enforceWordLimit(body, 125)
  body = withGreetingAndSignature(body, voice.greeting, displayName, senderEmail)

  const token = generateToken()
  return {
    subject,
    body: appendTracking(body, token),
    strategyNumber: strategy.strategy_number,
    token,
  }
}

/* ─────────────────────  HELPERS  ───────────────────── */

function cleanSubject(s: string): string {
  let out = (s || '').trim()
  // No emoji (best-effort: rimuove caratteri non Latin/numerici/punteggiatura base)
  out = out.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
  // No esclamativi
  out = out.replace(/!+/g, '.')
  // No tutto maiuscolo
  if (out === out.toUpperCase()) out = out.toLowerCase()
  // Max 6 parole
  const words = out.split(/\s+/).filter(Boolean)
  if (words.length > 6) out = words.slice(0, 6).join(' ')
  // Capitalize prima lettera
  if (out.length > 0) out = out.charAt(0).toUpperCase() + out.slice(1)
  return out
}

function sanitizeBody(s: string): string {
  let out = s
  // Strip linguaggio proibito (sostituzioni neutre)
  for (const word of BANNED_WORDS) {
    const re = new RegExp(`\\b${escapeRegex(word)}\\b`, 'gi')
    out = out.replace(re, redactionFor(word))
  }
  // No URL completi
  out = out.replace(/https?:\/\/(?:www\.)?/gi, '')
  out = out.replace(/\bwww\./gi, '')
  // No multiple newlines
  out = out.replace(/\n{3,}/g, '\n\n')
  return out.trim()
}

function redactionFor(word: string): string {
  const map: Record<string, string> = {
    AI: 'studio',
    agency: 'studio',
    automatizzato: 'curato',
    automatizzata: 'curata',
    'intelligenza artificiale': 'attenzione',
    automatico: 'rapido',
    automatica: 'rapida',
    piattaforma: 'sistema',
    platform: 'sistema',
    newsletter: 'comunicazione',
  }
  return map[word.toLowerCase()] || map[word] || ''
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function enforceWordLimit(s: string, maxWords: number): string {
  const words = s.split(/\s+/)
  if (words.length <= maxWords) return s
  return words.slice(0, maxWords).join(' ') + '.'
}

function withGreetingAndSignature(
  body: string,
  greeting: string,
  name: string,
  email: string,
): string {
  const greetingLine = `${greeting},`
  // Firma standard, uguale per tutti i mittenti.
  const signature = [
    name,
    'Account — Team Commerciale',
    'Lumino · siti web per la ristorazione',
    `${email} · bylumino.com`,
  ].join('\n')
  return `${greetingLine}\n\n${body}\n\n${signature}`
}
