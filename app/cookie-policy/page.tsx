import type { Metadata } from 'next'
import Link from 'next/link'
import SiteChrome from '@/components/site/SiteChrome'
import { COMPANY } from '@/lib/company'

export const metadata: Metadata = {
  title: 'Cookie Policy · Lumino',
  description:
    'Cookie Policy di Lumino: quali cookie e tecnologie simili utilizziamo, a quale scopo e come gestire le tue preferenze.',
}

export default function CookiePolicyPage() {
  return (
    <SiteChrome
      header={{
        kicker: '✦ legale',
        title: 'Cookie Policy',
        intro:
          'Questa pagina spiega cosa sono i cookie, quali utilizziamo sul nostro sito e come puoi gestire le tue preferenze.',
        updated: COMPANY.lastUpdated,
      }}
    >
      <div className="ls-container">
        <article className="ls-prose">
          <h2>1. Cosa sono i cookie</h2>
          <p>
            I cookie sono piccoli file di testo che i siti salvano sul dispositivo dell’utente per
            far funzionare il sito, ricordare le preferenze o raccogliere informazioni statistiche.
            Tecnologie simili (come il local storage) svolgono funzioni analoghe.
          </p>

          <h2>2. Tipi di cookie che utilizziamo</h2>
          <table className="ls-table">
            <thead>
              <tr>
                <th>Categoria</th>
                <th>Finalità</th>
                <th>Consenso</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Tecnici / necessari</td>
                <td>
                  Garantiscono il funzionamento del sito, l’autenticazione e la sicurezza (es.
                  sessione di accesso).
                </td>
                <td>Non richiesto</td>
              </tr>
              <tr>
                <td>Funzionali</td>
                <td>Ricordano le preferenze dell’utente per migliorare l’esperienza.</td>
                <td>Richiesto</td>
              </tr>
              <tr>
                <td>Statistici / analitici</td>
                <td>
                  Ci aiutano a capire come viene usato il sito in forma aggregata per migliorarlo.
                </td>
                <td>Richiesto</td>
              </tr>
              <tr>
                <td>Di terze parti</td>
                <td>
                  Impostati da servizi esterni che integriamo (es. fornitore di pagamenti, mappe,
                  font).
                </td>
                <td>Richiesto (ove non tecnici)</td>
              </tr>
            </tbody>
          </table>

          <h2>3. Cookie di terze parti</h2>
          <p>
            Alcune funzionalità si appoggiano a servizi esterni che possono impostare propri cookie,
            ciascuno con la propria informativa, tra cui il fornitore di pagamenti (
            {COMPANY.paymentProvider}), i servizi di mappe e i provider dei font web. Ti invitiamo a
            consultare le rispettive privacy/cookie policy.
          </p>

          <h2>4. Come gestire i cookie</h2>
          <p>
            Puoi gestire o disattivare i cookie tramite l’eventuale banner di consenso presente sul
            sito e in qualsiasi momento dalle impostazioni del tuo browser. La disattivazione dei
            cookie tecnici potrebbe compromettere alcune funzionalità del sito.
          </p>
          <p>
            Le principali guide dei browser:
          </p>
          <ul>
            <li>Chrome, Firefox, Safari ed Edge offrono impostazioni dedicate alla gestione dei cookie nelle rispettive preferenze sulla privacy.</li>
          </ul>

          <h2>5. Dati personali e cookie</h2>
          <p>
            Il titolare del trattamento è <strong>{COMPANY.legalName}</strong> (Company No.{' '}
            {COMPANY.companyNumber}), con sede legale in {COMPANY.address.full}. Il trattamento dei
            dati raccolti tramite cookie è descritto nella nostra{' '}
            <Link href="/privacy-policy">Privacy Policy</Link>. Per i tuoi diritti consulta anche
            l’<Link href="/gdpr">Informativa GDPR</Link>.
          </p>

          <h2>6. Aggiornamenti</h2>
          <p>
            Questa Cookie Policy può essere aggiornata. La versione vigente è quella pubblicata su
            questa pagina con la relativa data di ultimo aggiornamento.
          </p>

          <div className="ls-note">
            Domande sui cookie? Scrivici a{' '}
            <a href={`mailto:${COMPANY.privacyEmail}`}>{COMPANY.privacyEmail}</a>.
          </div>
        </article>
      </div>
    </SiteChrome>
  )
}
