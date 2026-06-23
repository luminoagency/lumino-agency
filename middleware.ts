import { NextResponse, type NextRequest } from 'next/server'

// Solo rotte protette. NIENTE redirect "guest-only" su /login,/register:
// quel ramo, combinato col controllo reale getUser() nelle pagine protette,
// causava un loop infinito (ERR_TOO_MANY_REDIRECTS) quando il cookie sb-*
// è presente ma non valido, o l'utente è loggato ma senza sito.
// La presenza del cookie qui è solo un gate ottimistico per evitare di
// renderizzare la pagina a chi non ha proprio sessione; la verifica vera
// la fa la pagina con supabase.auth.getUser().
const PROTECTED_PREFIXES = ['/admin', '/lumino-admin', '/lumino-dashboard']

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  let isProtected = false
  for (const p of PROTECTED_PREFIXES) {
    if (pathname === p || pathname.startsWith(p + '/')) { isProtected = true; break }
  }
  if (!isProtected) return NextResponse.next()

  // Cookie presence check (Supabase: sb-<projectref>-auth-token[.N])
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

export const config = {
  matcher: ['/admin', '/admin/:path*', '/lumino-admin', '/lumino-admin/:path*', '/lumino-dashboard', '/lumino-dashboard/:path*'],
}
