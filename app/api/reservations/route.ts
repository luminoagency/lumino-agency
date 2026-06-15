/**
 * POST /api/reservations
 * Body: { slug, guestName, guestEmail?, guestPhone, date (YYYY-MM-DD), time (HH:MM),
 *         guestsCount, notes? }
 *
 * Endpoint pubblico chiamato dal form prenotazione sui siti pubblici dei ristoranti.
 * Crea una riga in site_reservations con status='pending' per il ristoratore.
 * Solo per siti tier='pro' | 'premium' e status='live'.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { trackEvent } from '@/lib/tracking'

export async function POST(req: NextRequest) {
  let body: any = {}
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Body JSON richiesto' }, { status: 400 }) }

  const slug = String(body.slug || '').trim()
  const guestName = String(body.guestName || '').trim()
  const guestPhone = String(body.guestPhone || '').trim()
  const guestEmail = String(body.guestEmail || '').trim().toLowerCase()
  const date = String(body.date || '').trim()
  const time = String(body.time || '').trim()
  const guestsCount = Math.max(1, Math.min(50, parseInt(String(body.guestsCount || '0'), 10) || 0))
  const notes = String(body.notes || '').slice(0, 500)

  if (!slug || !guestName || !guestPhone || !date || !time || !guestsCount) {
    return NextResponse.json({ error: 'Campi obbligatori mancanti (nome, telefono, data, ora, persone)' }, { status: 400 })
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}/.test(time)) {
    return NextResponse.json({ error: 'Formato data o ora non valido' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data: site } = await supabase
    .from('sites')
    .select('id, tier, status, slug, client_id, clients:client_id(email, name)')
    .eq('slug', slug)
    .maybeSingle()

  if (!site || site.status !== 'live') {
    return NextResponse.json({ error: 'Sito non trovato o non pubblicato' }, { status: 404 })
  }
  if (site.tier === 'basic') {
    return NextResponse.json({ error: 'Le prenotazioni online non sono attive per questo locale' }, { status: 400 })
  }

  const { error: insErr } = await supabase.from('site_reservations').insert({
    site_id: site.id,
    guest_name: guestName,
    guest_email: guestEmail || null,
    guest_phone: guestPhone,
    date,
    time: time + ':00',  // postgres time vuole HH:MM:SS
    guests_count: guestsCount,
    notes: notes || null,
    status: 'pending',
  })

  if (insErr) {
    return NextResponse.json({ error: insErr.message }, { status: 500 })
  }

  // Tracking (fire-and-forget)
  const client = Array.isArray((site as any).clients) ? (site as any).clients[0] : (site as any).clients
  trackEvent('reservation', {
    email: client?.email || '',
    restaurantName: client?.name || slug,
    guestName,
    date,
    persons: guestsCount,
  }).catch(() => {})

  return NextResponse.json({ ok: true, message: 'Prenotazione ricevuta. Il ristorante ti contatterà per confermare.' })
}
