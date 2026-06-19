/**
 * POST /api/newsletter
 * Body: { slug, email }
 *
 * Iscrizione newsletter di un sito ristorante.
 * Solo per siti tier='pro' | 'premium' e status='live'.
 * Idempotente (se già iscritto ritorna ok).
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isFeatureActive } from '@/lib/plans'

export async function POST(req: NextRequest) {
  let body: any = {}
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Body JSON richiesto' }, { status: 400 })
  }

  const slug = String(body.slug || '').trim()
  const email = String(body.email || '').trim().toLowerCase()

  if (!slug || !email || !email.includes('@')) {
    return NextResponse.json({ error: 'Email o slug mancante/non valido' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data: site } = await supabase
    .from('sites')
    .select('id, tier, status, content:site_content (feature_newsletter_enabled)')
    .eq('slug', slug)
    .maybeSingle()

  if (!site || site.status !== 'live') {
    return NextResponse.json({ error: 'Non trovato' }, { status: 404 })
  }
  const content: any = Array.isArray((site as any).content)
    ? (site as any).content[0]
    : (site as any).content
  if (!isFeatureActive(site.tier as any, content || {}, 'newsletter')) {
    return NextResponse.json({ error: 'Non trovato' }, { status: 404 })
  }

  // Inserisce o reattiva l'iscrizione esistente
  const { error } = await supabase
    .from('site_newsletter')
    .upsert(
      { site_id: site.id, email, active: true },
      { onConflict: 'site_id,email' },
    )

  if (error) {
    // Se la tabella newsletter non esiste (migrazione 0008 non applicata), failgracefully
    if (/relation .* does not exist/i.test(error.message)) {
      return NextResponse.json({ error: 'Funzione non ancora disponibile' }, { status: 503 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, message: 'Iscritto alla newsletter. Grazie!' })
}
