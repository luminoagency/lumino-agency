import { scraperConfig } from './config';
import type { ProfileWeights, RestaurantRow, SelectionResult } from './types';

/**
 * Lead prioritization (#2). Produces a 0–1 priority_score from four signals,
 * weighted by the active strategy: no/poor website, underexposed (good ratings
 * but weak online presence), newly opened, and review volume.
 */

/** Hosts treated as "social-only" presence rather than a real website. */
const SOCIAL_HOSTS = [
  'facebook.com',
  'instagram.com',
  'tiktok.com',
  'linktr.ee',
  'wa.me',
  'whatsapp.com',
  'business.site', // Google's auto-generated mini-sites
];

/** Classify a business's web presence from its website URL alone. */
export function classifyWebsite(url?: string | null): 'none' | 'social' | 'real' {
  if (!url) return 'none';
  let host: string;
  try {
    host = new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace(/^www\./, '');
  } catch {
    return 'none';
  }
  if (SOCIAL_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) return 'social';
  return 'real';
}

/** Map web presence to the "website gap" signal: bigger gap = better lead. */
function websiteGap(url?: string | null): number {
  switch (classifyWebsite(url)) {
    case 'none':
      return 1;
    case 'social':
      return 0.6;
    default:
      return 0;
  }
}

/** Normalize a raw review count into a 0–1 signal. */
function normalizeReviews(reviews: number): number {
  return Math.min(reviews / scraperConfig.reviewsNormalizationCap, 1);
}

/** Score a candidate restaurant and explain why. */
export function scoreCandidate(
  row: RestaurantRow,
  weights: ProfileWeights,
): SelectionResult {
  const reasons: string[] = [];

  const gap = websiteGap(row.website);
  if (gap === 1) reasons.push('no website');
  else if (gap === 0.6) reasons.push('social-only presence');

  const stars = row.stars ?? 0;
  const reviews = row.reviews_count ?? 0;

  const underexposed =
    stars >= scraperConfig.minStarsUnderexposed &&
    reviews >= scraperConfig.minReviewsUnderexposed &&
    gap >= 0.6
      ? 1
      : 0;
  if (underexposed) {
    reasons.push(`underexposed (${stars}★, ${reviews} reviews, weak web)`);
  }

  const newly = row.newly_opened ? 1 : 0;
  if (newly) reasons.push('newly opened');

  const reviewsNorm = normalizeReviews(reviews);

  const raw =
    weights.no_site * gap +
    weights.underexposed * underexposed +
    weights.newly_opened * newly +
    weights.reviews * reviewsNorm;

  const score = Math.max(0, Math.min(1, raw));

  return { score: Number(score.toFixed(3)), reasons };
}
