import type { Metadata } from 'next'
import Link from 'next/link'
import SiteChrome from '@/components/site/SiteChrome'

export const metadata: Metadata = {
  title: 'Lo studio · Lumino',
  description:
    'Lumino è uno studio specializzato in siti web per la ristorazione. Lavoriamo solo con chi gestisce un locale.',
}

const CURIAMO: Array<{ b: string; rest: string }> = [
  { b: 'Testi scritti su misura', rest: ', non frasi vuote o slogan generici' },
  { b: 'Foto organizzate con cura', rest: ' — l’ambiente, i piatti, la cucina' },
  { b: 'Menu sempre accessibile', rest: ' dal telefono, in due click' },
  { b: 'Prenotazioni che funzionano', rest: ' davvero' },
  { b: 'Caricamento veloce', rest: ' anche su connessione lenta' },
  { b: 'Coerenza visiva', rest: ' con l’identità del tuo locale' },
]

export default function ChiSiamoPage() {
  return (
    <SiteChrome
      header={{
        kicker: '✦ lo studio',
        title: <>Lo studio</>,
        intro: 'Siamo uno studio specializzato in siti web per la ristorazione.',
      }}
    >
      <div className="ls-container">
        {/* Intro */}
        <section className="ls-section">
          <div className="ls-prose">
            <p>
              Lavoriamo solo con chi gestisce un locale — ristoranti, pizzerie, bar, bistrot,
              trattorie, fast food. Non ci occupiamo d’altro. Conosciamo il settore, sappiamo cosa
              cerca un cliente quando apre il sito di un ristorante, e sappiamo cosa fa la differenza
              tra un sito che porta prenotazioni e uno che resta una vetrina vuota.
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
              Prima di tutto guardiamo. Studiamo il locale, la cucina, la presenza online, cosa
              funziona e cosa no. Poi pensiamo a tutto noi — testi, foto, menu, layout. Niente
              template generici, niente moduli da compilare. Ogni sito nasce per il locale specifico
              che lo userà.
            </p>
            <p>
              In pochi giorni il sito è online. Tu pensi alla cucina, al sito pensiamo noi.
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
              Non siamo uno studio generalista. Non lavoriamo con e-commerce, app, software
              gestionali, social media management. Solo siti per la ristorazione, fatti bene.
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
