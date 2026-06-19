/**
 * GET /api/cron/warmup-tick
 * Schedule: 0 9 * * * (ogni giorno 09:00 UTC)
 * Auth: Authorization: Bearer ${CRON_SECRET}
 *
 * Avanza il warm-up dei 4 account Zoho e gestisce auto-pause / promotion.
 * Vedi lib/outreach/warmup.ts per la logica completa.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { runWarmupTick } from '@/lib/outreach/warmup'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') || ''
  const expected = process.env.CRON_SECRET
  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = createAdminClient()
    const result = await runWarmupTick(db)
    return NextResponse.json({ ok: true, ...result })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Errore' }, { status: 500 })
  }
}
