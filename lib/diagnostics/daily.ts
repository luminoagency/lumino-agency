import { createAdminClient } from '@/lib/supabase/admin'

function todayUTC(): string {
  const d = new Date()
  return `${d.toISOString().slice(0, 10)}T00:00:00.000Z`
}

function sinceMs(ms: number): string {
  return new Date(Date.now() - ms).toISOString()
}

// ── Types ─────────────────────────────────────────────────────

export interface EmailMetrics {
  sent_today: number
  sent_target: number
  opened_today: number
  opened_rate: number
  replied_today: number
  replied_rate: number
  estimated_spam: number
}

export interface StrategyPerformance {
  strategy_slot: number
  strategy_name: string
  sends_today: number
  opens_today: number
  replies_today: number
  status: 'performing' | 'underperforming' | 'paused'
}

export interface WhatsAppMetrics {
  active_conversations: number
  stages_breakdown: Record<string, number>
  form_links_sent_today: number
  avg_response_time: number
}

export interface Anomaly {
  severity: 'info' | 'warning' | 'critical'
  type: string
  message: string
  suggestion: string
}

export interface Win {
  label: string
  value: string
}

// ── Helpers ───────────────────────────────────────────────────

/** The AccountName stored in emails_sent for a given outreach_accounts row. */
function accountKey(acc: { sender_name: string | null; name?: string | null }): string {
  return (acc.sender_name ?? acc.name ?? '').toLowerCase()
}

// ── Functions ─────────────────────────────────────────────────

export async function getEmailMetricsToday(): Promise<EmailMetrics> {
  const admin = createAdminClient()
  const today = todayUTC()

  const { data: accts } = await admin
    .from('outreach_accounts')
    .select('daily_cap, status')
    .in('status', ['warming', 'active'])
  const sent_target = (accts ?? []).reduce((s, a) => s + (a.daily_cap ?? 0), 0)

  const [
    { count: sent_today },
    { count: opened_today },
    { count: replied_today },
  ] = await Promise.all([
    admin.from('emails_sent').select('id', { count: 'exact', head: true })
      .gte('sent_at', today).eq('status', 'sent'),
    admin.from('emails_sent').select('id', { count: 'exact', head: true })
      .gte('opened_at', today),
    admin.from('emails_sent').select('id', { count: 'exact', head: true })
      .gte('replied_at', today),
  ])

  const s = sent_today ?? 0
  const o = opened_today ?? 0
  const r = replied_today ?? 0

  return {
    sent_today: s,
    sent_target,
    opened_today: o,
    opened_rate: s > 0 ? Math.round((o / s) * 1000) / 1000 : 0,
    replied_today: r,
    replied_rate: s > 0 ? Math.round((r / s) * 1000) / 1000 : 0,
    estimated_spam: Math.max(0, s - o * 3),
  }
}

export async function getStrategyPerformanceToday(): Promise<StrategyPerformance[]> {
  const admin = createAdminClient()
  const today = todayUTC()
  const week7 = sinceMs(7 * 24 * 60 * 60 * 1000)

  const { data: strategies } = await admin
    .from('email_strategies')
    .select('strategy_number, angle_description')
    .eq('active', true)
    .order('strategy_number')

  return Promise.all((strategies ?? []).map(async (strat) => {
    const n = strat.strategy_number

    const [
      { count: sends_today },
      { count: opens_today },
      { count: replies_today },
      { count: sends7d },
      { count: replies7d },
    ] = await Promise.all([
      admin.from('emails_sent').select('id', { count: 'exact', head: true })
        .eq('strategy', n).gte('sent_at', today).eq('status', 'sent'),
      admin.from('emails_sent').select('id', { count: 'exact', head: true })
        .eq('strategy', n).gte('opened_at', today),
      admin.from('emails_sent').select('id', { count: 'exact', head: true })
        .eq('strategy', n).gte('replied_at', today),
      admin.from('emails_sent').select('id', { count: 'exact', head: true })
        .eq('strategy', n).gte('sent_at', week7).eq('status', 'sent'),
      admin.from('emails_sent').select('id', { count: 'exact', head: true })
        .eq('strategy', n).gte('replied_at', week7),
    ])

    const underperforming = (sends7d ?? 0) >= 30 && (replies7d ?? 0) === 0

    return {
      strategy_slot: n,
      strategy_name: strat.angle_description,
      sends_today: sends_today ?? 0,
      opens_today: opens_today ?? 0,
      replies_today: replies_today ?? 0,
      status: (underperforming ? 'underperforming' : 'performing') as StrategyPerformance['status'],
    }
  }))
}

export async function getWhatsAppMetricsToday(): Promise<WhatsAppMetrics> {
  const admin = createAdminClient()
  const today = todayUTC()
  const h24 = sinceMs(24 * 60 * 60 * 1000)

  const [
    { count: active_conversations },
    { data: convs },
    { count: form_links_sent_today },
    { data: msgs },
  ] = await Promise.all([
    admin.from('whatsapp_conversations')
      .select('id', { count: 'exact', head: true })
      .gte('updated_at', h24),
    admin.from('whatsapp_conversations')
      .select('stage')
      .gte('updated_at', h24),
    admin.from('whatsapp_messages')
      .select('id', { count: 'exact', head: true })
      .eq('direction', 'outbound')
      .ilike('body', '%bylumino.com/register%')
      .gte('sent_at', today),
    admin.from('whatsapp_messages')
      .select('conversation_id, direction, sent_at')
      .gte('sent_at', h24)
      .order('conversation_id')
      .order('sent_at'),
  ])

  const stages_breakdown: Record<string, number> = {}
  for (const c of convs ?? []) {
    stages_breakdown[c.stage] = (stages_breakdown[c.stage] ?? 0) + 1
  }

  // Avg response time: time from each inbound → next outbound message
  const byConv: Record<string, Array<{ direction: string; sent_at: string }>> = {}
  for (const m of msgs ?? []) {
    if (!byConv[m.conversation_id]) byConv[m.conversation_id] = []
    byConv[m.conversation_id].push(m)
  }

  const responseTimes: number[] = []
  for (const convMsgs of Object.values(byConv)) {
    for (let i = 0; i < convMsgs.length - 1; i++) {
      if (convMsgs[i].direction === 'inbound' && convMsgs[i + 1].direction === 'outbound') {
        const diff = new Date(convMsgs[i + 1].sent_at).getTime() - new Date(convMsgs[i].sent_at).getTime()
        if (diff > 0 && diff < 3_600_000) responseTimes.push(diff / 1000)
      }
    }
  }

  const avg_response_time =
    responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0

  return {
    active_conversations: active_conversations ?? 0,
    stages_breakdown,
    form_links_sent_today: form_links_sent_today ?? 0,
    avg_response_time,
  }
}

export async function getAnomalies(precomputedWaResponseTime?: number): Promise<Anomaly[]> {
  const admin = createAdminClient()
  const anomalies: Anomaly[] = []
  const h24 = sinceMs(24 * 60 * 60 * 1000)
  const week7ago = sinceMs(7 * 24 * 60 * 60 * 1000)

  // 1. Active accounts with 0 replies on last 50 sends
  const { data: activeAccounts } = await admin
    .from('outreach_accounts')
    .select('id, email, sender_name, status')
    .eq('status', 'active')

  await Promise.all((activeAccounts ?? []).map(async (acc) => {
    const key = accountKey(acc)
    const displayName = acc.sender_name || acc.email
    if (!key) return

    const { data: last50 } = await admin
      .from('emails_sent')
      .select('replied_at')
      .eq('account', key)
      .eq('status', 'sent')
      .order('sent_at', { ascending: false })
      .limit(50)

    if (last50 && last50.length >= 50 && last50.every(e => !e.replied_at)) {
      anomalies.push({
        severity: 'warning',
        type: 'low_response',
        message: `Account ${displayName}: 0 risposte ultime 50 mail`,
        suggestion: 'Possibile spam folder, controlla warm-up',
      })
    }
  }))

  // 2. Scraper returned 0 new leads in any region in last 24h
  const { data: recentRuns } = await admin
    .from('scrape_runs')
    .select('city, new_restaurants')
    .gte('started_at', h24)
    .in('status', ['success', 'partial'])

  for (const run of recentRuns ?? []) {
    if ((run.new_restaurants ?? 0) === 0 && run.city) {
      anomalies.push({
        severity: 'info',
        type: 'scraper_exhausted',
        message: `Zero nuovi lead in zona ${run.city}`,
        suggestion: 'Query Google Places potrebbe essere esaurita',
      })
    }
  }

  // 3. WhatsApp avg response time > 120s
  const waTime = precomputedWaResponseTime ?? (await getWhatsAppMetricsToday()).avg_response_time
  if (waTime > 120) {
    anomalies.push({
      severity: 'critical',
      type: 'whatsapp_slow',
      message: `Tempo medio risposta WhatsApp: ${Math.round(waTime / 60)} min`,
      suggestion: 'Controlla WHAPI_TOKEN o webhook status',
    })
  }

  // 4. Any account delivery_rate < 0.85
  const { data: allAccounts } = await admin
    .from('outreach_accounts')
    .select('email, sender_name, delivery_rate')
    .not('delivery_rate', 'is', null)

  for (const acc of allAccounts ?? []) {
    const rate = acc.delivery_rate as number
    if (rate < 0.85) {
      anomalies.push({
        severity: 'critical',
        type: 'deliverability',
        message: `Account ${acc.sender_name || acc.email} delivery rate al ${Math.round(rate * 100)}%`,
        suggestion: 'Sistema auto-pausa attiva',
      })
    }
  }

  // 5. Sites with payment_confirmed=false for >24h (created within last 7 days)
  const { count: pendingPayment } = await admin
    .from('sites')
    .select('id', { count: 'exact', head: true })
    .eq('payment_confirmed', false)
    .lte('created_at', h24)
    .gte('created_at', week7ago)

  if ((pendingPayment ?? 0) > 0) {
    anomalies.push({
      severity: 'info',
      type: 'pending_payment',
      message: `${pendingPayment} siti in attesa di conferma pagamento`,
      suggestion: 'Contatta il cliente o controlla il payment provider',
    })
  }

  return anomalies
}

export async function getWinsToday(): Promise<Win[]> {
  const admin = createAdminClient()
  const wins: Win[] = []
  const today = todayUTC()
  const week7 = sinceMs(7 * 24 * 60 * 60 * 1000)

  // 1. Strategy with highest reply_rate this week
  const { data: topStrategy } = await admin
    .from('email_strategies')
    .select('strategy_number, angle_description, reply_rate')
    .eq('active', true)
    .not('reply_rate', 'is', null)
    .order('reply_rate', { ascending: false })
    .limit(1)

  if (topStrategy && topStrategy.length > 0) {
    const best = topStrategy[0]
    const rateLabel = best.reply_rate != null ? `${(best.reply_rate * 100).toFixed(1)}%` : '—'
    wins.push({
      label: 'Strategia con più risposte questa settimana',
      value: `Strategia ${best.strategy_number} (${rateLabel} reply rate)`,
    })
  }

  // 2. Best cuisine category by reply rate this week
  try {
    const { data: weekEmails } = await admin
      .from('emails_sent')
      .select('replied_at, restaurants:restaurant_id(category)')
      .gte('sent_at', week7)
      .eq('status', 'sent')
      .limit(1000)

    if (weekEmails && weekEmails.length > 0) {
      const byCat: Record<string, { sends: number; replies: number }> = {}
      for (const e of weekEmails) {
        const cat = (e as any).restaurants?.category
        if (!cat) continue
        if (!byCat[cat]) byCat[cat] = { sends: 0, replies: 0 }
        byCat[cat].sends++
        if (e.replied_at) byCat[cat].replies++
      }
      const best = Object.entries(byCat)
        .filter(([, v]) => v.sends >= 5)
        .sort((a, b) => b[1].replies / b[1].sends - a[1].replies / a[1].sends)[0]
      if (best) {
        const rate = Math.round((best[1].replies / best[1].sends) * 100)
        wins.push({
          label: 'Categoria con miglior tasso di risposta',
          value: `${best[0]}: ${rate}% (${best[1].sends} invii)`,
        })
      }
    }
  } catch {}

  // 3. Best reservation time slot this week
  try {
    const { data: confirmedRes } = await admin
      .from('site_reservations')
      .select('time')
      .gte('created_at', week7)
      .eq('status', 'confirmed')
      .limit(500)

    if (confirmedRes && confirmedRes.length > 0) {
      const timeCount: Record<string, number> = {}
      for (const r of confirmedRes) {
        const t = String(r.time).slice(0, 5)
        if (t) timeCount[t] = (timeCount[t] ?? 0) + 1
      }
      const bestSlot = Object.entries(timeCount).sort((a, b) => b[1] - a[1])[0]
      if (bestSlot) {
        wins.push({
          label: 'Orario più prenotato questa settimana',
          value: `${bestSlot[0]} (${bestSlot[1]} prenotazioni confermate)`,
        })
      }
    }
  } catch {}

  // 4. New customers signed up today (sites created today)
  const { count: newSitesToday } = await admin
    .from('sites')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', today)

  if ((newSitesToday ?? 0) > 0) {
    wins.push({
      label: 'Nuovi siti creati oggi',
      value: `${newSitesToday}`,
    })
  }

  // 5. Sites that went live today
  const { data: newLiveSites } = await admin
    .from('sites')
    .select('slug')
    .eq('status', 'live')
    .gte('created_at', today)
    .limit(5)

  if (newLiveSites && newLiveSites.length > 0) {
    wins.push({
      label: 'Siti andati live oggi',
      value: newLiveSites.map(s => s.slug).join(', '),
    })
  }

  return wins
}
