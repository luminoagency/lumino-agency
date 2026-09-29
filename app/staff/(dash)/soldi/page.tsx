import Link from 'next/link'
import AreaChart from '@/components/staff/AreaChart'
import { Lollipop, Progress } from '@/components/staff/Bars'
import Cascade from '@/components/staff/Cascade'
import Counter from '@/components/staff/Counter'
import PageHead from '@/components/staff/PageHead'
import Ring from '@/components/staff/Ring'
import Spark from '@/components/staff/Spark'
import Tilt from '@/components/staff/Tilt'
import { requireStaff } from '@/lib/staff/auth'
import { demoAttivo } from '@/lib/staff/demo'
import { caricaSoldi } from '@/lib/staff/f4'
import { AVVISO_SCHEMA } from '@/lib/staff/queries'
import { dataBreve, euro } from '@/lib/staff/types'

export const metadata = { title: 'Soldi' }
export const dynamic = 'force-dynamic'

/**
 * Gli incassi.
 *
 * La pagina risponde a **quattro domande in quest'ordine**, che è l'ordine in cui
 * si fanno davvero: quanto è entrato, quanto manca, chi va sollecitato, quanto
 * entra ogni mese anche senza vendere niente.
 *
 * «Chi va sollecitato» sta nella card nera, cioè nell'unico accento scuro della
 * schermata. Non è una scelta grafica: è la sola informazione della pagina su cui
 * si può **agire oggi**, e in una composizione chiara l'occhio va sul nero prima
 * che sul titolo. Tutto il resto è un consuntivo, e un consuntivo non ha fretta.
 *
 * I crediti più vecchi stanno in cima (li ordina `caricaSoldi`): in una lista di
 * solleciti l'ordine è già metà della decisione.
 *
 * I margini li vede solo l'admin, e non per una `if` in questa pagina: la RLS di
 * `staff_deal_margins` non dà le righe a un venditore. Qui la richiesta si evita
 * perché sarebbe a vuoto, non perché sia questo il posto dove si protegge il
 * dato — un giorno che questo file cambia, il database continua a dire no.
 */
export default async function SoldiPage() {
  const me = await requireStaff()
  const demo = demoAttivo(me.role)
  const isAdmin = me.role === 'admin'
  const d = await caricaSoldi(demo, isAdmin)

  const venduto = d.incassato + d.daIncassare
  const totaleDaIncassare = d.daIncassare + d.extraDaIncassare
  const extraAperti = d.extra.filter((e) => !e.pagato)
  const scadenzeVicine = d.abbonamenti.filter((a) => a.rinnovo && giorniA(a.rinnovo) <= 30)

  /* Gli abbonamenti raggruppati per tipo: è l'unico modo di vedere se le entrate
     ricorrenti stanno su una gamba sola (tutta manutenzione) o su quattro. */
  const perTipo = new Map<string, number>()
  for (const a of d.abbonamenti) perTipo.set(a.tipo, (perTipo.get(a.tipo) ?? 0) + a.importo)

  return (
    <>
      <PageHead
        title={
          <>
            Gli <em>incassi</em>
          </>
        }
        sub={`${euro(d.incassato)} entrati, ${euro(totaleDaIncassare)} ancora da prendere, ${euro(
          d.ricorrenti,
        )} al mese che arrivano da soli.`}
      >
        <Link href="/staff/progetti" className="lm-btn" data-variant="ghost">
          Vai ai progetti
        </Link>
        <Link href="/staff/clienti" className="lm-btn">
          Apri un cliente
        </Link>
      </PageHead>

      {d.mancaSchema && <p className="lm-warn">{AVVISO_SCHEMA}</p>}

      <Tilt>
        <Cascade className="lm-bento">
          <article className="lm-card lm-in" data-span="4" data-tone="pearl" data-hover data-reveal>
            <div className="lm-card-top">
              <span className="lm-label">Incassato</span>
              <span className="lm-muted" style={{ fontSize: '0.86rem' }}>
                su {euro(venduto)} venduti
              </span>
            </div>
            <Counter value={d.incassato} format="euro" size="lg" />
            {/* Sotto il numero grosso ci va quello che manca, non del bianco: una
                card con dentro un solo numero è il segno che manca il contenuto
                (è una delle regole scritte della sezione Design). */}
            <div className="lm-rows" style={{ marginTop: '0.9rem' }}>
              <div className="lm-row">
                <span className="lm-muted">Ancora da prendere</span>
                <span className="lm-row-v">{euro(d.daIncassare)}</span>
              </div>
              <div className="lm-row">
                <span className="lm-muted">Modifiche extra aperte</span>
                <span className="lm-row-v">{euro(d.extraDaIncassare)}</span>
              </div>
            </div>
            <Spark
              serie={d.mesi.map((m) => m.value)}
              label="Incassi degli ultimi dodici mesi"
            />
          </article>

          <article className="lm-card lm-in" data-span="8" data-hover data-reveal>
            <div className="lm-card-top">
              <span className="lm-label">Cosa è entrato, mese per mese</span>
              <span className="lm-pill" data-size="sm">
                12 mesi
              </span>
            </div>
            {/* Acconti, saldi ed extra pagati, ognuno nel mese in cui è stato
                incassato — non nel mese della firma. Un saldo pagato a marzo per
                un contratto di gennaio è un incasso di marzo, e leggerlo a
                gennaio farebbe sembrare marzo un mese morto. */}
            <AreaChart points={d.mesi} format="euro" />
          </article>

          {/* La card nera: la sola cosa su cui si può agire oggi. */}
          <article className="lm-card lm-in" data-span="4" data-tone="black" data-hover data-reveal>
            <div className="lm-card-top">
              <span className="lm-label">Da sollecitare</span>
              <span className="lm-pill-n">{d.scoperti.length}</span>
            </div>
            {d.scoperti.length ? (
              <div className="lm-rows">
                {d.scoperti.slice(0, 5).map((s) => (
                  <Link key={s.id} href={`/staff/clienti/${s.clientId}`} className="lm-row">
                    <span>
                      {s.cliente}
                      <span className="lm-row-note">
                        manca il {s.cosa} · chiuso {s.giorni} giorni fa
                      </span>
                    </span>
                    <span className="lm-row-v">{euro(s.mancante)}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="lm-empty">Tutto incassato. Non capita spesso.</p>
            )}
            <div className="lm-rows" style={{ marginTop: 'auto', paddingTop: '0.9rem' }}>
              <div className="lm-row">
                <span className="lm-muted">Totale scoperto</span>
                <span className="lm-row-v">{euro(d.daIncassare)}</span>
              </div>
            </div>
          </article>

          <article className="lm-card lm-in" data-span="4" data-hover data-reveal>
            <div className="lm-card-top">
              <span className="lm-label">Acconti e saldi</span>
              <span className="lm-muted" style={{ fontSize: '0.86rem' }}>
                30 / 70
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
              <Ring
                value={venduto > 0 ? (d.incassato / venduto) * 100 : 0}
                cap="incassato"
                size={112}
                stroke={6}
                label="Quota incassata sul venduto"
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <Progress
                  label="Incassato"
                  value={d.incassato}
                  max={venduto || 1}
                  display={euro(d.incassato)}
                />
                <Progress
                  label="Ancora aperto"
                  value={d.daIncassare}
                  max={venduto || 1}
                  display={euro(d.daIncassare)}
                  tone="violet"
                />
              </div>
            </div>
          </article>

          <article className="lm-card lm-in" data-span="4" data-tone="pearl" data-hover data-reveal>
            <div className="lm-card-top">
              <span className="lm-label">Ricorrenti al mese</span>
              <span className="lm-muted" style={{ fontSize: '0.86rem' }}>
                {d.abbonamenti.length} attivi
              </span>
            </div>
            <Counter value={d.ricorrenti} format="euro" size="md" />
            {perTipo.size ? (
              <Lollipop
                items={Array.from(perTipo.entries()).map(([tipo, v]) => ({
                  label: tipo,
                  value: Math.round(v),
                }))}
              />
            ) : (
              <p className="lm-empty">Nessun abbonamento attivo.</p>
            )}
          </article>

          <article className="lm-card lm-in" data-span="6" data-hover data-reveal>
            <div className="lm-card-top">
              <span className="lm-label">Rinnovi e abbonamenti</span>
              <span className="lm-muted" style={{ fontSize: '0.86rem' }}>
                {scadenzeVicine.length} entro 30 giorni
              </span>
            </div>
            {d.abbonamenti.length ? (
              <div className="lm-rows">
                {d.abbonamenti.slice(0, 7).map((a) => (
                  <Link key={a.id} href={`/staff/clienti/${a.clientId}`} className="lm-row">
                    <span>
                      {a.cliente}
                      <span className="lm-row-note">
                        {a.tipo} · {euro(a.importo)} al mese
                      </span>
                    </span>
                    {a.rinnovo ? (
                      <span className="lm-when" data-late={giorniA(a.rinnovo) < 0}>
                        {dataBreve(a.rinnovo)}
                      </span>
                    ) : (
                      <span className="lm-when">senza scadenza</span>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="lm-empty">
                Nessun abbonamento. Sono la parte di fatturato che non va rivenduta ogni
                mese: vale la pena proporli alla consegna.
              </p>
            )}
          </article>

          <article className="lm-card lm-in" data-span="6" data-hover data-reveal>
            <div className="lm-card-top">
              <span className="lm-label">Modifiche extra</span>
              <span className="lm-row-v">{euro(d.extraDaIncassare)}</span>
            </div>
            {d.extra.length ? (
              <div className="lm-rows">
                {/* Prima le non pagate: una lista di extra serve a ricordarsi di
                    fatturarli, e quelli già fatturati non servono a quello. */}
                {[...extraAperti, ...d.extra.filter((e) => e.pagato)].slice(0, 7).map((e) => (
                  <div key={e.id} className="lm-row">
                    <span>
                      {e.cliente}
                      {e.descrizione && <span className="lm-row-note">{e.descrizione}</span>}
                    </span>
                    <span
                      className="lm-pill"
                      data-size="sm"
                      data-on={e.pagato ? undefined : 'true'}
                    >
                      {euro(e.prezzo)}
                      {e.pagato ? ' · pagata' : ''}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="lm-empty">
                Nessuna modifica extra registrata. Sono 80 euro l&apos;una, 120 per gli
                hotel.
              </p>
            )}
          </article>

          {/* Il margine: una card sola, viola, e solo per l'admin.
              Viola perché è il dato riservato della pagina, e in questo
              linguaggio il viola è ciò che è selezionato o speciale — non una
              decorazione. Una per schermata, mai due. */}
          {d.margine && d.margine.su > 0 && (
            <article className="lm-card lm-in" data-span="12" data-tone="violet" data-hover data-reveal>
              <div className="lm-card-top">
                <span className="lm-label">Margine sulle trattative chiuse</span>
                <span className="lm-muted" style={{ fontSize: '0.86rem' }}>
                  solo amministratori · {d.margine.su} trattative
                </span>
              </div>
              <div className="lm-detail-grid">
                <div className="lm-sub-card">
                  <span className="lm-kpi-name">Margine</span>
                  <Counter value={d.margine.margine} format="euro" size="sm" />
                </div>
                <div className="lm-sub-card">
                  <span className="lm-kpi-name">Costo interno</span>
                  <Counter value={d.margine.costo} format="euro" size="sm" />
                </div>
                <div className="lm-sub-card">
                  <span className="lm-kpi-name">Margine medio</span>
                  <Counter
                    value={Math.round(d.margine.margine / d.margine.su)}
                    format="euro"
                    size="sm"
                  />
                </div>
              </div>
              <div style={{ marginTop: '0.9rem' }}>
                <Progress
                  label="Quota di margine sul chiuso"
                  value={d.margine.margine}
                  max={d.margine.margine + d.margine.costo || 1}
                  display={`${Math.round(
                    (d.margine.margine / (d.margine.margine + d.margine.costo || 1)) * 100,
                  )}%`}
                />
              </div>
            </article>
          )}
        </Cascade>
      </Tilt>
    </>
  )
}

/** Giorni che restano a una data. Negativo se è già passata. */
function giorniA(data: string): number {
  const oggi = new Date()
  oggi.setHours(12, 0, 0, 0)
  return Math.round((new Date(`${data.slice(0, 10)}T12:00:00`).getTime() - oggi.getTime()) / 86_400_000)
}
