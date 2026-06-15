/**
 * POST /api/stripe/create-checkout
 * Body: { siteId?: string }   ← se assente, usa il sito dell'utente loggato
 *
 * Crea una Stripe Checkout Session per il 50% upfront del prezzo del piano.
 * Ritorna la URL a cui mandare il browser.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe/client'
import { getPlan, type PlanKey, SALES_TERMS } from '@/lib/plans'

export async function POST(req: NextRequest) {
  try {
    let body: any = {}
    try { body = await req.json() } catch {}

    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

    const admin = createAdminClient()
    const { data: ownerRow } = await admin
      .from('site_owners')
      .select('site_id')
      .eq('user_id', user.id)
      .maybeSingle()
    const siteId: string = body.siteId || ownerRow?.site_id
    if (!siteId) return NextResponse.json({ error: 'Nessun sito associato' }, { status: 400 })

    const { data: site } = await admin
      .from('sites')
      .select('id, slug, tier, client_id, clients:client_id(name, email)')
      .eq('id', siteId)
      .maybeSingle()
    if (!site) return NextResponse.json({ error: 'Sito non trovato' }, { status: 404 })

    const tier: PlanKey = (site.tier as PlanKey) || 'basic'
    const plan = getPlan(tier)
    const client = Array.isArray((site as any).clients) ? (site as any).clients[0] : (site as any).clients

    // 50% upfront in centesimi
    const upfrontAmount = Math.round(plan.priceFrom * (SALES_TERMS.upfrontPercent / 100) * 100)

    const origin = new URL(req.url).origin

    const stripe = getStripe()
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: client?.email || user.email || undefined,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Sito web Lumino — Piano ${plan.name}`,
              description: `Prima rata (${SALES_TERMS.upfrontPercent}%) per il sito di ${client?.name || 'il tuo ristorante'}`,
            },
            unit_amount: upfrontAmount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        siteId: site.id,
        tier,
        type: 'upfront_50',
        userId: user.id,
      },
      success_url: `${origin}/admin?payment=ok&session={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/admin?payment=cancel`,
    })

    return NextResponse.json({ ok: true, url: session.url })
  } catch (err: any) {
    console.error('[stripe checkout] error:', err?.message || err)
    return NextResponse.json({ error: err?.message || 'Errore checkout' }, { status: 500 })
  }
}
