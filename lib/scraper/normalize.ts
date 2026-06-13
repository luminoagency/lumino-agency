import { scraperConfig } from './config';
import type {
  PlaceAddressComponent,
  PlaceDetails,
  PlaceSearchResult,
  RestaurantRow,
} from './types';

/**
 * Map a Google search hit + Place Details into an insertable restaurants row.
 * Pure function — no I/O. Enrichment fields (email/opening/selection) get safe
 * defaults here and are overwritten by the orchestrator before insert.
 */

/** First component whose `types` include any of the requested types. */
function pickComponent(
  components: PlaceAddressComponent[],
  wanted: string[],
): string | null {
  for (const want of wanted) {
    const hit = components.find((c) => c.types.includes(want));
    if (hit) return hit.longText;
  }
  return null;
}

export function toRestaurantRow(
  search: PlaceSearchResult,
  details: PlaceDetails,
  opts: { category?: string } = {},
): RestaurantRow {
  const components = details.addressComponents;

  const city = pickComponent(components, [
    'locality',
    'postal_town',
    'administrative_area_level_3',
    'administrative_area_level_2',
  ]);

  const zone = pickComponent(components, [
    'sublocality',
    'sublocality_level_1',
    'neighborhood',
  ]);

  // Store bare photo resource names (not keyed media URLs) to avoid persisting
  // the API key in the DB. A server-side proxy builds usable URLs on demand.
  const photos_urls = details.photos
    .slice(0, scraperConfig.maxPhotosPerPlace)
    .map((p) => p.name);

  return {
    name: details.name || search.name,
    address: details.formattedAddress ?? null,
    city,
    zone,
    category: opts.category ?? details.primaryType ?? search.primaryType ?? null,
    stars: details.rating ?? search.rating ?? null,
    reviews_count: details.reviewsCount ?? search.reviewsCount ?? null,
    phone: details.phone ?? null,
    email: null,
    website: details.website ?? null,
    photos_urls,
    google_place_id: details.placeId || search.placeId,
    // enrichment defaults — overwritten downstream
    email_status: 'pending',
    email_source: null,
    newly_opened: false,
    opened_signal: null,
    priority_score: null,
  };
}
