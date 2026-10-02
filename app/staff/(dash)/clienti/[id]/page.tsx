import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink, MapPin } from 'lucide-react'
import { Progress } from '@/components/staff/Bars'
import CambioStato from '@/components/staff/CambioStato'
import Cascade from '@/components/staff/Cascade'
import CondizioniDeal from '@/components/staff/CondizioniDeal'
import { BottoneCanone, BottoneIncasso } from '@/components/staff/SegnaIncasso'
import Counter from '@/components/staff/Counter'
import PageHead, { StatoPill } from '@/components/staff/PageHead'
import Ring from '@/components/staff/Ring'
import Tilt from '@/components/staff/Tilt'
import { requireStaff } from '@/lib/staff/auth'
import { eAdmin, puo } from '@/lib/staff/permessi'
import { demoAttivo } from '@/lib/staff/demo'
import { modalitaDi, quotaPagata, vociPagamento } from '@/lib/staff/pagamenti'
import { followupDiCliente, reportDiCliente } from '@/lib/staff/queries'
import {
  ATTIVITA_LABEL,
  FASE_LABEL,
  FASI_PROGETTO,
  GESTIONE_LABEL,
  LINGUA_LABEL,
  OBIEZIONE_LABEL,
  PACCHETTO_LABEL,
  REAZIONE_LABEL,
  SETTORE_LABEL,
  SITO_LABEL,
  STRUMENTO_LABEL,
  dataBreve,
  dataLunga,
  etichetta,
  euro,
  quando,
  type ClienteRiga,
  type FaseProgetto,
  type Pacchetto,
  type ReportRiga,
  type TipoAttivita,
} from '@/lib/staff/types'
import { staffDb } from '@/lib/staff/db'
import SchedaAzioni from './SchedaAzioni'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: { id: string } }) {
  const supabase = staffDb()
  const { data } = await supabase
    .from('staff_clients')
    .select('nome')
    .eq('id', params.id)
    .maybeSingle()
  return { title: data?.nome ?? 'Cliente' }
}

/**
 * La scheda di un cliente: tutto quello che si sa di lui, in una schermata.
 *
 * Un cliente che non esiste e un cliente che esiste ma non è mio finiscono
 * nello stesso posto — un 404. Non è pigrizia: distinguere i due casi
 * significherebbe confermare a un venditore che un certo cliente esiste ed è
 * di un collega, cioè far trapelare il portafoglio altrui un id alla volta.
 * La RLS restituisce zero righe, e zero righe qui vuol dire "non c'è".
 */
export default async function SchedaCliente({ params }: { params: { id: string } }) {
  const me = await requireStaff()
  const supabase = staffDb()

  const [cliente, deals, abbonamenti, progetti, attivita, profili, campo, richiami] =
    await Promise.all([
      supabase.from('staff_clients').select('*').eq('id', params.id).maybeSingle(),
      supabase
        .from('staff_deals')
        .select('*')
        .eq('client_id', params.id)
        .order('data_proposta', { ascending: false }),
      supabase
        .from('staff_subscriptions')
        .select('*')
        .eq('client_id', params.id)
        .order('data_inizio', { ascending: false }),
      supabase
        .from('staff_projects')
        .select('*')
        .eq('client_id', params.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('staff_activities')
        .select('id, tipo, testo, data')
        .eq('client_id', params.id)
        .order('data', { ascending: false })
        .limit(20),
      supabase.from('staff_profiles').select('id, nome').eq('attivo', true).order('nome'),
      reportDiCliente(params.id),
      followupDiCliente(params.id),
    ])

  /* Un cliente finto con l'interruttore spento non esiste: aprirlo dal suo
     link diretto deve dare lo stesso 404 che dà un cliente di un collega. */
  /* Cosa di questa scheda si disegna. Senza il permesso la card **non c'è**:
     la RLS ha già restituito `null` al posto della trattativa, e disegnare il
     riquadro vuoto direbbe «nessuna trattativa aperta» — che è un'informazione
     falsa, non un permesso negato. Un dato che non si può vedere non si
     racconta come un dato che non esiste. */
  const vedeTrattative = puo(me, 'can_view_trattative')
  const vedeSoldi = puo(me, 'can_view_soldi')
  const puoIncassare = puo(me, 'can_view_incassi')
  const puoGestireClienti = puo(me, 'can_manage_clients')

  const demo = demoAttivo(me.role)
  if (!cliente.data || (!demo && (cliente.data as { is_demo?: boolean }).is_demo === true)) {
    notFound()
  }

  const c = cliente.data as ClienteRiga & { instagram: string | null }
  const deal = (deals.data?.[0] ?? null) as Deal | null
  const abbonamento = (abbonamenti.data?.[0] ?? null) as Abbonamento | null
  const progetto = (progetti.data?.[0] ?? null) as Progetto | null
  const storico = (attivita.data ?? []) as Attivita[]
  const venditori = (profili.data ?? []) as { id: string; nome: string }[]
  const aperti = richiami.filter((r) => !r.fatto)

  /* La quota pagata si legge dalle spunte, non da una percentuale tenuta in
     pari a mano — e in quante voci si divida lo dice `pagamenti.ts`, perché
     dalla 0038 non è sempre 30 + 70. */
  const voci = deal ? vociPagamento(deal) : []
  const pagato = deal ? quotaPagata(deal) : 0

  /* Il canone di questo mese risulta incassato? Una riga per mese (0039), e la
     chiave è il primo del mese. La data si costruisce dal fuso locale e non con
     `toISOString()`, che passa da UTC: l'ultimo giorno del mese, di sera,
     darebbe già il mese dopo. */
  const oggiLocale = new Date()
  const meseCorrente = `${oggiLocale.getFullYear()}-${String(oggiLocale.getMonth() + 1).padStart(2, '0')}-01`
  const canoneMese = abbonamento
    ? await supabase
        .from('staff_subscription_payments')
        .select('id')
        .eq('subscription_id', abbonamento.id)
        .eq('mese', meseCorrente)
        .maybeSingle()
    : null
  const faseIndice = progetto ? FASI_PROGETTO.indexOf(progetto.fase) : -1

  return (
    <>
      <Link href="/staff/clienti" className="lm-back">
        <ArrowLeft aria-hidden="true" />
        Clienti
      </Link>

      <PageHead
        title={c.nome}
        sub={[SETTORE_LABEL[c.settore], c.citta, c.zona].filter(Boolean).join(' · ')}
      >
        <StatoPill stato={c.stato} />
        {puoGestireClienti && <CambioStato clientId={c.id} nome={c.nome} stato={c.stato} />}
        <SchedaAzioni
          cliente={c}
          venditori={venditori}
          isAdmin={eAdmin(me)}
          puoGestire={puoGestireClienti}
        />
      </PageHead>

      {c.stato === 'rifiutato' && c.motivo_rifiuto && (
        <p className="lm-warn">Rifiutato: {c.motivo_rifiuto}</p>
      )}

      {/* L'avviso è qui in cima e non accanto alla riga dell'indirizzo, dove
          sarebbe più "logico": accanto alla riga lo leggerebbe solo chi sta già
          guardando l'indirizzo, e chi guarda l'indirizzo non ha il problema. Il
          problema lo ha chi cerca questo cliente sulla mappa e non lo trova, e
          quella persona apre la scheda dall'elenco e legge dall'alto.

          Dice **cosa fare**, non cosa è andato storto: «controlla l'indirizzo»
          è un'istruzione, «geocoding fallito» è un lamento. */}
      {c.geo_stato === 'non_trovato' && (
        <p className="lm-warn">
          Posizione non trovata: controlla l’indirizzo. Finché non si trova, questo cliente non
          compare sulla mappa — correggilo da «Modifica» e il pin si rifà al salvataggio.
        </p>
      )}

      <Tilt>
        <Cascade className="lm-bento">
          <article className="lm-card lm-in" data-span="5" data-hover data-reveal>
            <span className="lm-label">Anagrafica</span>
            <div className="lm-rows" style={{ marginTop: '0.9rem' }}>
              <Riga titolo="Referente" valore={c.referente} />
              <Riga titolo="Telefono" valore={c.telefono} href={tel(c.telefono)} />
              <Riga titolo="Email" valore={c.email} href={mail(c.email)} />
              <Riga
                titolo="Instagram"
                valore={c.instagram}
                href={c.instagram ? instagram(c.instagram) : undefined}
              />
              <Riga titolo="Indirizzo" valore={c.indirizzo} />
              <Riga
                titolo="Sito attuale"
                valore={c.sito_attuale ? SITO_LABEL[c.sito_attuale] : null}
              />
              <Riga titolo="In archivio da" valore={dataLunga(c.created_at)} />
            </div>
            {c.note_sito && (
              <p className="lm-sub" style={{ marginTop: '1rem' }}>
                {c.note_sito}
              </p>
            )}
          </article>

          {vedeTrattative && (
          <article className="lm-card lm-in" data-span="4" data-tone="black" data-hover data-reveal>
            <span className="lm-label">Trattativa</span>
            {deal ? (
              <>
                <div style={{ marginTop: '0.9rem' }}>
                  <Counter
                    value={deal.prezzo_chiuso ?? deal.prezzo_proposto ?? 0}
                    format="euro"
                    size="lg"
                  />
                  <p className="lm-kpi-name">
                    {deal.prezzo_chiuso ? 'Chiuso' : 'Proposto'}
                    {deal.pacchetto ? ` · ${PACCHETTO_LABEL[deal.pacchetto]}` : ''}
                  </p>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.1rem',
                    marginTop: '1.2rem',
                  }}
                >
                  <Ring value={pagato} cap="pagato" size={92} stroke={8} label="Quota pagata" />
                  <div className="lm-rows" style={{ flex: 1 }}>
                    {voci.length ? (
                      voci.map((v) => (
                        <div key={v.chiave} className="lm-row">
                          <span>
                            {v.etichetta}
                            <span className="lm-row-note">
                              {v.pagato ? dataBreve(v.data) : 'da incassare'}
                            </span>
                          </span>
                          {puoIncassare && (
                            <BottoneIncasso dealId={deal.id} clientId={c.id} voce={v} compatto />
                          )}
                        </div>
                      ))
                    ) : (
                      <Riga titolo="Da incassare" valore="manca il prezzo chiuso" />
                    )}
                  </div>
                </div>

                <div style={{ marginTop: '1rem' }}>
                  <CondizioniDeal
                    dealId={deal.id}
                    clientId={c.id}
                    modalita={modalitaDi(deal)}
                    abbonamentoMensile={deal.abbonamento_mensile}
                  />
                </div>
              </>
            ) : (
              <p className="lm-empty">
                Nessuna trattativa aperta.
                {c.prezzo_consigliato ? ` Prezzo consigliato: ${euro(c.prezzo_consigliato)}.` : ''}
              </p>
            )}
          </article>
          )}

          {vedeSoldi && (
          <article className="lm-card lm-in" data-span="3" data-tone="pearl" data-hover data-reveal>
            <span className="lm-label">Abbonamento</span>
            {abbonamento ? (
              <>
                <div style={{ marginTop: '0.9rem' }}>
                  <Counter value={abbonamento.importo_mensile ?? 0} format="euro" size="md" />
                  <p className="lm-kpi-name">{abbonamento.tipo} · al mese</p>
                </div>
                <div className="lm-rows" style={{ marginTop: '1rem' }}>
                  <Riga titolo="Dal" valore={dataBreve(abbonamento.data_inizio)} />
                  <Riga titolo="Rinnovo" valore={dataBreve(abbonamento.data_rinnovo)} />
                  <Riga titolo="Stato" valore={abbonamento.attivo ? 'Attivo' : 'Sospeso'} />
                  <div className="lm-row">
                    <span>
                      Questo mese
                      <span className="lm-row-note">
                        {canoneMese?.data ? 'incassato' : 'da incassare'}
                      </span>
                    </span>
                    {puoIncassare && (
                      <BottoneCanone
                        subscriptionId={abbonamento.id}
                        clientId={c.id}
                        importo={abbonamento.importo_mensile ?? 0}
                        pagato={Boolean(canoneMese?.data)}
                        compatto
                      />
                    )}
                  </div>
                </div>
              </>
            ) : (
              <p className="lm-empty">Nessun abbonamento attivo.</p>
            )}
          </article>
          )}

          <article className="lm-card lm-in" data-span="5" data-hover data-reveal>
            <div className="lm-card-top">
              <span className="lm-label">Progetto</span>
              {progetto?.preview_url && (
                <a
                  href={progetto.preview_url}
                  className="lm-pill"
                  data-size="sm"
                  target="_blank"
                  rel="noreferrer"
                >
                  Anteprima
                  <ExternalLink aria-hidden="true" />
                </a>
              )}
            </div>
            {progetto ? (
              <>
                <Progress
                  label={`Fase: ${FASE_LABEL[progetto.fase]}`}
                  value={faseIndice + 1}
                  max={FASI_PROGETTO.length}
                  display={`${faseIndice + 1} di ${FASI_PROGETTO.length}`}
                />
                <div className="lm-rows" style={{ marginTop: '1rem' }}>
                  <Riga titolo="Dominio" valore={progetto.dominio} />
                  <Riga titolo="Scadenza dominio" valore={dataBreve(progetto.scadenza_dominio)} />
                </div>
              </>
            ) : (
              <p className="lm-empty">Il progetto parte quando la trattativa si chiude.</p>
            )}
          </article>

          <article className="lm-card lm-in" data-span="7" data-hover data-reveal>
            <div className="lm-card-top">
              <span className="lm-label">Attività</span>
              <span className="lm-pill-n">{storico.length}</span>
            </div>
            {storico.length ? (
              <div className="lm-time">
                {storico.map((a) => (
                  <div key={a.id} className="lm-time-item">
                    <div className="lm-time-head">
                      <span className="lm-time-tipo">{ATTIVITA_LABEL[a.tipo]}</span>
                      <span className="lm-when">{dataBreve(a.data)}</span>
                    </div>
                    {a.testo && <p className="lm-time-body">{a.testo}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="lm-empty">
                Ancora nessuna attività. Le visite arrivano dal Campo, le chiamate e le note dal
                bottone «Attività» qui sopra.
              </p>
            )}
          </article>

          <article className="lm-card lm-in" data-span="5" data-hover data-reveal>
            <div className="lm-card-top">
              <span className="lm-label">Richiami</span>
              <span className="lm-pill-n">{aperti.length}</span>
            </div>
            {richiami.length ? (
              <div className="lm-rows">
                {richiami.map((f) => {
                  const q = quando(f.data)
                  return (
                    <div key={f.id} className="lm-row">
                      <span>
                        {f.fatto ? 'Fatto' : 'Da fare'}
                        {f.nota && <span className="lm-row-note">{f.nota}</span>}
                      </span>
                      <span className="lm-when" data-late={!f.fatto && q.tardi}>
                        {f.fatto ? dataBreve(f.data) : q.testo}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="lm-empty">
                Nessun richiamo preso. Si prende dal bottone «Richiamo», o alla fine di una visita.
              </p>
            )}
          </article>

          <article className="lm-card lm-in" data-span="12" data-hover data-reveal>
            <div className="lm-card-top">
              <span className="lm-label">Report di campo</span>
              <span className="lm-pill-n">{campo.visite.length}</span>
            </div>
            {campo.visite.length ? (
              <div className="lm-reports">
                {campo.visite.map((v) => (
                  <Report key={v.id} visita={v} foto={campo.foto} />
                ))}
              </div>
            ) : (
              <p className="lm-empty">
                Nessuna visita registrata. Dal Campo si raccoglie come lavora, cosa usa e cosa ha
                detto — è il materiale su cui si costruisce il preventivo.
              </p>
            )}
          </article>
        </Cascade>
      </Tilt>
    </>
  )
}

/**
 * Un report di campo dentro la scheda.
 *
 * Più stretto di quello della pagina Campo: là si sfogliano visite di clienti
 * diversi e serve il nome grande, qui il cliente è già il titolo della pagina
 * e quello che conta è cosa è cambiato da una visita all'altra.
 */
function Report({ visita, foto }: { visita: ReportRiga; foto: Record<string, string> }) {
  const scatti = (visita.foto ?? []).map((path) => foto[path]).filter(Boolean)
  const tag = [
    ...(visita.gestione_prenotazioni ?? []).map((v) => etichetta(v, GESTIONE_LABEL)),
    ...(visita.strumenti_usati ?? []).map((v) => etichetta(v, STRUMENTO_LABEL)),
    ...(visita.lingue_clienti ?? []).map((v) => etichetta(v, LINGUA_LABEL)),
  ]

  return (
    <div className="lm-report">
      <div className="lm-card-top">
        <span className="lm-when">{dataLunga(visita.created_at)}</span>
        {visita.reazione && (
          <span className="lm-react" data-r={visita.reazione}>
            {etichetta(visita.reazione, REAZIONE_LABEL)}
          </span>
        )}
      </div>

      {visita.frase_titolare && <p className="lm-quote">«{visita.frase_titolare}»</p>}

      {tag.length > 0 && (
        <div className="lm-tags">
          {tag.map((t) => (
            <span key={t} className="lm-tag">
              {t}
            </span>
          ))}
        </div>
      )}

      <div className="lm-rows" style={{ marginTop: '0.7rem' }}>
        {visita.obiezione_principale && (
          <div className="lm-row">
            <span className="lm-muted">Obiezione</span>
            <span className="lm-row-v">
              {etichetta(visita.obiezione_principale, OBIEZIONE_LABEL)}
            </span>
          </div>
        )}
        {visita.commissioni_pagate != null && (
          <div className="lm-row">
            <span className="lm-muted">Commissioni</span>
            <span className="lm-row-v">{euro(visita.commissioni_pagate)} al mese</span>
          </div>
        )}
        {visita.turisti != null && (
          <div className="lm-row">
            <span className="lm-muted">Turisti</span>
            <span className="lm-row-v">{visita.turisti ? 'Sì' : 'No'}</span>
          </div>
        )}
      </div>

      {visita.problemi_dichiarati && <p className="lm-sub">{visita.problemi_dichiarati}</p>}
      {visita.trascrizione_vocale && (
        <p className="lm-sub lm-dictated">{visita.trascrizione_vocale}</p>
      )}

      {scatti.length > 0 && (
        <div className="lm-shots" style={{ marginTop: '0.8rem' }}>
          {scatti.map((url) => (
            /* URL firmati che scadono in un'ora: next/image li metterebbe in
               una cache che muore prima di servire a qualcosa. */
            /* eslint-disable-next-line @next/next/no-img-element */
            <span key={url} className="lm-shot">
              <img src={url} alt="Foto della visita" loading="lazy" />
            </span>
          ))}
        </div>
      )}

      {visita.lat != null && visita.lng != null && (
        <a
          className="lm-pill lm-visit-map"
          data-size="sm"
          href={`https://www.openstreetmap.org/?mlat=${visita.lat}&mlon=${visita.lng}#map=18/${visita.lat}/${visita.lng}`}
          target="_blank"
          rel="noreferrer"
        >
          <MapPin aria-hidden="true" />
          Dov&apos;era
        </a>
      )}
    </div>
  )
}

/** Una riga etichetta/valore, la forma base di tutte le card di questa scheda. */
function Riga({
  titolo,
  valore,
  href,
}: {
  titolo: string
  valore: string | null | undefined
  href?: string
}) {
  return (
    <div className="lm-row">
      <span className="lm-muted">{titolo}</span>
      <span className="lm-row-v">
        {valore ? (
          href ? (
            <a
              href={href}
              style={{ color: 'inherit' }}
              target={href.startsWith('http') ? '_blank' : undefined}
              rel="noreferrer"
            >
              {valore}
            </a>
          ) : (
            valore
          )
        ) : (
          '—'
        )}
      </span>
    </div>
  )
}

interface Deal {
  id: string
  pacchetto: Pacchetto | null
  prezzo_proposto: number | null
  prezzo_chiuso: number | null
  modalita_pagamento: string | null
  abbonamento_mensile: number | null
  acconto_30_pagato: boolean
  acconto_30_data: string | null
  saldo_70_pagato: boolean
  saldo_70_data: string | null
  data_chiusura: string | null
}

interface Abbonamento {
  id: string
  tipo: string
  importo_mensile: number | null
  data_inizio: string | null
  data_rinnovo: string | null
  attivo: boolean
}

interface Progetto {
  fase: FaseProgetto
  preview_url: string | null
  dominio: string | null
  scadenza_dominio: string | null
}

interface Attivita {
  id: string
  tipo: TipoAttivita
  testo: string | null
  data: string
}

const tel = (value: string | null) => (value ? `tel:${value.replace(/\s/g, '')}` : undefined)
const mail = (value: string | null) => (value ? `mailto:${value}` : undefined)
const instagram = (value: string) =>
  value.startsWith('http') ? value : `https://instagram.com/${value.replace(/^@/, '')}`
