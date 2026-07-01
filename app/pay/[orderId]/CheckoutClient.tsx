'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { TrancheType } from '@/lib/orders/tranche'

declare global {
  interface Window {
    paypal?: any
  }
}

type Phase = 'loading' | 'ready' | 'paying' | 'success' | 'error'

const SDK_SCRIPT_ID = 'paypal-sdk'

export function CheckoutClient({
  orderId,
  type,
  clientId,
  amountLabel,
}: {
  orderId: string
  type: TrancheType
  clientId: string
  amountLabel: string
}) {
  const [phase, setPhase] = useState<Phase>('loading')
  const [error, setError] = useState<string | null>(null)
  const [cardEligible, setCardEligible] = useState(false)
  const [cardChecked, setCardChecked] = useState(false)
  const cardFieldRef = useRef<any>(null)
  const initedRef = useRef(false)

  /** Crea l'ordine PayPal lato server (l'importo lo decide il server). */
  const createOrderOnServer = useCallback(async (): Promise<string> => {
    const res = await fetch('/api/paypal/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, type }),
    })
    const data = await res.json()
    if (!res.ok || !data.id) {
      throw new Error(data.error || 'Errore nella creazione del pagamento')
    }
    return data.id as string
  }, [orderId, type])

  /** Cattura il pagamento lato server e aggiorna lo stato UI. */
  const captureOnServer = useCallback(async (paypalOrderId: string) => {
    setPhase('paying')
    const res = await fetch('/api/paypal/capture-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paypalOrderId }),
    })
    const data = await res.json()
    if (!res.ok || data.status !== 'COMPLETED') {
      setError(data.error || 'Il pagamento non è andato a buon fine.')
      setPhase('error')
      return
    }
    setPhase('success')
  }, [])

  // 1) Carica lo script SDK PayPal una sola volta.
  useEffect(() => {
    if (window.paypal) {
      setPhase('ready')
      return
    }
    const existing = document.getElementById(SDK_SCRIPT_ID)
    if (existing) {
      existing.addEventListener('load', () => setPhase('ready'))
      return
    }
    // NB: niente parametro `enable-funding` vuoto — PayPal risponde 400 e
    // l'SDK non carica. Passiamo solo i parametri valorizzati.
    const params = new URLSearchParams({
      'client-id': clientId,
      components: 'buttons,card-fields',
      currency: 'EUR',
      intent: 'capture',
      // Niente Venmo, niente Pay Later, niente MyBank: checkout solo
      // PayPal wallet + carta.
      'disable-funding': 'venmo,paylater,mybank',
    })
    const script = document.createElement('script')
    script.id = SDK_SCRIPT_ID
    script.src = `https://www.paypal.com/sdk/js?${params.toString()}`
    script.async = true
    script.onload = () => setPhase('ready')
    script.onerror = () => {
      setError('Impossibile caricare PayPal. Riprova più tardi.')
      setPhase('error')
    }
    document.body.appendChild(script)
  }, [clientId])

  // 2) Inizializza Buttons + CardFields quando l'SDK è pronto.
  useEffect(() => {
    if (phase !== 'ready' || initedRef.current || !window.paypal) return
    initedRef.current = true

    const paypal = window.paypal

    // --- Bottone PayPal standard (wallet) ---
    try {
      paypal
        .Buttons({
          style: { layout: 'vertical', shape: 'pill', label: 'paypal' },
          createOrder: createOrderOnServer,
          onApprove: (data: { orderID: string }) =>
            captureOnServer(data.orderID),
          onError: (err: unknown) => {
            console.error('PayPal Buttons error:', err)
            setError('Si è verificato un errore con PayPal. Riprova.')
            setPhase('error')
          },
        })
        .render('#paypal-button-container')
    } catch (e) {
      console.error(e)
    }

    // --- Campi carta integrati (Advanced Card Payments) ---
    try {
      const cardField = paypal.CardFields({
        createOrder: createOrderOnServer,
        onApprove: (data: { orderID: string }) => captureOnServer(data.orderID),
        onError: (err: unknown) => {
          console.error('PayPal CardFields error:', err)
          setError('Pagamento con carta non riuscito. Controlla i dati e riprova.')
          setPhase('ready')
        },
        style: {
          input: { color: '#ffffff', 'font-size': '15px' },
          '.invalid': { color: '#f87171' },
        },
      })

      if (cardField.isEligible()) {
        cardFieldRef.current = cardField
        // I contenitori #card-*-field sono SEMPRE montati nel DOM (vedi JSX),
        // quindi qui esistono di sicuro: nessun errore "element does not exist".
        cardField.NameField().render('#card-name-field')
        cardField.NumberField().render('#card-number-field')
        cardField.ExpiryField().render('#card-expiry-field')
        cardField.CVVField().render('#card-cvv-field')
        setCardEligible(true)
      } else {
        setCardEligible(false)
      }
    } catch (e) {
      console.error('CardFields non disponibile:', e)
      setCardEligible(false)
    } finally {
      setCardChecked(true)
    }
  }, [phase, createOrderOnServer, captureOnServer])

  async function payWithCard() {
    if (!cardFieldRef.current) return
    setError(null)
    setPhase('paying')
    try {
      // submit() innesca createOrder → approvazione → onApprove (capture).
      await cardFieldRef.current.submit()
    } catch (e) {
      console.error(e)
      setError('Pagamento con carta non riuscito. Controlla i dati e riprova.')
      setPhase('ready')
    }
  }

  if (phase === 'success') {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/15 text-3xl">
          ✓
        </div>
        <h2 className="text-xl font-semibold">Pagamento completato</h2>
        <p className="mt-2 text-white/60">
          Grazie! Abbiamo ricevuto {amountLabel}. Riceverai conferma da Lumino.
        </p>
      </div>
    )
  }

  const busy = phase === 'paying'

  return (
    <div>
      {phase === 'loading' && (
        <p className="text-sm text-white/50">Carico il pagamento…</p>
      )}

      {/* Bottone PayPal / wallet */}
      <div id="paypal-button-container" className={busy ? 'opacity-50' : ''} />

      {/* Separatore */}
      <div className="my-5 flex items-center gap-3 text-xs text-white/40">
        <span className="h-px flex-1 bg-white/10" />
        oppure paga con carta
        <span className="h-px flex-1 bg-white/10" />
      </div>

      {/*
        Campi carta. I contenitori restano SEMPRE nel DOM così l'SDK PayPal
        può renderizzarci dentro gli iframe subito dopo isEligible(): se li
        montassimo solo dopo, PayPal fallirebbe con "element does not exist".
        Nascondiamo il blocco solo se, a check fatto, l'account non è idoneo.
      */}
      <div
        className={busy ? 'pointer-events-none opacity-50' : ''}
        hidden={cardChecked && !cardEligible}
      >
        <label className="mb-1 block text-xs text-white/60">
          Titolare carta
        </label>
        <div
          id="card-name-field"
          className="mb-3 h-11 rounded-lg border border-white/15 bg-black/40 px-1"
        />
        <label className="mb-1 block text-xs text-white/60">Numero carta</label>
        <div
          id="card-number-field"
          className="mb-3 h-11 rounded-lg border border-white/15 bg-black/40 px-1"
        />
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-white/60">Scadenza</label>
            <div
              id="card-expiry-field"
              className="mb-3 h-11 rounded-lg border border-white/15 bg-black/40 px-1"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs text-white/60">CVV</label>
            <div
              id="card-cvv-field"
              className="mb-3 h-11 rounded-lg border border-white/15 bg-black/40 px-1"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={payWithCard}
          disabled={busy || !cardEligible}
          className="mt-2 w-full rounded-full bg-brand-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
        >
          {busy ? 'Attendere…' : `Paga ${amountLabel} con carta`}
        </button>
      </div>

      {cardChecked && !cardEligible && (
        <p className="text-xs text-white/40">
          Il pagamento con carta non è disponibile al momento: usa il bottone
          PayPal qui sopra.
        </p>
      )}

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
    </div>
  )
}
