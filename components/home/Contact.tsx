'use client'

import { useEffect, useRef, useState } from 'react'
import { COMPANY, MAILTO } from '@/lib/company'

/**
 * Sezione 10 — Contatti.
 *
 * Nessun form e nessun CTA di vendita: la vetrina si chiude con un indirizzo a
 * cui scrivere. Al click l'indirizzo si copia negli appunti con un piccolo
 * scoppio di luce; il mailto resta il comportamento di riserva, perché copiare
 * può fallire (permessi, contesto non sicuro) e non deve restare nulla in mano.
 */
export default function Contact() {
  const [copied, setCopied] = useState(false)
  const timer = useRef(0)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const copy = async (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!navigator.clipboard) return // niente da fare: parte il mailto

    event.preventDefault()
    try {
      await navigator.clipboard.writeText(COMPANY.email)
      setCopied(true)
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setCopied(false), 1800)
    } catch {
      window.location.href = MAILTO
    }
  }

  return (
    <section className="lm-section lm-contact" id="contatti">
      <div className="lm-wrap">
        <p className="lm-kicker lm-reveal">Contatti</p>

        <h2 className="lm-display lm-d1 lm-reveal">
          Hai qualcosa
          <br />
          da <span className="lm-grad-text">accendere?</span>
        </h2>

        <div
          className="lm-reveal"
          style={{ marginTop: 'clamp(2.5rem, 6vh, 4rem)', display: 'grid', gap: '1.25rem' }}
        >
          <span className={`lm-mail-wrap${copied ? ' is-copied' : ''}`}>
            <a className="lm-contact-mail" href={MAILTO} onClick={copy} data-cursor="grow">
              {COMPANY.email}
            </a>
            <span className="lm-mail-burst" aria-hidden="true" />
            <span className="lm-mail-said" aria-live="polite">
              {copied ? 'copiato' : ''}
            </span>
          </span>

          <p className="lm-lead">{COMPANY.responseTime}</p>
        </div>
      </div>
    </section>
  )
}
