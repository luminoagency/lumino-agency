import { KeyRound } from 'lucide-react'
import PageHead from '@/components/staff/PageHead'
import { requireStaff } from '@/lib/staff/auth'
import { eAdmin } from '@/lib/staff/permessi'
import { demoAttivo } from '@/lib/staff/demo'
import { caricaInsight } from '@/lib/staff/f5'
import { foglioDati, labAttivo } from '@/lib/staff/lab'
import { fontiArchivio } from '@/lib/staff/archivio-lab'
import { AVVISO_SCHEMA } from '@/lib/staff/queries'
import LabView from './LabView'

export const metadata = { title: 'Lab AI' }
export const dynamic = 'force-dynamic'

/**
 * Il laboratorio.
 *
 * ## Senza chiave la pagina non è rotta: è spenta
 *
 * È la differenza che questo file esiste per tenere. Se `GEMINI_API_KEY` manca,
 * la conversazione **non si disegna a metà** e non compare nessun campo che poi
 * risponde con un errore: si vede una pagina che spiega in due righe cosa
 * manca, e sotto lo scaffale degli insight già salvati, che funziona lo stesso
 * perché sono righe di un database e non hanno niente a che fare con Gemini.
 *
 * Un campo che accetta una domanda e risponde «servizio non configurato» è il
 * modo peggiore di dire la stessa cosa: fa fare un giro per scoprire che non si
 * poteva fare.
 *
 * ## Il foglio si costruisce qui e si mostra
 *
 * `foglioDati` lo chiama anche la route, e `cache()` fa sì che in questo render
 * sia costruito una volta sola. Mostrarlo non è trasparenza per bella figura: è
 * l'unico modo perché qualcuno possa accorgersi che il Lab sta rispondendo su
 * dati vecchi o sui dati finti, e in una dashboard su cui si prendono decisioni
 * quella è un'informazione, non un dettaglio.
 *
 * ## Le fonti dell'archivio arrivano già pronte
 *
 * In modalità archivio il modello cita `[#7]`, e l'interfaccia deve saperlo
 * trasformare in un link alla voce. La corrispondenza la dà `fontiArchivio`, che
 * legge **due colonne** — non rifà il foglio: rifarlo vorrebbe dire rileggere
 * tutto il testo estratto dell'archivio per disegnare dei link.
 */
export default async function LabPage() {
  const me = await requireStaff()
  const demo = demoAttivo(me.role)
  const attivo = labAttivo()

  /* Le due letture in parallelo, e il foglio solo se serve: senza chiave il Lab
     non parte, e costruire il foglio vorrebbe dire interrogare tutto il
     database per non mostrarlo a nessuno. */
  const [{ insight, mancaSchema }, foglio, fonti] = await Promise.all([
    caricaInsight(demo),
    attivo ? foglioDati(demo, eAdmin(me)) : Promise.resolve(''),
    attivo ? fontiArchivio(demo) : Promise.resolve([]),
  ])

  return (
    <>
      <PageHead
        title={
          <>
            Il <em>laboratorio</em>
          </>
        }
        sub="Domande in italiano sui numeri della dashboard o sul materiale dell’Archivio. Quello che vale si tiene da parte."
      />

      {mancaSchema && <p className="lm-avviso">{AVVISO_SCHEMA}</p>}

      {!attivo && (
        <div className="lm-card lm-lab-spento" data-tone="pearl">
          <span className="lm-lab-chiave" aria-hidden="true">
            <KeyRound />
          </span>
          <div>
            <b>Il Lab è da attivare.</b>
            <p className="lm-sub">
              Serve una chiave del piano gratuito di Gemini in <code>GEMINI_API_KEY</code>: si prende
              su <span className="lm-nowrap">aistudio.google.com</span>, si incolla nelle variabili
              d’ambiente e la pagina si accende da sola. Tutto il resto qui sotto funziona già.
            </p>
          </div>
        </div>
      )}

      <LabView
        attivo={attivo}
        insight={insight}
        foglio={foglio}
        fonti={fonti}
        ioSono={me.nome.split(' ')[0]}
        isAdmin={eAdmin(me)}
      />
    </>
  )
}
