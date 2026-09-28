import Link from 'next/link'
import { ExternalLink, Globe } from 'lucide-react'
import { Progress } from '@/components/staff/Bars'
import Cascade from '@/components/staff/Cascade'
import Counter from '@/components/staff/Counter'
import PageHead from '@/components/staff/PageHead'
import Tilt from '@/components/staff/Tilt'
import { requireStaff } from '@/lib/staff/auth'
import { demoAttivo } from '@/lib/staff/demo'
import { caricaProgetti } from '@/lib/staff/f4'
import { AVVISO_SCHEMA } from '@/lib/staff/queries'
import { FASE_LABEL, FASI_PROGETTO, SETTORE_LABEL, dataBreve } from '@/lib/staff/types'

export const metadata = { title: 'Progetti' }
export const dynamic = 'force-dynamic'

/**
 * I lavori in corso.
 *
 * Due informazioni, e sono di natura diversa: **dove è arrivato ogni sito** (un
 * consuntivo, si guarda una volta al giorno) e **quali domini stanno scadendo**
 * (un'urgenza, perché un dominio scaduto è un sito offline, cioè un cliente che
 * telefona). La seconda va nella card nera: è la sola cosa che, se non la si
 * vede, costa.
 *
 * Le fasi sono una barra e non un grafico a torta. Una torta mostra la
 * proporzione ma perde l'**ordine**, e qui l'ordine è tutto il significato —
 * brief, design, sviluppo, revisione, online sono un percorso, non cinque
 * categorie. Una barra di avanzamento per progetto dice a che punto è; la
 * colonna delle fasi dice dove si è accumulata la coda.
 *
 * Il link all'anteprima si apre in una scheda nuova con `rel="noreferrer"`: è un
 * sito che stiamo costruendo noi, quindi non è una difesa dal sito — è che
 * tornare indietro dopo aver aperto un'anteprima non deve voler dire perdere la
 * lista da cui si era partiti.
 */
export default async function ProgettiPage() {
  const me = await requireStaff()
  const demo = demoAttivo(me.role)
  const d = await caricaProgetti(demo)

  const online = d.progetti.filter((p) => p.fase === 'online').length
  const inCorso = d.progetti.length - online
  const scaduti = d.domini.filter((p) => (p.giorniDominio ?? 0) < 0)
  const extraAperti = d.progetti.reduce((s, p) => s + p.extraAperti, 0)
  const massimoFase = Math.max(1, ...d.perFase.map((f) => f.n))

  return (
    <>
      <PageHead
        /* «I progetti» no: una I maiuscola da sola, in Manrope 200 a sessanta
           pixel, non si legge come una lettera — si legge come un filo verticale
           messo lì per sbaglio. Due lettere bastano a farne una parola. */
        title={
          <>
            Il <em>lavoro</em> in corso
          </>
        }
        sub={`${inCorso} siti in lavorazione, ${online} già online${
          scaduti.length ? `, ${scaduti.length} con il dominio già scaduto` : ''
        }.`}
      >
        <Link href="/staff/soldi" className="lm-btn" data-variant="ghost">
          Vai agli incassi
        </Link>
      </PageHead>

      {d.mancaSchema && <p className="lm-warn">{AVVISO_SCHEMA}</p>}

      <Tilt>
        <Cascade className="lm-bento">
          <article className="lm-card lm-in" data-span="3" data-tone="pearl" data-hover data-reveal>
            <span className="lm-label">In lavorazione</span>
            <div style={{ marginTop: 'auto', paddingTop: '0.9rem' }}>
              <Counter value={inCorso} size="xl" />
              <p className="lm-kpi-name">
                {online} già online · {extraAperti} modifiche extra aperte
              </p>
            </div>
          </article>

          <article className="lm-card lm-in" data-span="5" data-hover data-reveal>
            <div className="lm-card-top">
              <span className="lm-label">Dove sono i lavori</span>
              <span className="lm-muted" style={{ fontSize: '0.78rem' }}>
                dal brief alla pubblicazione
              </span>
            </div>
            {/* Una barra per fase, nell'ordine del percorso. Dove la barra è
                lunga c'è la coda: tre siti fermi in «revisione» vogliono dire che
                si aspetta materiale dai clienti, non che si sta lavorando. */}
            <div style={{ marginTop: '0.3rem' }}>
              {d.perFase.map((f) => (
                <Progress
                  key={f.fase}
                  label={FASE_LABEL[f.fase]}
                  value={f.n}
                  max={massimoFase}
                  display={String(f.n)}
                  tone={f.fase === 'online' ? 'violet' : undefined}
                />
              ))}
            </div>
          </article>

          {/* La card nera: i domini. L'unica urgenza della pagina. */}
          <article className="lm-card lm-in" data-span="4" data-tone="black" data-hover data-reveal>
            <div className="lm-card-top">
              <span className="lm-label">Domini in scadenza</span>
              <span className="lm-pill-n">{d.domini.length}</span>
            </div>
            {d.domini.length ? (
              <div className="lm-rows">
                {d.domini.slice(0, 6).map((p) => (
                  <Link key={p.id} href={`/staff/clienti/${p.clientId}`} className="lm-row">
                    <span>
                      {p.dominio ?? p.cliente}
                      <span className="lm-row-note">{p.cliente}</span>
                    </span>
                    <span className="lm-when" data-late={(p.giorniDominio ?? 0) < 0}>
                      {scadenza(p.giorniDominio)}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="lm-empty">
                Nessun dominio scade nei prossimi due mesi. Si guarda qui, non nella
                casella di posta del registrar.
              </p>
            )}
          </article>

          <article className="lm-card lm-in" data-span="12" data-hover data-reveal>
            <div className="lm-card-top">
              <span className="lm-label">Tutti i progetti</span>
              <span className="lm-muted" style={{ fontSize: '0.78rem' }}>
                aggiornati per ultimo in cima
              </span>
            </div>
            {d.progetti.length ? (
              <ul className="lm-prog-list">
                {d.progetti.map((p) => (
                  <li key={p.id} className="lm-prog-item">
                    <Link href={`/staff/clienti/${p.clientId}`} className="lm-prog-nome">
                      <b>{p.cliente}</b>
                      <span>
                        {p.settore ? SETTORE_LABEL[p.settore] : 'Progetto'}
                        {p.citta ? ` · ${p.citta}` : ''}
                      </span>
                    </Link>

                    {/* La barra del percorso: cinque tacche, quelle fatte piene.
                        È la stessa informazione della colonna «Dove sono i
                        lavori», vista dalla parte del singolo progetto. */}
                    <span
                      className="lm-fasi"
                      role="img"
                      aria-label={`Fase: ${FASE_LABEL[p.fase]}, ${
                        FASI_PROGETTO.indexOf(p.fase) + 1
                      } di ${FASI_PROGETTO.length}`}
                    >
                      {FASI_PROGETTO.map((fase, i) => (
                        <span
                          key={fase}
                          data-fatta={i <= FASI_PROGETTO.indexOf(p.fase)}
                          data-ora={fase === p.fase}
                        />
                      ))}
                      <b>{FASE_LABEL[p.fase]}</b>
                    </span>

                    <span className="lm-prog-meta">
                      {p.extraAperti > 0 && (
                        <span className="lm-pill" data-size="sm" data-on="true">
                          {p.extraAperti} extra da incassare
                        </span>
                      )}
                      {p.dominio && (
                        <span className="lm-pill" data-size="sm">
                          <Globe aria-hidden="true" />
                          {p.dominio}
                          {p.scadenzaDominio ? ` · ${dataBreve(p.scadenzaDominio)}` : ''}
                        </span>
                      )}
                      {p.previewUrl && (
                        <a
                          href={p.previewUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="lm-pill"
                          data-size="sm"
                        >
                          <ExternalLink aria-hidden="true" />
                          Anteprima
                        </a>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="lm-empty">
                Nessun progetto. Nasce quando una trattativa si chiude: il progetto è la
                vita del cliente dopo la firma.
              </p>
            )}
          </article>
        </Cascade>
      </Tilt>
    </>
  )
}

/**
 * La scadenza a parole.
 *
 * «fra 12 giorni» e «scaduto da 3» invece di due date: la data costringe a fare
 * il conto, e il conto è tutta l'informazione.
 */
function scadenza(giorni: number | null): string {
  if (giorni == null) return '—'
  if (giorni < 0) return `scaduto da ${-giorni}`
  if (giorni === 0) return 'scade oggi'
  if (giorni === 1) return 'domani'
  return `fra ${giorni} giorni`
}
