import { scraperConfig } from './config';
import type { Budget } from './budget';
import type { PlaceDetails, PlaceSearchResult, ScanTile } from './types';

/**
 * Thin client over the Google Places API (New). All search/detail calls are
 * gated by a Budget instance so the nightly run stays under its call cap.
 * Field masks are kept as tight as possible to control billing tier.
 *
 * Endpoints:
 *   POST /v1/places:searchNearby   — type-based search (≤20 results, no paging)
 *   POST /v1/places:searchText     — keyword search (paginated, ≤60 results)
 *   GET  /v1/places/{placeId}      — Place Details
 *   GET  /v1/{photo.name}/media    — Place Photo media (billed on fetch)
 */

const PLACES_BASE = 'https://places.googleapis.com/v1';

/** Cheap field mask for search results (prefix `places.` for list responses). */
const SEARCH_FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.location',
  'places.rating',
  'places.userRatingCount',
  'places.primaryType',
  'places.businessStatus',
].join(',');

/** Richer field mask for Place Details (single-object response, no prefix). */
const DETAILS_FIELD_MASK = [
  'id',
  'displayName',
  'internationalPhoneNumber',
  'websiteUri',
  'photos',
  'addressComponents',
  'formattedAddress',
  'location',
  'rating',
  'userRatingCount',
  'primaryType',
  'businessStatus',
].join(',');

function apiKey(): string {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) throw new Error('GOOGLE_MAPS_API_KEY is not set');
  return key;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function safeText(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 500);
  } catch {
    return '<no body>';
  }
}

// The Places API returns loosely-typed JSON; we map it into our own types at
// the boundary, so `any` is intentional and contained to this module.
/* eslint-disable @typescript-eslint/no-explicit-any */

interface PlacesFetchInit extends RequestInit {
  fieldMask: string;
}

/**
 * Fetch helper with exponential backoff on 429 / 5xx. Non-retryable client
 * errors (4xx other than 429) throw immediately. Network errors are retried.
 */
async function placesFetch(
  url: string,
  init: PlacesFetchInit,
  retry: { retries?: number; baseDelayMs?: number } = {},
): Promise<any> {
  const retries = retry.retries ?? 3;
  const baseDelay = retry.baseDelayMs ?? 500;
  const { fieldMask, headers: extraHeaders, ...rest } = init;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': apiKey(),
    'X-Goog-FieldMask': fieldMask,
    ...(extraHeaders as Record<string, string> | undefined),
  };

  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    let res: Response;
    try {
      res = await fetch(url, { ...rest, headers });
    } catch (err) {
      lastErr = err; // network-level failure → retry
      if (attempt < retries) {
        await sleep(baseDelay * 2 ** attempt);
        continue;
      }
      break;
    }

    if (res.ok) return res.json();

    const body = await safeText(res);
    if (res.status === 429 || res.status >= 500) {
      lastErr = new Error(`Places API ${res.status}: ${body}`);
      if (attempt < retries) {
        await sleep(baseDelay * 2 ** attempt);
        continue;
      }
      break;
    }

    // Non-retryable client error.
    throw new Error(`Places API ${res.status}: ${body}`);
  }

  throw lastErr instanceof Error
    ? lastErr
    : new Error('Places API request failed');
}

function mapSearchPlace(p: any): PlaceSearchResult {
  return {
    placeId: p.id,
    name: p.displayName?.text ?? '',
    lat: p.location?.latitude,
    lng: p.location?.longitude,
    rating: p.rating,
    reviewsCount: p.userRatingCount,
    primaryType: p.primaryType,
    businessStatus: p.businessStatus,
  };
}

function mapDetails(p: any): PlaceDetails {
  return {
    placeId: p.id,
    name: p.displayName?.text ?? '',
    website: p.websiteUri,
    phone: p.internationalPhoneNumber,
    lat: p.location?.latitude,
    lng: p.location?.longitude,
    rating: p.rating,
    reviewsCount: p.userRatingCount,
    primaryType: p.primaryType,
    businessStatus: p.businessStatus,
    photos: (p.photos ?? []).map((ph: any) => ({
      name: ph.name,
      widthPx: ph.widthPx,
      heightPx: ph.heightPx,
    })),
    addressComponents: (p.addressComponents ?? []).map((a: any) => ({
      longText: a.longText,
      shortText: a.shortText,
      types: a.types ?? [],
    })),
    formattedAddress: p.formattedAddress,
  };
}

/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Type-based Nearby Search within a single tile. Returns up to 20 results
 * (the API maximum for searchNearby; no pagination). Records one search call.
 */
export async function searchNearby(
  tile: ScanTile,
  includedType: string,
  budget: Budget,
  opts: { maxResults?: number } = {},
): Promise<PlaceSearchResult[]> {
  budget.recordGoogle('search');

  const body = {
    includedTypes: [includedType],
    maxResultCount: Math.min(opts.maxResults ?? 20, 20),
    rankPreference: 'POPULARITY',
    locationRestriction: {
      circle: {
        center: { latitude: tile.lat, longitude: tile.lng },
        radius: tile.radiusM,
      },
    },
    languageCode: scraperConfig.languageCode,
    regionCode: scraperConfig.regionCode,
  };

  const json = await placesFetch(`${PLACES_BASE}/places:searchNearby`, {
    method: 'POST',
    body: JSON.stringify(body),
    fieldMask: SEARCH_FIELD_MASK,
  });

  return (json.places ?? []).map(mapSearchPlace);
}

/**
 * Keyword Text Search within a tile, paginated up to `maxPages × 20` results
 * (default 3 pages = 60). Used for categories with no native Google type
 * (trattoria, kebab, street food). Records one search call per page fetched,
 * and stops early if the budget is exhausted mid-pagination.
 *
 * Note: searchText only supports a *circular* locationBias (not a strict
 * restriction), so results may bleed slightly outside the tile — dedup.ts
 * (batch 2) collapses any overlap by google_place_id.
 */
export async function searchText(
  tile: ScanTile,
  textQuery: string,
  budget: Budget,
  opts: { includedType?: string; maxPages?: number } = {},
): Promise<PlaceSearchResult[]> {
  const maxPages = opts.maxPages ?? 3;
  const results: PlaceSearchResult[] = [];
  let pageToken: string | undefined;

  for (let page = 0; page < maxPages; page++) {
    if (!budget.canSpendGoogle()) break;
    budget.recordGoogle('search');

    const body: Record<string, unknown> = {
      textQuery,
      maxResultCount: 20,
      locationBias: {
        circle: {
          center: { latitude: tile.lat, longitude: tile.lng },
          radius: tile.radiusM,
        },
      },
      languageCode: scraperConfig.languageCode,
      regionCode: scraperConfig.regionCode,
    };
    if (opts.includedType) body.includedType = opts.includedType;
    if (pageToken) body.pageToken = pageToken;

    const json = await placesFetch(`${PLACES_BASE}/places:searchText`, {
      method: 'POST',
      body: JSON.stringify(body),
      fieldMask: `${SEARCH_FIELD_MASK},nextPageToken`,
    });

    for (const p of json.places ?? []) results.push(mapSearchPlace(p));

    pageToken = json.nextPageToken;
    if (!pageToken) break;
  }

  return results;
}

/**
 * Place Details for a single place. Records one details call.
 */
export async function placeDetails(
  placeId: string,
  budget: Budget,
): Promise<PlaceDetails> {
  budget.recordGoogle('details');

  const json = await placesFetch(
    `${PLACES_BASE}/places/${encodeURIComponent(placeId)}`,
    { method: 'GET', fieldMask: DETAILS_FIELD_MASK },
  );

  return mapDetails(json);
}

/**
 * Build a Place Photo media URL from a photo resource name.
 *
 * IMPORTANT: the URL embeds the API key, so it must NOT be served to the
 * browser as-is. It is returned for server-side use / proxying only. Whether
 * to persist raw keyed URLs vs. the bare photo resource name (proxied on
 * demand) is decided in the normalize step (batch 2). Building this string
 * does NOT consume the call budget — billing occurs only when it's fetched.
 */
export function photoMediaUrl(
  photoName: string,
  maxWidthPx: number = scraperConfig.photoMaxWidthPx,
): string {
  const params = new URLSearchParams({
    key: apiKey(),
    maxWidthPx: String(maxWidthPx),
  });
  return `${PLACES_BASE}/${photoName}/media?${params.toString()}`;
}
