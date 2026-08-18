'use client'

import { useEffect, useRef } from 'react'
import { COMPANY, MAILTO } from '@/lib/company'
import { bindScramble } from './scramble'

/**
 * Sezione 10 — Contatti.
 *
 * Nessun form e nessun CTA di vendita: la vetrina si chiude con un indirizzo a
 * cui scrivere, non con un funnel. All'hover l'indirizzo si ricompone lettera
 * per lettera (scramble).
 */
export default function Contact() {
  const mailRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    const el = mailRef.current
    if (!el) return
    return bindScramble(el, COMPANY.email)
  }, [])

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
          <a className="lm-contact-mail" href={MAILTO} ref={mailRef} data-cursor="grow">
            {COMPANY.email}
          </a>
          <p className="lm-lead">{COMPANY.responseTime}</p>
        </div>
      </div>
    </section>
  )
}
