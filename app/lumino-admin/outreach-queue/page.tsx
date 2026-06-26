import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getWarmupInfo } from '@/lib/warmup'
import { OutreachQueueClient } from './OutreachQueueClient'

const SUPER_ADMINS = ['bylumino06@gmail.com']

export const metadata = { title: 'Coda email · Super Admin' }
export const dynamic = 'force-dynamic'

function arr<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null
  return Array.isArray(v) ? (v[0] ?? null) : v
}

export default async function OutreachQueuePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/lumino-admin/outreach-queue')
  if (!SUPER_ADMINS.includes(user.email || '')) redirect('/lumino-admin')

  const admin = createAdminClient()

  // 1. Email pronte da inviare (status 'ready_to_send'), ordinate per creazione.
  const { data: rawEmails } = await admin
    .from('emails_sent')
    .select('id, restaurant_id, account, strategy, subject, body, step, token, claimed_at, restaurants:restaurant_id ( name, city, email )')
    .eq('status', 'ready_to_send')
    .order('claimed_at', { ascending: true })
    .limit(500)

  // 2. Mappa strategy_number → hook (angle_description) per la colonna "Hook".
  const { data: strategies } = await admin
    .from('email_strategies')
    .select('strategy_number, angle_description')
  const hookByStrategy = new Map<number, string>()
  for (const s of strategies || []) {
    hookByStrategy.set((s as any).strategy_number, (s as any).angle_description || '')
  }

  const emails = (rawEmails || []).map((e) => {
    const r = arr<{ name: string; city: string | null; email: string | null }>((e as any).restaurants)
    return {
      id: e.id as string,
      restaurantName: r?.name || '—',
      city: r?.city || null,
      to: r?.email || '',
      sender: (e.account as string) || '—',
      hook: hookByStrategy.get(e.strategy as number) || `Strategia ${e.strategy}`,
      subject: (e.subject as string) || '',
      body: (e.body as string) || '',
      step: (e.step as string) || 'initial',
    }
  })

  // 3. Warmup: primo invio manuale storico + inviate oggi.
  const { data: firstRow } = await admin
    .from('emails_sent')
    .select('manually_sent_at')
    .not('manually_sent_at', 'is', null)
    .order('manually_sent_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  const firstSentISO = (firstRow?.manually_sent_at as string) || null
  const warmup = getWarmupInfo(firstSentISO)

  const todayStart = new Date().toISOString().slice(0, 10) + 'T00:00:00Z'
  const { count: sentTodayCount } = await admin
    .from('emails_sent')
    .select('id', { count: 'exact', head: true })
    .gte('manually_sent_at', todayStart)

  // 4. Risposte (Gruppo Q — OAuth Gmail): DISATTIVATO, spostato a FASE 2.
  //    Il codice della Sezione 2 resta come riferimento ma non viene alimentato
  //    né renderizzato finché REPLIES_ENABLED resta false (vedi anche showReplies).
  const REPLIES_ENABLED = false
  const replies: never[] = []
  const blacklisted: never[] = []

  return (
    <OutreachQueueClient
      emails={emails}
      replies={replies}
      blacklisted={blacklisted}
      showReplies={REPLIES_ENABLED}
      warmup={warmup}
      sentToday={sentTodayCount || 0}
      backLink={<Link href="/lumino-admin" className="oq-back">← Super Admin</Link>}
    />
  )
}
