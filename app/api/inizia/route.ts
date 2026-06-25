/**
 * POST /api/inizia
 * Body: { name, restaurantName, city, cuisine, phone, email, message?, privacy }
 *
 * Endpoint pubblico chiamato dal form "Inizia ora" (pagina /inizia).
 * NON è una registrazione self-service: raccoglie la richiesta di contatto del
 * potenziale cliente e la instrada al sistema esistente.
 *
 * Instradamento: il lead viene inviato al foglio Google di tracking tramite
 * `trackEvent('lead', ...)` (LUMINO_SHEET_WEBHOOK_URL) — lo stesso canale che
 * l'owner già monitora per gli altri eventi. In più viene loggato lato server
 * come backup, così la richiesta non va mai persa.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { trackEvent } from '@/lib/tracking'

function clean(v: unknown, max = 200): string {
  return String(v ?? '').trim().slice(0, max)
}

export async function POST(req: NextRequest) {
  let body: any = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON richiesto' }, { status: 400 })
  }

  const name = clean(body.name)
  const restaurantName = clean(body.restaurantName)
  const city = clean(body.city)
  const cuisine = clean(body.cuisine)
  const phone = clean(body.phone, 40)
  const email = clean(body.email, 120).toLowerCase()
  const message = clean(body.message, 1000)
  const privacy = body.privacy === true

  if (!name || !restaurantName || !city || !cuisine || !phone || !email) {
    return NextResponse.json(
      { error: 'Compila tutti i campi obbligatori.' },
      { status: 400 },
    )
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Email non valida.' }, { status: 400 })
  }
  if (!privacy) {
    return NextResponse.json(
      { error: 'È necessario accettare la Privacy Policy.' },
      { status: 400 },
    )
  }

  const lead = { name, restaurant_name: restaurantName, city, cuisine, phone, email, message }

  // Backup lato server: il lead è sempre nei log anche se il webhook non è configurato.
  console.log('[lead] nuova richiesta da /inizia:', JSON.stringify(lead))

  // Instradamento al foglio di tracking esistente (canale monitorato dall'owner).
  await trackEvent('lead', lead).catch((err) => {
    console.error('[lead] invio al foglio fallito:', err)
  })

  return NextResponse.json({
    ok: true,
    message: 'Grazie! Ti ricontattiamo a breve.',
  })
}
