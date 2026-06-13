import type { SupabaseClient } from '@supabase/supabase-js';
import { defaultProfileWeights } from './config';
import type { ProfileWeights } from './types';

/**
 * Read-only access to the active search_strategy row (the weekly AI learner
 * writes it in step 4). Provides the city/category ordering and selection
 * weights the nightly scraper runs with, falling back to config defaults when
 * no active strategy exists (cold start).
 */
export interface ActiveStrategy {
  version: number | null;
  prioritizedCities: string[];
  prioritizedCategories: string[];
  weights: ProfileWeights;
}

function coerceWeights(raw: unknown): ProfileWeights {
  const w = (raw ?? {}) as Partial<Record<keyof ProfileWeights, unknown>>;
  const num = (v: unknown, fallback: number) =>
    typeof v === 'number' && Number.isFinite(v) ? v : fallback;
  return {
    no_site: num(w.no_site, defaultProfileWeights.no_site),
    underexposed: num(w.underexposed, defaultProfileWeights.underexposed),
    newly_opened: num(w.newly_opened, defaultProfileWeights.newly_opened),
    reviews: num(w.reviews, defaultProfileWeights.reviews),
  };
}

function asStringArray(raw: unknown): string[] {
  return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === 'string') : [];
}

export async function getActiveStrategy(
  db: SupabaseClient,
): Promise<ActiveStrategy> {
  const { data, error } = await db
    .from('search_strategy')
    .select('version, prioritized_cities, prioritized_categories, profile_weights')
    .eq('active', true)
    .maybeSingle();
  if (error) throw error;

  if (!data) {
    return {
      version: null,
      prioritizedCities: [],
      prioritizedCategories: [],
      weights: defaultProfileWeights,
    };
  }

  return {
    version: (data.version as number) ?? null,
    prioritizedCities: asStringArray(data.prioritized_cities),
    prioritizedCategories: asStringArray(data.prioritized_categories),
    weights: coerceWeights(data.profile_weights),
  };
}
