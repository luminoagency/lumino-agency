/**
 * Suppression globale: chi chiede unsub viene marcato `do_not_contact=true`
 * sulla riga `restaurants`. Da quel momento NESSUN account outreach lo
 * contatta più (preflight.ts lo skippa).
 *
 * /api/unsub/[token] chiama suppressRestaurantByToken(token).
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export interface SuppressResult {
  ok: boolean
  restaurantId?: string
  alreadySuppressed?: boolean
  error?: string
}

export async function suppressRestaurantByToken(
  db: SupabaseClient,
  token: string,
): Promise<SuppressResult> {
  if (!token) return { ok: false, error: 'token mancante' }

  // 1. Trova il restaurant_id dal token (emails_sent)
  const { data: emailRow, error: e1 } = await db
    .from('emails_sent')
    .select('id, restaurant_id, unsubscribed_at')
    .eq('token', token)
    .maybeSingle()

  if (e1) return { ok: false, error: e1.message }
  if (!emailRow) return { ok: false, error: 'token non riconosciuto' }

  // Marca la singola riga emails_sent come unsub (idempotente)
  if (!emailRow.unsubscribed_at) {
    await db.from('emails_sent')
      .update({ unsubscribed: true, unsubscribed_at: new Date().toISOString() })
      .eq('id', emailRow.id)
  }

  if (!emailRow.restaurant_id) return { ok: true, alreadySuppressed: false }

  // 2. Marca il ristorante per suppression globale
  const { data: existing } = await db
    .from('restaurants')
    .select('do_not_contact')
    .eq('id', emailRow.restaurant_id)
    .maybeSingle()

  if (existing?.do_not_contact === true) {
    return { ok: true, restaurantId: emailRow.restaurant_id, alreadySuppressed: true }
  }

  const { error: e2 } = await db
    .from('restaurants')
    .update({
      do_not_contact: true,
      do_not_contact_reason: 'unsub_via_email',
      do_not_contact_at: new Date().toISOString(),
    })
    .eq('id', emailRow.restaurant_id)

  if (e2) return { ok: false, error: e2.message }
  return { ok: true, restaurantId: emailRow.restaurant_id, alreadySuppressed: false }
}
