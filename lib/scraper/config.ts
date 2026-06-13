import type { ProfileWeights } from './types';

/**
 * Central configuration for the nightly scraper. All tunables live here so
 * behavior can be adjusted without touching logic. The weekly AI learner
 * overrides selection weights via the search_strategy table at runtime;
 * the values here are the cold-start fallback.
 */
export const scraperConfig = {
  // ── Google Places API budget ──────────────────────────────
  /** Hard ceiling on Google Places (Maps) API calls per nightly run. */
  maxGoogleCallsPerNight: 200,

  /**
   * Soft ceiling on web lookups (email stages 2-3, opening web-confirm).
   * These are NOT Google Maps-billed and are counted separately. Stubbed
   * for now — no web-search provider configured yet.
   */
  maxWebLookupsPerNight: 100,

  // ── Time box ──────────────────────────────────────────────
  /**
   * Wall-clock budget for a single nightly invocation. Vercel Hobby
   * functions time out around 10s, so we stop well before that and resume
   * from the persisted scan_state cursor on the next run.
   */
  batchDeadlineMs: 9_000,

  // ── Grid / tiling (used by grid.ts in batch 2) ────────────
  /** Spacing between intra-city search tiles, in kilometers. */
  tileStepKm: 1.2,
  /** Radius of each search tile, in meters. */
  searchRadiusM: 800,

  // ── Selection thresholds (#2, used by selection.ts) ───────
  /** Min reviews for a place to count as "underexposed". */
  minReviewsUnderexposed: 100,
  /** Min star rating for the underexposed signal. */
  minStarsUnderexposed: 3.5,
  /** Cap used to normalize reviews_count into a 0-1 signal. */
  reviewsNormalizationCap: 1_000,

  // ── Newly-opened heuristic (#4, used by opening.ts) ───────
  /** At or below this review count, a place is a "newly opened" candidate. */
  maxReviewsNewlyOpened: 30,

  // ── Photos ────────────────────────────────────────────────
  /** Max photos to record per restaurant. */
  maxPhotosPerPlace: 3,
  /** Default photo width (px) when building media URLs. */
  photoMaxWidthPx: 1_200,

  // ── Locale ────────────────────────────────────────────────
  /** Language + region biasing for Places queries (Italy). */
  languageCode: 'it',
  regionCode: 'IT',
} as const;

/**
 * Cold-start selection weights, used when no active search_strategy row
 * exists. Kept separate (and typed) so the learner can swap it out.
 */
export const defaultProfileWeights: ProfileWeights = {
  no_site: 0.4,
  underexposed: 0.3,
  newly_opened: 0.2,
  reviews: 0.1,
};
