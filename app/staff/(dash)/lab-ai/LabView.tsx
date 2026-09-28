'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { ArrowUp, Bookmark, Square, Trash2 } from 'lucide-react'
import { CHIAVE_DOMANDA } from '@/components/staff/ChiediALumino'
import Modal from '@/components/staff/Modal'
import { eliminaInsight, salvaInsight } from '@/lib/staff/azioni-f5'
import { TIPI_INSIGHT, type Insight, type TipoInsight } from '@/lib/staff/lab-tipi'
import { dataBreve } from '@/lib/staff/types'

/**
 * Il laboratorio.
 *
 * Una conversazione e uno scaffale, affiancati: si chiede una cosa, e se la
 * risposta vale la si mette sullo scaffale. Senza lo scaffale sarebbe una chat —
 * cioè un posto dove si capiscono cose che poi si dimenticano.
 *
 * ## La conversazione non si salva
 *
 * È la scelta che sorprende di più, quindi vale la pena dirla: chiudendo la
 * pagina le domande spariscono. Non è pigrizia — è che una cronologia di chat
 * che si accumula in un database diventa in tre mesi trecento domande, di cui
 * nessuna si ritrova e tutte si conservano. Quello che vale si salva a mano, con
 * un titolo scelto da chi l'ha capito: è un gesto in più, ed è proprio il gesto
 * che distingue una cosa che serve da una che è passata di lì.
 *
 * ## La risposta si scrive da sé
 *
 * La route restituisce testo a pezzi. Non è decorazione: il piano gratuito
 * impiega fra due e sei secondi, e sei secondi di schermata ferma sono un
 * pulsante rotto. Vedere la prima frase dopo mezzo secondo cambia la stessa
 * attesa in un'attesa che si sopporta — ed è anche il momento in cui si capisce
 * che la domanda era sbagliata e si può fermare.
 */

interface Turno {
  ruolo: 'io' | 'lab'
  testo: string
}

const ESEMPI = [
  'Quale settore conviene di più?',
  'Dove stiamo chiudendo meglio?',
  'Cosa ci dicono più spesso quelli che non comprano?',
  'Il prezzo medio è cresciuto o sceso?',
]

export default function LabView({
  attivo,
  insight,
  foglio,
  ioSono,
  isAdmin,
}: {
  /** La chiave di Gemini c'è. Senza, la conversazione non si disegna affatto. */
  attivo: boolean
  insight: Insight[]
  /** Il foglio che parte al modello, mostrato tale e quale dietro un dettaglio. */
  foglio: string
  ioSono: string
  isAdmin: boolean
}) {
  const [turni, setTurni] = useState<Turno[]>([])
  const [domanda, setDomanda] = useState('')
  const [inCorso, setInCorso] = useState(false)
  const [errore, setErrore] = useState<string | null>(null)
  const [daSalvare, setDaSalvare] = useState<string | null>(null)

  const abort = useRef<AbortController | null>(null)
  const fondo = useRef<HTMLDivElement>(null)

  /* Si scende in fondo a ogni pezzo che arriva, ma **solo se** ci si era già:
     chi è risalito a rileggere una risposta di prima non deve vedersi strappare
     la pagina sotto gli occhi a ogni parola nuova. */
  useEffect(() => {
    const el = fondo.current?.parentElement
    if (!el) return
    const vicino = el.scrollHeight - el.scrollTop - el.clientHeight < 120
    if (vicino) fondo.current?.scrollIntoView({ block: 'end' })
  }, [turni])

  useEffect(() => () => abort.current?.abort(), [])

  /**
   * La domanda lasciata dalla riga «Chiedi a Lumino» della home.
   *
   * Si legge **e si cancella** nello stesso gesto: senza, tornando qui da
   * un'altra pagina la stessa domanda ripartirebbe da sola, e una schermata che
   * si rimette a chiedere ciò che ha già chiesto sembra rotta. `chiedi` non sta
   * nelle dipendenze di proposito — questo effetto deve girare al montaggio e
   * mai più, mentre `chiedi` cambia a ogni turno della conversazione. */
  useEffect(() => {
    if (!attivo) return
    let q: string | null = null
    try {
      q = sessionStorage.getItem(CHIAVE_DOMANDA)
      if (q) sessionStorage.removeItem(CHIAVE_DOMANDA)
    } catch {
      /* storage negato: si batte la domanda qui */
    }
    if (q) void chiedi(q)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attivo])

  const ferma = useCallback(() => {
    abort.current?.abort()
    abort.current = null
    setInCorso(false)
  }, [])

  const chiedi = useCallback(
    async (testo: string) => {
      const t = testo.trim()
      if (!t || inCorso) return

      setErrore(null)
      setDomanda('')
      /* La storia che si manda è quella *prima* di questo turno: il turno nuovo
         viaggia a parte come `domanda`, e mandarlo due volte farebbe sembrare al
         modello di essersela già sentita chiedere. */
      const storia = turni
      setTurni([...storia, { ruolo: 'io', testo: t }, { ruolo: 'lab', testo: '' }])
      setInCorso(true)

      const controller = new AbortController()
      abort.current = controller

      try {
        const r = await fetch('/api/staff/lab', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domanda: t, storia }),
          signal: controller.signal,
        })

        if (!r.ok || !r.body) {
          const d = (await r.json().catch(() => null)) as { error?: string } | null
          throw new Error(d?.error ?? 'Il Lab non ha risposto.')
        }

        const lettore = r.body.getReader()
        const decodifica = new TextDecoder()
        for (;;) {
          const { done, value } = await lettore.read()
          if (done) break
          const pezzo = decodifica.decode(value, { stream: true })
          if (!pezzo) continue
          /* Si aggiorna **l'ultimo** turno, identificato dalla posizione e non
             da un id: è l'unico che questo ciclo possa stare scrivendo, perché
             finché `inCorso` è vero non se ne può aprire un altro. */
          setTurni((prima) => {
            const dopo = prima.slice()
            const ultimo = dopo[dopo.length - 1]
            if (ultimo?.ruolo === 'lab') dopo[dopo.length - 1] = { ...ultimo, testo: ultimo.testo + pezzo }
            return dopo
          })
        }
      } catch (e) {
        if ((e as Error).name === 'AbortError') {
          /* Fermato a mano: quello che era arrivato resta, e resta leggibile.
             Cancellare una risposta a metà perché è stata interrotta vorrebbe
             dire buttare la parte che magari bastava. */
        } else {
          setErrore((e as Error).message)
          setTurni((prima) => prima.filter((t2, i) => !(i === prima.length - 1 && t2.testo === '')))
        }
      } finally {
        abort.current = null
        setInCorso(false)
      }
    },
    [inCorso, turni],
  )

  return (
    <div className="lm-lab">
      {/* ── la conversazione ─────────────────────────────────────────────── */}
      <section className="lm-card lm-lab-chat" data-tone="black">
        <div className="lm-card-top">
          <span className="lm-label">chiedi ai dati</span>
          {inCorso && (
            <button type="button" className="lm-lab-stop" onClick={ferma}>
              <Square aria-hidden="true" /> ferma
            </button>
          )}
        </div>

        <div className="lm-lab-flusso">
          {turni.length === 0 && (
            <div className="lm-lab-vuoto">
              <p>
                Ciao {ioSono}. Rispondo solo sui numeri che questa dashboard ha davvero, e quando un
                dato non c’è lo dico invece di inventarlo.
              </p>
              <div className="lm-lab-esempi">
                {ESEMPI.map((e) => (
                  <button key={e} type="button" onClick={() => void chiedi(e)} disabled={!attivo}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
          )}

          {turni.map((t, i) => (
            <article key={i} className="lm-lab-turno" data-ruolo={t.ruolo}>
              <p>
                {t.testo}
                {/* Il cursore che lampeggia mentre arriva il testo: è l'unico
                    modo di distinguere «sta ancora scrivendo» da «ha finito e la
                    risposta è corta». */}
                {inCorso && i === turni.length - 1 && t.ruolo === 'lab' && (
                  <span className="lm-lab-cursore" aria-hidden="true" />
                )}
              </p>
              {t.ruolo === 'lab' && t.testo && !inCorso && (
                <button
                  type="button"
                  className="lm-lab-salva"
                  onClick={() => setDaSalvare(t.testo)}
                >
                  <Bookmark aria-hidden="true" /> tieni questo
                </button>
              )}
            </article>
          ))}

          <div ref={fondo} />
        </div>

        {errore && (
          <p className="lm-error" role="alert">
            {errore}
          </p>
        )}

        <form
          className="lm-lab-barra"
          onSubmit={(e) => {
            e.preventDefault()
            void chiedi(domanda)
          }}
        >
          <input
            value={domanda}
            onChange={(e) => setDomanda(e.target.value)}
            placeholder={attivo ? 'Chiedi qualcosa sui dati…' : 'Serve la chiave di Gemini'}
            disabled={!attivo || inCorso}
            aria-label="La tua domanda"
          />
          <button type="submit" disabled={!attivo || inCorso || !domanda.trim()} aria-label="Chiedi">
            <ArrowUp aria-hidden="true" />
          </button>
        </form>

        {/* Cosa ha visto il modello, per chi vuole saperlo. Chiuso di default:
            è la risposta a una domanda che si fa una volta sola, ma è una
            domanda a cui si deve poter rispondere senza aprire il codice. */}
        <details className="lm-lab-foglio">
          <summary>Cosa legge il Lab</summary>
          <p className="lm-sub">
            Solo questo, e mai i nomi dei clienti né i loro contatti. I conti sono quelli della
            pagina Statistiche: il Lab non li rifà.
          </p>
          <pre>{foglio}</pre>
        </details>
      </section>

      {/* ── lo scaffale ──────────────────────────────────────────────────── */}
      <section className="lm-lab-scaffale">
        <div className="lm-card-top">
          <span className="lm-label">tenuti da parte</span>
          <span className="lm-muted">{insight.length}</span>
        </div>

        {insight.length === 0 ? (
          <p className="lm-empty">
            Ancora niente. Quando una risposta vale, premi «tieni questo»: resta qui con il tuo nome
            e la data.
          </p>
        ) : (
          <ul className="lm-lab-lista">
            {insight.map((i) => (
              <VoceInsight key={i.id} insight={i} mio={i.created_by === null || isAdmin} />
            ))}
          </ul>
        )}
      </section>

      {daSalvare && <Salva testo={daSalvare} chiudi={() => setDaSalvare(null)} />}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */

function VoceInsight({ insight, mio }: { insight: Insight; mio: boolean }) {
  const [inCorso, avvia] = useTransition()
  const [aperto, setAperto] = useState(false)

  return (
    <li className="lm-card lm-lab-voce" data-aperta={aperto}>
      <button type="button" className="lm-lab-voce-testa" onClick={() => setAperto((v) => !v)}>
        <span className="lm-pill">{TIPI_INSIGHT[insight.tipo as TipoInsight] ?? insight.tipo}</span>
        <b>{insight.titolo}</b>
      </button>

      {aperto && <p className="lm-lab-voce-testo">{insight.contenuto}</p>}

      <footer>
        <span className="lm-muted">
          {insight.autore ?? 'qualcuno'} · {dataBreve(insight.created_at)}
        </span>
        {mio && (
          <button
            type="button"
            className="lm-lab-cestino"
            disabled={inCorso}
            aria-label={`Elimina ${insight.titolo}`}
            onClick={() => avvia(async () => void (await eliminaInsight(insight.id)))}
          >
            <Trash2 aria-hidden="true" />
          </button>
        )}
      </footer>
    </li>
  )
}

/**
 * Il salvataggio: il titolo lo scrive la persona, non il modello.
 *
 * Un titolo generato sarebbe stato più comodo e più inutile: lo scaffale si
 * sfoglia leggendo i titoli, e un titolo scritto da chi ha capito la cosa è
 * l'unico che poi la faccia ritrovare. Il primo rigo della risposta si propone
 * come bozza, perché partire da un campo vuoto è il modo di non salvare niente.
 */
function Salva({ testo, chiudi }: { testo: string; chiudi: () => void }) {
  const [titolo, setTitolo] = useState(() => primaFrase(testo))
  const [tipo, setTipo] = useState<TipoInsight>('pattern')
  const [errore, setErrore] = useState<string | null>(null)
  const [inCorso, avvia] = useTransition()

  return (
    <Modal title="Tieni questo" onClose={chiudi}>
      <div className="lm-field">
        <label htmlFor="ins-titolo">Come lo ritroverai</label>
        <input
          id="ins-titolo"
          value={titolo}
          maxLength={120}
          onChange={(e) => setTitolo(e.target.value)}
          autoFocus
        />
      </div>

      <div className="lm-field">
        <label htmlFor="ins-tipo">Che cos’è</label>
        <select id="ins-tipo" value={tipo} onChange={(e) => setTipo(e.target.value as TipoInsight)}>
          {Object.entries(TIPI_INSIGHT).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <p className="lm-lab-anteprima">{testo}</p>

      {errore && (
        <p className="lm-error" role="alert">
          {errore}
        </p>
      )}

      <div className="lm-modal-actions">
        <button type="button" className="lm-btn" data-variant="ghost" onClick={chiudi}>
          Lascia stare
        </button>
        <button
          type="button"
          className="lm-btn"
          disabled={inCorso}
          onClick={() =>
            avvia(async () => {
              const esito = await salvaInsight({ tipo, titolo, contenuto: testo })
              if (esito.ok) chiudi()
              else setErrore(esito.error ?? 'Non è andata.')
            })
          }
        >
          {inCorso ? 'Salvo…' : 'Salva'}
        </button>
      </div>
    </Modal>
  )
}

/** La prima frase, tagliata dove finisce o a ottanta caratteri. */
function primaFrase(testo: string): string {
  const pulito = testo.trim().replace(/\s+/g, ' ')
  const punto = pulito.search(/[.!?](\s|$)/)
  const grezzo = punto > 10 ? pulito.slice(0, punto) : pulito
  return grezzo.length > 80 ? grezzo.slice(0, 77).trimEnd() + '…' : grezzo
}
