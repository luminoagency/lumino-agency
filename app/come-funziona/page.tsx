import type { Metadata } from 'next'
import Link from 'next/link'
import SiteChrome from '@/components/site/SiteChrome'
import { SALES_TERMS } from '@/lib/plans'

export const metadata: Metadata = {
  title: 'Come funziona · Lumino',
  description:
    'Scopri come lavoriamo: i passi, i tempi di consegna, il pagamento e cosa è incluso nel tuo sito.',
}

const STEPS = [
  {
    n: '01',
    t: 'Ci racconti del tuo locale',
    p: 'Ci parli del ristorante, della cucina e di cosa ti serve. Scegli il piano più adatto a te.',
  },
  {
    n: '02',
    t: 'Noi costruiamo',
    p: 'Curiamo testi, foto e menu su misura per te, e impostiamo orari e contatti.',
  },
  {
    n: '03',
    t: 'Tu approvi',
    p: 'In pochi giorni ti mostriamo il sito. Controlli, chiedi modifiche e lo rendi davvero tuo.',
  },
  {
    n: '04',
    t: 'Vai online',
    p: 'Pubblichi con un clic. Da quel momento gestisci tutto dal pannello, in autonomia.',
  },
]

const INCLUDED = [
  'Sito completo, responsive e ottimizzato per smartphone',
  'Testi scritti su misura per la tua attività',
  'Hosting incluso su dominio bylumino.com (dominio personalizzato su Pro e Premium)',
  'Pannello di gestione per aggiornare contenuti, orari e contatti',
  'Assistenza via email (WhatsApp prioritario sul piano Premium)',
]

export default function ComeFunzionaPage() {
  return (
    <SiteChrome
      header={{
        kicker: '✦ come funziona',
        title: (
          <>
            Quattro passi. Il tuo sito <em>pronto</em> in pochi giorni.
          </>
        ),
        intro:
          'Niente riunioni infinite né preventivi complicati. Ci racconti del tuo locale, noi costruiamo, tu approvi e vai online. Ecco tutto quello che succede dietro le quinte.',
      }}
    >
      <div className="ls-container">
        {/* Steps */}
        <section className="ls-section">
          <div className="ls-grid ls-grid-2">
            {STEPS.map((s) => (
              <div key={s.n} className="ls-card">
                <div className="ls-card-n">{s.n}</div>
                <h3>{s.t}</h3>
                <p>{s.p}</p>
              </div>
            ))}
          </div>
        </section>

        {/* What's included */}
        <section className="ls-section">
          <h2 className="ls-section-title">
            Cosa è <em>incluso</em>
          </h2>
          <div className="ls-prose">
            <ul>
              {INCLUDED.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
            <p style={{ marginTop: '1.2rem' }}>
              Le funzionalità esatte dipendono dal piano scelto. Trovi il confronto completo nella
              pagina <Link href="/pricing">Piani e prezzi</Link>.
            </p>
          </div>
        </section>

        {/* Delivery & payment */}
        <section className="ls-section">
          <h2 className="ls-section-title">
            Tempi e <em>pagamento</em>
          </h2>
          <div className="ls-prose">
            <h3>Tempi di consegna</h3>
            <p>
              Dalla conferma dell’ordine, il sito viene preparato e mostrato in anteprima{' '}
              <strong>in pochi giorni</strong>. La pubblicazione online avviene subito dopo la
              tua approvazione. Trattandosi di un servizio digitale, non sono previste spedizioni
              fisiche.
            </p>
            <h3>Come si paga</h3>
            <p>
              Il servizio prevede un <strong>pagamento unico</strong>, senza abbonamenti. È richiesto
              il <strong>{SALES_TERMS.upfrontPercent}% all’avvio del lavoro</strong> e il restante{' '}
              {100 - SALES_TERMS.upfrontPercent}% alla consegna del sito. I pagamenti sono gestiti in
              modo sicuro tramite il nostro fornitore di pagamenti; non trattiamo né conserviamo i
              dati della tua carta.
            </p>
            <p>
              Per i dettagli su recesso, rimborsi e disdetta consulta la pagina{' '}
              <Link href="/resi-rimborsi">Resi e Rimborsi</Link> e i{' '}
              <Link href="/termini-condizioni">Termini e Condizioni</Link>.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="ls-section" style={{ textAlign: 'center', paddingBottom: '4rem' }}>
          <h2 className="ls-section-title">
            Iniziamo <em>oggi</em>.
          </h2>
          <p className="ls-lead" style={{ margin: '0 auto 28px' }}>
            Raccontaci del tuo locale e ricevi il tuo sito in pochi giorni.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/inizia" className="ls-btn ls-btn-primary">
              Inizia ora →
            </Link>
            <Link href="/pricing" className="ls-btn ls-btn-secondary">
              Vedi i piani
            </Link>
          </div>
        </section>
      </div>
    </SiteChrome>
  )
}
