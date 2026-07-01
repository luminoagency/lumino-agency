import { createAdminClient } from '../supabase/admin';
import { Budget } from './budget';
import { orderedCategories } from './categories';
import { defaultProfileWeights } from './config';
import { filterKnown, insertRestaurant } from './dedup';
import { placeDetails, searchNearby, searchText } from './googlePlaces';
import { generateTiles } from './grid';
import { toRestaurantRow } from './normalize';
import { detectOpening } from './opening';
import * as scanState from './scanState';
import { scoreCandidate } from './selection';
import type { BatchSummary, Category, PlaceSearchResult, ScanTile } from './types';

/**
 * Nightly orchestrator. Picks the current city, scans tiles × categories from
 * the persisted cursor within the API and time budget, dedupes, enriches
 * (details → opening → email → score), inserts new leads, and advances the
 * city cursor — marking the city complete only when fully covered.
 *
 * Designed to be called by the nightly cron route (step 3 of the build).
 */

/** Run the right Places search for a category, respecting the budget. */
async function runSearch(
  tile: ScanTile,
  category: Category,
  budget: Budget,
): Promise<PlaceSearchResult[]> {
  if (!budget.canSpendGoogle()) return [];
  if (category.query.kind === 'type') {
    return searchNearby(tile, category.query.includedType, budget);
  }
  return searchText(tile, category.query.textQuery, budget, {
    includedType: category.query.includedType,
  });
}

export async function runScrapeBatch(): Promise<BatchSummary> {
  const db = createAdminClient();
  const budget = new Budget();

  const city = await scanState.getCurrentCity(db);
  const summary: BatchSummary = {
    city: city?.city ?? null,
    tilesScanned: 0,
    candidatesFound: 0,
    newRestaurants: 0,
    detailsFetched: 0,
    emailsFound: 0,
    apiCalls: 0,
    status: 'success',
  };

  // Every city complete — nothing to do.
  if (!city) return summary;

  // Misconfigured city (no bbox to tile) — record and bail without a run row.
  if (!city.bbox) {
    summary.status = 'error';
    summary.error = `City "${city.city}" has no bbox configured`;
    return summary;
  }

  const runId = await scanState.startRun(db, 'nightly', city.city);

  try {
    const tiles = generateTiles(city.bbox, { radiusM: city.search_radius_m });
    await scanState.beginCity(db, city, tiles.length);

    // Strategia fissa: ordine categorie di default (niente learning).
    const cats = orderedCategories([]);

    let tileCursor = city.tile_cursor;
    let categoryCursor = city.category_cursor;
    let restaurantsFound = city.restaurants_found;

    outer: for (; tileCursor < tiles.length; tileCursor++) {
      const tile = tiles[tileCursor];

      for (; categoryCursor < cats.length; categoryCursor++) {
        if (budget.shouldStop()) break outer;
        const category = cats[categoryCursor];

        const hits = await runSearch(tile, category, budget);
        summary.candidatesFound += hits.length;

        // One query collapses all duplicates for this search.
        const placeIds = hits.map((h) => h.placeId).filter(Boolean);
        const known = await filterKnown(db, placeIds);

        for (const hit of hits) {
          if (budget.shouldStop()) break outer;
          if (!hit.placeId || known.has(hit.placeId)) continue;
          if (!budget.canSpendGoogle()) break outer;

          const details = await placeDetails(hit.placeId, budget);
          summary.detailsFetched += 1;

          const row = toRestaurantRow(hit, details, { category: category.key });

          const opening = await detectOpening(row, { budget });
          row.newly_opened = opening.newly_opened;
          row.opened_signal = opening.opened_signal;

          // Discovery only (option b): email is left as 'pending' (the default
          // from normalize) for a separate enrichment cron pass to process.
          // This keeps the nightly run fast and well inside the time box.
          row.priority_score = scoreCandidate(row, defaultProfileWeights).score;

          const { inserted } = await insertRestaurant(db, row);
          if (inserted) {
            summary.newRestaurants += 1;
            restaurantsFound += 1;
          }
        }
      }

      categoryCursor = 0; // reset for the next tile
      summary.tilesScanned += 1;
    }

    const finishedCity = tileCursor >= tiles.length;
    const apiCallsUsed = city.api_calls_used + budget.googleSpent;

    await scanState.saveProgress(db, city.id, {
      tileCursor: finishedCity ? tiles.length : tileCursor,
      categoryCursor: finishedCity ? 0 : categoryCursor,
      restaurantsFound,
      apiCallsUsed,
    });
    if (finishedCity) await scanState.markComplete(db, city.id);

    summary.apiCalls = budget.googleSpent;
    summary.status = finishedCity ? 'success' : 'partial';
    await scanState.finishRun(db, runId, summary);
    return summary;
  } catch (err) {
    summary.status = 'error';
    summary.error = err instanceof Error ? err.message : String(err);
    summary.apiCalls = budget.googleSpent;
    await scanState.finishRun(db, runId, summary);
    return summary;
  }
}
