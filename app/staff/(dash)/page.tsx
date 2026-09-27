import Link from 'next/link'
import { Plus, Sparkles } from 'lucide-react'
import AreaChart, { type AreaPoint } from '@/components/staff/AreaChart'
import { Lollipop, Progress } from '@/components/staff/Bars'
import Cascade from '@/components/staff/Cascade'
import Counter from '@/components/staff/Counter'
import FlussoTeam from '@/components/staff/FlussoTeam'
import Mappa, { type PuntoZona } from '@/components/staff/Mappa'
import PageHead from '@/components/staff/PageHead'
import Ring from '@/components/staff/Ring'
import Settimana, { type EventoSettimana } from '@/components/staff/Settimana'
import Spark from '@/components/staff/Spark'
import Tilt from '@/components/staff/Tilt'
import { requireStaff } from '@/lib/staff/auth'
import { staffDb } from '@/lib/staff/db'
import { demoAttivo, senzaDemo } from '@/lib/staff/demo'
import { flussoTeam } from '@/lib/staff/queries'
import {
  STAFF_COUNTRY,
  STATI,
  STATO_CORTO,
  dataBreve,
  euro,
  oggiISO,
  quando,
  type Stato,
} from '@/lib/staff/types'

export const metadata = { title: 'Oggi' }
export const dynamic = 'force-dynamic'

/**
 * Oggi.
 *
 * Non è un riassunto dell'azienda: è quello che serve sapere entrando, in
 * quest'ordine — quanto ho incassato, cosa ho chiuso, come sta andando,
 * **che settimana mi aspetta**, dove sto girando.
 *
 * La composizione segue ref1: una card nera col flusso del team, accanto i
 * numeri che contano, sotto un calendario largo e la mappa del territorio. Le
 * card non sono tutte uguali e non devono esserlo — la varietà delle forme è ciò
 * che rende leggibile una schermata densa, perché ogni riquadro si riconosce
 * dalla sua figura prima che dal suo titolo.
 *
 * Tutti i numeri li filtra la RLS: un venditore vede i propri clienti, l'admin
 * tutti. Non c'è nessun `if (role)` in questa pagina, ed è voluto — la regola
 * sta nel database, dove non la si può dimenticare.
 */
export default async function StaffHome() {
  const me = await requireStaff()
  const demo = demoAttivo(me.role)
  const supabase = staffDb()

  const oggi = new Date()
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  const inizioMese = iso(new Date(oggi.getFullYear(), oggi.getMonth(), 1))
  const inizioMeseScorso = iso(new Date(oggi.getFullYear(), oggi.getMonth() - 1, 1))
  const fra30Giorni = iso(new Date(oggi.getTime() + 30 * 86_400_000))

  const [clienti, deals, abbonamenti, followup, rinnovi, flusso] = await Promise.all([
    /* `*` e non l'elenco delle colonne: serve `is_demo`, che arriva con la
       migration 0031, e nominarla esplicitamente farebbe fallire ogni query
       su un database dove non è ancora passata. Con `*` la colonna c'è se
       c'è, e il filtro dei dati finti se la cava da solo (senzaDemo). */
    supabase.from('staff_clients').select('*').eq('country', STAFF_COUNTRY),
    supabase.from('staff_deals').select('*'),
    supabase.from('staff_subscriptions').select('*').eq('attivo', true),
    supabase
      .from('staff_followups')
      .select('*, staff_clients ( nome )')
      .eq('fatto', false)
      .lte('data', iso(new Date(oggi.getTime() + 14 * 86_400_000)))
      .order('data', { ascending: true })
      .limit(40),
    supabase
      .from('staff_subscriptions')
      .select('*, staff_clients ( nome )')
      .eq('attivo', true)
      .not('data_rinnovo', 'is', null)
      .lte('data_rinnovo', fra30Giorni)
      .order('data_rinnovo', { ascending: true })
      .limit(6),
    flussoTeam(demo),
  ])

  /* Se la migration 0030 non è ancora passata, Postgres risponde 42P01
     (relazione inesistente). È l'unico errore che vale la pena raccontare per
     nome: chiunque apra questa pagina il primo giorno lo incontrerà. */
  const mancaSchema = [clienti, deals, abbonamenti, followup, rinnovi].some(
    (r) => r.error?.code === '42P01',
  )

  const righeCliente = senzaDemo(
    (clienti.data ?? []) as { stato: Stato; citta: string | null; lat: number | null; lng: number | null }[],
    demo,
  )
  const righeDeal = senzaDemo(
    (deals.data ?? []) as {
      prezzo_chiuso: number | null
      acconto_30_pagato: boolean
      saldo_70_pagato: boolean
      data_chiusura: string | null
    }[],
    demo,
  )
  const abbonamentiAttivi = senzaDemo(
    (abbonamenti.data ?? []) as { importo_mensile: number | null }[],
    demo,
  )
  const richiami = senzaDemo((followup.data ?? []) as FollowupRiga[], demo)
  const righeRinnovo = senzaDemo((rinnovi.data ?? []) as RinnovoRiga[], demo)

  const perStato = new Map<Stato, number>()
  for (const riga of righeCliente) perStato.set(riga.stato, (perStato.get(riga.stato) ?? 0) + 1)

  const chiusiDelMese = righeDeal.filter((d) => d.data_chiusura && d.data_chiusura >= inizioMese)
  const chiusiMeseScorso = righeDeal.filter(
    (d) => d.data_chiusura && d.data_chiusura >= inizioMeseScorso && d.data_chiusura < inizioMese,
  )

  /* 30% all'ordine e 70% alla consegna: incassato e residuo si ricavano dalle
     due spunte, non da un campo "pagato" tenuto in pari a mano. */
  let incassato = 0
  let daIncassare = 0
  for (const d of righeDeal) {
    const totale = d.prezzo_chiuso ?? 0
    if (!totale || !d.data_chiusura) continue
    if (d.acconto_30_pagato) incassato += totale * 0.3
    else daIncassare += totale * 0.3
    if (d.saldo_70_pagato) incassato += totale * 0.7
    else daIncassare += totale * 0.7
  }
  const venduto = incassato + daIncassare
  const ricorrenti = abbonamentiAttivi.reduce((s, a) => s + (a.importo_mensile ?? 0), 0)

  const andamento = ultimiSeiMesi(righeDeal, oggi)
  const delta = chiusiDelMese.length - chiusiMeseScorso.length
  const chiaveAI = Boolean(process.env.GEMINI_API_KEY)

  const adesso = oggiISO()
  const eventi: EventoSettimana[] = richiami
    .filter((f) => f.data >= adesso)
    .map((f) => ({
      id: f.id,
      data: f.data,
      titolo: nomeCliente(f.staff_clients),
      nota: f.nota,
      href: `/staff/clienti/${f.client_id}`,
    }))
  const arretrati: EventoSettimana[] = richiami
    .filter((f) => f.data < adesso)
    .slice(0, 3)
    .map((f) => ({
      id: f.id,
      data: f.data,
      titolo: nomeCliente(f.staff_clients),
      nota: f.nota,
      href: `/staff/clienti/${f.client_id}`,
    }))

  return (
    <>
      <PageHead
        title={
          <>
            Ciao, <em>{me.nome.split(' ')[0]}</em>
          </>
        }
        sub={`${new Intl.DateTimeFormat('it-IT', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        }).format(oggi)}${
          me.obiettivo_mensile ? ` · obiettivo del mese ${euro(me.obiettivo_mensile)}` : ''
        }`}
      >
        <Link href="/staff/campo/nuova" className="lm-btn" data-variant="dark">
          Registra una visita
        </Link>
        <Link href="/staff/clienti/nuovo" className="lm-btn">
          <Plus aria-hidden="true" />
          Nuovo cliente
        </Link>
      </PageHead>

      {/* La barra dell'AI c'è dal primo giorno ma non finge: senza chiave è
          spenta e lo dice, invece di raccogliere una domanda e non rispondere. */}
      <div className="lm-ask">
        <span className="lm-ask-spark" aria-hidden="true">
          <Sparkles />
        </span>
        <input
          type="text"
          disabled={!chiaveAI}
          placeholder="Chiedi a Lumino — «quali settori chiudono meglio?»"
          aria-label="Chiedi a Lumino"
        />
        <span className="lm-ask-note">{chiaveAI ? 'Fase 5' : 'Da attivare'}</span>
      </div>

      {mancaSchema && (
        <p className="lm-warn">
          Le tabelle dell&apos;area staff non esistono ancora su questo database. Esegui{' '}
          <code>supabase/migrations/0030_staff_dashboard.sql</code> nell&apos;SQL editor di
          Supabase: fino a quel momento i numeri qui sotto restano a zero.
        </p>
      )}

      <Tilt>
        <Cascade className="lm-bento">
          {/* La card nera: qui c'era una sfera cromata che girava. Era un
              ornamento nel punto più guardato della schermata — ora c'è cosa
              sta facendo il team, che è la sola card della home a parlare del
              presente invece di contare il passato. */}
          <article className="lm-card lm-in" data-span="4" data-tone="black" data-hover data-reveal>
            <div className="lm-card-top">
              <span className="lm-label">Il team, adesso</span>
              <span className="lm-live" style={{ color: 'rgba(255,255,255,0.7)' }}>
                in linea
              </span>
            </div>
            <FlussoTeam voci={flusso} />
            <div className="lm-rows" style={{ marginTop: 'auto', paddingTop: '0.9rem' }}>
              <div className="lm-row">
                <span className="lm-muted">Clienti in archivio</span>
                <span className="lm-row-v">{righeCliente.length}</span>
              </div>
              <div className="lm-row">
                <span className="lm-muted">Ricorrenti al mese</span>
                <span className="lm-row-v">{euro(ricorrenti)}</span>
              </div>
            </div>
          </article>

          <article className="lm-card lm-in" data-span="5" data-hover data-reveal>
            <div className="lm-card-top">
              <span className="lm-label">Incassato</span>
              <span className="lm-muted" style={{ fontSize: '0.78rem' }}>
                su {euro(venduto)} venduti
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.3rem' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Counter value={incassato} format="euro" size="lg" />
                <div style={{ marginTop: '1.1rem' }}>
                  <Progress
                    label="Da incassare"
                    value={daIncassare}
                    max={venduto || 1}
                    display={euro(daIncassare)}
                    tone="violet"
                  />
                  <Progress
                    label="Ricorrenti al mese"
                    value={ricorrenti}
                    max={Math.max(ricorrenti, venduto / 12 || 1)}
                    display={euro(ricorrenti)}
                  />
                </div>
              </div>
              <Ring
                value={venduto > 0 ? (incassato / venduto) * 100 : 0}
                cap="incassato"
                size={104}
                stroke={6}
                label="Quota incassata sul venduto"
              />
            </div>
          </article>

          <article className="lm-card lm-in" data-span="3" data-tone="pearl" data-hover data-reveal>
            <span className="lm-label">Chiusi questo mese</span>
            <div style={{ marginTop: 'auto', paddingTop: '0.9rem' }}>
              <Counter value={chiusiDelMese.length} size="xl" />
              <p className="lm-delta" data-dir={delta === 0 ? undefined : delta > 0 ? 'up' : 'down'}>
                {delta === 0
                  ? 'come il mese scorso'
                  : `${delta > 0 ? '+' : ''}${delta} rispetto al mese scorso`}
              </p>
            </div>
            <Spark
              serie={andamento.map((p) => p.value)}
              label="Chiusure degli ultimi sei mesi"
            />
          </article>

          <article className="lm-card lm-in" data-span="8" data-hover data-reveal>
            <div className="lm-card-top">
              <span className="lm-label">Andamento delle chiusure</span>
              <span className="lm-pill" data-size="sm">
                6 mesi
              </span>
            </div>
            <AreaChart points={andamento} />
          </article>

          <article className="lm-card lm-in" data-span="4" data-hover data-reveal>
            <div className="lm-card-top">
              <span className="lm-label">Pipeline</span>
              <Link href="/staff/pipeline" className="lm-pill" data-size="sm">
                {righeCliente.length} client{righeCliente.length === 1 ? 'e' : 'i'}
              </Link>
            </div>
            <Lollipop
              items={STATI.map((stato) => ({
                label: STATO_CORTO[stato],
                value: perStato.get(stato) ?? 0,
              }))}
            />
          </article>

          {/* Il calendario largo di ref1: la settimana che aspetta, in pill
              nere. È l'unica card che mostra il futuro invece del passato. */}
          <article className="lm-card lm-in" data-span="8" data-hover data-reveal>
            <div className="lm-card-top">
              <span className="lm-label">I prossimi sette giorni</span>
              <span className="lm-muted" style={{ fontSize: '0.78rem' }}>
                {arretrati.length > 0
                  ? `${arretrati.length} in ritardo, appoggiati su oggi`
                  : 'Nessun arretrato'}
              </span>
            </div>
            {eventi.length || arretrati.length ? (
              <Settimana eventi={eventi} arretrati={arretrati} />
            ) : (
              <p className="lm-empty">
                Nessun richiamo in agenda. Si prendono alla fine di una visita.
              </p>
            )}
          </article>

          <article className="lm-card lm-in" data-span="4" data-hover data-reveal>
            <div className="lm-card-top">
              <span className="lm-label">Dove stai girando</span>
              <Link href="/staff/campo" className="lm-pill" data-size="sm">
                Campo
              </Link>
            </div>
            <Mappa punti={zone(righeCliente)} unita="clienti" />
          </article>

          <article className="lm-card lm-in" data-span="6" data-hover data-reveal>
            <div className="lm-card-top">
              <span className="lm-label">Rinnovi entro 30 giorni</span>
              <span className="lm-pill-n">{righeRinnovo.length}</span>
            </div>
            {righeRinnovo.length ? (
              <div className="lm-rows">
                {righeRinnovo.map((r) => (
                  <div key={r.id} className="lm-row">
                    <span>
                      {nomeCliente(r.staff_clients)}
                      <span className="lm-row-note">
                        {r.tipo} · {euro(r.importo_mensile)} al mese
                      </span>
                    </span>
                    <span className="lm-when" data-late={r.data_rinnovo < adesso}>
                      {dataBreve(r.data_rinnovo)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="lm-empty">Nessun rinnovo nei prossimi 30 giorni.</p>
            )}
          </article>

          <article className="lm-card lm-in" data-span="6" data-hover data-reveal>
            <div className="lm-card-top">
              <span className="lm-label">Da richiamare</span>
              <span className="lm-pill-n">{richiami.length}</span>
            </div>
            {richiami.length ? (
              <div className="lm-rows">
                {richiami.slice(0, 6).map((f) => {
                  const q = quando(f.data)
                  return (
                    <Link key={f.id} href={`/staff/clienti/${f.client_id}`} className="lm-row">
                      <span>
                        {nomeCliente(f.staff_clients)}
                        {f.nota && <span className="lm-row-note">{f.nota}</span>}
                      </span>
                      <span className="lm-when" data-late={q.tardi}>
                        {q.testo}
                      </span>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <p className="lm-empty">Nessun follow-up in scadenza. Buon segno.</p>
            )}
          </article>
        </Cascade>
      </Tilt>
    </>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * I sei mesi dell'andamento, zeri compresi.
 *
 * I mesi senza chiusure devono esserci: saltarli farebbe leggere una curva che
 * sale sempre, perché l'asse X non sarebbe più il tempo ma solo i mesi buoni.
 */
function ultimiSeiMesi(deals: { data_chiusura: string | null }[], oggi: Date): AreaPoint[] {
  const punti: AreaPoint[] = []
  for (let i = 5; i >= 0; i--) {
    const mese = new Date(oggi.getFullYear(), oggi.getMonth() - i, 1)
    const chiave = `${mese.getFullYear()}-${String(mese.getMonth() + 1).padStart(2, '0')}`
    punti.push({
      label: new Intl.DateTimeFormat('it-IT', { month: 'short' }).format(mese),
      value: deals.filter((d) => d.data_chiusura?.startsWith(chiave)).length,
    })
  }
  return punti
}

/**
 * I punti della mappa: uno per città, grande quanto i clienti che ci stanno
 * dentro.
 *
 * Le coordinate sono quelle dei clienti, non un elenco di città scritto a mano:
 * il giorno che si vende a Belluno il punto compare da solo. Chi non ha
 * coordinate non entra — meglio una mappa con meno punti che un punto nel posto
 * sbagliato.
 *
 * Il taglio a nove città non serve più a evitare che le etichette si coprano
 * (era il difetto della mappa disegnata a mano): ora ci pensa il cluster di
 * Leaflet. Resta perché la card è alta 210px e nove punti sono già una risposta
 * completa alla domanda «sto coprendo il territorio».
 */
function zone(
  clienti: { citta: string | null; lat: number | null; lng: number | null }[],
): PuntoZona[] {
  const mappa = new Map<string, { lat: number; lng: number; n: number }>()

  for (const c of clienti) {
    if (!c.citta || c.lat == null || c.lng == null) continue
    const corrente = mappa.get(c.citta)
    if (corrente) corrente.n += 1
    else mappa.set(c.citta, { lat: c.lat, lng: c.lng, n: 1 })
  }

  return Array.from(mappa.entries())
    .map(([nome, v]) => ({ nome, ...v }))
    .sort((a, b) => b.n - a.n)
    .slice(0, 9)
}

/* La tabella collegata, come la restituisce PostgREST: un oggetto quando la
   chiave esterna punta a una riga sola. Il tipo ammette anche l'array perché
   supabase-js, che non conosce i vincoli del database, la dichiara così. */
type ClienteEmbed = { nome: string } | { nome: string }[] | null

interface FollowupRiga {
  id: string
  client_id: string
  data: string
  nota: string | null
  staff_clients: ClienteEmbed
}

interface RinnovoRiga {
  id: string
  tipo: string
  importo_mensile: number | null
  data_rinnovo: string
  staff_clients: ClienteEmbed
}

function nomeCliente(embed: ClienteEmbed): string {
  if (!embed) return 'Cliente'
  const riga = Array.isArray(embed) ? embed[0] : embed
  return riga?.nome ?? 'Cliente'
}
