import type { Metadata } from 'next'
import Link from 'next/link'
import SiteChrome from '@/components/site/SiteChrome'

export const metadata: Metadata = {
  alternates: { canonical: '/chi-siamo' },
  title: 'Lo studio',
  description:
    'Lumino è uno studio digitale: progettiamo e costruiamo siti su misura per ristoranti, hotel, aziende e retail.',
}

const CURIAMO: Array<{ b: string; rest: string }> = [
  { b: 'Testi scritti su misura', rest: ', non frasi vuote o slogan generici' },
  { b: 'Foto scelte e ordinate', rest: ' — gli spazi, le persone, il lavoro' },
  { b: 'Le informazioni che servono', rest: ' raggiungibili dal telefono, in due click' },
  { b: 'Contatti e prenotazioni', rest: ' che funzionano davvero' },
  { b: 'Caricamento veloce', rest: ' anche su connessione lenta' },
  { b: 'Coerenza visiva', rest: ' con la tua identità' },
]

export default function ChiSiamoPage() {
  return (
    <SiteChrome
      header={{
        kicker: '✦ lo studio',
        title: <>Lo studio</>,
        intro: 'Siamo uno studio digitale. Progettiamo e costruiamo siti su misura.',
      }}
    >
      <div className="ls-container">
        {/* Intro */}
        <section className="ls-section">
          <div className="ls-prose">
            <p>
              Lavoriamo con chi ha qualcosa di vero da mostrare — ristoranti, hotel, aziende,
              negozi. Quello che cambia da un settore all’altro sono le domande a cui il sito deve
              rispondere; quello che non cambia è che un visitatore decide in pochi secondi se
              fidarsi. Sappiamo cosa fa la differenza tra un sito che porta contatti e uno che resta
              una vetrina vuota.
            </p>
          </div>
        </section>

        {/* Come lavoriamo */}
        <section className="ls-section">
          <h2 className="ls-section-title">
            Come <em>lavoriamo</em>
          </h2>
          <div className="ls-prose" style={{ paddingBottom: '1rem' }}>
            <p>
              Prima di tutto guardiamo. Studiamo l’attività, com’è fatta, la presenza online, cosa
              funziona e cosa no. Poi pensiamo a tutto noi — testi, foto, struttura, layout. Niente
              template generici, niente moduli da compilare. Ogni sito nasce per l’attività
              specifica che lo userà.
            </p>
            <p>
              In pochi giorni il sito è online. Tu pensi al tuo lavoro, al sito pensiamo noi.
            </p>
          </div>
        </section>

        {/* Cosa curiamo */}
        <section className="ls-section">
          <h2 className="ls-section-title">
            Cosa <em>curiamo</em>
          </h2>
          <div className="ls-prose" style={{ marginTop: '1rem' }}>
            <ul>
              {CURIAMO.map((c) => (
                <li key={c.b}>
                  <strong>{c.b}</strong>{c.rest}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Cosa non facciamo */}
        <section className="ls-section">
          <h2 className="ls-section-title">
            Cosa <em>non</em> facciamo
          </h2>
          <div className="ls-prose">
            <p>
              Non facciamo di tutto. Non lavoriamo con e-commerce, app, software gestionali, social
              media management. Solo siti, fatti bene.
            </p>
          </div>
        </section>

        {/* Chiusura */}
        <section className="ls-section" style={{ paddingBottom: '4rem' }}>
          <p className="ls-lead" style={{ margin: '0 auto' }}>
            Se vuoi sapere come affrontiamo un progetto,{' '}
            <Link href="/portfolio">guarda alcuni lavori</Link>.
          </p>
        </section>
      </div>
    </SiteChrome>
  )
}
