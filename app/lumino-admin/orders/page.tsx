import { createAdminClient } from '@/lib/supabase/admin'
import { requireSuperAdmin } from '../lab/guard'
import { OrdersClient, type OrderCard, type ClientOption } from './OrdersClient'
import type { OrderRow } from '@/lib/orders/tranche'

export const metadata = { title: 'Ordini & Pagamenti · Super Admin' }
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export default async function OrdersPage() {
  await requireSuperAdmin('/lumino-admin/orders')
  const admin = createAdminClient()

  // Ordini + anagrafica clienti, letti lato server con la service role.
  const [{ data: ordersData }, { data: clientsData }] = await Promise.all([
    admin
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500),
    admin
      .from('clients')
      .select('id, name, email, price')
      .order('name', { ascending: true })
      .limit(1000),
  ])

  const orders: OrderCard[] = ((ordersData as OrderRow[]) || []).map((o) => ({
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

  const clients: ClientOption[] = (
    (clientsData as { id: string; name: string; email: string | null; price: number | string | null }[]) || []
  ).map((c) => ({
    id: c.id,
    name: c.name || '(senza nome)',
    email: c.email || '',
    price: c.price == null ? null : Number(c.price),
  }))

  return <OrdersClient orders={orders} clients={clients} />
}
