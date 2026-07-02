'use client'

import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    google?: any
    paypal?: any
  }
}

const PAYJS_SCRIPT_ID = 'google-pay-js-sdk'

/**
 * Bottone Google Pay per il checkout Lumino.
 *
 * Riusa ESATTAMENTE il flusso della Fase 1:
 *  - onCreateOrder → POST /api/paypal/create-order (importo letto dal server)
 *  - onApprove     → POST /api/paypal/capture-order (aggiorna Supabase)
 *
 * Mostra il bottone SOLO se il dispositivo è idoneo (isReadyToPay). Se non lo
 * è (o pay.js non carica), non renderizza nulla e non mostra errori.
 *
 * L'importo passato a Google (`amountValue`) è solo il valore DISPLAY mostrato
 * nel foglio Google Pay: è reso dal server nella pagina, non calcolato dal
 * browser. L'addebito reale resta deciso dal server in create-order.
 */
export function GooglePayButton({
  sdkReady,
  env,
  amountValue,
  currency = 'EUR',
  onCreateOrder,
  onApprove,
  onError,
  disabledRef,
}: {
  /** true quando l'SDK PayPal (window.paypal con componente googlepay) è caricato. */
  sdkReady: boolean
  /** 'TEST' in sandbox, 'PRODUCTION' in live. */
  env: 'TEST' | 'PRODUCTION'
  /** Importo display (es. "0.30"), reso dal server. */
  amountValue: string
  currency?: string
  onCreateOrder: () => Promise<string>
  onApprove: (paypalOrderId: string) => Promise<void>
  onError: (msg: string) => void
  /** Ref al flag "pagamento in corso" del parent, per bloccare doppi click. */
  disabledRef: React.MutableRefObject<boolean>
}) {
  const [payjsReady, setPayjsReady] = useState(false)
  const initedRef = useRef(false)

  // 1) Carica il Google Pay JS SDK (pay.js) una sola volta.
  useEffect(() => {
    if (window.google?.payments?.api) {
      setPayjsReady(true)
      return
    }
    const existing = document.getElementById(PAYJS_SCRIPT_ID)
    if (existing) {
      existing.addEventListener('load', () => setPayjsReady(true))
      return
    }
    const s = document.createElement('script')
    s.id = PAYJS_SCRIPT_ID
    s.src = 'https://pay.google.com/gp/p/js/pay.js'
    s.async = true
    s.onload = () => setPayjsReady(true)
    // onerror: silenzioso → semplicemente niente Google Pay.
    document.body.appendChild(s)
  }, [])

  // 2) Inizializza Google Pay quando SDK PayPal + pay.js sono pronti.
  useEffect(() => {
    if (!sdkReady || !payjsReady || initedRef.current) return
    if (!window.paypal?.Googlepay || !window.google?.payments?.api) return
    initedRef.current = true

    let cancelled = false

    ;(async () => {
      try {
        const gp = window.paypal.Googlepay()
        const config = await gp.config()
        if (cancelled) return

        const {
          allowedPaymentMethods,
          merchantInfo,
          apiVersion,
          apiVersionMinor,
          countryCode,
        } = config

        const client = new window.google.payments.api.PaymentsClient({
          environment: env,
        })

        const ready = await client.isReadyToPay({
          apiVersion,
          apiVersionMinor,
          allowedPaymentMethods,
        })
        // Non idoneo → niente bottone, niente errori a schermo.
        if (cancelled || !ready?.result) return

        const onClick = async () => {
          if (disabledRef.current) return
          try {
            const paymentDataRequest = {
              apiVersion,
              apiVersionMinor,
              allowedPaymentMethods,
              merchantInfo,
              transactionInfo: {
                countryCode: countryCode || 'IT',
                currencyCode: currency,
                totalPriceStatus: 'FINAL',
                totalPrice: amountValue, // valore display reso dal server
              },
            }

            // Apre il foglio Google Pay.
            const paymentData = await client.loadPaymentData(paymentDataRequest)

            // 1) Crea l'ordine sul NOSTRO server (importo da Supabase).
            const paypalOrderId = await onCreateOrder()

            // 2) Conferma con Google Pay: gestisce internamente il 3D Secure.
            const confirm = await gp.confirmOrder({
              orderId: paypalOrderId,
              paymentMethodData: paymentData.paymentMethodData,
            })

            if (confirm?.status === 'APPROVED') {
              // 3) Cattura lato server → aggiorna Supabase (identico Fase 1).
              await onApprove(paypalOrderId)
            } else if (confirm?.status === 'PAYER_ACTION_REQUIRED') {
              onError(
                'Verifica di sicurezza non completata. Riprova o usa un altro metodo.',
              )
            } else {
              onError('Pagamento con Google Pay non riuscito. Riprova.')
            }
          } catch (e: any) {
            // La chiusura del foglio da parte dell'utente NON è un errore.
            const code = e?.statusCode || e?.code
            if (code === 'CANCELED' || code === 'CANCELLED') return
            console.error('Google Pay error:', e)
            onError('Pagamento con Google Pay non riuscito. Riprova.')
          }
        }

        const button = client.createButton({
          onClick,
          buttonType: 'plain',
          buttonSizeMode: 'fill',
          buttonColor: 'black',
        })

        const container = document.getElementById('google-pay-button-container')
        if (container && !cancelled) {
          container.innerHTML = ''
          container.appendChild(button)
          container.classList.add('mt-3')
        }
      } catch (e) {
        // Init fallita → nessun bottone (silenzioso).
        console.error('Google Pay init error:', e)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [
    sdkReady,
    payjsReady,
    env,
    amountValue,
    currency,
    onCreateOrder,
    onApprove,
    onError,
    disabledRef,
  ])

  // Container sempre presente: il bottone Google (iframe/DOM) viene iniettato
  // qui solo se idoneo. Se non idoneo resta vuoto (nessuno spazio aggiunto).
  return <div id="google-pay-button-container" />
}
