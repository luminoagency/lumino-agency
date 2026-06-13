/**
 * Scraper-specific TypeScript types.
 *
 * This batch (foundation + Google client) defines the config, budget,
 * tiling, category, and Places-API result types. Transform/selection/
 * enrichment types (RestaurantRow, SelectionResult, EmailResult, …) are
 * added in batch 2.
 */

/** A weighting of the four selection signals (#2). Values typically sum to 1. */
export interface ProfileWeights {
  no_site: number;
  underexposed: number;
  newly_opened: number;
  reviews: number;
}

/** Bounding box for a city, as stored in scan_state.bbox. */
export interface BBox {
  min_lat: number;
  min_lng: number;
  max_lat: number;
  max_lng: number;
}

/** A single intra-city search point produced by grid.ts. */
export interface ScanTile {
  index: number; // position in the deterministic tile sequence
  lat: number;
  lng: number;
  radiusM: number;
}

/** How a category is queried against Google Places. */
export type CategoryQuery =
  | { kind: 'type'; includedType: string } // native Google place type
  | { kind: 'keyword'; textQuery: string; includedType?: string };

/** A food & beverage category in our taxonomy. */
export interface Category {
  key: string; // internal key, e.g. 'pizzeria'
  label: string; // human-readable label
  query: CategoryQuery;
}

/** Minimal place data from a search call (cheap field mask). */
export interface PlaceSearchResult {
  placeId: string;
  name: string;
  lat?: number;
  lng?: number;
  rating?: number;
  reviewsCount?: number;
  primaryType?: string;
  businessStatus?: string;
}

/** A photo reference returned by Place Details (Places API New). */
export interface PlacePhoto {
  name: string; // photo resource name
  widthPx?: number;
  heightPx?: number;
}

/** A single component of a structured address. */
export interface PlaceAddressComponent {
  longText: string;
  shortText: string;
  types: string[];
}

/** Rich place data from Place Details (richer field mask). */
export interface PlaceDetails {
  placeId: string;
  name: string;
  website?: string;
  phone?: string;
  lat?: number;
  lng?: number;
  rating?: number;
  reviewsCount?: number;
  primaryType?: string;
  businessStatus?: string;
  photos: PlacePhoto[];
  addressComponents: PlaceAddressComponent[];
  formattedAddress?: string;
}

/** Kinds of Google Places spend the budget guard tracks. */
export type SpendKind = 'search' | 'details';

/** Summary of one nightly batch, persisted to scrape_runs (used in batch 3). */
export interface BatchSummary {
  city: string | null;
  tilesScanned: number;
  candidatesFound: number;
  newRestaurants: number;
  detailsFetched: number;
  emailsFound: number;
  apiCalls: number;
  status: 'success' | 'partial' | 'error';
  error?: string;
}

// ── Batch 2: transform / selection / enrichment ─────────────

/** Source that yielded a business email (mirrors restaurants.email_source). */
export type EmailSource =
  | 'website'
  | 'google'
  | 'facebook'
  | 'instagram'
  | 'manual';

/** Email discovery outcome (mirrors restaurants.email_status). */
export type EmailStatus = 'pending' | 'found' | 'not_found' | 'manual_review';

/**
 * An insertable restaurants row. Discovery fields are filled by normalize.ts;
 * enrichment fields are overwritten by selection/opening/email before insert.
 * snake_case to match the Supabase column names directly.
 */
export interface RestaurantRow {
  name: string;
  address: string | null;
  city: string | null;
  zone: string | null;
  category: string | null;
  stars: number | null;
  reviews_count: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  photos_urls: string[];
  google_place_id: string;
  // enrichment
  email_status: EmailStatus;
  email_source: EmailSource | null;
  newly_opened: boolean;
  opened_signal: string | null;
  priority_score: number | null;
}

/** Result of selection.scoreCandidate (#2). */
export interface SelectionResult {
  score: number; // 0–1
  reasons: string[];
}

/** Result of email.findEmail (#3). */
export interface EmailResult {
  email: string | null;
  source: EmailSource | null;
  status: EmailStatus;
}

/** Result of opening.detectOpening (#4). */
export interface OpeningResult {
  newly_opened: boolean;
  opened_signal: string | null;
}
