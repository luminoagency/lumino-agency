/**
 * Stripe client singleton (server-only).
 * Reads STRIPE_SECRET_KEY. Mai usare in client components.
 */

import Stripe from 'stripe'

let cached: Stripe | null = null

export function getStripe(): Stripe {
  if (cached) return cached
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY non configurata')
  cached = new Stripe(key, { apiVersion: '2025-04-30.basil' as any })
  return cached
}

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || ''
