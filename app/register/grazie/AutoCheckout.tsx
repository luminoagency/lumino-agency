'use client'

import { useEffect, useState } from 'react'

export function GrazieAutoCheckout() {
  const [status, setStatus] = useState<'starting' | 'redirecting' | 'error'>('starting')
  const [msg, setMsg] = useState<string>('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setStatus('starting')
        const r = await fetch('/api/stripe/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        })
        const json = await r.json()
        if (cancelled) return
        if (json.url) {
          setStatus('redirecting')
          window.location.href = json.url
        } else {
          setStatus('error')
          setMsg(json.error || 'Errore creazione checkout')
        }
      } catch (e: any) {
        if (!cancelled) {
          setStatus('error')
          setMsg(e?.message || 'Errore rete')
        }
      }
    })()
    return () => { cancelled = true }
  }, [])

  if (status === 'error') {
    return (
      <div style={{
        position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)',
        padding: '12px 18px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
        borderRadius: 10, color: '#f87171', fontSize: 13, zIndex: 100,
      }}>
        Checkout non disponibile: {msg}. Ti contattiamo noi entro 24h per il pagamento.
      </div>
    )
  }

  return (
    <div style={{
      position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)',
      padding: '12px 18px', background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.3)',
      borderRadius: 10, color: '#a78bfa', fontSize: 13, zIndex: 100,
    }}>
      {status === 'starting' ? 'Preparo il pagamento sicuro...' : 'Reindirizzamento a Stripe...'}
    </div>
  )
}
