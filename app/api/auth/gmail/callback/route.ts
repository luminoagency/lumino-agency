/**
 * GET /api/auth/gmail/callback
 * Callback OAuth Gmail: riceve il `code`, lo scambia per i token, li cifra
 * e li salva in gmail_oauth_tokens. Poi torna alla pagina di stato.
 *
 * Accesso: questo endpoint è raggiungibile solo via redirect Google dopo
 * che un super-admin ha avviato il flow da /lumino-admin/gmail-auth.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { encryptPassword } from '@/lib/outreach/crypto'
import { exchangeCodeForTokens, getProfileEmail } from '@/lib/integrations/gmail-oauth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function back(url: string, params: Record<string, string>): NextResponse {
  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(url).origin
  const dest = new URL('/lumino-admin/gmail-auth', origin)
  for (const [k, v] of Object.entries(params)) dest.searchParams.set(k, v)
  return NextResponse.redirect(dest)
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const error = req.nextUrl.searchParams.get('error')

  if (error) return back(req.url, { error })
  if (!code) return back(req.url, { error: 'Codice mancante' })

  try {
    const tokens = await exchangeCodeForTokens(code)
    const accountEmail = await getProfileEmail(tokens.accessToken)

    const admin = createAdminClient()
    const payload: any = {
      account_email: accountEmail,
      access_token: encryptPassword(tokens.accessToken),
      expires_at: tokens.expiresAt,
      updated_at: new Date().toISOString(),
    }
    // Il refresh_token arriva solo al primo consenso: non sovrascriverlo con null.
    if (tokens.refreshToken) payload.refresh_token = encryptPassword(tokens.refreshToken)

    const { error: dbErr } = await admin
      .from('gmail_oauth_tokens')
      .upsert(payload, { onConflict: 'account_email' })
    if (dbErr) return back(req.url, { error: dbErr.message })

    return back(req.url, { connected: '1' })
  } catch (e: any) {
    return back(req.url, { error: e?.message || 'Errore OAuth' })
  }
}
