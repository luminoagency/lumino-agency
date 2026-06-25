import type { Metadata } from 'next'
import Link from 'next/link'
import SiteChrome from '@/components/site/SiteChrome'
import { COMPANY } from '@/lib/company'

export const metadata: Metadata = {
  title: 'Chi siamo · Lumino',
  description:
    'Lumino crea siti professionali su misura per ristoranti e attività locali. Scopri chi siamo e cosa facciamo.',
}

const VALUES = [
  {
    t: 'Qualità senza compromessi',
    p: 'Ogni sito che pubblichiamo deve sembrare fatto da un’agenzia di design, non da un template. È la nostra unica regola.',
  },
  {
    t: 'Prezzi trasparenti',
    p: 'Un pagamento unico, nessun abbonamento nascosto, nessuna sorpresa in fattura. Quello che vedi è quello che paghi.',
  },
  {
    t: 'Veloci per davvero',
    p: 'Dal primo contatto al sito online in pochi giorni. Il tuo tempo vale: tu cucini, al sito pensiamo noi.',
  },
  {
    t: 'Vicini al cliente',
    p: 'Parliamo la lingua di chi gestisce un locale. Ci trovi via email e WhatsApp, da persone vere.',
  },
]

export default function ChiSiamoPage() {
  return (
    <SiteChrome
      header={{
        kicker: '✦ chi siamo',
        title: (
          <>
            Diamo ai locali italiani il sito che <em>meritano</em>.
          </>
        ),
        intro:
          'Lumino è nata da un’idea semplice: troppi ristoranti e attività locali hanno un sito vecchio, lento o inesistente. Noi lo cambiamo — in modo veloce, curato e accessibile.',
      }}
    >
      <div className="ls-container">
        {/* Story */}
        <section className="ls-section">
          <h2 className="ls-section-title">
            La nostra <em>storia</em>
          </h2>
          <div className="ls-prose" style={{ paddingBottom: '1rem' }}>
            <p>
              {COMPANY.brand} è un progetto dedicato alle piccole e medie attività che vivono
              del territorio: ristoranti, pizzerie, trattorie, bar, barbieri, studi e negozi. Sono
              realtà che lavorano benissimo nel mondo fisico, ma che spesso online sono rappresentate
              male o non lo sono affatto.
            </p>
            <p>
              Partiamo dalle informazioni del tuo locale e costruiamo un sito completo: testi su
              misura, organizzazione del menu o dei servizi, gallerie fotografiche, orari, contatti e
              prenotazioni. Curiamo ogni dettaglio a mano e controlliamo sempre il risultato prima
              della consegna, perché la qualità la decidiamo noi.
            </p>
            <p>
              Il risultato è un sito che il cliente può mettere online in pochi giorni e gestire da
              solo, senza conoscenze tecniche e senza costi mensili a sorpresa.
            </p>
          </div>
        </section>

        {/* Values */}
        <section className="ls-section">
          <h2 className="ls-section-title">
            In cosa <em>crediamo</em>
          </h2>
          <div className="ls-grid ls-grid-2" style={{ marginTop: '1.5rem' }}>
            {VALUES.map((v) => (
              <div key={v.t} className="ls-card">
                <h3>{v.t}</h3>
                <p>{v.p}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="ls-section" style={{ textAlign: 'center', paddingBottom: '4rem' }}>
          <h2 className="ls-section-title">
            Pronto a far <em>brillare</em> la tua attività?
          </h2>
          <p className="ls-lead" style={{ margin: '0 auto 28px' }}>
            Guarda cosa realizziamo o scrivici per qualsiasi domanda. Siamo qui per questo.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/inizia" className="ls-btn ls-btn-primary">
              Inizia ora →
            </Link>
            <Link href="/contatti" className="ls-btn ls-btn-secondary">
              Contattaci
            </Link>
          </div>
        </section>
      </div>
    </SiteChrome>
  )
}
