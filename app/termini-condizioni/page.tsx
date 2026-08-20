import type { Metadata } from 'next'
import Link from 'next/link'
import LegalChrome from '@/components/legal/LegalChrome'
import { COMPANY } from '@/lib/company'
import { SALES_TERMS } from '@/lib/plans'

export const metadata: Metadata = {
  alternates: { canonical: '/termini-condizioni' },
  title: 'Termini e Condizioni',
  description:
    'Termini e Condizioni del servizio Lumino: descrizione del servizio, ordini, prezzi, pagamenti, consegna, obblighi delle parti e responsabilità.',
}

export default function TerminiCondizioniPage() {
  return (
    <LegalChrome
      title="Termini e Condizioni"
      intro={
        'Le presenti condizioni regolano l’utilizzo del sito e l’acquisto dei servizi offerti da Lumino. Effettuando un ordine, dichiari di averle lette e accettate.'
      }
      updated={COMPANY.lastUpdated}
      sections={[
        { id: '1-chi-siamo', label: 'Chi siamo' },
        { id: '2-oggetto-del-servizio', label: 'Oggetto del servizio' },
        {
          id: '3-ordine-e-conclusione-del-contratto',
          label: 'Ordine e conclusione del contratto',
        },
        { id: '4-prezzi', label: 'Prezzi' },
        { id: '5-pagamenti', label: 'Pagamenti' },
        { id: '6-consegna-ed-esecuzione', label: 'Consegna ed esecuzione' },
        { id: '7-obblighi-del-cliente', label: 'Obblighi del cliente' },
        { id: '8-proprieta-intellettuale', label: 'Proprietà intellettuale' },
        {
          id: '9-diritto-di-recesso-resi-e-rimborsi',
          label: 'Diritto di recesso, resi e rimborsi',
        },
        {
          id: '10-limitazione-di-responsabilita',
          label: 'Limitazione di responsabilità',
        },
        {
          id: '11-sospensione-e-cessazione',
          label: 'Sospensione e cessazione',
        },
        { id: '12-modifiche-ai-termini', label: 'Modifiche ai Termini' },
        {
          id: '13-legge-applicabile-e-foro',
          label: 'Legge applicabile e foro',
        },
      ]}
    >
      <h2 id="1-chi-siamo">1. Chi siamo</h2>
      <p>
        Il servizio è fornito da <strong>{COMPANY.legalName}</strong> (Company No.{' '}
        {COMPANY.companyNumber}), società titolare del brand «{COMPANY.brand}», con sede legale in{' '}
        {COMPANY.address.full}. Contatti: <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>.
      </p>

      <h2 id="2-oggetto-del-servizio">2. Oggetto del servizio</h2>
      <p>
        {COMPANY.brand} offre un servizio digitale di creazione, pubblicazione e gestione di siti
        web per ristoranti, hotel, aziende e retail, realizzati su misura e curati nei minimi
        dettagli. Il servizio include, secondo il piano scelto, hosting, dominio, pannello di
        gestione e assistenza. La descrizione dettagliata dei piani e delle funzionalità è
        disponibile nella pagina <Link href="/pricing">Piani e prezzi</Link>.
      </p>

      <h2 id="3-ordine-e-conclusione-del-contratto">3. Ordine e conclusione del contratto</h2>
      <p>
        L’ordine si effettua tramite registrazione e selezione del piano sul sito. Il contratto si
        intende concluso al momento della conferma dell’ordine e dell’avvenuto pagamento
        dell’importo dovuto. Riceverai conferma via email.
      </p>

      <h2 id="4-prezzi">4. Prezzi</h2>
      <p>
        I prezzi dei piani partono da €400 (Basic), €700 (Pro) e €1.100 (Premium). Il prezzo finale
        può variare in funzione della zona e della tipologia dell’attività, come indicato durante
        l’ordine. Tutti i prezzi sono espressi in euro. {SALES_TERMS.publicNote}
      </p>

      <h2 id="5-pagamenti">5. Pagamenti</h2>
      <p>
        Il servizio prevede un <strong>pagamento unico</strong>, senza abbonamenti ricorrenti. È
        previsto il versamento del{' '}
        <strong>{SALES_TERMS.upfrontPercent}% all’avvio del lavoro</strong> e del restante{' '}
        {100 - SALES_TERMS.upfrontPercent}% alla consegna del sito.
      </p>
      <p>
        I pagamenti sono elaborati in modo sicuro tramite il fornitore di pagamenti{' '}
        {COMPANY.paymentProvider}. Accettiamo le principali carte e i metodi di pagamento resi
        disponibili al checkout. {COMPANY.brand} non raccoglie né conserva i dati completi delle
        carte di pagamento.
      </p>

      <h2 id="6-consegna-ed-esecuzione">6. Consegna ed esecuzione</h2>
      <p>
        Trattandosi di un servizio digitale, non sono previste spedizioni fisiche. L’anteprima del
        sito viene messa a disposizione di norma <strong>in pochi giorni</strong> dalla conferma
        dell’ordine; la pubblicazione avviene a seguito dell’approvazione del cliente. I tempi
        possono variare in funzione della tempestività con cui il cliente fornisce i contenuti e i
        riscontri necessari.
      </p>

      <h2 id="7-obblighi-del-cliente">7. Obblighi del cliente</h2>
      <ul>
        <li>fornire informazioni veritiere, complete e aggiornate;</li>
        <li>
          garantire di avere i diritti sui contenuti (testi, immagini, marchi) forniti per la
          realizzazione del sito;
        </li>
        <li>
          non utilizzare il servizio per finalità illecite, ingannevoli o lesive di diritti di
          terzi;
        </li>
        <li>custodire le credenziali di accesso al proprio account.</li>
      </ul>

      <h2 id="8-proprieta-intellettuale">8. Proprietà intellettuale</h2>
      <p>
        I contenuti forniti dal cliente restano di sua proprietà. Il software, la piattaforma, i
        modelli e gli strumenti utilizzati da {COMPANY.brand} restano di nostra esclusiva proprietà.
        A pagamento completato, il cliente ottiene il diritto d’uso del sito realizzato secondo il
        piano sottoscritto.
      </p>

      <h2 id="9-diritto-di-recesso-resi-e-rimborsi">9. Diritto di recesso, resi e rimborsi</h2>
      <p>
        Le condizioni relative al diritto di recesso, alla disdetta e ai rimborsi sono descritte
        nella pagina dedicata <Link href="/resi-rimborsi">Resi e Rimborsi</Link>, che costituisce
        parte integrante dei presenti Termini.
      </p>

      <h2 id="10-limitazione-di-responsabilita">10. Limitazione di responsabilità</h2>
      <p>
        Ci impegniamo a fornire il servizio con la massima diligenza, ma non garantiamo che sia
        privo di interruzioni o errori. Nei limiti consentiti dalla legge, {COMPANY.brand} non è
        responsabile per danni indiretti o consequenziali derivanti dall’uso o dall’impossibilità di
        usare il servizio. Restano salvi i diritti inderogabili riconosciuti ai consumatori.
      </p>

      <h2 id="11-sospensione-e-cessazione">11. Sospensione e cessazione</h2>
      <p>
        Possiamo sospendere o chiudere un account in caso di violazione dei presenti Termini,
        mancato pagamento o uso illecito del servizio, dandone comunicazione al cliente.
      </p>

      <h2 id="12-modifiche-ai-termini">12. Modifiche ai Termini</h2>
      <p>
        Potremo aggiornare i presenti Termini. La versione vigente è quella pubblicata su questa
        pagina. Le modifiche non si applicano retroattivamente agli ordini già conclusi.
      </p>

      <h2 id="13-legge-applicabile-e-foro">13. Legge applicabile e foro</h2>
      <p>
        I presenti Termini sono regolati dalla legge italiana. Per i rapporti con i consumatori è
        competente il foro del luogo di residenza o domicilio del consumatore; per gli altri
        rapporti si applica il foro indicato nei documenti contrattuali. È fatta salva la
        possibilità di ricorrere alla piattaforma europea di risoluzione delle controversie online
        (ODR).
      </p>

      <div className="ls-note">
        Hai domande sui Termini? Scrivici a <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>.
      </div>
    </LegalChrome>
  )
}
