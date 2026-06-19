/**
 * Warm-up tick — chiamato da Vercel Cron una volta al giorno.
 *
 * Per ogni account 'warming':
 *   - warmup_day++
 *   - daily_cap aggiornato in base alla curva (5 → 10 → 20 → 30 → 50)
 *   - day 22+ → promote a 'active' (cap iniziale 20, +5/giorno fino a 50)
 *   - durante warming, invia email "cross-warm" agli ALTRI account interni
 *     (simulazione conversazione naturale, mai a prospect reali)
 *   - se delivery_rate < 0.85 → 'paused', alert
 *
 * Per ogni account 'paused':
 *   - se sono passate 48h da last_paused_at → torna 'warming' dallo stesso day
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { sendOutreachEmail, type OutreachAccount } from './smtpSender'

/** Daily cap in base al giorno di warmup. */
export function warmupCap(day: number): number {
  if (day <= 0) return 0
  if (day <= 3) return 5
  if (day <= 7) return 10
  if (day <= 14) return 20
  if (day <= 21) return 30
  return 50
}

/** Cap dopo la promotion ad active. */
export function activeCap(daysActive: number): number {
  // Start at 20, +5/day, cap at 50 after ~6 giorni active
  return Math.min(50, 20 + Math.max(0, daysActive) * 5)
}

const PAUSE_THRESHOLD_DELIVERY_RATE = 0.85
const PAUSE_RETRY_HOURS = 48

interface WarmupTickResult {
  promoted: string[]      // account email passati a 'active'
  paused: string[]        // account email auto-pausati
  resumed: string[]       // account email tornati 'warming' dopo cooldown
  emailsSent: number      // mail di cross-warm inviate in totale
}

export async function runWarmupTick(db: SupabaseClient): Promise<WarmupTickResult> {
  const { data: rawAccounts } = await db
    .from('outreach_accounts')
    .select('id, email, sender_name, smtp_host, smtp_port, smtp_user, smtp_password_encrypted, provider, status, daily_cap, warmup_day, delivery_rate, last_paused_at, active')
    .eq('active', true)

  const accounts = (rawAccounts || []) as Array<OutreachAccount & {
    status: string; daily_cap: number; warmup_day: number; delivery_rate: number | null; last_paused_at: string | null; active: boolean
  }>

  const promoted: string[] = []
  const paused: string[] = []
  const resumed: string[] = []
  let emailsSent = 0

  // 1. Resume paused dopo cooldown
  for (const a of accounts) {
    if (a.status === 'paused' && a.last_paused_at) {
      const hoursSince = (Date.now() - new Date(a.last_paused_at).getTime()) / 3_600_000
      if (hoursSince >= PAUSE_RETRY_HOURS) {
        await db.from('outreach_accounts').update({ status: 'warming' }).eq('id', a.id)
        a.status = 'warming'
        resumed.push(a.email)
      }
    }
  }

  // 2. Warming → check delivery, promote, send cross-warm
  for (const a of accounts) {
    if (a.status !== 'warming') continue

    // Auto-pause su delivery basso
    if (a.delivery_rate != null && a.delivery_rate < PAUSE_THRESHOLD_DELIVERY_RATE) {
      await db.from('outreach_accounts').update({
        status: 'paused',
        last_paused_at: new Date().toISOString(),
      }).eq('id', a.id)
      paused.push(a.email)
      continue
    }

    const nextDay = (a.warmup_day || 0) + 1
    let nextStatus = a.status
    let nextCap = warmupCap(nextDay)

    // Promotion al giorno 22+
    if (nextDay >= 22) {
      nextStatus = 'active'
      nextCap = activeCap(0)
      promoted.push(a.email)
    }

    await db.from('outreach_accounts').update({
      warmup_day: nextDay,
      daily_cap: nextCap,
      status: nextStatus,
    }).eq('id', a.id)

    // Invia 1-2 mail di cross-warm agli altri account (se config valida)
    if (a.smtp_password_encrypted && nextStatus === 'warming') {
      const peers = accounts.filter(x =>
        x.id !== a.id && x.email && x.email.endsWith('@bylumino.com')
      )
      const targetCount = Math.min(peers.length, 2)
      const targets = peers.slice(0, targetCount)
      for (const peer of targets) {
        const body = randomWarmupBody()
        try {
          await sendOutreachEmail({
            account: a,
            to: peer.email,
            subject: randomWarmupSubject(),
            body,
            unsubToken: `warmup-${a.id}-${Date.now()}`,
          })
          emailsSent++
        } catch {}
      }
    }
  }

  // 3. Active accounts: cap progressivo (start 20, +5/day fino a 50)
  for (const a of accounts) {
    if (a.status !== 'active') continue
    const daysActive = Math.max(0, (a.warmup_day - 22))
    const cap = activeCap(daysActive)
    if (cap !== a.daily_cap) {
      await db.from('outreach_accounts').update({
        warmup_day: a.warmup_day + 1,
        daily_cap: cap,
      }).eq('id', a.id)
    }
  }

  return { promoted, paused, resumed, emailsSent }
}

/* ───────────  Cross-warm content (varianti per non sembrare bot) ─────────── */

const WARMUP_SUBJECTS = [
  'rivediamo domani',
  'quella cosa di ieri',
  'la versione finale',
  'pronto a chiudere',
  'qualche commento',
  'tutto a posto',
  'pensavo a quel cliente',
  'ok per giovedi',
]
const WARMUP_BODIES = [
  'Ciao,\n\nperfetto cosi. Mi dici domani mattina?\n\nA presto',
  'Ciao,\n\nho rivisto il documento. Ci stiamo. Ti scrivo domani con i dettagli.\n\nA presto',
  'Buongiorno,\n\nci sentiamo questa settimana per chiudere. Va bene?\n\nGrazie',
  'Ciao,\n\nho parlato con loro. Tutto a posto.\n\nA presto',
  'Ciao,\n\nti mando il file aggiornato a breve. Niente di urgente.\n\nGrazie',
  'Buongiorno,\n\nconfermo per la prossima settimana. Ti ricontatto io.\n\nA presto',
]

function randomWarmupSubject(): string {
  return WARMUP_SUBJECTS[Math.floor(Math.random() * WARMUP_SUBJECTS.length)]
}
function randomWarmupBody(): string {
  return WARMUP_BODIES[Math.floor(Math.random() * WARMUP_BODIES.length)]
}
