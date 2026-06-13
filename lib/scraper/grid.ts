import { scraperConfig } from './config';
import type { BBox, ScanTile } from './types';

/**
 * Intra-city tiling. A city's bounding box (scan_state.bbox) is divided into a
 * deterministic, row-major grid of search points so the nightly scraper can
 * cover the whole city across many runs, resuming from scan_state.tile_cursor.
 */

/** Kilometers per degree of latitude (roughly constant). */
const KM_PER_DEG_LAT = 110.574;

/** Kilometers per degree of longitude shrinks toward the poles. */
function kmPerDegLng(lat: number): number {
  return 111.32 * Math.cos((lat * Math.PI) / 180);
}

/**
 * Produce the ordered list of search tiles covering a bbox. Spacing defaults to
 * config.tileStepKm; each tile uses config.searchRadiusM. Ordering is
 * south→north, west→east, so a given bbox always yields the same sequence and
 * tile_cursor resumes deterministically.
 */
export function generateTiles(
  bbox: BBox,
  opts: { stepKm?: number; radiusM?: number } = {},
): ScanTile[] {
  const stepKm = opts.stepKm ?? scraperConfig.tileStepKm;
  const radiusM = opts.radiusM ?? scraperConfig.searchRadiusM;
  const latStepDeg = stepKm / KM_PER_DEG_LAT;

  const tiles: ScanTile[] = [];
  let index = 0;

  for (let lat = bbox.min_lat; lat <= bbox.max_lat; lat += latStepDeg) {
    const lngStepDeg = stepKm / kmPerDegLng(lat);
    for (let lng = bbox.min_lng; lng <= bbox.max_lng; lng += lngStepDeg) {
      tiles.push({ index: index++, lat, lng, radiusM });
    }
  }

  return tiles;
}

/**
 * Number of tiles a bbox yields — written to scan_state.tiles_total when a
 * city scan begins. (Longitude spacing varies with latitude, so this counts
 * the generated tiles rather than computing a closed form.)
 */
export function tileCount(bbox: BBox, opts: { stepKm?: number } = {}): number {
  return generateTiles(bbox, opts).length;
}
