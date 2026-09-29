import { NextResponse, type NextRequest } from 'next/server'
import {
  COUNTRY_TO_LOCALE,
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  isBot,
  isLocale,
  localeFromAcceptLanguage,
  readCountry,
  splitLocale,
  type GeoRead,
} from '@/lib/i18n/config'

// Solo rotte protette. NIENTE redirect "guest-only" su /login,/register:
// quel ramo, combinato col controllo reale getUser() nelle pagine protette,
// causava un loop infinito (ERR_TOO_MANY_REDIRECTS) quando il cookie sb-*
// è presente ma non valido, o l'utente è loggato ma senza sito.
// La presenza del cookie qui è solo un gate ottimistico per evitare di
// renderizzare la pagina a chi non ha proprio sessione; la verifica vera
// la fa la pagina con supabase.auth.getUser().
const PROTECTED_PREFIXES = ['/admin', '/lumino-admin', '/lumino-dashboard']

/**
 * I percorsi che ESISTONO in tre lingue.
 *
 * È una lista di inclusione e non di esclusione, di proposito: una pagina
 * entra nel giro delle lingue solo quando è stata davvero tradotta e spostata
 * sotto app/[locale]. Con una lista di esclusione, ogni rotta nuova sarebbe
 * localizzata per default e risponderebbe 404 finché qualcuno non se ne
 * ricorda — l'errore lo scoprirebbe un visitatore, non noi.
 *
 * Area riservata, pagamento, autenticazione, demo e siti dei clienti non
 * entreranno mai: sono applicazioni, non contenuto indicizzabile.
 */
const LOCALISED = ['/']

function isLocalised(path: string): boolean {
  return LOCALISED.includes(path)
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  /* ── 0. L'area staff, che ha un suo login ──────────────────────────────── */
  /* Non entra in PROTECTED_PREFIXES perché quel ramo rimanda a /login, che è il
     login dei clienti: uno dello staff ci finirebbe dentro e non troverebbe la
     sua porta. Anche qui la presenza del cookie è solo un gate ottimistico —
     la verifica vera, compreso il "questo utente è davvero staff", la fa
     app/staff/(dash)/layout.tsx. */
  if (pathname === '/staff' || pathname.startsWith('/staff/')) {
    /* Le tre porte che si aprono senza sessione. `/staff/offline` ci sta
       perché è la pagina che il service worker mostra quando la rete non c'è:
       se fosse dietro al gate, il worker si troverebbe in cache la pagina di
       login al posto suo — cioè, senza rete, una schermata che chiede di
       accedere e non può farlo. Dentro non c'è nessun dato. */
    if (
      pathname === '/staff/login' ||
      pathname === '/staff/logout' ||
      pathname === '/staff/offline'
    ) {
      return NextResponse.next()
    }

    /* L'anteprima di sviluppo non esiste in produzione, e lo si decide **qui**,
       prima di qualsiasi altra cosa. La pagina ha già il suo `notFound()` e i
       due lucchetti di `ANTEPRIMA`: questo è il terzo, e non è ridondanza
       inutile. Gli altri due stanno dentro il rendering, cioè dopo che Next ha
       risolto la rotta e caricato il modulo dei dati finti; questo taglia la
       richiesta al bordo, dove NODE_ENV in produzione vale 'production' e non
       c'è nessuna variabile che qualcuno possa impostare per sbaglio su Vercel
       per cambiarne l'esito. Una porta su un'area riservata merita di essere
       chiusa nel punto più esterno che si ha. */
    if (pathname.startsWith('/staff/anteprima') && process.env.NODE_ENV === 'production') {
      return new NextResponse(null, { status: 404 })
    }
    /* Anteprima di sviluppo: le stesse pagine senza sessione, coi dati finti.
       I due lucchetti sono ripetuti qui alla lettera invece di importarli da
       lib/staff/db.ts, che tira dentro next/headers e il client Supabase —
       roba che nell'edge runtime del middleware non deve entrare. */
    if (process.env.NODE_ENV !== 'production' && process.env.STAFF_DEV_PREVIEW === '1') {
      return NextResponse.next()
    }
    if (hasSessionCookie(request)) return NextResponse.next()

    const url = request.nextUrl.clone()
    url.pathname = '/staff/login'
    url.search = ''
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  /* ── 1. Il gate dell'area riservata, invariato ─────────────────────────── */
  let isProtected = false
  for (const p of PROTECTED_PREFIXES) {
    if (pathname === p || pathname.startsWith(p + '/')) { isProtected = true; break }
  }

  if (isProtected) {
    if (!hasSessionCookie(request)) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.search = ''
      url.searchParams.set('next', pathname)
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  /* ── 2. La lingua ──────────────────────────────────────────────────────── */

  const { locale: urlLocale, path: barePath } = splitLocale(pathname)
  const hasPrefix = pathname === `/${urlLocale}` || pathname.startsWith(`/${urlLocale}/`)

  /* Un percorso col prefisso ma non tradotto — /fr/login — non esiste: non
     va riscritto, va lasciato cadere sulle rotte normali. */
  if (!isLocalised(barePath)) return NextResponse.next()

  /* Le pagine vivono TUTTE sotto app/[locale]. L'inglese però sta sulla
     radice, senza prefisso: la riscrittura interna manda / su /en senza che
     l'indirizzo cambi. È il motivo per cui non serve una copia inglese delle
     rotte. */
  const rewriteTo = (locale: string) => {
    const url = request.nextUrl.clone()
    url.pathname = `/${locale}${barePath === '/' ? '' : barePath}`
    return url
  }

  /* I bot ricevono ESATTAMENTE la pagina che hanno chiesto.
     È la regola che tiene in piedi tutta l'indicizzazione multilingua: se
     Googlebot chiedesse la radice e si vedesse rispondere un redirect verso
     /it perché scansiona da un IP italiano, l'inglese non finirebbe mai
     nell'indice — e siccome i crawler escono da paesi diversi, ogni lingua
     rischierebbe di sparire a turno. La riscrittura invece resta: serve a
     trovare il file, non cambia l'indirizzo né risponde 3xx. */
  if (isBot(request.headers.get('user-agent'))) {
    if (hasPrefix) return NextResponse.next()
    const geo = readCountry((name) => request.headers.get(name))
    return withGeoHeaders(NextResponse.rewrite(rewriteTo(DEFAULT_LOCALE)), geo, 'bot')
  }

  /* Chi ha scritto /fr o /it a mano ha già scelto: quella scelta vince sempre
     sul paese, e si scrive nel cookie perché duri anche dopo. */
  if (hasPrefix) {
    const response = NextResponse.next()
    if (request.cookies.get(LOCALE_COOKIE)?.value !== urlLocale) {
      response.cookies.set(LOCALE_COOKIE, urlLocale, {
        maxAge: LOCALE_COOKIE_MAX_AGE,
        path: '/',
        sameSite: 'lax',
      })
    }
    return response
  }

  /* Da qui in giù siamo su un percorso senza prefisso, cioè in inglese. */

  /* Il cookie batte il paese: se qualcuno ha già scelto una lingua, il
     rilevamento non deve più intromettersi. Ed è anche ciò che impedisce di
     restare intrappolati — chi passa all'inglese dal selettore si porta un
     cookie 'en' e non viene più rimbalzato su /fr al prossimo ingresso. */
  const saved = request.cookies.get(LOCALE_COOKIE)?.value
  if (isLocale(saved)) {
    const geo = readCountry((name) => request.headers.get(name))
    const response =
      saved === DEFAULT_LOCALE
        ? NextResponse.rewrite(rewriteTo(DEFAULT_LOCALE))
        : NextResponse.redirect(rewriteTo(saved))
    return withGeoHeaders(response, geo, 'cookie')
  }

  /* Primo ingresso, nessuna preferenza salvata. Il paese decide; la lingua del
     browser è il secondo segnale, non il primo — un marocchino col telefono in
     inglese sta comunque comprando in Marocco. */
  const geo = readCountry((name) => request.headers.get(name))
  const fromCountry = geo.country ? COUNTRY_TO_LOCALE[geo.country] : undefined
  const fromLanguage = localeFromAcceptLanguage(request.headers.get('accept-language'))
  const target = fromCountry || fromLanguage || DEFAULT_LOCALE

  const response =
    target === DEFAULT_LOCALE
      ? NextResponse.rewrite(rewriteTo(DEFAULT_LOCALE))
      : NextResponse.redirect(rewriteTo(target))

  if (target !== DEFAULT_LOCALE) {
    response.cookies.set(LOCALE_COOKIE, target, {
      maxAge: LOCALE_COOKIE_MAX_AGE,
      path: '/',
      sameSite: 'lax',
    })
  }

  return withGeoHeaders(response, geo, fromCountry ? 'country' : fromLanguage ? 'language' : 'default')
}

/**
 * Due cose sulla risposta, e la seconda è quella che conta.
 *
 * `x-lumino-geo` dice, guardando una sola risposta, quale header ha risposto e
 * cosa se n'è concluso. Senza, per capire perché dal Marocco arrivava
 * l'italiano bisognava indovinare: non si vede da fuori cosa riceve il
 * middleware.
 *
 * `Cache-Control: private, no-store` è la parte seria. Questa risposta dipende
 * dal PAESE di chi la chiede e dal suo cookie, ma l'indirizzo è sempre lo
 * stesso — la radice. Una cache condivisa che ne salvasse una copia la
 * servirebbe a tutti: basta un italiano per primo e da lì in poi i marocchini
 * ricevono l'italiano, che è esattamente il guasto da evitare. Cloudflare oggi
 * risponde `cf-cache-status: DYNAMIC` e non la sta salvando, ma dipende dalla
 * configurazione e va detto qui, non sperato là.
 *
 * Le pagine con prefisso — /fr, /it — non passano di qui e restano cacheabili:
 * il loro indirizzo dice già quale lingua sono.
 */
function withGeoHeaders(response: NextResponse, geo: GeoRead, decidedBy: string): NextResponse {
  response.headers.set('x-lumino-geo', `${geo.country ?? 'none'}/${geo.source}/${decidedBy}`)
  response.headers.set('Cache-Control', 'private, no-store')
  return response
}

/** C'è un cookie di sessione Supabase? Non se sia valido: solo se c'è. */
function hasSessionCookie(request: NextRequest): boolean {
  const all = request.cookies.getAll()
  for (let i = 0; i < all.length; i++) {
    const n = all[i].name
    if (n.indexOf('sb-') === 0 && n.indexOf('auth-token') >= 0) return true
  }
  return false
}

export const config = {
  /* Tutto tranne gli statici e le API: la lingua si decide sulle pagine.
     Escludere qui costa meno che entrare nel middleware e uscirne subito per
     ogni immagine e ogni chunk.

     `staff-sw.js` è il service worker dell'area: sta in radice per poter
     governare anche `/staff` (un worker governa solo la sua cartella), e deve
     arrivare al browser così com'è, senza il `no-store` che il middleware
     mette su tutto.

     `staff/stanza.webp` è l'altra eccezione che non è una cartella: è la
     fotografia di sfondo dell'area, e sta sotto `/staff/` perché è lì che
     appartiene. Senza questa riga il gate qui sopra la scambiava per una pagina
     riservata e la rimandava al login — cioè **la pagina di login restava senza
     sfondo**, perché chi la guarda per definizione non ha una sessione. Non
     protegge niente tenerla dentro: è una stanza vuota. */
  matcher: ['/((?!api|_next/static|_next/image|favicon|icon-|apple-touch-icon|og-image|works/|motion/|pwa/|staff-sw\.js|staff/stanza\.webp|robots.txt|sitemap.xml|site\.webmanifest|manifest.webmanifest).*)'],
}
