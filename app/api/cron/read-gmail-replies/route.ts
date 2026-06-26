/**
 * GET /api/cron/read-gmail-replies  (schedule: ogni 15 minuti)
 *
 * Legge le risposte dalla Gmail collegata (OAuth, sola lettura), le collega
 * ai cold outreach inviati, le classifica e prepara la risposta del bot —
 * che entra in coda (email_replies.reply_status='ready_to_send').
 *
 * Fail-soft: se la Gmail non è collegata o le credenziali mancano, esce 200
 * senza errori. Auth: header `Authorization: Bearer ${CRON_SECRET}`.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getClaude } from '@/lib/ai/claude'
import { encryptPassword, decryptPassword } from '@/lib/outreach/crypto'
import { fetchInboxMessages, refreshAccessToken, type InboxMessage } from '@/lib/integrations/gmail-oauth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const CLASSIFY_MODEL = 'claude-haiku-4-5-20251001'
type Classification = 'interested' | 'question' | 'not_interested' | 'out_of_target' | 'ambiguous'

function isAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get('authorization') || ''
  const secret = process.env.CRON_SECRET
  return !!secret && auth === `Bearer ${secret}`
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  // 1. Token Gmail (fail-soft se non collegata)
  const { data: tokenRow } = await admin
    .from('gmail_oauth_tokens')
    .select('id, account_email, access_token, refresh_token, expires_at, last_sync_at')
    .limit(1)
    .maybeSingle()
  if (!tokenRow?.access_token) {
    return NextResponse.json({ ok: true, reason: 'Gmail non collegata' })
  }

  // 2. Access token valido (refresh se scaduto)
  let accessToken: string
  try {
    accessToken = decryptPassword(tokenRow.access_token as string)
    const expired = !tokenRow.expires_at || Date.now() >= new Date(tokenRow.expires_at as string).getTime()
    if (expired && tokenRow.refresh_token) {
      const refreshed = await refreshAccessToken(decryptPassword(tokenRow.refresh_token as string))
      accessToken = refreshed.accessToken
      await admin
        .from('gmail_oauth_tokens')
        .update({
          access_token: encryptPassword(refreshed.accessToken),
          expires_at: refreshed.expiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tokenRow.id)
    }
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Token error' }, { status: 500 })
  }

  // 3. Messaggi nuovi
  let messages: InboxMessage[] = []
  try {
    messages = await fetchInboxMessages(accessToken, (tokenRow.last_sync_at as string) || null)
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Gmail fetch error' }, { status: 502 })
  }

  let matched = 0
  let processed = 0

  for (const msg of messages) {
    // Dedupe: già processato?
    const { data: existing } = await admin
      .from('email_replies')
      .select('id')
      .eq('gmail_message_id', msg.id)
      .maybeSingle()
    if (existing) continue

    // Collega alla cold email originale
    const original = await matchOriginal(admin, msg)
    if (!original) continue
    matched++

    // Marca il lead come "ha risposto"
    await admin
      .from('emails_sent')
      .update({ replied: true, replied_at: new Date().toISOString() })
      .eq('id', original.id)

    // Classifica + genera risposta (voce del mittente originale)
    const { classification, reply } = await classifyAndReply(msg, original)

    const notInterested = classification === 'not_interested'
    await admin.from('email_replies').insert({
      original_email_id: original.id,
      gmail_message_id: msg.id,
      from_email: msg.from,
      subject: msg.subject,
      body: msg.body,
      received_at: msg.receivedAt,
      classification,
      // not_interested → nessuna risposta, va in "blacklisted" senza azioni
      reply_generated: notInterested ? null : reply,
      reply_status: notInterested ? 'discarded' : 'ready_to_send',
    })
    processed++
  }

  // 4. Aggiorna last_sync_at
  await admin
    .from('gmail_oauth_tokens')
    .update({ last_sync_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', tokenRow.id)

  return NextResponse.json({ ok: true, fetched: messages.length, matched, processed })
}

// ── Helpers ──────────────────────────────────────────────────

interface OriginalEmail {
  id: string
  subject: string
  body: string
  account: string
}

/** Collega una risposta alla cold email originale via In-Reply-To/References o subject. */
async function matchOriginal(
  admin: ReturnType<typeof createAdminClient>,
  msg: InboxMessage,
): Promise<OriginalEmail | null> {
  // 1. Per Message-Id (se l'email originale è stata inviata via SMTP e ha gmail_message_id)
  const refs = `${msg.inReplyTo || ''} ${msg.references || ''}`
    .split(/\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
  if (refs.length) {
    const { data } = await admin
      .from('emails_sent')
      .select('id, subject, body, account')
      .in('gmail_message_id', refs)
      .limit(1)
    if (data && data[0]) return data[0] as OriginalEmail
  }

  // 2. Fallback per subject normalizzato (toglie "Re:", "Fwd:", ecc.)
  const normalized = msg.subject.replace(/^(\s*(re|r|fwd|fw|i)\s*:\s*)+/i, '').trim()
  if (normalized) {
    const { data } = await admin
      .from('emails_sent')
      .select('id, subject, body, account')
      .eq('subject', normalized)
      .in('status', ['sent', 'ready_to_send'])
      .limit(1)
    if (data && data[0]) return data[0] as OriginalEmail
  }

  return null
}

/** Classifica la risposta e genera la replica con la voce del mittente originale. */
async function classifyAndReply(
  msg: InboxMessage,
  original: OriginalEmail,
): Promise<{ classification: Classification; reply: string }> {
  try {
    const claude = getClaude()
    const system = [
      'Sei un assistente che gestisce le risposte alle email di un piccolo studio italiano di siti per la ristorazione.',
      `Il mittente originale si chiama ${original.account}: rispondi con la sua voce, in italiano, tono umano e breve.`,
      'Restituisci SOLO un oggetto JSON con due campi:',
      '- "classification": uno tra interested | question | not_interested | out_of_target | ambiguous',
      '- "reply": la risposta da inviare (vuota se classification è not_interested)',
    ].join('\n')
    const userMsg = [
      `EMAIL ORIGINALE (oggetto: ${original.subject}):`,
      original.body,
      '',
      'RISPOSTA RICEVUTA DAL LEAD:',
      msg.body,
    ].join('\n')

    const res = await claude.messages.create({
      model: CLASSIFY_MODEL,
      max_tokens: 600,
      system,
      messages: [{ role: 'user', content: userMsg }],
    })
    const text = res.content[0]?.type === 'text' ? res.content[0].text : ''
    const parsed = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1))
    const classification = normalizeClassification(parsed.classification)
    return { classification, reply: String(parsed.reply || '') }
  } catch {
    // Fail-soft: se Claude non risponde o il JSON è invalido, lascia ambiguous senza reply.
    return { classification: 'ambiguous', reply: '' }
  }
}

function normalizeClassification(v: unknown): Classification {
  const s = String(v || '').toLowerCase()
  const allowed: Classification[] = ['interested', 'question', 'not_interested', 'out_of_target', 'ambiguous']
  return (allowed.includes(s as Classification) ? s : 'ambiguous') as Classification
}
