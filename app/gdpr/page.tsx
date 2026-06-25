import type { Metadata } from 'next'
import Link from 'next/link'
import SiteChrome from '@/components/site/SiteChrome'
import { COMPANY } from '@/lib/company'

export const metadata: Metadata = {
  title: 'Informativa GDPR · Lumino',
  description:
    'Informativa GDPR di Lumino: i diritti degli interessati, come esercitarli e gli impegni in materia di protezione dei dati personali.',
}

export default function GdprPage() {
  return (
    <SiteChrome
      header={{
        kicker: '✦ legale',
        title: 'Informativa GDPR',
        intro:
          'Questa pagina riassume i tuoi diritti come interessato ai sensi del Regolamento (UE) 2016/679 e come esercitarli con Lumino.',
        updated: COMPANY.lastUpdated,
      }}
    >
      <div className="ls-container">
        <article className="ls-prose">
          <h2>1. Titolare del trattamento</h2>
          <p>
            Titolare del trattamento è <strong>{COMPANY.legalName}</strong>, società titolare del
            brand «{COMPANY.brand}». Per ogni
            richiesta in materia di dati personali puoi scrivere a{' '}
            <a href={`mailto:${COMPANY.privacyEmail}`}>{COMPANY.privacyEmail}</a>.
          </p>

          <h2>2. Principi che seguiamo</h2>
          <p>
            Trattiamo i dati personali in modo lecito, corretto e trasparente, raccogliendo solo i
            dati necessari per le finalità dichiarate (minimizzazione), conservandoli per il tempo
            strettamente necessario e proteggendoli con misure di sicurezza adeguate.
          </p>

          <h2>3. I tuoi diritti</h2>
          <p>In quanto interessato, hai diritto di:</p>
          <ul>
            <li>
              <strong>Accesso (art. 15):</strong> sapere se trattiamo i tuoi dati e ottenerne copia.
            </li>
            <li>
              <strong>Rettifica (art. 16):</strong> correggere dati inesatti o incompleti.
            </li>
            <li>
              <strong>Cancellazione (art. 17):</strong> chiedere la rimozione dei dati, nei casi
              previsti («diritto all’oblio»).
            </li>
            <li>
              <strong>Limitazione (art. 18):</strong> limitare il trattamento in determinate
              circostanze.
            </li>
            <li>
              <strong>Portabilità (art. 20):</strong> ricevere i tuoi dati in formato strutturato e
              trasmetterli ad altro titolare.
            </li>
            <li>
              <strong>Opposizione (art. 21):</strong> opporti al trattamento basato sul legittimo
              interesse o per finalità di marketing.
            </li>
            <li>
              <strong>Revoca del consenso (art. 7):</strong> revocare in qualsiasi momento il
              consenso prestato, senza pregiudicare la liceità del trattamento precedente.
            </li>
          </ul>

          <h2>4. Come esercitare i diritti</h2>
          <p>
            Per esercitare i tuoi diritti, invia una richiesta a{' '}
            <a href={`mailto:${COMPANY.privacyEmail}`}>{COMPANY.privacyEmail}</a> specificando il
            diritto che intendi esercitare. Risponderemo senza ingiustificato ritardo e comunque
            entro <strong>30 giorni</strong>, salvo proroghe consentite per richieste complesse. Per
            tutelare i tuoi dati, potremmo chiederti di confermare la tua identità.
          </p>

          <h2>5. Reclamo all’Autorità di controllo</h2>
          <p>
            Se ritieni che il trattamento dei tuoi dati violi la normativa, hai diritto di proporre
            reclamo al Garante per la protezione dei dati personali (
            <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer">
              garanteprivacy.it
            </a>
            ) o all’autorità competente del tuo Stato di residenza.
          </p>

          <h2>6. Responsabili e sicurezza</h2>
          <p>
            I fornitori che trattano dati per nostro conto (hosting, pagamenti, email) sono nominati
            responsabili del trattamento e vincolati al rispetto del GDPR. Adottiamo misure tecniche
            e organizzative adeguate a proteggere i dati.
          </p>

          <h2>7. Documenti collegati</h2>
          <p>
            Per il dettaglio completo dei trattamenti consulta la{' '}
            <Link href="/privacy-policy">Privacy Policy</Link> e la{' '}
            <Link href="/cookie-policy">Cookie Policy</Link>.
          </p>

          <div className="ls-note">
            Per esercitare i tuoi diritti GDPR scrivi a{' '}
            <a href={`mailto:${COMPANY.privacyEmail}`}>{COMPANY.privacyEmail}</a>.
          </div>
        </article>
      </div>
    </SiteChrome>
  )
}
