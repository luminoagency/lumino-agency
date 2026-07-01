import { createAdminClient } from '@/lib/supabase/admin'
import {
  isTrancheType,
  trancheOf,
  formatEuro,
  type OrderRow,
} from '@/lib/orders/tranche'
import { CheckoutClient } from './CheckoutClient'
import { AlreadyPaid, PayShell } from './PayShell'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const metadata = { title: 'Pagamento · Lumino', robots: { index: false } }

interface PageProps {
  params: { orderId: string }
  searchParams: { type?: string }
}

export default async function PayPage({ params, searchParams }: PageProps) {
  const { orderId } = params
  const type = searchParams.type

  if (!isTrancheType(type)) {
    return (
      <PayShell>
        <h1 className="text-xl font-semibold">Link non valido</h1>
        <p className="mt-2 text-white/60">
          Manca o non è corretto il tipo di pagamento. Contatta Lumino per un
          nuovo link.
        </p>
      </PayShell>
    )
  }

  const admin = createAdminClient()
  const { data } = await admin
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle()

  if (!data) {
    return (
      <PayShell>
        <h1 className="text-xl font-semibold">Ordine non trovato</h1>
        <p className="mt-2 text-white/60">
          Questo link non corrisponde a nessun ordine. Contatta Lumino.
        </p>
      </PayShell>
    )
  }

  const order = data as OrderRow
  const tranche = trancheOf(order, type)

  // Già pagata → niente checkout.
  if (tranche.status === 'paid') {
    return <AlreadyPaid clientName={order.client_name} label={tranche.label} />
  }

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || ''

  return (
    <PayShell>
      <div className="mb-6">
        <p className="text-sm text-white/50">Ciao {order.client_name},</p>
        <h1 className="mt-1 text-2xl font-semibold">
          {tranche.label} — sito web Lumino
        </h1>
        <p className="mt-3 text-white/70">
          Stai pagando <strong className="text-white">{tranche.label}</strong>{' '}
          del tuo sito.
        </p>
        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-white/70">Importo da pagare</span>
            <span className="text-xl font-semibold">
              {formatEuro(tranche.amount)}
            </span>
          </div>
        </div>
      </div>

      {clientId ? (
        <CheckoutClient
          orderId={order.id}
          type={type}
          clientId={clientId}
          amountLabel={formatEuro(tranche.amount)}
        />
      ) : (
        <p className="text-red-400">
          Configurazione pagamenti mancante. Contatta Lumino.
        </p>
      )}
    </PayShell>
  )
}
