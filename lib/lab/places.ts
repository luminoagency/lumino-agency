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

/** Normalizza un URL al suo dominio "nudo" (senza protocollo, www, path, porta). */
export function domainOf(url?: string | null): string | null {
  if (!url) return null
  let u = url.trim().toLowerCase()
  if (!u) return null
  u = u.replace(/^https?:\/\//, '').replace(/^www\./, '')
  u = u.split('/')[0].split('?')[0].split('#')[0].split(':')[0]
  return u || null
}

function mapPlace(p: any): LabPlace {
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

export interface FindPlaceInput {
  businessName: string
  websiteUrl?: string   // se presente → match per DOMINIO (evita omonimi)
  address?: string      // bias geografico opzionale
}

/**
 * Trova il place Google più probabile.
 *
 * URL-aware (fix omonimi): se `websiteUrl` è fornito, la query include il dominio
 * e i risultati vengono filtrati preferendo quello il cui sito ha lo STESSO dominio.
 * Se nessun risultato combacia col dominio → ritorna null (meglio nessun dato che
 * l'attività sbagliata: es. "Hotel Aurora" Abano vs Sperlonga). Senza websiteUrl
 * mantiene il vecchio comportamento (miglior match per nome).
 */
export async function findPlace(input: string | FindPlaceInput): Promise<LabPlace | null> {
  const opts: FindPlaceInput = typeof input === 'string' ? { businessName: input } : input
  const domain = domainOf(opts.websiteUrl)
  const textQuery = [opts.businessName, domain, opts.address].filter(Boolean).join(' ')

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
      // Con dominio cerchiamo tra più candidati per poterli filtrare; senza, il top match.
      body: JSON.stringify({ textQuery, maxResultCount: domain ? 5 : 1, languageCode: 'it', regionCode: 'IT' }),
    })
  } catch {
    return null
  }
  if (!res.ok) return null
  const json: any = await res.json()
  const places: any[] = json?.places ?? []
  if (!places.length) return null

  // Con dominio noto: accetta SOLO un match di dominio (niente omonimi sbagliati).
  if (domain) {
    const matched = places.find(p => domainOf(p.websiteUri) === domain)
    return matched ? mapPlace(matched) : null
  }

  return mapPlace(places[0])
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
