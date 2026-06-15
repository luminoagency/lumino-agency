/**
 * POST /api/stripe/webhook
 * Riceve eventi da Stripe.
 *
 * Setup necessario (manuale, una volta sola):
 *   1. Dashboard Stripe → Developers → Webhooks → Add endpoint
 *   2. URL: https://bylumino.com/api/stripe/webhook
 *   3. Eventi: checkout.session.completed
 *   4. Copia il signing secret e mettilo in env: STRIPE_WEBHOOK_SECRET
 */

import { NextResponse, type NextRequest } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { getStripe, STRIPE_WEBHOOK_SECRET } from '@/lib/stripe/client'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateSiteContent } from '@/lib/pipeline/generate'
import { trackEvent } from '@/lib/tracking'

export async function POST(req: NextRequest) {
  if (!STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Webhook non configurato (STRIPE_WEBHOOK_SECRET mancante)' }, { status: 503 })
  }

  const signature = headers().get('stripe-signature')
  if (!signature) return NextResponse.json({ error: 'No signature' }, { status: 400 })

  const stripe = getStripe()
  const rawBody = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET)
  } catch (err: any) {
    return NextResponse.json({ error: `Invalid signature: ${err?.message}` }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const meta = session.metadata || {}
    const siteId = meta.siteId
    const type = meta.type

    if (siteId && type === 'upfront_50') {
      const admin = createAdminClient()

      // Marca il sito come "pagato il 50%" (status resta 'building' finché la pipeline non finisce)
      await admin.from('sites').update({ status: 'building' }).eq('id', siteId)

      // Carica info per tracking + pipeline
      const { data: site } = await admin
        .from('sites')
        .select('id, slug, tier, clients:client_id(email, name)')
        .eq('id', siteId)
        .maybeSingle()
      const client = site ? (Array.isArray((site as any).clients) ? (site as any).clients[0] : (site as any).clients) : null

      // Triggera la pipeline AI (async, non blocca il webhook)
      generateSiteContent({ siteId }).catch(e => console.error('[stripe webhook] pipeline failed:', e))

      // Tracking
      trackEvent('plan_change', {
        email: client?.email || session.customer_email || '',
        from: 'pending',
        to: 'paid_50',
      }).catch(() => {})
    }
  }

  return NextResponse.json({ received: true })
}

// App Router: req.text() già restituisce il raw body, non serve config bodyParser.
