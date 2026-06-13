import type { SupabaseClient } from '@supabase/supabase-js';
import type { RestaurantRow } from './types';

/**
 * Deduplication and contact-history guards. The Supabase client is injected by
 * the caller (the cron route, batch 3) so this module stays decoupled from
 * request context and can run under a service-role client.
 *
 * Rules:
 *   - Never store the same business twice — keyed on google_place_id (UNIQUE).
 *   - Never reset contact history / email_status on re-discovery: inserts use
 *     ignoreDuplicates, so an existing row is left untouched.
 *   - Never re-queue a business we've already emailed (joins emails_sent).
 */

/** True if a place is already stored. */
export async function isKnown(
  db: SupabaseClient,
  placeId: string,
): Promise<boolean> {
  const { data, error } = await db
    .from('restaurants')
    .select('id')
    .eq('google_place_id', placeId)
    .maybeSingle();
  if (error) throw error;
  return data !== null;
}

/**
 * Given a batch of place IDs, return the set already in the DB. Lets the
 * orchestrator skip Place Details calls for known places in one query per tile
 * instead of one per candidate.
 */
export async function filterKnown(
  db: SupabaseClient,
  placeIds: string[],
): Promise<Set<string>> {
  if (placeIds.length === 0) return new Set();
  const { data, error } = await db
    .from('restaurants')
    .select('google_place_id')
    .in('google_place_id', placeIds);
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.google_place_id as string));
}

/**
 * Insert a newly discovered restaurant. On google_place_id conflict the
 * existing row is preserved (no overwrite of contact history). Returns whether
 * a row was actually inserted and its id (null when the duplicate was ignored).
 */
export async function insertRestaurant(
  db: SupabaseClient,
  row: RestaurantRow,
): Promise<{ inserted: boolean; id: string | null }> {
  const { data, error } = await db
    .from('restaurants')
    .upsert(row, { onConflict: 'google_place_id', ignoreDuplicates: true })
    .select('id')
    .maybeSingle();
  if (error) throw error;
  return { inserted: data !== null, id: (data?.id as string) ?? null };
}

/**
 * True if this restaurant has an active outreach record (sending or sent).
 * Failed/skipped rows are excluded so leads can be re-attempted after a
 * send failure without being permanently blocked.
 */
export async function alreadyContacted(
  db: SupabaseClient,
  restaurantId: string,
): Promise<boolean> {
  const { data, error } = await db
    .from('emails_sent')
    .select('id')
    .eq('restaurant_id', restaurantId)
    .in('status', ['sending', 'sent'])
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data !== null;
}
