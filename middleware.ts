import { NextRequest, NextResponse } from 'next/server'

/**
 * Edge-safe middleware: fa solo gate per cookie presence.
 *
 * Pattern raccomandato Next 14: middleware veloce (no Supabase calls in Edge,
 * perché @supabase/ssr trascina codice che usa __dirname → ReferenceError su Edge).
 * La validazione vera (token decode, getUser) avviene a livello di Server Component
 * dove abbiamo l'intero runtime Node.
 *
 * Risultato: middleware lascia passare se c'è un cookie sb-*-auth-token, poi
 * la page chiama getUser() che valida sul server. Se il token è scaduto/falso,
 * la page redirige a /login.
 */

const ADMIN_OPEN_FOR_PREVIEW = process.env.NEXT_PUBLIC_ADMIN_OPEN === '1'
// /lumino-admin è sempre gated (super-admin only), a prescindere dal preview flag
const PROTECTED_PREFIXES = ADMIN_OPEN_FOR_PREVIEW ? ['/lumino-admin'] : ['/admin', '/lumino-admin']
const GUEST_ONLY = ['/login', '/register']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isProtected = PROTECTED_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'))
  const isGuestOnly = GUEST_ONLY.some(p => pathname === p)

  if (!isProtected && !isGuestOnly) return NextResponse.next()

  // Presenza cookie sessione Supabase (formato sb-<project-ref>-auth-token)
  const hasSession = request.cookies.getAll().some(c =>
    c.name.startsWith('sb-') && c.name.includes('auth-token'),
  )

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
