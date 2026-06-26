/**
 * POST /api/pipeline/generate
 * Body: { siteId: string }
 *
 * Triggera la pipeline AI per generare contenuto del sito.
 *
 * Auth: l'utente loggato deve essere owner del sito (site_owners.user_id),
 * oppure deve avere CRON_SECRET (per chiamate server-to-server, es. webhook pagamento).
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateSiteContent } from '@/lib/pipeline/generate'
import { canStartWork } from '@/lib/payments/status'

export async function POST(req: NextRequest) {
  let body: any = {}
  try { body = await req.json() } catch {}
  const siteId: string = String(body.siteId || '')
  if (!siteId) return NextResponse.json({ error: 'siteId richiesto' }, { status: 400 })

  // Auth via CRON_SECRET (server-to-server)
  const auth = req.headers.get('authorization') || ''
  const cronSecret = process.env.CRON_SECRET || ''
  const viaCron = cronSecret && auth === `Bearer ${cronSecret}`

  if (!viaCron) {
    // Auth via sessione utente
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    const admin = createAdminClient()
    const { data: owner } = await admin
      .from('site_owners')
      .select('site_id')
      .eq('user_id', user.id)
      .eq('site_id', siteId)
      .maybeSingle()
    if (!owner) return NextResponse.json({ error: 'Non autorizzato per questo sito' }, { status: 403 })
  }

  // Gate pagamento: la generazione del sito parte SOLO con l'acconto (30%) confermato.
  // first_payment_confirmed viene messo a true a mano (dal super-admin) o, in futuro,
  // automaticamente dal webhook del payment provider. Bypass via CRON_SECRET per testing.
  if (!viaCron) {
    const admin = createAdminClient()
    const { data: siteRow } = await admin
      .from('sites')
      .select('first_payment_confirmed')
      .eq('id', siteId)
      .maybeSingle()
    if (!siteRow || !canStartWork(siteRow as { first_payment_confirmed: boolean })) {
      return NextResponse.json(
        { error: 'Primo acconto non confermato' },
        { status: 402 },
      )
    }
  }

  const result = await generateSiteContent({ siteId })
  if (!result.ok) {
    return NextResponse.json({ error: result.error || 'Errore generazione' }, { status: 500 })
  }
  return NextResponse.json({
    ok: true,
    template: result.template,
    accentColor: result.accentColor,
    message: 'Sito generato con AI. Apri /admin per vederlo.',
  })
}
