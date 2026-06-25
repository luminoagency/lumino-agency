import type { Metadata } from 'next'
import Link from 'next/link'
import SiteChrome from '@/components/site/SiteChrome'
import { COMPANY } from '@/lib/company'

export const metadata: Metadata = {
  title: 'Disclaimer · Lumino',
  description:
    'Disclaimer di Lumino: limitazioni di responsabilità sui contenuti del sito, link esterni e contenuti forniti dai clienti.',
}

export default function DisclaimerPage() {
  return (
    <SiteChrome
      header={{
        kicker: '✦ legale',
        title: 'Disclaimer',
        intro:
          'Avvertenze e limitazioni di responsabilità relative ai contenuti e all’utilizzo del sito di Lumino.',
        updated: COMPANY.lastUpdated,
      }}
    >
      <div className="ls-container">
        <article className="ls-prose">
          <h2>1. Informazioni generali</h2>
          <p>
            Le informazioni pubblicate su questo sito da <strong>{COMPANY.legalName}</strong> («
            {COMPANY.brand}») hanno scopo informativo. Pur impegnandoci a mantenerle accurate e
            aggiornate, non garantiamo che siano sempre complete, corrette o prive di errori, e non
            costituiscono consulenza professionale.
          </p>

          <h2>2. Disponibilità del sito</h2>
          <p>
            Ci impegniamo a mantenere il sito accessibile, ma non garantiamo che il funzionamento sia
            continuo, privo di interruzioni o di errori tecnici. Possiamo modificare, sospendere o
            interrompere contenuti e funzionalità in qualsiasi momento.
          </p>

          <h2>3. Link a siti esterni</h2>
          <p>
            Il sito può contenere collegamenti a siti di terze parti. Non controlliamo tali siti e
            non siamo responsabili dei loro contenuti, delle loro politiche o della loro
            disponibilità. L’accesso a siti esterni avviene a rischio dell’utente.
          </p>

          <h2>4. Contenuti dei siti dei clienti</h2>
          <p>
            I siti realizzati per i clienti includono testi, foto e informazioni curati su misura. Il
            cliente è tenuto a controllare e validare i contenuti prima della pubblicazione; resta
            responsabile dell’accuratezza delle informazioni relative alla propria attività (ad
            esempio prezzi, orari, allergeni e disponibilità).
          </p>

          <h2>5. Contenuti forniti dai clienti</h2>
          <p>
            Non siamo responsabili per i contenuti (testi, immagini, marchi, dati) forniti dai
            clienti né pubblicati sui siti realizzati su loro istruzione. Il cliente garantisce di
            disporre dei relativi diritti e si assume la responsabilità di tali contenuti.
          </p>

          <h2>6. Limitazione di responsabilità</h2>
          <p>
            Nei limiti consentiti dalla legge, {COMPANY.brand} non è responsabile per eventuali danni
            diretti o indiretti derivanti dall’uso o dall’impossibilità di usare il sito o i suoi
            contenuti. Restano impregiudicati i diritti inderogabili previsti dalla legge a favore
            dei consumatori.
          </p>

          <h2>7. Proprietà intellettuale</h2>
          <p>
            Marchi, logo, testi e grafiche di {COMPANY.brand} sono protetti e non possono essere
            utilizzati senza autorizzazione. Per i dettagli sui diritti relativi ai servizi consulta
            i <Link href="/termini-condizioni">Termini e Condizioni</Link>.
          </p>

          <div className="ls-note">
            Per chiarimenti su questo disclaimer scrivici a{' '}
            <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>.
          </div>
        </article>
      </div>
    </SiteChrome>
  )
}
