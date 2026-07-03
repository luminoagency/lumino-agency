import { createAdminClient } from '@/lib/supabase/admin'
import {
  isPaymentType,
  paymentPlan,
  formatEuro,
  toAmountString,
  type OrderRow,
  type PaymentType,
} from '@/lib/orders/tranche'
import { CheckoutClient, type PayOption } from './CheckoutClient'
import { AlreadyPaid, PayShell } from './PayShell'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const metadata = { title: 'Pagamento · Lumino', robots: { index: false } }

interface PageProps {
  params: { orderId: string }
  searchParams: { type?: string }
}

const TITLES: Record<PayOption['type'], string> = {
  deposit: 'Acconto 30%',
  balance: 'Saldo 70%',
  full: 'Paga tutto (100%)',
}

export default async function PayPage({ params, searchParams }: PageProps) {
  const { orderId } = params

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
  const depositPaid = order.deposit_status === 'paid'
  const balancePaid = order.balance_status === 'paid'

  // Ordine completamente pagato → niente checkout.
  if (depositPaid && balancePaid) {
    return (
      <AlreadyPaid clientName={order.client_name} label="Pagamento completo" />
    )
  }

  const mkOption = (t: PaymentType): PayOption => {
    const plan = paymentPlan(order, t)
    return {
      type: t,
      title: TITLES[t],
      amountLabel: formatEuro(plan.amount),
      amountValue: toAmountString(plan.amount),
    }
  }

  const qType = searchParams.type
  let options: PayOption[]

  if (isPaymentType(qType)) {
    // LINK CON type esplicito (es. ?type=deposit / ?type=balance dai link storici):
    // paga direttamente quella tranche, nessun selettore. Comportamento invariato.
    const plan = paymentPlan(order, qType)
    if (plan.alreadyPaid) {
      return <AlreadyPaid clientName={order.client_name} label={TITLES[qType]} />
    }
    options = [mkOption(qType)]
  } else {
    // NESSUN type (es. link WhatsApp): il cliente sceglie in base allo stato.
    //  - niente pagato → "Acconto 30%" oppure "Paga tutto"
    //  - acconto già pagato → resta il saldo
    let candidates: PaymentType[]
    if (!depositPaid && !balancePaid) candidates = ['deposit', 'full']
    else if (depositPaid && !balancePaid) candidates = ['balance']
    else candidates = ['deposit'] // saldo già pagato, resta l'acconto (raro)
    options = candidates.map(mkOption)
  }

  const initialType = options[0].type
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || ''

  return (
    <PayShell>
      <div className="mb-6">
        <p className="text-sm text-white/50">Ciao {order.client_name},</p>
        <h1 className="mt-1 text-2xl font-semibold">
          Completa il pagamento del tuo sito
        </h1>
      </div>

      {clientId ? (
        <CheckoutClient
          orderId={order.id}
          options={options}
          initialType={initialType}
          clientId={clientId}
          googlePayEnv={process.env.PAYPAL_MODE === 'live' ? 'PRODUCTION' : 'TEST'}
        />
      ) : (
        <p className="text-red-400">
          Configurazione pagamenti mancante. Contatta Lumino.
        </p>
      )}
    </PayShell>
  )
}
