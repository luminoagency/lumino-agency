'use server'

/**
 * Server actions per il pannello prenotazioni del ristoratore.
 * Tutte le azioni sono gated: l'utente deve essere site_owner del sito.
 * Le email d'esito al guest passano dal webhook Apps Script.
 */

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export interface ReservationRow {
  id: string
  guest_name: string
  guest_email: string | null
  guest_phone: string
  date: string
  time: string
  guests_count: number
  notes: string | null
  status: 'pending' | 'confirmed' | 'cancelled' | 'no_show' | 'completed'
  owner_note: string | null
  owner_decided_at: string | null
  ack_email_sent_at: string | null
  outcome_email_sent_at: string | null
  created_at: string
}

async function getMyOwnedSiteId(): Promise<string | null> {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return null
  const { data: owner } = await sb
    .from('site_owners')
    .select('site_id')
    .eq('user_id', user.id)
    .maybeSingle()
  return owner?.site_id || null
}

export async function listMyReservations(filter: 'pending' | 'all' | 'confirmed' | 'cancelled' = 'all'): Promise<{
  ok: boolean
  reservations?: ReservationRow[]
  error?: string
}> {
  const siteId = await getMyOwnedSiteId()
  if (!siteId) return { ok: false, error: 'Non autenticato' }

  const admin = createAdminClient()
  let q = admin
    .from('site_reservations')
    .select('id, guest_name, guest_email, guest_phone, date, time, guests_count, notes, status, owner_note, owner_decided_at, ack_email_sent_at, outcome_email_sent_at, created_at')
    .eq('site_id', siteId)
    .order('created_at', { ascending: false })
    .limit(200)

  if (filter === 'pending') q = q.eq('status', 'pending')
  if (filter === 'confirmed') q = q.eq('status', 'confirmed')
  if (filter === 'cancelled') q = q.eq('status', 'cancelled')

  const { data, error } = await q
  if (error) return { ok: false, error: error.message }
  return { ok: true, reservations: (data as ReservationRow[]) || [] }
}

async function sendOutcomeEmail(reservationId: string, outcome: 'confirmed' | 'cancelled', ownerNote: string | null): Promise<boolean> {
  const url = process.env.LUMINO_RESERVATION_OUTCOME_URL
  if (!url) return false

  const admin = createAdminClient()
  const { data: r } = await admin
    .from('site_reservations')
    .select(`
      id, guest_name, guest_email, date, time, guests_count,
      site:site_id (
        slug,
        clients:client_id (email, name),
        content:site_content (restaurant_name, email)
      )
    `)
    .eq('id', reservationId)
    .maybeSingle()
  if (!r || !r.guest_email) return false

  const site: any = (r as any).site
  const content = site?.content ? (Array.isArray(site.content) ? site.content[0] : site.content) : null
  const client = site?.clients ? (Array.isArray(site.clients) ? site.clients[0] : site.clients) : null
  const restaurantName = content?.restaurant_name || client?.name || ''
  const replyTo = content?.email || client?.email || ''

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: process.env.LUMINO_SHEET_SECRET,
        kind: outcome === 'confirmed' ? 'reservation_confirmed' : 'reservation_cancelled',
        guest_email: r.guest_email,
        guest_name: r.guest_name,
        restaurant_name: restaurantName,
        restaurant_reply_to: replyTo,
        date: r.date,
        time: typeof r.time === 'string' ? r.time.slice(0, 5) : r.time,
        people: r.guests_count,
        owner_note: ownerNote || '',
      }),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function confirmReservation(id: string, note?: string): Promise<{ ok: boolean; error?: string }> {
  const siteId = await getMyOwnedSiteId()
  if (!siteId) return { ok: false, error: 'Non autenticato' }
  const admin = createAdminClient()

  const { error } = await admin
    .from('site_reservations')
    .update({
      status: 'confirmed',
      owner_note: note || null,
      owner_decided_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('site_id', siteId)
  if (error) return { ok: false, error: error.message }

  const sent = await sendOutcomeEmail(id, 'confirmed', note || null)
  if (sent) {
    await admin.from('site_reservations')
      .update({ outcome_email_sent_at: new Date().toISOString() })
      .eq('id', id)
  }

  revalidatePath('/admin/prenotazioni')
  return { ok: true }
}

export async function cancelReservation(id: string, note?: string): Promise<{ ok: boolean; error?: string }> {
  const siteId = await getMyOwnedSiteId()
  if (!siteId) return { ok: false, error: 'Non autenticato' }
  const admin = createAdminClient()

  const { error } = await admin
    .from('site_reservations')
    .update({
      status: 'cancelled',
      owner_note: note || null,
      owner_decided_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('site_id', siteId)
  if (error) return { ok: false, error: error.message }

  const sent = await sendOutcomeEmail(id, 'cancelled', note || null)
  if (sent) {
    await admin.from('site_reservations')
      .update({ outcome_email_sent_at: new Date().toISOString() })
      .eq('id', id)
  }

  revalidatePath('/admin/prenotazioni')
  return { ok: true }
}
