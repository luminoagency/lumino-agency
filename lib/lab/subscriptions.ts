/**
 * Subscription management (Layer 4.6) — tipi + helper PURI (no provider).
 * Importabile sia server che client (nessuna dipendenza server).
 */

export type SubscriptionStatus = 'active' | 'past_due' | 'suspended' | 'canceled' | 'trial'
export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'failed' | 'refunded'
export type PaymentMethod = 'stripe' | 'sepa' | 'bonifico' | 'cash' | 'manual'

export interface Subscription {
  id: string
  project_id: string
  setup_fee_amount?: number
  setup_fee_paid: boolean
  setup_paid_at?: string
  monthly_amount: number
  billing_day: number
  status: SubscriptionStatus
  next_billing_date?: string
  last_paid_at?: string
  provider?: 'stripe' | 'sepa' | 'manual'
  provider_customer_id?: string
  provider_subscription_id?: string
  grace_period_days: number
  suspended_at?: string
  suspension_reason?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Invoice {
  id: string
  subscription_id: string
  project_id: string
  invoice_number: string
  invoice_type: 'setup' | 'monthly' | 'one-off'
  amount: number
  status: InvoiceStatus
  due_date?: string
  paid_at?: string
  payment_method?: PaymentMethod
  notes?: string
  created_at: string
}

const DAY_MS = 86_400_000

/** Prossima data di addebito (giorno del mese 1-28) dalla data di partenza. */
export function calculateNextBilling(billingDay: number, fromDate: Date = new Date()): Date {
  const day = Math.min(Math.max(Math.round(billingDay) || 1, 1), 28)
  const d = new Date(fromDate.getFullYear(), fromDate.getMonth(), day)
  if (d <= fromDate) d.setMonth(d.getMonth() + 1)
  return d
}

/** Numero fattura progressivo, es. "LMN-2026-001". */
export function generateInvoiceNumber(year: number, seq: number): string {
  return `LMN-${year}-${String(seq).padStart(3, '0')}`
}

/** True se l'abbonamento è scaduto (data di addebito passata, non cancellato/sospeso). */
export function isSubscriptionOverdue(sub: Subscription): boolean {
  if (!sub.next_billing_date) return false
  if (sub.status === 'canceled' || sub.status === 'suspended') return false
  return new Date(sub.next_billing_date).getTime() < Date.now()
}

/** Giorni che mancano alla prossima fattura (negativo se in ritardo). */
export function getDaysUntilBilling(sub: Subscription): number {
  if (!sub.next_billing_date) return Number.POSITIVE_INFINITY
  return Math.ceil((new Date(sub.next_billing_date).getTime() - Date.now()) / DAY_MS)
}
