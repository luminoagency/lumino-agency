import { scraperConfig } from './config';
import type { Budget } from './budget';
import type { OpeningResult, RestaurantRow } from './types';

/**
 * Newly-opened detection (#4).
 *
 * Signal 1 (always on, no extra call): a low review count suggests a recently
 * opened business. Google exposes no opening date, so this is a heuristic.
 *
 * Signal 2 (web confirmation): a quick search for opening announcements/news to
 * populate opened_signal. This needs a web-search provider we don't have yet,
 * so it is stubbed behind OpeningConfirmProvider — opened_signal stays null
 * until a provider is wired in.
 */

/** Pluggable web-confirmation provider (no implementation yet). */
export interface OpeningConfirmProvider {
  /** Return a short evidence snippet of a recent opening, or null. */
  confirm(name: string, city: string): Promise<string | null>;
}

export async function detectOpening(
  row: RestaurantRow,
  opts: { provider?: OpeningConfirmProvider; budget?: Budget } = {},
): Promise<OpeningResult> {
  const reviews = row.reviews_count ?? Number.POSITIVE_INFINITY;
  const newly_opened = reviews <= scraperConfig.maxReviewsNewlyOpened;

  let opened_signal: string | null = null;
  if (
    newly_opened &&
    opts.provider &&
    (!opts.budget || opts.budget.canSpendWeb())
  ) {
    opts.budget?.recordWeb();
    opened_signal = await opts.provider.confirm(row.name, row.city ?? '');
  }

  return { newly_opened, opened_signal };
}
