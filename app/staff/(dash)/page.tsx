import Link from 'next/link'
import { Plus, Sparkles } from 'lucide-react'
import AreaChart, { type AreaPoint } from '@/components/staff/AreaChart'
import { Lollipop, Progress } from '@/components/staff/Bars'
import Cascade from '@/components/staff/Cascade'
import Counter from '@/components/staff/Counter'
import PageHead from '@/components/staff/PageHead'
import Ring from '@/components/staff/Ring'
import { requireStaff } from '@/lib/staff/auth'
import { STAFF_COUNTRY, STATI, STATO_LABEL, dataBreve, euro, type Stato } from '@/lib/staff/types'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Oggi' }

/**
 * Oggi.
 *
 * Non è un riassunto dell'azienda: è quello che serve sapere entrando, in
 * quest'ordine — cosa ho chiuso questo mese, quanto ho incassato, quanto entra
 * da solo, com'è fatta la pipeline, chi va richiamato adesso, cosa scade.
 *
 * Tutti i numeri li filtra la RLS: un venditore vede i propri clienti, l'admin
 * tutti. Non c'è nessun `if (role)` in questa pagina, ed è voluto: la stessa
 * query dà due risultati diversi perché la regola sta nel database, dove non la
 * si può dimenticare.
 */
export default async function StaffHome() {
  const me = await requireStaff()
  const supabase = createClient()
  const oggi = new Date()
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  const primoDelMese = new Date(oggi.getFullYear(), oggi.getMonth(), 1)
  const inizioMese = iso(primoDelMese)
  const inizioMeseScorso = iso(new Date(oggi.getFullYear(), oggi.getMonth() - 1, 1))
  const fra30Giorni = iso(new Date(oggi.getTime() + 30 * 86_400_000))

  const [clienti, deals, abbonamenti, followup, rinnovi] = await Promise.all([
    supabase.from('staff_clients').select('stato').eq('country', STAFF_COUNTRY),
    supabase
      .from('staff_deals')
      .select('prezzo_chiuso, acconto_30_pagato, saldo_70_pagato, data_chiusura'),
    supabase.from('staff_subscriptions').select('importo_mensile').eq('attivo', true),
    supabase
      .from('staff_followups')
      .select('id, data, nota, staff_clients ( nome )')
      .eq('fatto', false)
      .lte('data', iso(oggi))
      .order('data', { ascending: true })
      .limit(6),
    supabase
      .from('staff_subscriptions')
      .select('id, tipo, importo_mensile, data_rinnovo, staff_clients ( nome )')
      .eq('attivo', true)
      .not('data_rinnovo', 'is', null)
      .lte('data_rinnovo', fra30Giorni)
      .order('data_rinnovo', { ascending: true })
      .limit(6),
  ])

  /* Se la migration 0030 non è ancora passata, Postgres risponde 42P01
     (relazione inesistente). È l'unico errore che vale la pena raccontare per
     nome: chiunque apra questa pagina il primo giorno lo incontrerà, e senza
     una spiegazione vedrebbe solo una schermata di zeri. */
  const mancaSchema = [clienti, deals, abbonamenti, followup, rinnovi].some(
    (r) => r.error?.code === '42P01',
  )

  const perStato = new Map<Stato, number>()
  for (const riga of (clienti.data ?? []) as { stato: Stato }[]) {
    perStato.set(riga.stato, (perStato.get(riga.stato) ?? 0) + 1)
  }
  const totaleClienti = clienti.data?.length ?? 0

  const righeDeal = (deals.data ?? []) as {
    prezzo_chiuso: number | null
    acconto_30_pagato: boolean
    saldo_70_pagato: boolean
    data_chiusura: string | null
  }[]

  const chiusiDelMese = righeDeal.filter((d) => d.data_chiusura && d.data_chiusura >= inizioMese)
  const chiusiMeseScorso = righeDeal.filter(
    (d) => d.data_chiusura && d.data_chiusura >= inizioMeseScorso && d.data_chiusura < inizioMese,
  )

  /* 30% all'ordine e 70% alla consegna: incassato e residuo si ricavano dalle
     due spunte, non da un campo "pagato" che andrebbe tenuto in pari a mano. */
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

  const abbonamentiAttivi = (abbonamenti.data ?? []) as { importo_mensile: number | null }[]
  const ricorrenti = abbonamentiAttivi.reduce((somma, a) => somma + (a.importo_mensile ?? 0), 0)

  const andamento = ultimiSeiMesi(righeDeal, oggi)
  const delta = chiusiDelMese.length - chiusiMeseScorso.length
  const chiaveAI = Boolean(process.env.GEMINI_API_KEY)

  return (
    <>
      <PageHead
        title={
          <>
            Ciao, <em>{me.nome.split(' ')[0]}</em>.
          </>
        }
        sub={`${new Intl.DateTimeFormat('it-IT', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        }).format(oggi)}${me.obiettivo_mensile ? ` · obiettivo del mese ${euro(me.obiettivo_mensile)}` : ''}`}
      >
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
          placeholder="Chiedi a Lumino AI — “quali settori chiudono meglio?”"
          aria-label="Chiedi a Lumino AI"
        />
        <span className="lm-ask-note">{chiaveAI ? 'Fase 5' : 'Da attivare'}</span>
      </div>

      {mancaSchema && (
        <p className="lm-warn">
          Le tabelle dell&apos;area staff non esistono ancora su questo database. Esegui{' '}
          <code>supabase/migrations/0030_staff_dashboard.sql</code> nell&apos;SQL editor di Supabase:
          fino a quel momento i numeri qui sotto restano a zero.
        </p>
      )}

      <Cascade className="lm-bento">
        <div className="lm-card lm-in" data-span="4" data-tone="cream" data-reveal>
          <span className="lm-label">Chiusi questo mese</span>
          <div style={{ marginTop: 'auto', paddingTop: '1.2rem' }}>
            <Counter value={chiusiDelMese.length} size="xl" />
            <p className="lm-delta" data-dir={delta === 0 ? undefined : delta > 0 ? 'up' : 'down'}>
              {delta === 0
                ? 'come il mese scorso'
                : `${delta > 0 ? '+' : ''}${delta} rispetto al mese scorso`}
            </p>
          </div>
        </div>

        <div className="lm-card lm-in" data-span="4" data-glow data-reveal>
          <span className="lm-label">Incassato</span>
          <div style={{ marginTop: 'auto', paddingTop: '1.2rem' }}>
            <Counter value={incassato} format="euro" size="lg" />
            <p className="lm-kpi-name">Su {euro(venduto)} venduti</p>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <Progress
              label="Da incassare"
              value={daIncassare}
              max={venduto || 1}
              display={euro(daIncassare)}
              tone="grad"
            />
          </div>
        </div>

        <div className="lm-card lm-in" data-span="4" data-reveal>
          <span className="lm-label">Ricorrenti al mese</span>
          <div style={{ marginTop: 'auto', paddingTop: '1.2rem' }}>
            <Counter value={ricorrenti} format="euro" size="lg" />
            <p className="lm-kpi-name">
              {abbonamentiAttivi.length} abbonament{abbonamentiAttivi.length === 1 ? 'o' : 'i'}{' '}
              attiv{abbonamentiAttivi.length === 1 ? 'o' : 'i'}
            </p>
          </div>
        </div>

        <div className="lm-card lm-in" data-span="8" data-reveal>
          <div className="lm-card-top">
            <span className="lm-label">Chiusi negli ultimi 6 mesi</span>
            <span className="lm-pill" data-size="sm" data-on="true" aria-hidden="true">
              6 mesi
            </span>
          </div>
          <AreaChart points={andamento} />
        </div>

        <div
          className="lm-card lm-in"
          data-span="4"
          data-tone="violet"
          data-reveal
          style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}
        >
          <Ring
            value={venduto > 0 ? (incassato / venduto) * 100 : 0}
            cap="incassato"
            size={124}
            stroke={10}
            label="Quota incassata sul venduto"
          />
          <p className="lm-kpi-name" style={{ marginTop: '1rem' }}>
            {euro(daIncassare)} ancora da incassare
          </p>
        </div>

        <div className="lm-card lm-in" data-span="12" data-reveal>
          <div className="lm-card-top">
            <span className="lm-label">Pipeline</span>
            <Link href="/staff/pipeline" className="lm-pill" data-size="sm">
              {totaleClienti} client{totaleClienti === 1 ? 'e' : 'i'}
            </Link>
          </div>
          <Lollipop
            items={STATI.map((stato) => ({
              label: STATO_LABEL[stato],
              value: perStato.get(stato) ?? 0,
            }))}
          />
        </div>

        <div className="lm-card lm-in" data-span="6" data-reveal>
          <div className="lm-card-top">
            <span className="lm-label">Da richiamare</span>
            <span className="lm-pill-n">{followup.data?.length ?? 0}</span>
          </div>
          {followup.data?.length ? (
            <div className="lm-rows">
              {(followup.data as FollowupRiga[]).map((f) => (
                <div key={f.id} className="lm-row">
                  <span>
                    {nomeCliente(f.staff_clients)}
                    {f.nota && <span className="lm-row-note">{f.nota}</span>}
                  </span>
                  <span className="lm-when" data-late={f.data < iso(oggi)}>
                    {f.data < iso(oggi) ? 'in ritardo' : 'oggi'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="lm-empty">Nessun follow-up in scadenza. Buon segno.</p>
          )}
        </div>

        <div className="lm-card lm-in" data-span="6" data-reveal>
          <div className="lm-card-top">
            <span className="lm-label">Rinnovi entro 30 giorni</span>
            <span className="lm-pill-n">{rinnovi.data?.length ?? 0}</span>
          </div>
          {rinnovi.data?.length ? (
            <div className="lm-rows">
              {(rinnovi.data as RinnovoRiga[]).map((r) => (
                <div key={r.id} className="lm-row">
                  <span>
                    {nomeCliente(r.staff_clients)}
                    <span className="lm-row-note">
                      {r.tipo} · {euro(r.importo_mensile)} al mese
                    </span>
                  </span>
                  <span className="lm-when" data-late={r.data_rinnovo < iso(oggi)}>
                    {dataBreve(r.data_rinnovo)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="lm-empty">Nessun rinnovo nei prossimi 30 giorni.</p>
          )}
        </div>
      </Cascade>
    </>
  )
}

/**
 * I sei mesi dell'andamento, zeri compresi.
 *
 * I mesi senza chiusure devono esserci: saltarli farebbe leggere una curva che
 * sale sempre, perché l'asse X non sarebbe più il tempo ma solo i mesi buoni.
 */
function ultimiSeiMesi(
  deals: { data_chiusura: string | null }[],
  oggi: Date,
): AreaPoint[] {
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

/* La tabella collegata, come la restituisce PostgREST: un oggetto quando la
   chiave esterna punta a una riga sola. Il tipo ammette anche l'array perché
   supabase-js, che non conosce i vincoli del database, la dichiara così: la
   forma vera la risolve nomeCliente(). */
type ClienteEmbed = { nome: string } | { nome: string }[] | null

interface FollowupRiga {
  id: string
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
