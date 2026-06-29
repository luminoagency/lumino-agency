import type { Metadata } from 'next'
import Link from 'next/link'
import SiteChrome from '@/components/site/SiteChrome'
import { COMPANY } from '@/lib/company'

export const metadata: Metadata = {
  title: 'Privacy Policy · Lumino',
  description:
    'Informativa sulla privacy di Lumino: quali dati raccogliamo, perché, come li trattiamo e quali sono i tuoi diritti ai sensi del GDPR.',
}

export default function PrivacyPolicyPage() {
  return (
    <SiteChrome
      header={{
        kicker: '✦ legale',
        title: 'Privacy Policy',
        intro:
          'La presente informativa descrive come trattiamo i dati personali degli utenti del sito e dei clienti del servizio, ai sensi del Regolamento (UE) 2016/679 (GDPR).',
        updated: COMPANY.lastUpdated,
      }}
    >
      <div className="ls-container">
        <article className="ls-prose">
          <h2>1. Titolare del trattamento</h2>
          <p>
            Il titolare del trattamento dei dati è <strong>{COMPANY.legalName}</strong> (Company
            No. {COMPANY.companyNumber}), società titolare del brand «{COMPANY.brand}» (di seguito
            «{COMPANY.brand}», «noi»), con sede legale in {COMPANY.address.full}.
          </p>
          <p>
            Per qualsiasi questione relativa al trattamento dei tuoi dati puoi scriverci a{' '}
            <a href={`mailto:${COMPANY.privacyEmail}`}>{COMPANY.privacyEmail}</a>.
          </p>

          <h2>2. Quali dati raccogliamo</h2>
          <p>Trattiamo le seguenti categorie di dati personali:</p>
          <ul>
            <li>
              <strong>Dati di registrazione e account:</strong> nome, email, password (in forma
              cifrata), nome e dati dell’attività.
            </li>
            <li>
              <strong>Dati di contatto e comunicazione:</strong> messaggi che ci invii via email o
              tramite il modulo di contatto.
            </li>
            <li>
              <strong>Dati relativi all’ordine e al pagamento:</strong> piano scelto, importi,
              stato del pagamento. I dati della carta sono trattati direttamente dal fornitore di
              pagamenti e non sono da noi conservati.
            </li>
            <li>
              <strong>Dati tecnici e di navigazione:</strong> indirizzo IP, tipo di browser, pagine
              visitate, raccolti tramite cookie e tecnologie simili (vedi{' '}
              <Link href="/cookie-policy">Cookie Policy</Link>).
            </li>
            <li>
              <strong>Contenuti del sito cliente:</strong> testi, immagini e informazioni che ci
              fornisci o che pubblichiamo per realizzare il tuo sito.
            </li>
          </ul>

          <h2>3. Perché trattiamo i dati e su quale base giuridica</h2>
          <table className="ls-table">
            <thead>
              <tr>
                <th>Finalità</th>
                <th>Base giuridica</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Erogazione del servizio e gestione dell’account</td>
                <td>Esecuzione del contratto (art. 6.1.b GDPR)</td>
              </tr>
              <tr>
                <td>Gestione di pagamenti e fatturazione</td>
                <td>Esecuzione del contratto e obblighi di legge (art. 6.1.b e 6.1.c)</td>
              </tr>
              <tr>
                <td>Risposta a richieste di contatto e assistenza</td>
                <td>Esecuzione di misure precontrattuali / legittimo interesse (art. 6.1.b/f)</td>
              </tr>
              <tr>
                <td>Sicurezza, prevenzione abusi e miglioramento del servizio</td>
                <td>Legittimo interesse (art. 6.1.f)</td>
              </tr>
              <tr>
                <td>Newsletter e comunicazioni commerciali</td>
                <td>Consenso (art. 6.1.a)</td>
              </tr>
            </tbody>
          </table>

          <h2>4. Come condividiamo i dati</h2>
          <p>
            Non vendiamo i tuoi dati personali. Li condividiamo solo con fornitori che ci aiutano a
            erogare il servizio, nominati responsabili del trattamento ove richiesto, tra cui:
          </p>
          <ul>
            <li>fornitori di hosting e infrastruttura cloud;</li>
            <li>
              il fornitore dei pagamenti ({COMPANY.paymentProvider}) per gestire le transazioni in
              modo sicuro;
            </li>
            <li>fornitori di email e strumenti di assistenza;</li>
            <li>consulenti e autorità, quando previsto dalla legge.</li>
          </ul>

          <h2>5. Trasferimenti extra UE</h2>
          <p>
            Alcuni fornitori potrebbero trattare dati al di fuori dello Spazio Economico Europeo. In
            tali casi garantiamo adeguate garanzie, come le Clausole Contrattuali Standard approvate
            dalla Commissione Europea.
          </p>

          <h2>6. Per quanto tempo conserviamo i dati</h2>
          <p>
            Conserviamo i dati per il tempo necessario alle finalità indicate: i dati dell’account
            per la durata del rapporto e, successivamente, nei limiti degli obblighi legali e
            fiscali (di norma 10 anni per i documenti contabili). I dati trattati su consenso sono
            conservati fino alla revoca dello stesso.
          </p>

          <h2>7. I tuoi diritti</h2>
          <p>
            Ai sensi degli artt. 15–22 del GDPR hai diritto di accesso, rettifica, cancellazione,
            limitazione, portabilità e opposizione, oltre al diritto di revocare il consenso in
            qualsiasi momento. Per esercitarli scrivi a{' '}
            <a href={`mailto:${COMPANY.privacyEmail}`}>{COMPANY.privacyEmail}</a>. Trovi i dettagli
            operativi nell’<Link href="/gdpr">Informativa GDPR</Link>.
          </p>
          <p>
            Hai inoltre il diritto di proporre reclamo all’Autorità Garante per la protezione dei
            dati personali (<a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer">garanteprivacy.it</a>).
          </p>

          <h2>8. Sicurezza</h2>
          <p>
            Adottiamo misure tecniche e organizzative adeguate per proteggere i dati da accessi non
            autorizzati, perdita o uso improprio, tra cui cifratura delle password, connessioni
            protette (HTTPS) e accessi controllati.
          </p>

          <h2>9. Modifiche</h2>
          <p>
            Potremo aggiornare questa informativa nel tempo. La versione vigente è sempre quella
            pubblicata su questa pagina, con indicazione della data di ultimo aggiornamento.
          </p>

          <div className="ls-note">
            Per esercitare i tuoi diritti o per qualsiasi domanda sulla privacy, scrivici a{' '}
            <a href={`mailto:${COMPANY.privacyEmail}`}>{COMPANY.privacyEmail}</a>.
          </div>
        </article>
      </div>
    </SiteChrome>
  )
}
