/**
 * Google Places helper focalizzato per il Lumino Lab (no Budget, no scraper coupling).
 * Usa GOOGLE_MAPS_API_KEY (già nel progetto).
 */

const PLACES_BASE = 'https://places.googleapis.com/v1'

function apiKey(): string {
  const k = process.env.GOOGLE_MAPS_API_KEY
  if (!k) throw new Error('GOOGLE_MAPS_API_KEY is not set')
  return k
}

export interface LabPlace {
  placeId: string
  name: string
  address?: string
  phone?: string
  website?: string
  lat?: number
  lng?: number
  rating?: number
  reviewsCount?: number
  primaryType?: string
  hours?: string[]
  photoNames: string[]
}

export interface Competitor {
  name: string
  rating?: number
  reviewsCount?: number
  distanceM?: number
  address?: string
  primaryType?: string
  website?: string
}

// Lumino business type → Google Places includedType (per searchNearby)
const TYPE_MAP: Record<string, string> = {
  ristorante: 'restaurant',
  barbiere: 'barber_shop',
  dentista: 'dentist',
  palestra: 'gym',
  negozio: 'store',
}

function haversine(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000
  const dLat = ((bLat - aLat) * Math.PI) / 180
  const dLng = ((bLng - aLng) * Math.PI) / 180
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return Math.round(2 * R * Math.asin(Math.sqrt(s)))
}

/** Trova il place più probabile per una query testuale (nome + città). */
export async function findPlace(query: string): Promise<LabPlace | null> {
  const fieldMask = [
    'places.id', 'places.displayName', 'places.formattedAddress', 'places.location',
    'places.rating', 'places.userRatingCount', 'places.primaryType',
    'places.internationalPhoneNumber', 'places.websiteUri',
    'places.regularOpeningHours', 'places.photos',
  ].join(',')

  let res: Response
  try {
    res = await fetch(`${PLACES_BASE}/places:searchText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey(),
        'X-Goog-FieldMask': fieldMask,
      },
      body: JSON.stringify({ textQuery: query, maxResultCount: 1, languageCode: 'it', regionCode: 'IT' }),
    })
  } catch {
    return null
  }
  if (!res.ok) return null
  const json: any = await res.json()
  const p = json?.places?.[0]
  if (!p) return null

  return {
    placeId: p.id,
    name: p.displayName?.text ?? '',
    address: p.formattedAddress,
    phone: p.internationalPhoneNumber,
    website: p.websiteUri,
    lat: p.location?.latitude,
    lng: p.location?.longitude,
    rating: p.rating,
    reviewsCount: p.userRatingCount,
    primaryType: p.primaryType,
    hours: p.regularOpeningHours?.weekdayDescriptions ?? undefined,
    photoNames: (p.photos ?? []).map((ph: any) => ph.name).filter(Boolean).slice(0, 8),
  }
}

/** I 3 competitor più vicini geograficamente (escluso il business stesso). */
export async function findCompetitors(
  lat: number,
  lng: number,
  businessTypeKey: string,
  excludePlaceId?: string,
): Promise<Competitor[]> {
  const includedType = TYPE_MAP[businessTypeKey]
  const fieldMask = [
    'places.id', 'places.displayName', 'places.formattedAddress', 'places.location',
    'places.rating', 'places.userRatingCount', 'places.primaryType', 'places.websiteUri',
  ].join(',')

  const body: any = {
    maxResultCount: 20,
    rankPreference: 'DISTANCE',
    locationRestriction: { circle: { center: { latitude: lat, longitude: lng }, radius: 4000 } },
    languageCode: 'it',
    regionCode: 'IT',
  }
  if (includedType) body.includedTypes = [includedType]

  let res: Response
  try {
    res = await fetch(`${PLACES_BASE}/places:searchNearby`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey(),
        'X-Goog-FieldMask': fieldMask,
      },
      body: JSON.stringify(body),
    })
  } catch {
    return []
  }
  if (!res.ok) return []
  const json: any = await res.json()

  const out: Competitor[] = []
  for (const p of json?.places ?? []) {
    if (excludePlaceId && p.id === excludePlaceId) continue
    const pLat = p.location?.latitude
    const pLng = p.location?.longitude
    out.push({
      name: p.displayName?.text ?? '',
      rating: p.rating,
      reviewsCount: p.userRatingCount,
      distanceM: pLat != null && pLng != null ? haversine(lat, lng, pLat, pLng) : undefined,
      address: p.formattedAddress,
      primaryType: p.primaryType,
      website: p.websiteUri,
    })
    if (out.length >= 6) break
  }
  out.sort((a, b) => (a.distanceM ?? 1e9) - (b.distanceM ?? 1e9))
  return out.slice(0, 3)
}
