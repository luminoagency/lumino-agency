import { createAdminClient } from '@/lib/supabase/admin'
import { requireSuperAdmin } from '../lab/guard'
import { OrdersClient, type OrderCard } from './OrdersClient'
import type { OrderRow } from '@/lib/orders/tranche'

export const metadata = { title: 'Ordini & Pagamenti · Super Admin' }
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export default async function OrdersPage() {
  await requireSuperAdmin('/lumino-admin/orders')
  const admin = createAdminClient()

  const { data } = await admin
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500)

  const orders: OrderCard[] = ((data as OrderRow[]) || []).map((o) => ({
    id: o.id,
    clientName: o.client_name,
    clientEmail: o.client_email,
    clientWhatsapp: o.client_whatsapp,
    total: Number(o.total_amount),
    deposit: Number(o.deposit_amount),
    balance: Number(o.balance_amount),
    depositStatus: o.deposit_status,
    balanceStatus: o.balance_status,
    depositPaidAt: o.deposit_paid_at,
    balancePaidAt: o.balance_paid_at,
    createdAt: o.created_at,
  }))

  return <OrdersClient orders={orders} />
}
