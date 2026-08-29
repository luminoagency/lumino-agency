import { NextResponse, type NextRequest } from 'next/server'
import {
  COUNTRY_TO_LOCALE,
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  isBot,
  isLocale,
  localeFromAcceptLanguage,
  splitLocale,
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

  /* ── 1. Il gate dell'area riservata, invariato ─────────────────────────── */
  let isProtected = false
  for (const p of PROTECTED_PREFIXES) {
    if (pathname === p || pathname.startsWith(p + '/')) { isProtected = true; break }
  }

  if (isProtected) {
    let hasSession = false
    const all = request.cookies.getAll()
    for (let i = 0; i < all.length; i++) {
      const n = all[i].name
      if (n.indexOf('sb-') === 0 && n.indexOf('auth-token') >= 0) { hasSession = true; break }
    }

    if (!hasSession) {
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
    return hasPrefix ? NextResponse.next() : NextResponse.rewrite(rewriteTo(DEFAULT_LOCALE))
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
    if (saved === DEFAULT_LOCALE) return NextResponse.rewrite(rewriteTo(DEFAULT_LOCALE))
    return NextResponse.redirect(rewriteTo(saved))
  }

  /* Primo ingresso, nessuna preferenza salvata. Il paese decide; la lingua del
     browser è il secondo segnale, non il primo — un marocchino col telefono in
     inglese sta comunque comprando in Marocco. */
  const country = request.headers.get('x-vercel-ip-country')?.toUpperCase()
  const target =
    (country && COUNTRY_TO_LOCALE[country]) ||
    localeFromAcceptLanguage(request.headers.get('accept-language')) ||
    DEFAULT_LOCALE

  if (target === DEFAULT_LOCALE) return NextResponse.rewrite(rewriteTo(DEFAULT_LOCALE))

  const response = NextResponse.redirect(rewriteTo(target))
  response.cookies.set(LOCALE_COOKIE, target, {
    maxAge: LOCALE_COOKIE_MAX_AGE,
    path: '/',
    sameSite: 'lax',
  })
  return response
}

export const config = {
  /* Tutto tranne gli statici e le API: la lingua si decide sulle pagine.
     Escludere qui costa meno che entrare nel middleware e uscirne subito per
     ogni immagine e ogni chunk. */
  matcher: ['/((?!api|_next/static|_next/image|favicon|icon-|apple-touch-icon|og-image|works/|motion/|robots.txt|sitemap.xml|manifest.webmanifest).*)'],
}
