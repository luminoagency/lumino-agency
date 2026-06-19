/**
 * POST /api/reviews
 * Body: { slug, authorName, rating (1-5), text, authorEmail? }
 *
 * Submit pubblico di una recensione sul sito di un ristorante.
 * Va in moderazione (show=false) — il ristoratore approva dal pannello.
 *
 * Storage: site_content.reviews (jsonb array). Richiede migrazione 0008 applicata.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { isFeatureActive } from '@/lib/plans'

export async function POST(req: NextRequest) {
  let body: any = {}
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Body JSON richiesto' }, { status: 400 })
  }

  const slug = String(body.slug || '').trim()
  const authorName = String(body.authorName || body.author_name || '').trim()
  const authorEmail = String(body.authorEmail || body.author_email || '').trim().toLowerCase()
  const rating = Math.max(1, Math.min(5, Math.round(Number(body.rating) || 0)))
  const text = String(body.text || '').trim().slice(0, 1500)

  if (!slug || !authorName || !rating || !text) {
    return NextResponse.json({ error: 'Compila nome, voto e recensione' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data: site } = await supabase
    .from('sites')
    .select('id, tier, status, content:site_content (reviews, feature_reviews_enabled)')
    .eq('slug', slug)
    .maybeSingle()

  if (!site || site.status !== 'live') {
    return NextResponse.json({ error: 'Non trovato' }, { status: 404 })
  }
  const content: any = Array.isArray((site as any).content)
    ? (site as any).content[0]
    : (site as any).content
  if (!isFeatureActive(site.tier as any, content || {}, 'reviews')) {
    return NextResponse.json({ error: 'Non trovato' }, { status: 404 })
  }

  if (!content) {
    return NextResponse.json({ error: 'Sito non inizializzato' }, { status: 500 })
  }

  const existing = Array.isArray((content as any).reviews) ? (content as any).reviews : []
  const newReview = {
    author: authorName,
    email: authorEmail || undefined,
    rating,
    text,
    source: 'site',
    date: new Date().toISOString(),
    show: false,  // in moderazione
  }

  const { error } = await supabase
    .from('site_content')
    .update({ reviews: [...existing, newReview] })
    .eq('site_id', site.id)

  if (error) {
    if (/column .* does not exist|Could not find the/i.test(error.message)) {
      return NextResponse.json({ error: 'Recensioni richiedono la migrazione 0008 applicata' }, { status: 503 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, message: 'Recensione inviata. Sarà pubblicata dopo approvazione.' })
}
