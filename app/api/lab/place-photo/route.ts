import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SUPER_ADMINS = ['bylumino06@gmail.com']

/**
 * Proxy per le foto di Google Places: la media URL incorpora la API key,
 * quindi NON può essere servita al browser. Qui la fetch avviene server-side.
 * Gated al super-admin (le img sono renderizzate solo in /lumino-admin/lab).
 */
export async function GET(req: NextRequest) {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user || !SUPER_ADMINS.includes(user.email || '')) {
    return new NextResponse('forbidden', { status: 403 })
  }

  const name = req.nextUrl.searchParams.get('name')
  if (!name || !name.startsWith('places/')) {
    return new NextResponse('bad request', { status: 400 })
  }

  const key = process.env.GOOGLE_MAPS_API_KEY
  if (!key) return new NextResponse('no key', { status: 500 })

  const w = req.nextUrl.searchParams.get('w') || '600'
  const upstream = `https://places.googleapis.com/v1/${name}/media?maxWidthPx=${encodeURIComponent(w)}&key=${key}`

  try {
    const r = await fetch(upstream)
    if (!r.ok) return new NextResponse('upstream error', { status: 502 })
    const buf = await r.arrayBuffer()
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': r.headers.get('content-type') || 'image/jpeg',
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch {
    return new NextResponse('fetch failed', { status: 502 })
  }
}
