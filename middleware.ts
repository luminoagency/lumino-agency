import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_PREFIXES = ['/admin', '/lumino-admin']
const GUEST_ONLY = ['/login', '/register']

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Trova se è una rotta gated
  let isProtected = false
  for (const p of PROTECTED_PREFIXES) {
    if (pathname === p || pathname.startsWith(p + '/')) { isProtected = true; break }
  }
  let isGuestOnly = false
  if (!isProtected) {
    for (const p of GUEST_ONLY) {
      if (pathname === p) { isGuestOnly = true; break }
    }
  }

  if (!isProtected && !isGuestOnly) return NextResponse.next()

  // Cookie presence check (Supabase session cookie nome: sb-<projectref>-auth-token)
  let hasSession = false
  const all = request.cookies.getAll()
  for (let i = 0; i < all.length; i++) {
    const n = all[i].name
    if (n.indexOf('sb-') === 0 && n.indexOf('auth-token') >= 0) { hasSession = true; break }
  }

  if (isProtected && !hasSession) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }
  if (isGuestOnly && hasSession) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin'
    url.search = ''
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/lumino-admin', '/lumino-admin/:path*', '/login', '/register'],
}
