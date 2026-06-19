/**
 * Outreach SMTP sender — invio reale via Zoho Mail.
 *
 * Sostituisce il vecchio modello "Apps Script preleva batch e invia da Gmail".
 * Adesso:
 *   - /api/cron/outreach-tick (o /next-batch invocato da Vercel Cron)
 *   - claim batch da emails_sent (status='sending')
 *   - per ogni lead chiama sendOutreachEmail()
 *   - aggiorna direttamente emails_sent.status='sent' o 'failed'
 *
 * Failure handling: ogni errore SMTP incrementa outreach_accounts.failure_count.
 * Se delivery_rate scende sotto 0.85 → auto-pause (warmup.ts).
 */

import nodemailer, { type Transporter } from 'nodemailer'
import { createAdminClient } from '@/lib/supabase/admin'
import { decryptPassword } from './crypto'

export interface OutreachAccount {
  id: string
  email: string
  sender_name: string | null
  smtp_host: string
  smtp_port: number
  smtp_user: string
  smtp_password_encrypted: string | null
  provider: 'zoho' | 'gmail'
}

export interface SendInput {
  account: OutreachAccount
  to: string
  subject: string
  body: string             // plain text only
  unsubToken: string       // sostituito in {token} dell'URL List-Unsubscribe
  replyToOverride?: string // di default = account.email
}

export interface SendResult {
  ok: boolean
  messageId?: string
  error?: string
}

const transportCache = new Map<string, Transporter>()

function getTransport(acc: OutreachAccount): Transporter {
  const cacheKey = `${acc.smtp_host}:${acc.smtp_port}:${acc.smtp_user}`
  const cached = transportCache.get(cacheKey)
  if (cached) return cached

  if (!acc.smtp_password_encrypted) {
    throw new Error(`[smtp] Account ${acc.email} senza password_encrypted impostata`)
  }
  const password = decryptPassword(acc.smtp_password_encrypted)

  const t = nodemailer.createTransport({
    host: acc.smtp_host,
    port: acc.smtp_port,
    secure: acc.smtp_port === 465,
    auth: { user: acc.smtp_user, pass: password },
    pool: true,
    maxConnections: 1,
    maxMessages: 100,
  })
  transportCache.set(cacheKey, t)
  return t
}

/**
 * Invia un'email outreach con headers anti-spam corretti.
 * Plain text only. Niente HTML, niente immagini, niente tracking pixel
 * (la deliverability viene PRIMA del tracking — il pixel torna in /api/t).
 */
export async function sendOutreachEmail(input: SendInput): Promise<SendResult> {
  const { account, to, subject, body, unsubToken, replyToOverride } = input
  try {
    const transport = getTransport(account)
    const fromName = account.sender_name || 'Lumino'
    const unsubUrl = `https://bylumino.com/api/unsub/${unsubToken}`

    const info = await transport.sendMail({
      from: `"${fromName}" <${account.email}>`,
      to,
      subject,
      text: body,
      replyTo: replyToOverride || account.email,
      headers: {
        'List-Unsubscribe': `<${unsubUrl}>, <mailto:unsubscribe@bylumino.com?subject=unsub-${unsubToken}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        'X-Mailer': 'Lumino Outreach',
        Precedence: 'bulk',
      },
    })

    // Reset failure counter on success
    await createAdminClient()
      .from('outreach_accounts')
      .update({ failure_count: 0 })
      .eq('id', account.id)

    return { ok: true, messageId: info.messageId }
  } catch (err: any) {
    const msg = err?.message || 'Unknown SMTP error'
    // Increment failure counter (alerts in /lumino-admin handled by warmup.ts)
    try {
      const admin = createAdminClient()
      const { data: cur } = await admin
        .from('outreach_accounts')
        .select('failure_count')
        .eq('id', account.id)
        .maybeSingle()
      const next = (cur?.failure_count || 0) + 1
      await admin.from('outreach_accounts').update({ failure_count: next }).eq('id', account.id)
    } catch {}
    return { ok: false, error: msg }
  }
}
