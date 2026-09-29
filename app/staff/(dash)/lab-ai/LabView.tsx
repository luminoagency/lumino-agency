'use client'

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { ArrowUp, Bookmark, Lightbulb, Repeat, Square, Trash2 } from 'lucide-react'
import { CHIAVE_DOMANDA } from '@/components/staff/ChiediALumino'
import Modal from '@/components/staff/Modal'
import { eliminaInsight, salvaInsight } from '@/lib/staff/azioni-f5'
import { ANALISI, type ChiaveAnalisi, type FonteCitabile } from '@/lib/staff/archivio-tipi'
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
 *
 * ## Due fonti, e si sceglie quale
 *
 * «I numeri» sono i totali della dashboard; «l'archivio» è il materiale grezzo
 * — note, trascrizioni, documenti. Sono due lavori diversi: sui numeri il
 * modello non deve calcolare niente, sul materiale non deve affermare niente
 * senza dire dove l'ha letto. Un interruttore e non due pagine, perché la
 * domanda che viene in mente è la stessa («perché non comprano?») e cambia solo
 * dove si va a guardare.
 *
 * In modalità archivio ogni frase porta un contrassegno `[#7]`, che qui diventa
 * un link alla voce vera. Non è un vezzo: è materiale su cui si decide dove
 * mandare un venditore, e una conclusione che non si può risalire è un'opinione
 * scritta bene.
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
  fonti,
  ioSono,
  isAdmin,
}: {
  /** La chiave di Gemini c'è. Senza, la conversazione non si disegna affatto. */
  attivo: boolean
  insight: Insight[]
  /** Il foglio che parte al modello, mostrato tale e quale dietro un dettaglio. */
  foglio: string
  /** La corrispondenza fra i contrassegni `[#7]` e le voci dell'Archivio. */
  fonti: FonteCitabile[]
  ioSono: string
  isAdmin: boolean
}) {
  const [modalita, setModalita] = useState<'dati' | 'archivio'>('dati')
  const [turni, setTurni] = useState<Turno[]>([])
  const [domanda, setDomanda] = useState('')
  const [inCorso, setInCorso] = useState(false)
  const [errore, setErrore] = useState<string | null>(null)
  const [daSalvare, setDaSalvare] = useState<{ testo: string; tipo: TipoInsight } | null>(null)

  const perNumero = useMemo(() => new Map(fonti.map((f) => [f.n, f])), [fonti])

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
          body: JSON.stringify({ domanda: t, storia, modalita }),
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
    [inCorso, turni, modalita],
  )

  return (
    <div className="lm-lab">
      {/* ── la conversazione ─────────────────────────────────────────────── */}
      <section className="lm-card lm-lab-chat" data-tone="black">
        <div className="lm-card-top">
          {/* Cambiare fonte **azzera la conversazione**, e i bottoni si spengono
              mentre una risposta sta arrivando. Tenere i turni vorrebbe dire
              mandare al modello domande fatte su un foglio che non ha piu
              davanti: risponderebbe citando cose che non sta leggendo. */}
          <div className="lm-seg lm-lab-fonte" role="group" aria-label="Su cosa rispondo">
            <button
              type="button"
              data-on={modalita === 'dati'}
              aria-pressed={modalita === 'dati'}
              disabled={inCorso}
              onClick={() => {
                setModalita('dati')
                setTurni([])
              }}
            >
              i numeri
            </button>
            <button
              type="button"
              data-on={modalita === 'archivio'}
              aria-pressed={modalita === 'archivio'}
              disabled={inCorso}
              onClick={() => {
                setModalita('archivio')
                setTurni([])
              }}
            >
              l’archivio
            </button>
          </div>
          {inCorso && (
            <button type="button" className="lm-lab-stop" onClick={ferma}>
              <Square aria-hidden="true" /> ferma
            </button>
          )}
        </div>

        <div className="lm-lab-flusso">
          {turni.length === 0 && modalita === 'dati' && (
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

          {turni.length === 0 && modalita === 'archivio' && (
            <div className="lm-lab-vuoto">
              <p>
                {fonti.length === 0 ? (
                  <>
                    L’archivio è ancora vuoto: non ho niente da leggere. Comincia a buttarci dentro
                    note, PDF e foto da <Link href="/staff/archivio">Archivio</Link>, e torna qui.
                  </>
                ) : (
                  <>
                    Leggo le {fonti.length} voci dell’archivio — note, trascrizioni, documenti — e
                    cito sempre da dove ho preso: i contrassegni si aprono sulla voce vera.
                  </>
                )}
              </p>

              {/* Le due analisi pronte. Non sono un esempio da copiare in
                  domanda: sono la ragione per cui si apre questa modalita, e
                  stanno in due card e non in due righe di testo. */}
              <div className="lm-lab-analisi">
                {(Object.keys(ANALISI) as ChiaveAnalisi[]).map((k) => {
                  const a = ANALISI[k]
                  const Icona = k === 'problemi' ? Repeat : Lightbulb
                  return (
                    <button
                      key={k}
                      type="button"
                      disabled={!attivo || fonti.length === 0}
                      onClick={() => void chiedi(a.domanda)}
                    >
                      <Icona aria-hidden="true" />
                      <b>{a.titolo}</b>
                      <small>{a.sotto}</small>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {turni.map((t, i) => (
            <article key={i} className="lm-lab-turno" data-ruolo={t.ruolo}>
              <p>
                {t.ruolo === 'lab' ? (
                  <Risposta testo={t.testo} perNumero={modalita === 'archivio' ? perNumero : null} />
                ) : (
                  t.testo
                )}
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
                  onClick={() => setDaSalvare({ testo: t.testo, tipo: tipoProposto(turni, i, modalita) })}
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
            placeholder={
              !attivo
                ? 'Serve la chiave di Gemini'
                : modalita === 'archivio'
                  ? 'Chiedi qualcosa all’archivio…'
                  : 'Chiedi qualcosa sui dati…'
            }
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
          {modalita === 'archivio' ? (
            <>
              <p className="lm-sub">
                Le {fonti.length} voci piu recenti dell’archivio, col testo estratto e l’avvertenza
                su quale testo è automatico. Nient’altro: né i numeri, né i contatti dei clienti.
              </p>
              <ul className="lm-lab-fonti">
                {fonti.slice(0, 40).map((f) => (
                  <li key={f.id}>
                    <Link href={VIA_ARCHIVIO + f.id}>
                      [#{f.n}] {f.titolo}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <p className="lm-sub">
                Solo questo, e mai i nomi dei clienti né i loro contatti. I conti sono quelli della
                pagina Statistiche: il Lab non li rifà.
              </p>
              <pre>{foglio}</pre>
            </>
          )}
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

      {daSalvare && (
        <Salva testo={daSalvare.testo} tipoIniziale={daSalvare.tipo} chiudi={() => setDaSalvare(null)} />
      )}
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
function Salva({
  testo,
  tipoIniziale,
  chiudi,
}: {
  testo: string
  /** Il tipo che discende da cosa si stava chiedendo: si cambia, ma parte giusto. */
  tipoIniziale: TipoInsight
  chiudi: () => void
}) {
  const [titolo, setTitolo] = useState(() => primaFrase(testo))
  const [tipo, setTipo] = useState<TipoInsight>(tipoIniziale)
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
              else setErrore(esito.error ?? 'L’insight non è stato salvato. Riprova.')
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

/* ──────────────────────────────────────────────────────────────────────── */

/** La rotta della voce singola dell'Archivio, scritta una volta sola. */
const VIA_ARCHIVIO = '/staff/archivio?voce='

/**
 * La risposta, disegnata.
 *
 * Il modello scrive in Markdown anche quando gli si dice di non farlo — due
 * asterischi per il grassetto, un asterisco a inizio riga per un punto elenco —
 * e finora quegli asterischi finivano sullo schermo così com'erano: una risposta
 * che sembra codice incollato per sbaglio. Qui si disegnano le **tre** cose che
 * arrivano davvero, e nient'altro: grassetto, punti elenco, citazioni.
 *
 * Non è un parser Markdown e non deve diventarlo. Un parser vero è una
 * dipendenza, un rischio di HTML arbitrario dentro una risposta generata, e
 * cinque sintassi che nessuno usa qui. Tre regex su testo, che restano testo.
 *
 * Funziona anche **a metà stream**: un `**` non ancora chiuso o un `[#` a metà
 * non corrispondono a niente e restano quello che sono, e al pezzo dopo si
 * ricompongono da sé.
 */
function Risposta({
  testo,
  perNumero,
}: {
  testo: string
  /** Le fonti da citare, o `null` quando si sta rispondendo sui numeri. */
  perNumero: Map<number, FonteCitabile> | null
}) {
  const righe = testo.split('\n')

  return (
    <>
      {righe.map((riga, i) => {
        /* Il punto elenco diventa un trattino: dentro una card nera un pallino
           in più per riga è rumore, e il trattino è già la lingua del resto
           dell'area. */
        const elenco = /^\s*[*-]\s+/.test(riga)
        const corpo = elenco ? riga.replace(/^\s*[*-]\s+/, '') : riga

        return (
          <span key={i} className={elenco ? 'lm-lab-punto' : undefined}>
            <Inline testo={corpo} perNumero={perNumero} />
            {i < righe.length - 1 && '\n'}
          </span>
        )
      })}
    </>
  )
}

/**
 * Grassetto e citazioni dentro una riga.
 *
 * In due passaggi e non in uno: il modello scrive spesso **[#1] [#2]**, cioe'
 * mette le citazioni dentro il grassetto. Con una sola divisione quel pezzo
 * diventava un blocco in grassetto e le citazioni restavano testo — proprio nel
 * punto in cui servono di piu'. Prima si divide sul grassetto, poi dentro ogni
 * pezzo si cercano le citazioni.
 */
function Inline({
  testo,
  perNumero,
}: {
  testo: string
  perNumero: Map<number, FonteCitabile> | null
}) {
  const pezzi = testo.split(/(\*\*[^*\n]+\*\*)/g)

  return (
    <>
      {pezzi.map((p, i) =>
        /^\*\*[^*\n]+\*\*$/.test(p) ? (
          <b key={i}>
            <Cita testo={p.slice(2, -2)} perNumero={perNumero} />
          </b>
        ) : (
          <Cita key={i} testo={p} perNumero={perNumero} />
        ),
      )}
    </>
  )
}

/** I contrassegni `[#7]` diventano link alla voce dell'Archivio. */
function Cita({
  testo,
  perNumero,
}: {
  testo: string
  perNumero: Map<number, FonteCitabile> | null
}) {
  if (!perNumero) return <>{testo}</>

  const pezzi = testo.split(/(\[#\d{1,3}\])/g)

  return (
    <>
      {pezzi.map((p, i) => {
        const m = p.match(/^\[#(\d{1,3})\]$/)
        const fonte = m ? perNumero.get(Number(m[1])) : undefined
        /* Un contrassegno che non corrisponde a niente **resta testo**, e non
           diventa un link rotto: succede se il modello se ne inventa uno, ed e'
           proprio il caso in cui non si vuole che sembri verificato. */
        if (!fonte) return p

        return (
          <Link key={i} href={VIA_ARCHIVIO + fonte.id} className="lm-lab-cita" title={fonte.titolo}>
            #{fonte.n}
          </Link>
        )
      })}
    </>
  )
}

/**
 * Che tipo di insight proporre, guardando cosa si era chiesto.
 *
 * Non indovina niente sul contenuto: guarda la **domanda** che ha generato
 * questa risposta e la confronta con le due analisi pronte, che sono testi
 * fissi. Fuori da quelle resta `pattern`, che e il tipo generico. Serve a una
 * cosa sola, e concreta: chi preme "tieni questo" dopo l'analisi dei problemi
 * non deve andare a cercare "problema che torna" in una tendina di sei voci.
 */
function tipoProposto(turni: Turno[], i: number, modalita: 'dati' | 'archivio'): TipoInsight {
  if (modalita !== 'archivio') return 'pattern'
  const domanda = turni[i - 1]?.ruolo === 'io' ? turni[i - 1].testo : ''
  for (const a of Object.values(ANALISI)) {
    if (domanda === a.domanda) return a.tipo as TipoInsight
  }
  return 'pattern'
}
