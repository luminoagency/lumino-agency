import type { SupabaseClient } from '@supabase/supabase-js';
import type { BBox, BatchSummary } from './types';

/**
 * The city-by-city scan queue and run audit, backed by scan_state and
 * scrape_runs. The scraper always works the lowest priority_rank city that is
 * not yet complete, persisting its cursor each run so the next night resumes
 * exactly where it stopped — and only advances to the next city when the
 * current one is fully covered.
 */

export interface CityScanState {
  id: string;
  city: string;
  region: string | null;
  country: string;
  priority_rank: number;
  center_lat: number | null;
  center_lng: number | null;
  bbox: BBox | null;
  search_radius_m: number;
  tiles_total: number | null;
  tile_cursor: number;
  category_cursor: number;
  status: 'pending' | 'in_progress' | 'complete';
  restaurants_found: number;
  api_calls_used: number;
}

const CITY_COLUMNS =
  'id, city, region, country, priority_rank, center_lat, center_lng, bbox, ' +
  'search_radius_m, tiles_total, tile_cursor, category_cursor, status, ' +
  'restaurants_found, api_calls_used';

/** Lowest-rank city not yet complete, or null when every city is done. */
export async function getCurrentCity(
  db: SupabaseClient,
): Promise<CityScanState | null> {
  const { data, error } = await db
    .from('scan_state')
    .select(CITY_COLUMNS)
    .neq('status', 'complete')
    .order('priority_rank', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? (data as unknown as CityScanState) : null;
}

/** Mark a city in-progress and set tiles_total on first touch. */
export async function beginCity(
  db: SupabaseClient,
  city: CityScanState,
  tilesTotal: number,
): Promise<void> {
  const patch: Record<string, unknown> = {};
  if (city.status === 'pending') {
    patch.status = 'in_progress';
    patch.started_at = new Date().toISOString();
  }
  if (city.tiles_total === null) {
    patch.tiles_total = tilesTotal;
  }
  if (Object.keys(patch).length === 0) return;

  const { error } = await db.from('scan_state').update(patch).eq('id', city.id);
  if (error) throw error;
}

/** Persist the scan cursor and cumulative counters for a city. */
export async function saveProgress(
  db: SupabaseClient,
  cityId: string,
  p: {
    tileCursor: number;
    categoryCursor: number;
    restaurantsFound: number;
    apiCallsUsed: number;
  },
): Promise<void> {
  const { error } = await db
    .from('scan_state')
    .update({
      tile_cursor: p.tileCursor,
      category_cursor: p.categoryCursor,
      restaurants_found: p.restaurantsFound,
      api_calls_used: p.apiCallsUsed,
      last_scanned_at: new Date().toISOString(),
    })
    .eq('id', cityId);
  if (error) throw error;
}

/** Flag a city fully scanned so the queue advances to the next one. */
export async function markComplete(
  db: SupabaseClient,
  cityId: string,
): Promise<void> {
  const { error } = await db
    .from('scan_state')
    .update({ status: 'complete', completed_at: new Date().toISOString() })
    .eq('id', cityId);
  if (error) throw error;
}

/** Open a scrape_runs audit row; returns its id. */
export async function startRun(
  db: SupabaseClient,
  runType: 'nightly' | 'weekly',
  city: string | null,
): Promise<string> {
  const { data, error } = await db
    .from('scrape_runs')
    .insert({ run_type: runType, city })
    .select('id')
    .single();
  if (error) throw error;
  return data.id as string;
}

/** Finalize a scrape_runs row with the batch summary. */
export async function finishRun(
  db: SupabaseClient,
  runId: string,
  summary: BatchSummary,
): Promise<void> {
  const { error } = await db
    .from('scrape_runs')
    .update({
      finished_at: new Date().toISOString(),
      status: summary.status,
      tiles_scanned: summary.tilesScanned,
      candidates_found: summary.candidatesFound,
      new_restaurants: summary.newRestaurants,
      details_fetched: summary.detailsFetched,
      emails_found: summary.emailsFound,
      api_calls: summary.apiCalls,
      error: summary.error ?? null,
    })
    .eq('id', runId);
  if (error) throw error;
}
