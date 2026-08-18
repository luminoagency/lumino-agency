import { COMPANY, MAILTO } from '@/lib/company'

/**
 * Sezione 10 — Contatti.
 * Blocco 3: struttura statica. Lo scramble sulla mail arriva nel Blocco 4.
 *
 * Nessun form e nessun CTA di vendita: la vetrina si chiude con un indirizzo
 * a cui scrivere, non con un funnel.
 */
export default function Contact() {
  return (
    <section className="lm-section lm-contact" id="contatti">
      <div className="lm-wrap">
        <p className="lm-kicker lm-reveal">Contatti</p>

        <h2 className="lm-display lm-d1 lm-reveal">
          Hai qualcosa
          <br />
          da accendere?
        </h2>

        <div
          className="lm-reveal"
          style={{ marginTop: 'clamp(2.5rem, 6vh, 4rem)', display: 'grid', gap: '1.25rem' }}
        >
          <a className="lm-contact-mail" href={MAILTO} data-scramble={COMPANY.email}>
            {COMPANY.email}
          </a>
          <p className="lm-lead">{COMPANY.responseTime}</p>
        </div>
      </div>
    </section>
  )
}
