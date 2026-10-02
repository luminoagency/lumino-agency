/**
 * Dall'indirizzo alle coordinate, sul server.
 *
 * ## Perché sul server, e perché non con una chiave
 *
 * La policy d'uso di Nominatim chiede uno `User-Agent` che identifichi
 * l'applicazione, e `User-Agent` nel browser è un *forbidden header name*: una
 * chiamata dal client violerebbe la policy senza modo di rimediare, e
 * manderebbe l'indirizzo dei clienti nei log di Nominatim un dispositivo alla
 * volta. È la stessa ragione per cui esiste `app/api/staff/geo/route.ts`, e
 * questo file è il suo gemello: quello traduce coordinate → città per il widget
 * della preghiera, questo indirizzo → coordinate per la mappa dei clienti.
 *
 * `@googlemaps/google-maps-services-js` è fra le dipendenze del repo e sarebbe
 * più preciso sui civici. Non si usa qui: vuole una chiave con una carta di
 * credito collegata, e geocodificare qualche centinaio di indirizzi all'anno
 * non giustifica un servizio a consumo che un giorno smette di funzionare
 * perché è scaduta una carta. Il giorno che i civici sbagliati diventano un
 * problema vero, qui si cambia una funzione.
 *
 * ## La ricerca è **strutturata**, non una stringa
 *
 * `?q=Via Roma 12, Jesolo` fa fare a Nominatim un'interpretazione, e con un
 * indirizzo italiano scritto come lo scrive un venditore («v.le Oriente 15/B»)
 * l'interpretazione sbaglia spesso — e quando sbaglia non torna niente, torna
 * **il centro del comune**, che è il pin approssimativo che si voleva evitare.
 * Con `street`, `city` e `country` separati Nominatim sa cosa sta leggendo, e
 * `addressdetails=1` permette di controllare *dopo* se quello che ha trovato è
 * davvero un indirizzo e non una provincia.
 *
 * ## Un risultato si accetta solo se è abbastanza preciso
 *
 * È la regola che rende questo file utile. Nominatim risponde comunque
 * qualcosa: cercando una via che non esiste a Jesolo restituisce Jesolo, con
 * `200 OK` e delle coordinate perfettamente valide. Prenderle vorrebbe dire
 * mettere il pin in mezzo al paese e **dire che è l'indirizzo del cliente** —
 * cioè esattamente il difetto da correggere, con l'aggravante di sembrare
 * risolto. Qui si guarda `addresstype`/`category`: se non è un civico, una
 * strada o un luogo nominato, la risposta vale `non_trovato` e la scheda lo
 * dice. Un buco dichiarato è meglio di un pin inventato.
 */

const NOMINATIM = 'https://nominatim.openstreetmap.org'

/* Lo stesso contatto della route del widget: se arriva un reclamo sulla
   policy, arriva a un indirizzo che esiste. */
const UA = 'LuminoStaffDashboard/1.0 (+https://bylumino.com; staff@bylumino.com)'

/**
 * I tipi di risultato abbastanza precisi da attaccarci un pin.
 *
 * `building`, `house`, `house_number` sono il civico — il caso buono.
 * `road` è la via senza civico: il pin cade sulla via, che per andare a trovare
 * un bar è giusto comunque. `amenity`, `shop`, `tourism` sono i locali che
 * OpenStreetMap conosce per nome, e per un ristorante sono spesso il risultato
 * **più** preciso del civico.
 *
 * Fuori da questo elenco restano `city`, `town`, `village`, `suburb`,
 * `postcode`, `county`, `state`: tutti centri di qualcosa di grande, cioè tutti
 * pin nel posto sbagliato.
 */
const TIPI_BUONI = new Set([
  'building',
  'house',
  'house_number',
  'road',
  'residential',
  'pedestrian',
  'amenity',
  'shop',
  'tourism',
  'leisure',
  'office',
  'place_of_worship',
])

export type GeoStato = 'ok' | 'non_trovato' | 'assente' | 'da_fare'

export interface Geocodifica {
  lat: number | null
  lng: number | null
  stato: GeoStato
}

/** I campi del cliente che fanno un indirizzo. */
export interface IndirizzoCliente {
  indirizzo?: string | null
  citta?: string | null
  zona?: string | null
  country?: string | null
}

/**
 * La firma di un indirizzo: se non cambia, non si ricerca.
 *
 * Serve a `aggiornaCliente`, che viene chiamata ogni volta che si salva la
 * scheda — anche per correggere un numero di telefono. Senza questo confronto
 * ogni salvataggio sarebbe una chiamata a Nominatim per riottenere le stesse
 * coordinate, e la policy del servizio è una richiesta al secondo.
 */
export function firmaIndirizzo(c: IndirizzoCliente): string {
  return [c.indirizzo, c.citta, c.zona, c.country]
    .map((v) => (v ?? '').trim().toLowerCase().replace(/\s+/g, ' '))
    .join('|')
}

/** C'è qualcosa da cercare? Una città sola basta, un indirizzo vuoto no. */
export function haIndirizzo(c: IndirizzoCliente): boolean {
  return Boolean((c.indirizzo ?? '').trim() || (c.citta ?? '').trim())
}

/**
 * Le coordinate di un cliente.
 *
 * Non lancia mai. Nominatim giù, in timeout o che risponde una provincia sono
 * tutti lo stesso caso dal punto di vista di chi ha premuto Salva: il cliente
 * si salva comunque e la mappa lo dirà quando le coordinate ci saranno. Far
 * fallire la creazione di un cliente perché un servizio di mappe non risponde
 * sarebbe perdere il dato che conta per avere quello che decora.
 */
export async function geocodifica(c: IndirizzoCliente): Promise<Geocodifica> {
  if (!haIndirizzo(c)) return { lat: null, lng: null, stato: 'assente' }

  const via = (c.indirizzo ?? '').trim()
  /* `zona` come ripiego della città: in questo archivio «Lido di Jesolo» sta
     spesso in `zona` e `citta` è «Jesolo» — ma capita anche il contrario, e un
     indirizzo senza nessuna delle due non si cerca. */
  const comune = (c.citta ?? '').trim() || (c.zona ?? '').trim()

  const q = new URLSearchParams({
    format: 'jsonv2',
    addressdetails: '1',
    limit: '1',
    /* Il paese lo filtra Nominatim, non noi: senza questo, «Via Roma» trova
       una Via Roma in Argentina prima di quella a due chilometri. */
    countrycodes: (c.country ?? 'IT').toLowerCase(),
  })
  if (via) q.set('street', via)
  if (comune) q.set('city', comune)

  const riga = await cerca(q)

  /* Secondo tentativo **solo** se il primo è andato a vuoto e c'era un civico:
     un indirizzo scritto con la frazione dentro la via («Via Roma 12, Lido»)
     fa fallire la ricerca strutturata, e la stessa stringa in `q` libero la
     trova. Non è il contrario del commento in testa: la ricerca libera è il
     ripiego, non la prima scelta, e il controllo sul tipo di risultato vale
     identico — quindi non può far entrare un pin sul centro del paese. */
  const trovata = riga ?? (via && comune ? await cercaLibera(`${via}, ${comune}`, c.country) : null)

  if (!trovata) return { lat: null, lng: null, stato: 'non_trovato' }

  const lat = Number(trovata.lat)
  const lng = Number(trovata.lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { lat: null, lng: null, stato: 'non_trovato' }
  }

  /* Il controllo che evita il pin inventato. Se chi cercava aveva solo la
     città, un risultato «città» è esatto e si prende: il pin sul comune è
     l'informazione vera, non un'approssimazione di qualcos'altro. */
  const tipo = (trovata.addresstype || trovata.category || '').toLowerCase()
  const abbastanzaPreciso = via ? TIPI_BUONI.has(tipo) : true
  if (!abbastanzaPreciso) return { lat: null, lng: null, stato: 'non_trovato' }

  return { lat, lng, stato: 'ok' }
}

/* ─────────────────────────────────────────────────────────────────────────── */

interface RigaNominatim {
  lat?: string
  lon?: string
  addresstype?: string
  category?: string
  display_name?: string
}

async function cerca(q: URLSearchParams): Promise<RigaNominatim | null> {
  return primo(`${NOMINATIM}/search?${q.toString()}`)
}

async function cercaLibera(testo: string, country?: string | null): Promise<RigaNominatim | null> {
  const q = new URLSearchParams({
    format: 'jsonv2',
    addressdetails: '1',
    limit: '1',
    countrycodes: (country ?? 'IT').toLowerCase(),
    q: testo,
  })
  return primo(`${NOMINATIM}/search?${q.toString()}`)
}

async function primo(indirizzo: string): Promise<RigaNominatim | null> {
  try {
    const r = await fetch(indirizzo, {
      headers: { 'User-Agent': UA, 'Accept-Language': 'it' },
      /* `no-store`: la cache di Next terrebbe una copia di un dato che qui si
         chiede una volta per cliente e poi si conserva in una colonna. */
      cache: 'no-store',
      signal: AbortSignal.timeout(6000),
    })
    if (!r.ok) return null
    const righe = (await r.json()) as RigaNominatim[]
    return Array.isArray(righe) && righe.length ? righe[0] : null
  } catch {
    return null
  }
}

/**
 * I link per andarci davvero.
 *
 * Due URL `https://` e non gli schemi nativi (`comgooglemaps://`, `maps://`), e
 * la ragione è che questi funzionano in tutti e tre i casi: su Android e iOS il
 * sistema li riconosce come *universal link* e apre l'app installata, su un
 * desktop aprono il sito. Uno schema nativo su un computer non apre niente e
 * lascia la pagina ferma, che è il modo peggiore di non funzionare — non si
 * capisce nemmeno che si è premuto.
 *
 * Il nome va solo nel link Apple: `maps.apple.com` lo usa come etichetta del
 * segnaposto, mentre `ll` tiene il punto esatto. Google con `api=1` vuole
 * `query` come coordinate — mettendoci il nome rifarebbe una ricerca, e una
 * ricerca può finire sul locale omonimo di un'altra città.
 */
export function linkMappe(lat: number, lng: number, nome: string) {
  const ll = `${lat},${lng}`
  return {
    google: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ll)}`,
    apple: `https://maps.apple.com/?q=${encodeURIComponent(nome)}&ll=${encodeURIComponent(ll)}`,
  }
}
