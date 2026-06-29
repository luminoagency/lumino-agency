import type { Metadata } from 'next'
import SiteChrome from '@/components/site/SiteChrome'
import { COMPANY } from '@/lib/company'
import ContactForm from './ContactForm'

export const metadata: Metadata = {
  title: 'Contatti · Lumino',
  description:
    'Hai bisogno di aiuto o vuoi informazioni sui nostri servizi? Contatta Lumino via email. Ti rispondiamo entro un giorno lavorativo.',
}

export default function ContattiPage() {
  return (
    <SiteChrome
      header={{
        kicker: '✦ contatti',
        title: (
          <>
            Parliamone. Siamo <em>qui</em> per questo.
          </>
        ),
        intro:
          'Domande sui piani, supporto su un sito esistente o semplicemente curiosità: scrivici e ti rispondiamo da persone vere, in italiano.',
      }}
    >
      <div className="ls-container">
        <section className="ls-section">
          <div className="ls-grid ls-grid-2" style={{ alignItems: 'start' }}>
            {/* Contact info */}
            <div className="ls-grid" style={{ gap: 16 }}>
              <div className="ls-card">
                <h3>Email</h3>
                <p>
                  Il modo più rapido per raggiungerci.
                  <br />
                  <a
                    href={`mailto:${COMPANY.email}`}
                    style={{ color: '#a78bfa', textDecoration: 'none', fontWeight: 600 }}
                  >
                    {COMPANY.email}
                  </a>
                </p>
              </div>
              <div className="ls-card">
                <h3>Assistenza</h3>
                <p>
                  {COMPANY.hours}
                  <br />
                  {COMPANY.responseTime}
                </p>
              </div>
              <div className="ls-card">
                <h3>Dati aziendali</h3>
                <p>
                  {COMPANY.brand} è un brand di <strong>{COMPANY.legalName}</strong>.
                  <br />
                  Company No. {COMPANY.companyNumber}
                  <br />
                  {COMPANY.address.full}
                </p>
              </div>
            </div>

            {/* Form */}
            <div className="ls-card">
              <h3 style={{ marginBottom: 18 }}>Scrivici un messaggio</h3>
              <ContactForm />
            </div>
          </div>
        </section>
      </div>
    </SiteChrome>
  )
}
