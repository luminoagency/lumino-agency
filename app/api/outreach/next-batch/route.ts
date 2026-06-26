import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { compose } from '@/lib/outreach/compose'
import { getQueue } from '@/lib/outreach/queue'
import { releaseStaleClaims } from '@/lib/outreach/report'
import { getActiveStrategies, pickStrategy } from '@/lib/outreach/strategies'
import { sendOutreachEmail, type OutreachAccount } from '@/lib/outreach/smtpSender'
import { preflightCheck } from '@/lib/outreach/preflight'
import { FEATURE_FLAGS } from '@/lib/feature-flags'
import type { ClaimInsert } from '@/lib/outreach/types'

/**
 * Outreach send tick — chiamato da Vercel Cron (o /api/cron/outreach-tick).
 *
 * NIENTE Apps Script. Lumino tiene il controllo end-to-end:
 *  1. release stale claims (failed-mid-run nelle run precedenti)
 *  2. per ogni account status='active' con capacita rimanente:
 *      - prendi N lead dalla coda (initial + followup_3 + followup_7)
 *      - compose() con strategia round-robin e voce del sender_name
 *      - preflightCheck() (MX, disposable, suppression, recently_contacted)
 *      - claim (insert emails_sent status='sending')
 *      - sendOutreachEmail() via Zoho SMTP
 *      - update status='sent'/'failed' direttamente
 *
 * Auth: header `Authorization: Bearer ${CRON_SECRET}`.
 */
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

function isAuthorized(req: NextRequest): boolean {
  // Accetta sia OUTREACH_SECRET (legacy) sia CRON_SECRET (nuovo Vercel cron)
  const auth = req.headers.get('authorization') || ''
  const expected1 = process.env.OUTREACH_SECRET
  const expected2 = process.env.CRON_SECRET
  if (expected1 && auth === `Bearer ${expected1}`) return true
  if (expected2 && auth === `Bearer ${expected2}`) return true
  return false
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // PIANO B — finché le email pro non sono attive, l'outreach resta spento.
  if (!FEATURE_FLAGS.OUTREACH_ENABLED) {
    console.log('Outreach disabled — PIANO B not active')
    return NextResponse.json({ ok: true, sent: 0, reason: 'Outreach disabled — PIANO B not active' })
  }

  const db = createAdminClient()

  // MANUAL_SEND_MODE (warmup): genera le email ma NON le invia via SMTP.
  // Le salva con status 'ready_to_send' → finiscono nella coda /lumino-admin/outreach-queue.
  const manualMode = FEATURE_FLAGS.MANUAL_SEND_MODE

  // 1. Rilascia claim 'sending' vecchi (deploy crash mid-run)
  await releaseStaleClaims(db)

  // 2. Account selezionati.
  // In manual mode usiamo anche gli account warming: non c'è invio SMTP reale,
  // è solo generazione testuale via Claude API. Gli account passeranno ad 'active'
  // quando partirà l'invio automatico (MANUAL_SEND_MODE=false).
  const accountStatuses = manualMode ? ['active', 'warming'] : ['active']
  const { data: rawAccounts } = await db
    .from('outreach_accounts')
    .select('id, email, sender_name, smtp_host, smtp_port, smtp_user, smtp_password_encrypted, provider, daily_cap, name')
    .eq('active', true)
    .in('status', accountStatuses)

  const accounts = (rawAccounts || []) as Array<OutreachAccount & { daily_cap: number; name: string }>
  if (accounts.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, reason: 'no active accounts' })
  }

  const strategies = await getActiveStrategies(db)
  if (!strategies.length) {
    return NextResponse.json({ ok: true, sent: 0, reason: 'no strategies' })
  }

  const todayUtc = new Date().toISOString().slice(0, 10)
  let totalSent = 0
  let totalSkipped = 0
  let totalFailed = 0
  let totalGenerated = 0

  // Per ogni account: quanti slot rimanenti oggi → quanti lead prelevare
  for (const account of accounts) {
    const { count: sentToday } = await db
      .from('emails_sent')
      .select('id', { count: 'exact', head: true })
      .eq('account', account.name)
      .eq('status', 'sent')
      .gte('sent_at', `${todayUtc}T00:00:00Z`)
    const remaining = Math.max(0, (account.daily_cap || 0) - (sentToday || 0))
    if (remaining <= 0) continue

    const batchSize = Math.min(remaining, 25)
    const queue = await getQueue(db, batchSize)
    if (!queue.length) continue

    for (let i = 0; i < queue.length; i++) {
      const item = queue[i]
      const lead = item.lead

      // Preflight: skip lead se non sicuro
      const pf = await preflightCheck(db, lead)
      if (!pf.ok) {
        totalSkipped++
        continue
      }

      // Compose con voce del sender (sender_name passato a compose)
      const draft = await compose({
        lead,
        strategy: pickStrategy(strategies, i),
        step: item.step,
        priorSubject: item.priorSubject,
        senderName: account.sender_name || 'Lumino',
      } as any)

      // Claim — in manual mode entra in coda come 'ready_to_send' (niente SMTP).
      const claim: ClaimInsert = {
        restaurant_id: lead.id,
        strategy: draft.strategyNumber,
        subject: draft.subject,
        body: draft.body,
        account: account.name as any,
        step: item.step,
        status: manualMode ? 'ready_to_send' : 'sending',
        token: draft.token,
      }
      const { error: claimErr } = await db.from('emails_sent').insert(claim)
      if (claimErr) {
        totalSkipped++
        continue
      }

      // MANUAL_SEND_MODE: ci fermiamo qui. L'email resta in coda, la manda l'utente a mano.
      if (manualMode) {
        totalGenerated++
        continue
      }

      // Send via SMTP
      const r = await sendOutreachEmail({
        account,
        to: lead.email!,
        subject: draft.subject,
        body: draft.body,
        unsubToken: draft.token,
      })

      if (r.ok) {
        await db
          .from('emails_sent')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            gmail_message_id: r.messageId || null,
          })
          .eq('token', draft.token)
        totalSent++
      } else {
        await db
          .from('emails_sent')
          .update({ status: 'failed', error_message: (r.error || '').slice(0, 500) })
          .eq('token', draft.token)
        totalFailed++
      }
    }
  }

  if (manualMode) {
    console.log(`Generated ${totalGenerated} emails in manual mode, ready in queue`)
    return NextResponse.json({
      ok: true,
      mode: 'manual',
      generated: totalGenerated,
      skipped: totalSkipped,
      accountsProcessed: accounts.length,
    })
  }

  return NextResponse.json({
    ok: true,
    sent: totalSent,
    skipped: totalSkipped,
    failed: totalFailed,
    accountsProcessed: accounts.length,
  })
}
