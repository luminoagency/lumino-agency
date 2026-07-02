/**
 * Subscription cron logic (Layer 4.6) — SERVER ONLY.
 * Logica pronta ma NON schedulata: usata da bottoni manuali in /lumino-admin/subscriptions
 * e, più avanti, da un cron (Vercel Cron / Supabase pg_cron).
 */

import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { calculateNextBilling, generateInvoiceNumber } from './subscriptions'

const DAY_MS = 86_400_000

/** Trova abbonamenti scaduti: past_due entro grazia, sospensione automatica oltre. */
export async function checkOverdueSubscriptions(): Promise<{ notified: number; suspended: number }> {
  const admin = createAdminClient()
  let notified = 0
  let suspended = 0
  try {
    const today = new Date().toISOString().slice(0, 10)
    const { data } = await admin.from('lab_subscriptions').select('*').in('status', ['active', 'past_due']).lte('next_billing_date', today)
    for (const sub of (data || []) as any[]) {
      const { data: pending } = await admin.from('lab_invoices').select('id').eq('subscription_id', sub.id).eq('status', 'pending').limit(1)
      if (!pending || !pending.length) continue
      const daysLate = Math.floor((Date.now() - new Date(sub.next_billing_date).getTime()) / DAY_MS)
      if (daysLate > (sub.grace_period_days ?? 7)) {
        await admin.from('lab_subscriptions').update({ status: 'suspended', suspended_at: new Date().toISOString(), suspension_reason: 'Pagamento scaduto (auto)' }).eq('id', sub.id)
        suspended++
      } else {
        if (sub.status !== 'past_due') await admin.from('lab_subscriptions').update({ status: 'past_due' }).eq('id', sub.id)
        // TODO: invia email reminder al cliente
        notified++
      }
    }
  } catch { /* tabelle non ancora create */ }
  return { notified, suspended }
}

/** Genera le fatture mensili dovute e avanza next_billing_date. */
export async function generateMonthlyInvoices(): Promise<{ generated: number }> {
  const admin = createAdminClient()
  let generated = 0
  try {
    const today = new Date().toISOString().slice(0, 10)
    const { data } = await admin.from('lab_subscriptions').select('*').eq('status', 'active').lte('next_billing_date', today)
    for (const sub of (data || []) as any[]) {
      const year = new Date().getFullYear()
      const { count } = await admin.from('lab_invoices').select('*', { count: 'exact', head: true }).like('invoice_number', `LMN-${year}-%`)
      const num = generateInvoiceNumber(year, (count || 0) + 1)
      await admin.from('lab_invoices').insert({
        subscription_id: sub.id, project_id: sub.project_id, invoice_number: num,
        invoice_type: 'monthly', amount: sub.monthly_amount, status: 'pending', due_date: sub.next_billing_date,
      })
      const next = calculateNextBilling(sub.billing_day, new Date(new Date(sub.next_billing_date).getTime() + DAY_MS))
      await admin.from('lab_subscriptions').update({ next_billing_date: next.toISOString().slice(0, 10) }).eq('id', sub.id)
      generated++
    }
  } catch { /* tabelle non ancora create */ }
  return { generated }
}
