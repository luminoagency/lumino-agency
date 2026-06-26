import type { Metadata } from 'next'
import Link from 'next/link'
import SiteChrome from '@/components/site/SiteChrome'
import FaqAccordion, { type FaqGroup } from './FaqAccordion'
import { SALES_TERMS } from '@/lib/plans'

export const metadata: Metadata = {
  title: 'Domande frequenti · Lumino',
  description:
    'Risposte alle domande più comuni su Lumino: come funziona il servizio, tempi di consegna, pagamenti, rimborsi, dominio e gestione dei dati.',
}

const GROUPS: FaqGroup[] = [
  {
    title: 'Il servizio',
    items: [
      {
        q: 'Che cosa fa esattamente Lumino?',
        a: (
          <>
            Costruiamo il sito web della tua attività su misura e lo
            consegniamo pronto da pubblicare. Testi, organizzazione di menu o servizi, foto, orari,
            contatti e prenotazioni: ci pensiamo noi. Tu lo controlli, lo approvi e lo gestisci dal
            pannello.
          </>
        ),
      },
      {
        q: 'Per chi è pensato?',
        a: (
          <>
            Per ristoranti, pizzerie, bar, trattorie e in generale per le attività locali italiane
            che vogliono un sito professionale senza perdere tempo e senza costi mensili.
          </>
        ),
      },
      {
        q: 'Devo saper usare il computer?',
        a: (
          <>
            No. Il sito te lo prepariamo noi. Per gli aggiornamenti (orari, contatti, contenuti) il
            pannello è pensato per essere semplice come usare un’app sul telefono.
          </>
        ),
      },
    ],
  },
  {
    title: 'Tempi e consegna',
    items: [
      {
        q: 'In quanto tempo è pronto il sito?',
        a: (
          <>
            Dalla conferma dell’ordine ti mostriamo un’anteprima <strong>in pochi
            giorni</strong>. Dopo la tua approvazione il sito va online subito. Essendo un
            servizio digitale, non ci sono spedizioni.
          </>
        ),
      },
      {
        q: 'Posso chiedere modifiche?',
        a: (
          <>
            Sì. Prima della pubblicazione raccogliamo le tue correzioni. Dopo la pubblicazione puoi
            aggiornare i contenuti dal pannello; le modifiche più avanzate dipendono dal piano scelto.
          </>
        ),
      },
    ],
  },
  {
    title: 'Prezzi e pagamenti',
    items: [
      {
        q: 'Quanto costa?',
        a: (
          <>
            Si parte da €190 (Basic), €390 (Pro) e €590 (Premium). È un{' '}
            <strong>pagamento unico</strong>, senza abbonamenti. Il confronto completo è nella pagina{' '}
            <Link href="/pricing">Piani e prezzi</Link>.
          </>
        ),
      },
      {
        q: 'Come funziona il pagamento?',
        a: (
          <>
            Si versa il <strong>{SALES_TERMS.upfrontPercent}% all’avvio</strong> del lavoro e il
            restante {100 - SALES_TERMS.upfrontPercent}% alla consegna. I pagamenti sono gestiti in
            modo sicuro dal nostro fornitore di pagamenti: non vediamo né conserviamo i dati della
            tua carta.
          </>
        ),
      },
      {
        q: 'Quali metodi di pagamento accettate?',
        a: (
          <>
            Accettiamo le principali carte di credito e debito e i metodi di pagamento elettronici
            resi disponibili dal nostro fornitore di pagamenti al momento del checkout.
          </>
        ),
      },
      {
        q: 'Posso avere un rimborso?',
        a: (
          <>
            Sì, secondo quanto indicato nella nostra{' '}
            <Link href="/resi-rimborsi">Politica Resi e Rimborsi</Link>, che spiega anche il diritto
            di recesso e i casi particolari per i servizi digitali su misura.
          </>
        ),
      },
      {
        q: 'Ci sono costi nascosti?',
        a: <>No. Il prezzo include hosting, dominio (su Pro/Premium), aggiornamenti e supporto.</>,
      },
    ],
  },
  {
    title: 'Dominio e dati',
    items: [
      {
        q: 'Il dominio è incluso?',
        a: (
          <>
            <p style={{ margin: '0 0 10px' }}>Dipende dal piano.</p>
            <p style={{ margin: '0 0 10px' }}>
              Col piano Basic il tuo sito sarà su un sottodominio del nostro studio (es.{' '}
              <code>tuoristorante.bylumino.com</code>). È incluso e non scade. Se in futuro vuoi
              un dominio personalizzato (tipo <code>tuoristorante.it</code>), basta passare al
              piano Pro pagando la differenza.
            </p>
            <p style={{ margin: '0 0 10px' }}>Coi piani Pro e Premium la scelta è tua:</p>
            <p style={{ margin: '0 0 10px' }}>
              — Se hai già un dominio che usi o vuoi usare, lo colleghiamo noi al nuovo sito. Il
              rinnovo annuale resta a casa tua, dove l’hai sempre pagato.
            </p>
            <p style={{ margin: 0 }}>
              — Se non hai un dominio o ne vuoi uno nuovo, lo registriamo noi a tuo nome. Il primo
              anno è incluso. Dal secondo anno te lo rinnoviamo annualmente: quando si avvicina la
              scadenza ti scriviamo con il prezzo aggiornato e il link per il rinnovo. Se decidi di
              non rinnovarlo, il dominio si libera.
            </p>
          </>
        ),
      },
      {
        q: 'Come trattate i miei dati?',
        a: (
          <>
            Con la massima cura e nel rispetto del GDPR. Trovi tutti i dettagli nella{' '}
            <Link href="/privacy-policy">Privacy Policy</Link>, nella{' '}
            <Link href="/cookie-policy">Cookie Policy</Link> e nell’{' '}
            <Link href="/gdpr">Informativa GDPR</Link>.
          </>
        ),
      },
    ],
  },
]

export default function FaqPage() {
  return (
    <SiteChrome
      header={{
        kicker: '✦ domande frequenti',
        title: (
          <>
            Tutto quello che vuoi <em>sapere</em>.
          </>
        ),
        intro:
          'Le risposte alle domande che ci fanno più spesso. Non trovi la tua? Scrivici dalla pagina Contatti.',
      }}
    >
      <div className="ls-container">
        <section className="ls-section" style={{ paddingTop: '1rem' }}>
          <FaqAccordion groups={GROUPS} />
        </section>

        <section className="ls-section" style={{ textAlign: 'center', paddingBottom: '4rem' }}>
          <p className="ls-lead" style={{ margin: '0 auto 24px' }}>
            Hai ancora dubbi?
          </p>
          <Link href="/contatti" className="ls-btn ls-btn-primary">
            Contattaci →
          </Link>
        </section>
      </div>
    </SiteChrome>
  )
}
