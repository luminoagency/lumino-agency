import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Uscita.
 *
 * POST e non GET: un link GET che chiude la sessione lo può far premere
 * chiunque da fuori (o un prefetch del browser), e ci si ritrova sloggati senza
 * aver toccato niente.
 */
export async function POST(request: NextRequest) {
  const supabase = createClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/staff/login', request.url))
}
