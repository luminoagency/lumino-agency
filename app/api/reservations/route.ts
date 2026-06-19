/**
 * POST /api/reservations
 * Body: { slug, guestName, guestEmail?, guestPhone, date (YYYY-MM-DD), time (HH:MM),
 *         guestsCount, notes? }
 *
 * Endpoint pubblico chiamato dal form prenotazione sui siti pubblici dei ristoranti.
 *
 * Privacy: Lumino non vede MAI dati personali. Tracking solo aggregato
 * (slug + date_only + restaurant_id). Tutte le email passano da Apps Script
 * webhook (LUMINO_RESERVATION_ACK_URL, LUMINO_OWNER_NOTIFY_URL).
 *
 * Gating: tier ≠ 'basic' AND status='live' AND feature_reservations_enabled.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { trackEvent } from '@/lib/tracking'
import { isFeatureActive } from '@/lib/plans'

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
    .select(`
      id, tier, status, slug, client_id,
      clients:client_id (email, name, restaurant_id),
      content:site_content (
        restaurant_name, email, whatsapp_number,
        feature_reservations_enabled, feature_whatsapp_button_enabled
      )
    `)
    .eq('slug', slug)
    .maybeSingle()

  if (!site || site.status !== 'live') {
    // Stessa 404 per "non esiste" e "feature disattivata": no info leak
    return NextResponse.json({ error: 'Non trovato' }, { status: 404 })
  }

  const content: any = Array.isArray((site as any).content)
    ? (site as any).content[0]
    : (site as any).content
  const client: any = Array.isArray((site as any).clients)
    ? (site as any).clients[0]
    : (site as any).clients

  // Feature gating: se il piano non lo prevede O l'override è OFF → 404
  if (!isFeatureActive(site.tier as any, content || {}, 'reservations')) {
    return NextResponse.json({ error: 'Non trovato' }, { status: 404 })
  }

  const { data: inserted, error: insErr } = await supabase
    .from('site_reservations')
    .insert({
      site_id: site.id,
      guest_name: guestName,
      guest_email: guestEmail || null,
      guest_phone: guestPhone,
      date,
      time: time + ':00',
      guests_count: guestsCount,
      notes: notes || null,
      status: 'pending',
    })
    .select('id')
    .single()

  if (insErr || !inserted) {
    return NextResponse.json({ error: insErr?.message || 'Errore' }, { status: 500 })
  }

  const restaurantName: string = content?.restaurant_name || client?.name || slug
  const restaurantReplyTo: string = content?.email || client?.email || ''

  // ── 1. Email ACK al guest (Apps Script) ─────────────────────────────────
  const ackUrl = process.env.LUMINO_RESERVATION_ACK_URL
  if (ackUrl && guestEmail) {
    try {
      const ackRes = await fetch(ackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: process.env.LUMINO_SHEET_SECRET,
          kind: 'reservation_ack',
          guest_email: guestEmail,
          guest_name: guestName,
          restaurant_name: restaurantName,
          restaurant_reply_to: restaurantReplyTo,
          date,
          time,
          people: guestsCount,
        }),
      })
      if (ackRes.ok) {
        await supabase.from('site_reservations')
          .update({ ack_email_sent_at: new Date().toISOString() })
          .eq('id', inserted.id)
      }
    } catch {}
  }

  // ── 2. Notifica al ristoratore (Apps Script email) ──────────────────────
  const notifyUrl = process.env.LUMINO_OWNER_NOTIFY_URL
  if (notifyUrl && client?.email) {
    fetch(notifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: process.env.LUMINO_SHEET_SECRET,
        kind: 'owner_notify_reservation',
        owner_email: client.email,
        restaurant_name: restaurantName,
        guest_name: guestName,
        guest_phone: guestPhone,
        date,
        time,
        people: guestsCount,
        notes: notes || '',
        admin_url: `https://bylumino.com/admin/prenotazioni`,
      }),
    }).catch(() => {})
  }

  // ── 3. Notifica WhatsApp al ristoratore (solo se ha bottone WA attivo) ──
  const hasWhatsappFeature = isFeatureActive(
    site.tier as any,
    content || {},
    'whatsappButton',
  )
  const ownerWhatsapp = content?.whatsapp_number
  if (hasWhatsappFeature && ownerWhatsapp && process.env.WHAPI_TOKEN) {
    fetch(`${process.env.WHAPI_BASE_URL}/messages/text`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.WHAPI_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: ownerWhatsapp,
        body:
          `Nuova prenotazione · ${restaurantName}\n\n` +
          `${guestName} (${guestPhone})\n` +
          `${date} alle ${time} · ${guestsCount} persone\n` +
          (notes ? `Note: ${notes}\n` : '') +
          `\nConferma o annulla: https://bylumino.com/admin/prenotazioni`,
      }),
    }).catch(() => {})
  }

  // ── 4. Tracking AGGREGATO (zero dati personali) ─────────────────────────
  trackEvent('reservation_count' as any, {
    restaurant_id: (client?.restaurant_id as string) || '',
    slug,
    date_only: date,
  }).catch(() => {})

  return NextResponse.json({
    ok: true,
    message: 'Prenotazione ricevuta. Riceverai una mail di conferma a breve.',
  })
}
