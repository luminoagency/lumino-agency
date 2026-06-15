import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * OAuth / magic-link / password-reset callback.
 *
 * Supabase manda al cliente un link con `?code=...`. Qui scambiamo quel code
 * per una sessione vera (cookie httpOnly), poi rediriamo al `next` indicato
 * (es. `/reset-password` per il flow di recupero password, `/admin` di default).
 *
 * Senza questo handler, l'utente arriva alla pagina di destinazione SENZA sessione
 * e qualsiasi chiamata a `supabase.auth.updateUser()` fallisce con "Auth session missing!".
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') || '/admin'

  // Whitelist dei redirect interni (evita open-redirect attacks)
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/admin'

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${safeNext}`)
    }
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent('Link non valido o scaduto. Richiedi un nuovo link di recupero.')}`,
    )
  }

  // Niente code → l'utente è arrivato qui per sbaglio
  return NextResponse.redirect(`${origin}/login`)
}
