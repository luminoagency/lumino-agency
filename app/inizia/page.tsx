import type { Metadata } from 'next'
import SiteChrome from '@/components/site/SiteChrome'
import IniziaForm from './IniziaForm'

export const metadata: Metadata = {
  title: 'Inizia ora · Lumino',
  description:
    'Raccontaci del tuo locale e ti ricontattiamo noi. Lascia i tuoi dati: pensiamo noi al tuo nuovo sito.',
}

export default function IniziaPage() {
  return (
    <SiteChrome
      header={{
        kicker: '✦ inizia ora',
        title: (
          <>
            Raccontaci del tuo <em>locale</em>.
          </>
        ),
        intro:
          'Lascia i tuoi dati e ti ricontattiamo noi. Niente impegno: capiamo cosa ti serve e ti mostriamo come può essere il tuo nuovo sito.',
      }}
    >
      <div className="ls-container">
        <section className="ls-section" style={{ paddingTop: '1rem', paddingBottom: '4rem' }}>
          <div className="ls-card" style={{ maxWidth: 680, margin: '0 auto' }}>
            <h3 style={{ marginBottom: 18 }}>I tuoi dati</h3>
            <IniziaForm />
          </div>
        </section>
      </div>
    </SiteChrome>
  )
}
