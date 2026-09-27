import { NextResponse } from 'next/server'
import { requireStaff } from '@/lib/staff/auth'

/**
 * Il traduttore fra coordinate e nomi di città.
 *
 * Esiste per **tre** ragioni, in ordine di importanza:
 *
 * 1. La policy d'uso di Nominatim chiede un `User-Agent` che identifichi
 *    l'applicazione e un contatto. Nel browser `User-Agent` è un *forbidden
 *    header name*: `fetch` lo ignora. Quindi una chiamata diretta dal widget
 *    violerebbe la policy senza che ci sia modo di rimediare.
 * 2. Dal browser ogni dispositivo comparirebbe nei log di Nominatim col proprio
 *    indirizzo IP e la propria posizione. Da qui compare un server solo.
 * 3. La cache. Nominatim chiede al massimo una richiesta al secondo: qui le
 *    coordinate arrivano già arrotondate al chilometro dal chiamante, e la
 *    risposta resta in memoria un giorno. Sette persone che lavorano nella
 *    stessa zona fanno una richiesta, non settemila.
 *
 * È dietro `requireStaff()`: un proxy di geocoding aperto è un proxy di
 * geocoding di qualcun altro, e la fattura della policy la paghiamo noi.
 */

const NOMINATIM = 'https://nominatim.openstreetmap.org'

/* Il contatto vero, come chiede la policy. Se un giorno arriva un reclamo,
   arriva a un indirizzo che esiste. */
const UA = 'LuminoStaffDashboard/1.0 (+https://bylumino.com; staff@bylumino.com)'

/** Un giorno: una città non cambia nome, e i nostri spostamenti nemmeno. */
const TTL = 86_400_000

/**
 * La cache è in memoria del processo, non in Redis e non in un cookie.
 *
 * Su Vercel free ogni istanza fredda riparte vuota, e va benissimo: non è una
 * cache di correttezza, è un tampone per non bussare a Nominatim dieci volte
 * mentre qualcuno apre dieci pagine. Il tetto sulle voci c'è perché un modulo
 * che cresce senza limiti in un processo che vive giorni è una perdita di
 * memoria, anche quando le voci sono minuscole.
 */
const cache = new Map<string, { at: number; body: unknown }>()
const MAX_VOCI = 500

function dallaCache(chiave: string): unknown | null {
  const v = cache.get(chiave)
  if (!v) return null
  if (Date.now() - v.at > TTL) {
    cache.delete(chiave)
    return null
  }
  return v.body
}

function inCache(chiave: string, body: unknown): void {
  if (cache.size >= MAX_VOCI) {
    /* La voce più vecchia inserita: la Map conserva l'ordine di inserimento,
       quindi la prima chiave è la prima entrata. Non è una LRU vera e non serve
       che lo sia. */
    const prima = cache.keys().next().value
    if (prima !== undefined) cache.delete(prima)
  }
  cache.set(chiave, { at: Date.now(), body })
}

export async function GET(req: Request) {
  await requireStaff()

  const url = new URL(req.url)
  const lat = Number(url.searchParams.get('lat'))
  const lng = Number(url.searchParams.get('lng'))
  const q = (url.searchParams.get('q') ?? '').trim()

  const chiave = q ? `q:${q.toLowerCase()}` : `r:${lat.toFixed(2)},${lng.toFixed(2)}`
  const pronta = dallaCache(chiave)
  if (pronta) return NextResponse.json(pronta)

  try {
    if (q) {
      if (q.length < 3) return NextResponse.json({ risultati: [] })
      const r = await chiama(
        `${NOMINATIM}/search?format=jsonv2&addressdetails=1&limit=6&q=${encodeURIComponent(q)}`,
      )
      const righe = (r as NominatimRiga[]) ?? []
      const body = {
        risultati: righe
          .map((x) => ({
            nome: nomeCitta(x),
            lat: Number(x.lat),
            lng: Number(x.lon),
          }))
          .filter((x) => x.nome && Number.isFinite(x.lat) && Number.isFinite(x.lng)),
      }
      inCache(chiave, body)
      return NextResponse.json(body)
    }

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ citta: '' })
    }

    /* `zoom=10` è il livello «città»: più fine restituirebbe il quartiere, e il
       widget direbbe «Lido di Jesolo — Pineta» dove serve «Jesolo». */
    const r = await chiama(
      `${NOMINATIM}/reverse?format=jsonv2&zoom=10&addressdetails=1&lat=${lat}&lon=${lng}`,
    )
    const body = { citta: nomeCitta(r as NominatimRiga) }
    inCache(chiave, body)
    return NextResponse.json(body)
  } catch {
    /* Nominatim giù non è un errore di questa applicazione: il widget resta
       senza il nome della città e con gli orari giusti, che è il 90% di ciò che
       serve. Un 500 qui farebbe comparire un errore in console a ogni apertura
       della dashboard. */
    return NextResponse.json(q ? { risultati: [] } : { citta: '' })
  }
}

interface NominatimRiga {
  lat?: string
  lon?: string
  name?: string
  display_name?: string
  address?: Record<string, string>
}

async function chiama(indirizzo: string): Promise<unknown> {
  const r = await fetch(indirizzo, {
    headers: { 'User-Agent': UA, 'Accept-Language': 'it' },
    /* Niente cache di Next su questa: la cache è la Map qui sopra, e quella di
       Next sarebbe una seconda copia degli stessi dati con un'altra scadenza. */
    cache: 'no-store',
    signal: AbortSignal.timeout(6000),
  })
  if (!r.ok) throw new Error(String(r.status))
  return r.json()
}

/**
 * Il nome che si mostra.
 *
 * Nominatim non ha un campo «città»: ha `city` per i comuni grandi, `town` per i
 * paesi, `village` per le frazioni e `municipality` per certi ordinamenti
 * amministrativi. Jesolo è `town`, Cavallino-Treporti è `village`: guardare solo
 * `city` vorrebbe dire che il widget non sa dove sta proprio dove lavoriamo.
 */
function nomeCitta(r: NominatimRiga | null | undefined): string {
  const a = r?.address ?? {}
  return (
    a.city ||
    a.town ||
    a.village ||
    a.municipality ||
    a.county ||
    a.state ||
    r?.name ||
    (r?.display_name ?? '').split(',')[0] ||
    ''
  ).trim()
}
