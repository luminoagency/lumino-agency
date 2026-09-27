import Link from 'next/link'
import { requireStaff } from '@/lib/staff/auth'
import { STAFF_COUNTRY, STATI, STATO_LABEL, euro, type Stato } from '@/lib/staff/types'
import { createClient } from '@/lib/supabase/server'
import KpiNumber from './KpiNumber'

export const metadata = { title: 'Oggi' }

/**
 * Oggi.
 *
 * Non è un riassunto dell'azienda: è quello che serve sapere entrando, in
 * quest'ordine — cosa ho chiuso questo mese, quanto devo ancora incassare,
 * com'è fatta la pipeline, chi va richiamato adesso, cosa scade.
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
  const inizioMese = iso(new Date(oggi.getFullYear(), oggi.getMonth(), 1))
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
      .limit(8),
    supabase
      .from('staff_subscriptions')
      .select('id, tipo, importo_mensile, data_rinnovo, staff_clients ( nome )')
      .eq('attivo', true)
      .not('data_rinnovo', 'is', null)
      .lte('data_rinnovo', fra30Giorni)
      .order('data_rinnovo', { ascending: true })
      .limit(8),
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
  const massimoStato = Math.max(1, ...Array.from(perStato.values()))

  const righeDeal = (deals.data ?? []) as {
    prezzo_chiuso: number | null
    acconto_30_pagato: boolean
    saldo_70_pagato: boolean
    data_chiusura: string | null
  }[]

  const chiusiDelMese = righeDeal.filter((d) => d.data_chiusura && d.data_chiusura >= inizioMese)

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

  const ricorrenti = ((abbonamenti.data ?? []) as { importo_mensile: number | null }[]).reduce(
    (somma, a) => somma + (a.importo_mensile ?? 0),
    0,
  )

  return (
    <>
      <span className="lm-staff-label">Oggi</span>
      <h1 className="lm-staff-h1" style={{ marginTop: '1.1rem' }}>
        Ciao, {me.nome.split(' ')[0]}.
      </h1>
      <p className="lm-staff-sub">
        {new Intl.DateTimeFormat('it-IT', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        }).format(oggi)}
        {me.obiettivo_mensile ? ` · obiettivo del mese ${euro(me.obiettivo_mensile)}` : ''}
      </p>

      {mancaSchema && (
        <p className="lm-staff-warn">
          Le tabelle dell&apos;area staff non esistono ancora su questo database. Esegui{' '}
          <code>supabase/migrations/0030_staff_dashboard.sql</code> nell&apos;SQL editor di Supabase:
          fino a quel momento i numeri qui sotto restano a zero.
        </p>
      )}

      <div className="lm-staff-kpi-lead">
        <div>
          <KpiNumber value={chiusiDelMese.length} size="xl" />
          <p className="lm-staff-kpi-name">Chiusi questo mese</p>
        </div>

        <dl className="lm-staff-rows">
          <div className="lm-staff-row">
            <dt>Incassato</dt>
            <dd>
              <KpiNumber value={incassato} format="euro" />
            </dd>
          </div>
          <div className="lm-staff-row">
            <dt>Da incassare</dt>
            <dd>
              <KpiNumber value={daIncassare} format="euro" />
            </dd>
          </div>
          <div className="lm-staff-row">
            <dt>Ricorrenti al mese</dt>
            <dd>
              <KpiNumber value={ricorrenti} format="euro" />
            </dd>
          </div>
          <div className="lm-staff-row">
            <dt>Clienti in pipeline</dt>
            <dd>
              <KpiNumber value={totaleClienti} />
            </dd>
          </div>
        </dl>
      </div>

      <section className="lm-staff-section">
        <span className="lm-staff-label">Pipeline</span>
        <div className="lm-staff-states">
          {STATI.map((stato) => {
            const n = perStato.get(stato) ?? 0
            return (
              <Link key={stato} href="/staff/pipeline" className="lm-staff-state" data-cursor="grow">
                <span className="lm-staff-state-name">{STATO_LABEL[stato]}</span>
                <span className="lm-staff-state-n">{n}</span>
                <span
                  className="lm-staff-bar"
                  style={{ transform: `scaleX(${n / massimoStato})`, opacity: n ? 1 : 0.18 }}
                  aria-hidden="true"
                />
              </Link>
            )
          })}
        </div>
      </section>

      <section className="lm-staff-section">
        <span className="lm-staff-label">Da richiamare</span>
        {followup.data?.length ? (
          <div className="lm-staff-list">
            {(followup.data as FollowupRiga[]).map((f) => (
              <div key={f.id} className="lm-staff-item">
                <span>
                  {nomeCliente(f.staff_clients)}
                  {f.nota && <span className="lm-staff-item-note">{f.nota}</span>}
                </span>
                <span className="lm-staff-when" data-late={f.data < iso(oggi)}>
                  {f.data < iso(oggi) ? 'in ritardo' : 'oggi'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="lm-staff-empty">Nessun follow-up in scadenza. Buon segno.</p>
        )}
      </section>

      <section className="lm-staff-section">
        <span className="lm-staff-label">Rinnovi entro 30 giorni</span>
        {rinnovi.data?.length ? (
          <div className="lm-staff-list">
            {(rinnovi.data as RinnovoRiga[]).map((r) => (
              <div key={r.id} className="lm-staff-item">
                <span>
                  {nomeCliente(r.staff_clients)}
                  <span className="lm-staff-item-note">
                    {r.tipo} · {euro(r.importo_mensile)} al mese
                  </span>
                </span>
                <span className="lm-staff-when" data-late={r.data_rinnovo < iso(oggi)}>
                  {new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short' }).format(
                    new Date(r.data_rinnovo),
                  )}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="lm-staff-empty">Nessun rinnovo nei prossimi 30 giorni.</p>
        )}
      </section>
    </>
  )
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
