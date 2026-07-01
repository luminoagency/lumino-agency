'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createOrder } from './actions'
import { computeTranches, formatEuro } from '@/lib/orders/tranche'

/** Dominio di produzione per i link di pagamento (come da specifica). */
const PAY_BASE = 'https://www.bylumino.com'

export interface OrderCard {
  id: string
  clientName: string
  clientEmail: string
  clientWhatsapp: string | null
  total: number
  deposit: number
  balance: number
  depositStatus: string
  balanceStatus: string
  depositPaidAt: string | null
  balancePaidAt: string | null
  createdAt: string
}

const serif = { fontFamily: '"Cormorant Garamond", Georgia, serif' }

function payLink(id: string, type: 'deposit' | 'balance', base = PAY_BASE) {
  return `${base}/pay/${id}?type=${type}`
}

function CopyLink({ id, type }: { id: string; type: 'deposit' | 'balance' }) {
  const [copied, setCopied] = useState(false)
  const prod = payLink(id, type)
  // Link locale (per testare in sandbox su localhost / preview Vercel).
  const local =
    typeof window !== 'undefined' ? payLink(id, type, window.location.origin) : prod

  async function copy() {
    try {
      await navigator.clipboard.writeText(prod)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // fallback: selezione manuale
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <code className="rounded bg-white/5 px-2 py-1 text-[11px] text-white/60">
        {prod}
      </code>
      <button
        type="button"
        onClick={copy}
        className="rounded-full border border-white/15 px-3 py-1 text-[11px] font-medium text-white/80 transition-colors hover:border-white/40 hover:text-white"
      >
        {copied ? '✓ Copiato' : 'Copia'}
      </button>
      <a
        href={local}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[11px] text-brand-300 underline-offset-2 hover:underline"
        title="Apri il checkout su questo ambiente (per test in sandbox)"
      >
        apri in locale ↗
      </a>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const paid = status === 'paid'
  return (
    <span
      className={
        'rounded-full px-2.5 py-0.5 text-[11px] font-semibold ' +
        (paid
          ? 'bg-green-500/15 text-green-300'
          : 'bg-amber-500/15 text-amber-300')
      }
    >
      {paid ? 'Pagato' : 'In attesa'}
    </span>
  )
}

export function OrdersClient({ orders }: { orders: OrderCard[] }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [total, setTotal] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totalNum = Number(total.replace(',', '.'))
  const preview =
    Number.isFinite(totalNum) && totalNum > 0 ? computeTranches(totalNum) : null

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const res = await createOrder({
      clientName: name,
      clientEmail: email,
      clientWhatsapp: whatsapp,
      totalAmount: totalNum,
    })
    setSubmitting(false)
    if (!res.ok) {
      setError(res.error || 'Errore')
      return
    }
    setName('')
    setEmail('')
    setWhatsapp('')
    setTotal('')
    router.refresh()
  }

  return (
    <div
      className="min-h-screen bg-[#050505] text-white"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap"
      />
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(800px circle at 12% 18%, rgba(214,141,28,0.07), transparent 50%), radial-gradient(700px circle at 88% 75%, rgba(167,139,250,0.05), transparent 50%)',
        }}
      />

      <div className="relative z-10 mx-auto max-w-[1100px] px-5 py-6">
        {/* Header */}
        <div className="mb-7 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
          <div className="flex items-center gap-4">
            <Link
              href="/lumino-admin"
              className="text-xs text-white/50 transition-colors hover:text-white"
            >
              ← Control
            </Link>
            <h1
              className="m-0 text-3xl font-normal tracking-tight"
              style={serif}
            >
              💶 Ordini &{' '}
              <em className="bg-gradient-to-r from-brand-400 to-[#a78bfa] bg-clip-text not-italic text-transparent">
                Pagamenti
              </em>
            </h1>
          </div>
        </div>

        {/* Form nuovo ordine */}
        <form
          onSubmit={onSubmit}
          className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5"
        >
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white/60">
            Nuovo ordine
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs text-white/60">
                Nome cliente *
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-brand-400"
                placeholder="Trattoria da Mario"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-white/60">Email *</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-brand-400"
                placeholder="mario@ristorante.it"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-white/60">
                WhatsApp (opzionale)
              </span>
              <input
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-brand-400"
                placeholder="+39 333 1234567"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-white/60">
                Importo totale concordato (EUR) *
              </span>
              <input
                inputMode="decimal"
                value={total}
                onChange={(e) => setTotal(e.target.value)}
                required
                className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-brand-400"
                placeholder="es. 1500"
              />
            </label>
          </div>

          {preview && (
            <p className="mt-3 text-xs text-white/60">
              Acconto 30%:{' '}
              <strong className="text-white">{formatEuro(preview.deposit)}</strong>
              {'  ·  '}
              Saldo 70%:{' '}
              <strong className="text-white">{formatEuro(preview.balance)}</strong>
            </p>
          )}

          {error && <p className="mt-3 text-xs text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-4 rounded-full bg-brand-500 px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
          >
            {submitting ? 'Salvataggio…' : '+ Crea ordine'}
          </button>
        </form>

        {/* Lista ordini */}
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/60">
          Ordini ({orders.length})
        </h2>

        {orders.length === 0 ? (
          <p className="text-sm text-white/40">
            Nessun ordine ancora. Creane uno qui sopra.
          </p>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <div
                key={o.id}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
              >
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold">{o.clientName}</div>
                    <div className="text-xs text-white/50">
                      {o.clientEmail}
                      {o.clientWhatsapp ? ` · ${o.clientWhatsapp}` : ''}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-white/70">
                      Totale{' '}
                      <strong className="text-white">
                        {formatEuro(o.total)}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Acconto */}
                <div className="mb-3 rounded-xl border border-white/5 bg-black/20 p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-sm">
                      Acconto 30% ·{' '}
                      <strong>{formatEuro(o.deposit)}</strong>
                    </span>
                    <StatusBadge status={o.depositStatus} />
                  </div>
                  <CopyLink id={o.id} type="deposit" />
                </div>

                {/* Saldo */}
                <div className="rounded-xl border border-white/5 bg-black/20 p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-sm">
                      Saldo 70% ·{' '}
                      <strong>{formatEuro(o.balance)}</strong>
                    </span>
                    <StatusBadge status={o.balanceStatus} />
                  </div>
                  <CopyLink id={o.id} type="balance" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
