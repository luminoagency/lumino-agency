import AreaChart from '@/components/staff/AreaChart'
import { Lollipop, Progress } from '@/components/staff/Bars'
import Cascade from '@/components/staff/Cascade'
import Counter from '@/components/staff/Counter'
import Mappa from '@/components/staff/Mappa'
import PageHead from '@/components/staff/PageHead'
import Ring from '@/components/staff/Ring'
import Spark from '@/components/staff/Spark'
import Tilt from '@/components/staff/Tilt'
import { requireStaff } from '@/lib/staff/auth'
import { demoAttivo } from '@/lib/staff/demo'
import { caricaStatistiche, type Taglio } from '@/lib/staff/f4'
import { AVVISO_SCHEMA } from '@/lib/staff/queries'
import {
  OBIEZIONE_LABEL,
  SETTORE_LABEL,
  etichetta,
  euro,
  type Settore,
} from '@/lib/staff/types'

export const metadata = { title: 'Statistiche' }
export const dynamic = 'force-dynamic'

/**
 * Cosa conviene vendere, dove, e a che prezzo.
 *
 * ## Ogni percentuale porta con sé il suo denominatore
 *
 * È la regola di tutta la pagina. Accanto a «67%» c'è sempre «su 9 decise», e
 * non per scrupolo statistico: con dieci trattative in archivio una percentuale
 * cambia di dieci punti per un solo sì, e chi la legge deve saperlo **mentre** la
 * legge, non dopo aver preso la decisione. Un numero grosso senza il suo
 * denominatore è la cosa più vicina a una bugia che una dashboard possa dire.
 *
 * Per la stessa ragione il tasso di chiusura si calcola sulle trattative
 * **decise** e non su tutti i clienti: il perché sta in `caricaStatistiche`.
 *
 * ## La mappa
 *
 * È la stessa `Mappa` della home — Leaflet con le tile CartoDB Positron — qui in
 * formato grande. Non è un doppione: sulla home risponde a «sto girando sempre
 * nelle stesse tre vie?», qui a «dove ho clienti e dove non ne ho», che è una
 * domanda di pianificazione e vuole spazio per essere guardata.
 *
 * ## Le obiezioni
 *
 * Vengono dai report di campo, non dai clienti: sono ciò che i titolari hanno
 * detto in faccia a un venditore. È il dato più prezioso che quest'area
 * raccoglie, ed è anche il solo che nessun CRM comprato avrebbe.
 */
export default async function StatistichePage() {
  const me = await requireStaff()
  const demo = demoAttivo(me.role)
  const d = await caricaStatistiche(demo)

  return (
    <>
      <PageHead
        title={
          <>
            Cosa <em>funziona</em>
          </>
        }
        sub={
          d.decise
            ? `${d.chiuse} sì su ${d.decise} trattative arrivate a una risposta. Le percentuali qui sotto sono tutte calcolate su quel numero, non sui clienti in archivio.`
            : 'Non c’è ancora nessuna trattativa arrivata a un sì o a un no: le percentuali compaiono da sole appena ce n’è una.'
        }
      />

      {d.mancaSchema && <p className="lm-warn">{AVVISO_SCHEMA}</p>}

      <Tilt>
        <Cascade className="lm-bento">
          <article className="lm-card lm-in" data-span="4" data-hover data-reveal>
            <div className="lm-card-top">
              <span className="lm-label">Tasso di chiusura</span>
              <span className="lm-muted" style={{ fontSize: '0.86rem' }}>
                su {d.decise} decise
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
              <Ring
                value={d.tasso}
                cap="chiuse"
                size={118}
                stroke={6}
                label="Tasso di chiusura sulle trattative decise"
              />
              <div className="lm-rows" style={{ flex: 1, minWidth: 0 }}>
                <div className="lm-row">
                  <span className="lm-muted">Sì</span>
                  <span className="lm-row-v">{d.chiuse}</span>
                </div>
                <div className="lm-row">
                  <span className="lm-muted">No</span>
                  <span className="lm-row-v">{d.decise - d.chiuse}</span>
                </div>
              </div>
            </div>
          </article>

          {/* La media da sola è la card più bugiarda della pagina: 413 € può
              voler dire «costiamo tutti così» o «due a quattromila e otto a
              mille», e sono due aziende diverse. Sotto ci sono i prezzi veri
              in fila dal più basso al più alto — e si vede in un colpo se il
              listino tiene o se la media non descrive nessuno. */}
          <article
            className="lm-card lm-in"
            data-span="4"
            data-tone="pearl"
            data-riempi="true"
            data-hover
            data-reveal
          >
            <span className="lm-label">Prezzo medio</span>
            <Counter value={Math.round(d.prezzoMedio)} format="euro" size="lg" />
            <p className="lm-kpi-name">
              {d.giorniMedi != null
                ? `${d.giorniMedi} giorni medi dalla proposta alla firma`
                : 'Non ci sono ancora trattative con proposta e firma datate'}
            </p>
            {d.prezzi.length > 1 && (
              <>
                <Spark serie={d.prezzi} label="I prezzi chiusi, dal più basso al più alto" />
                <p className="lm-muted" style={{ fontSize: '0.82rem', marginTop: '0.35rem' }}>
                  {d.prezzi.length} chiusure, da {euro(d.prezzi[0])} a{' '}
                  {euro(d.prezzi[d.prezzi.length - 1])}
                </p>
              </>
            )}
          </article>

          <article className="lm-card lm-in" data-span="4" data-hover data-reveal>
            <div className="lm-card-top">
              <span className="lm-label">Chiusure per mese</span>
              <span className="lm-pill" data-size="sm">
                6 mesi
              </span>
            </div>
            <AreaChart points={d.mesi} />
          </article>

          <ClassificaCard
            titolo="Per settore"
            nota="quanto conviene ogni tipo di locale"
            righe={d.perSettore}
            span="4"
            nomeLeggibile={(n) => SETTORE_LABEL[n as Settore] ?? n}
          />

          <ClassificaCard
            titolo="Per zona"
            nota="dove si chiude più facile"
            righe={d.perZona.slice(0, 7)}
            span="4"
          />

          <ClassificaCard
            titolo="Per venditore"
            nota="chi chiude, e a quanto"
            righe={d.perVenditore}
            span="4"
            tono="pearl"
          />

          <article className="lm-card lm-in" data-span="8" data-hover data-reveal>
            <div className="lm-card-top">
              <span className="lm-label">Il territorio</span>
              <span className="lm-muted" style={{ fontSize: '0.86rem' }}>
                {d.zone.length} città · i punti vicini si sommano
              </span>
            </div>
            {/* La stessa mappa della home, grande. Le tile sono quelle standard
                di OpenStreetMap, schiarite dal CSS: l'attribuzione in basso a
                destra è la condizione della licenza, non un dettaglio che si
                possa nascondere per pulizia. */}
            <Mappa punti={d.zone} altezza="lg" unita="clienti" />
          </article>

          {/* La card nera: cosa ci si sente dire. È l'unica cosa in questa pagina
              che cambia il modo di parlare domani, e non solo il modo di
              leggere ieri. */}
          <article className="lm-card lm-in" data-span="4" data-tone="black" data-hover data-reveal>
            <div className="lm-card-top">
              <span className="lm-label">Cosa ci si sente dire</span>
              <span className="lm-muted" style={{ fontSize: '0.86rem' }}>
                dalle visite
              </span>
            </div>
            {d.obiezioni.length ? (
              <>
                <Lollipop
                  items={d.obiezioni.map((o) => ({
                    label: etichetta(o.nome, OBIEZIONE_LABEL),
                    value: o.n,
                  }))}
                />
                <p className="lm-kpi-name" style={{ marginTop: '0.7rem' }}>
                  La prima è quella a cui conviene preparare una risposta scritta.
                </p>
              </>
            ) : (
              <p className="lm-empty">
                Nessuna obiezione registrata. Si raccolgono dal Campo, alla voce
                «Com&apos;è andata».
              </p>
            )}

            {/* Sotto il conteggio, le parole.
                Un'obiezione contata è una statistica; la stessa obiezione con le
                parole di chi l'ha detta è un argomento di vendita — e riempie
                una card che altrimenti sarebbe mezza vuota con l'unica cosa che
                nessun CRM comprato avrebbe. */}
            {d.frasi.length > 0 && (
              <div className="lm-frasi" style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                {d.frasi.map((f) => (
                  <blockquote key={f.id} className="lm-frase">
                    <p>{f.testo}</p>
                    <cite>{f.cliente}</cite>
                  </blockquote>
                ))}
              </div>
            )}
          </article>
        </Cascade>
      </Tilt>
    </>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Una classifica: tasso, quante decise, quanto vale in media.
 *
 * La barra misura il **tasso**, il numero a destra dice **su quante**. I gruppi
 * con meno di tre trattative decise portano un punto di domanda al posto della
 * sicurezza: `caricaStatistiche` li ha già spinti in fondo, ma stare in fondo non
 * basta — chi legge una riga la legge per intero, non in ordine.
 */
function ClassificaCard({
  titolo,
  nota,
  righe,
  span,
  tono,
  nomeLeggibile,
}: {
  titolo: string
  nota: string
  righe: Taglio[]
  span: string
  tono?: 'pearl'
  nomeLeggibile?: (nome: string) => string
}) {
  return (
    <article className="lm-card lm-in" data-span={span} data-tone={tono} data-hover data-reveal>
      <div className="lm-card-top">
        <span className="lm-label">{titolo}</span>
        <span className="lm-muted" style={{ fontSize: '0.86rem' }}>
          {nota}
        </span>
      </div>
      {righe.length ? (
        <div style={{ marginTop: '0.3rem' }}>
          {righe.map((r) => (
            /* L'etichetta porta sempre «chiuse su decise», senza formule
               diverse per i gruppi piccoli: «0/1» dice da solo che è un gruppo
               da una trattativa, e lo dice meglio di una nota fra parentesi.
               Il viola resta ai soli gruppi con almeno tre decise e metà chiuse:
               è l'unica cosa che qui può somigliare a un consiglio. */
            <Progress
              key={r.nome}
              label={`${nomeLeggibile ? nomeLeggibile(r.nome) : r.nome} · ${r.chiuse}/${r.decise}`}
              value={r.tasso}
              max={100}
              display={r.medio > 0 ? euro(r.medio) : `${Math.round(r.tasso)}%`}
              tone={r.decise >= 3 && r.tasso >= 50 ? 'violet' : undefined}
            />
          ))}
        </div>
      ) : (
        <p className="lm-empty">Ancora nessuna trattativa decisa da mettere in classifica.</p>
      )}
    </article>
  )
}
