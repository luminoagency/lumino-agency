import type { Metadata } from 'next'
import Link from 'next/link'
import SiteChrome from '@/components/site/SiteChrome'
import { COMPANY } from '@/lib/company'
import { SALES_TERMS } from '@/lib/plans'

export const metadata: Metadata = {
  title: 'Resi e Rimborsi · Lumino',
  description:
    'Politica resi e rimborsi di Lumino: diritto di recesso, rimborsi, casi particolari per i servizi digitali su misura e come richiedere un rimborso.',
}

export default function ResiRimborsiPage() {
  return (
    <SiteChrome
      header={{
        kicker: '✦ legale',
        title: 'Politica Resi e Rimborsi',
        intro:
          'Vogliamo che tu sia soddisfatto del servizio. Qui spieghiamo come funzionano recesso, rimborsi e le regole specifiche per i servizi digitali realizzati su misura.',
        updated: COMPANY.lastUpdated,
      }}
    >
      <div className="ls-container">
        <article className="ls-prose">
          <h2>1. Natura del servizio</h2>
          <p>
            {COMPANY.brand} fornisce un <strong>servizio digitale su misura</strong>: la
            realizzazione di un sito web personalizzato per la tua attività. Questo incide sulle
            modalità di recesso e rimborso, come spiegato di seguito.
          </p>

          <h2>2. Diritto di recesso (consumatori)</h2>
          <p>
            Se acquisti come consumatore, hai diritto di recedere dal contratto entro{' '}
            <strong>14 giorni</strong> dalla conclusione dello stesso, senza dover fornire
            motivazioni, ai sensi del Codice del Consumo (D.lgs. 206/2005).
          </p>
          <p>
            <strong>Eccezione per i servizi digitali e i beni su misura:</strong> richiedendo
            l’avvio immediato della lavorazione, riconosci che il servizio consiste nella creazione di
            contenuti personalizzati. Una volta che la prestazione è stata completata, o per la parte
            di lavoro già eseguita su tua espressa richiesta, il diritto di recesso non può essere
            esercitato o è limitato al lavoro non ancora svolto, come previsto dall’art. 59 del Codice
            del Consumo.
          </p>

          <h2>3. Acconto e saldo</h2>
          <p>
            Il servizio prevede il versamento del <strong>{SALES_TERMS.upfrontPercent}%
            all’avvio</strong> e del restante {100 - SALES_TERMS.upfrontPercent}% alla consegna.
          </p>
          <ul>
            <li>
              <strong>Prima dell’avvio della lavorazione:</strong> se eserciti il recesso prima che
              iniziamo a lavorare, hai diritto al rimborso integrale di quanto versato.
            </li>
            <li>
              <strong>Dopo l’avvio della lavorazione:</strong> l’acconto copre il lavoro di
              progettazione e realizzazione già avviato; potrà essere trattenuto in misura
              proporzionale al lavoro effettivamente svolto.
            </li>
            <li>
              <strong>A servizio completato e consegnato:</strong> trattandosi di contenuto digitale
              su misura, il corrispettivo non è rimborsabile, salvo i casi di seguito previsti.
            </li>
          </ul>

          <h2>4. Quando rimborsiamo</h2>
          <p>Procediamo al rimborso, totale o parziale, nei seguenti casi:</p>
          <ul>
            <li>pagamento duplicato o errore di addebito;</li>
            <li>mancata erogazione del servizio per causa a noi imputabile;</li>
            <li>
              difformità sostanziale e non sanabile del risultato rispetto a quanto concordato,
              qualora non riusciamo a porvi rimedio.
            </li>
          </ul>

          <h2>5. Come richiedere un rimborso</h2>
          <p>
            Invia una richiesta a <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> indicando
            il nome dell’account, il riferimento dell’ordine e il motivo. Ti risponderemo entro un
            giorno lavorativo e valuteremo la richiesta in buona fede.
          </p>

          <h2>6. Tempi e modalità del rimborso</h2>
          <p>
            I rimborsi approvati vengono effettuati con lo <strong>stesso metodo di pagamento</strong>{' '}
            utilizzato per l’acquisto, tramite il nostro fornitore di pagamenti{' '}
            ({COMPANY.paymentProvider}), di norma entro <strong>14 giorni</strong> dall’accettazione
            della richiesta. I tempi di accredito effettivi dipendono dall’emittente della carta o
            dal metodo utilizzato.
          </p>

          <h2>7. Reclami</h2>
          <p>
            Per qualsiasi reclamo puoi scriverci a{' '}
            <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>. È inoltre disponibile la
            piattaforma europea di risoluzione delle controversie online (ODR) della Commissione
            Europea.
          </p>

          <p>
            La presente politica è parte integrante dei{' '}
            <Link href="/termini-condizioni">Termini e Condizioni</Link>.
          </p>

          <div className="ls-note">
            Hai bisogno di assistenza su un ordine? Scrivici a{' '}
            <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> — siamo qui per aiutarti.
          </div>
        </article>
      </div>
    </SiteChrome>
  )
}
