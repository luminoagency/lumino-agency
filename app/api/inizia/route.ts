/**
 * POST /api/inizia
 * Body: { name, restaurantName, email, phone, wantsContact, privacy, leadId? }
 *
 * Endpoint pubblico chiamato dal form "Inizia ora" (pagina /inizia).
 * NON è una registrazione self-service: raccoglie la richiesta di contatto.
 *
 * Flusso:
 *  1. valida i campi obbligatori
 *  2. risolve l'eventuale link cold-outreach (?lead=<uuid> → restaurants)
 *  3. salva il lead in `inbound_leads` (Supabase)
 *  4. logga al foglio Google di tracking (canale esistente)
 *  5. prepara le 2 email transazionali (conferma cliente + notifica team).
 *     ⚠️ PIANO B: l'invio è gated da PRO_EMAIL_ACTIVE — finché è false logga soltanto.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { trackEvent } from '@/lib/tracking'
import { PUBLIC_CONTACT_EMAIL } from '@/lib/company'
import {
  buildClientConfirmation,
  buildTeamNotification,
  dispatchTransactional,
  pickCycledSender,
} from '@/lib/email/transactional'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

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
  const phone = clean(body.phone, 40)
  const email = clean(body.email, 120).toLowerCase()
  const wantsContact = body.wantsContact !== false // default true
  const privacy = body.privacy === true
  const leadId = clean(body.leadId, 64)

  if (!name || !restaurantName || !phone || !email) {
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

  const cameFromOutreach = UUID_RE.test(leadId)
  const source: 'form_direct' | 'form_cold_outreach' = cameFromOutreach
    ? 'form_cold_outreach'
    : 'form_direct'

  // Backup lato server: il lead è sempre nei log anche se DB/sheet non rispondono.
  console.log('[lead] nuova richiesta da /inizia:', JSON.stringify({ name, restaurantName, email, phone, wantsContact, source }))

  // ── 2. Profilo dallo scraper (se il lead arriva da cold outreach) ──
  let linkedRestaurantId: string | null = null
  let restaurant: any = null
  let outreachSender: string | null = null
  let db: ReturnType<typeof createAdminClient> | null = null
  try {
    db = createAdminClient()
  } catch (err) {
    console.error('[lead] Supabase admin non configurato:', err)
  }

  if (db && cameFromOutreach) {
    const { data: r } = await db
      .from('restaurants')
      .select('id, name, category, city, stars, reviews_count, website')
      .eq('id', leadId)
      .maybeSingle()
    if (r) {
      restaurant = r
      linkedRestaurantId = r.id as string
      const { data: lastEmail } = await db
        .from('emails_sent')
        .select('account')
        .eq('restaurant_id', leadId)
        .order('sent_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      outreachSender = (lastEmail?.account as string) || null
    }
  }

  // ── 3. Salvataggio in inbound_leads ──
  let insertedId: string | null = null
  let leadIndex = 0
  if (db) {
    const { data: inserted, error: insErr } = await db
      .from('inbound_leads')
      .insert({
        name,
        restaurant_name: restaurantName,
        email,
        phone,
        wants_contact: wantsContact,
        source,
        linked_restaurant_id: linkedRestaurantId,
      })
      .select('id')
      .single()
    if (insErr) {
      console.error('[lead] insert inbound_leads fallito:', insErr.message)
    } else {
      insertedId = inserted.id as string
      // Indice per il round-robin del mittente: numero di lead totali finora.
      const { count } = await db
        .from('inbound_leads')
        .select('id', { count: 'exact', head: true })
      leadIndex = Math.max(0, (count || 1) - 1)
    }
  }

  // ── 4. Tracking sul foglio Google (canale esistente) ──
  await trackEvent('lead', {
    name,
    restaurant_name: restaurantName,
    email,
    phone,
    wants_contact: wantsContact,
    source,
  }).catch((err) => console.error('[lead] invio al foglio fallito:', err))

  // ── 5. Email transazionali (gated PIANO B — vedi lib/email/transactional) ──
  const sender = pickCycledSender(leadIndex)

  // H.4 — conferma al cliente
  try {
    const confirm = buildClientConfirmation({ name, restaurantName, sender })
    await dispatchTransactional({
      to: email,
      fromName: sender.name,
      fromEmail: sender.email,
      subject: confirm.subject,
      body: confirm.body,
    })
  } catch (err) {
    console.error('[lead] email conferma cliente fallita:', err)
  }

  // H.5 — notifica al team
  try {
    const profileBlock = buildProfileBlock({ restaurant, outreachSender })
    const notify = buildTeamNotification({
      leadId: insertedId || leadId || '—',
      name,
      restaurantName,
      email,
      phone,
      wantsContact,
      city: restaurant?.city ?? null,
      profileBlock,
    })
    await dispatchTransactional({
      to: PUBLIC_CONTACT_EMAIL,
      fromName: sender.name,
      fromEmail: sender.email,
      subject: notify.subject,
      body: notify.body,
    })
  } catch (err) {
    console.error('[lead] email notifica team fallita:', err)
  }

  return NextResponse.json({
    ok: true,
    message: 'Grazie! Ti ricontattiamo a breve.',
  })
}

/** Costruisce il blocco PROFILO della notifica team. */
function buildProfileBlock(opts: {
  restaurant: any | null
  outreachSender: string | null
}): string {
  const { restaurant, outreachSender } = opts
  if (!restaurant) {
    return 'PROFILO\nLead nuovo, audit in coda.'
  }
  const rating =
    restaurant.stars != null
      ? `${restaurant.stars} ⭐ con ${restaurant.reviews_count ?? 0} recensioni`
      : 'n/d'
  const sitoEsistente = restaurant.website ? restaurant.website : 'No'
  return [
    'PROFILO (dallo scraper)',
    `Categoria: ${restaurant.category || 'n/d'}`,
    `Rating Google: ${rating}`,
    `Sito esistente: ${sitoEsistente}`,
    'Audit profondo: non ancora disponibile',
    `Mittente che ha gestito outreach: ${outreachSender || 'n/d'}`,
  ].join('\n')
}
