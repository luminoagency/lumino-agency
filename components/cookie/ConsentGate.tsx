'use client'

import { useEffect, useState } from 'react'
import {
  isAllowed,
  CONSENT_CHANGE_EVENT,
  type ConsentCategory,
} from '@/lib/cookies/consent'

/**
 * Carica i figli SOLO se la categoria di cookie è consentita.
 *
 * - 'technical'  → sempre consentito (script di funzionamento).
 * - 'analytics'  → solo se getConsent().analytics === true.
 * - 'marketing'  → solo se getConsent().marketing === true.
 *
 * Reattivo: ascolta l'evento `lumino-consent-change` (e `storage` cross-tab),
 * così quando l'utente concede il consenso lo script si monta SUBITO, senza
 * ricaricare la pagina (L.4). Quando lo revoca, i figli si smontano e i cookie
 * già piazzati vengono rimossi da setConsent().
 *
 * Infrastruttura pronta: oggi il sito non ha tracker di analisi/marketing.
 * Quando se ne aggiungerà uno, basta avvolgerlo:
 *
 *   <ConsentGate category="analytics">
 *     <Script src="https://www.googletagmanager.com/gtag/js?id=G-XXXX" />
 *   </ConsentGate>
 */
export default function ConsentGate({
  category,
  children,
}: {
  category: ConsentCategory
  children: React.ReactNode
}) {
  // false in SSR / primo render → niente script prima del consenso (e niente mismatch).
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    const update = () => setAllowed(isAllowed(category))
    update()
    window.addEventListener(CONSENT_CHANGE_EVENT, update)
    window.addEventListener('storage', update)
    return () => {
      window.removeEventListener(CONSENT_CHANGE_EVENT, update)
      window.removeEventListener('storage', update)
    }
  }, [category])

  if (!allowed) return null
  return <>{children}</>
}
