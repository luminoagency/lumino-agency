import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { Progress } from '@/components/staff/Bars'
import Cascade from '@/components/staff/Cascade'
import Counter from '@/components/staff/Counter'
import PageHead, { StatoPill } from '@/components/staff/PageHead'
import Ring from '@/components/staff/Ring'
import { requireStaff } from '@/lib/staff/auth'
import {
  ATTIVITA_LABEL,
  FASE_LABEL,
  FASI_PROGETTO,
  PACCHETTO_LABEL,
  SETTORE_LABEL,
  SITO_LABEL,
  dataBreve,
  dataLunga,
  euro,
  type ClienteRiga,
  type FaseProgetto,
  type Pacchetto,
  type TipoAttivita,
} from '@/lib/staff/types'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: { id: string } }) {
  const supabase = createClient()
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
  await requireStaff()
  const supabase = createClient()

  const [cliente, deals, abbonamenti, progetti, attivita] = await Promise.all([
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
  ])

  if (!cliente.data) notFound()

  const c = cliente.data as ClienteRiga & { instagram: string | null }
  const deal = (deals.data?.[0] ?? null) as Deal | null
  const abbonamento = (abbonamenti.data?.[0] ?? null) as Abbonamento | null
  const progetto = (progetti.data?.[0] ?? null) as Progetto | null
  const storico = (attivita.data ?? []) as Attivita[]

  /* 30% all'ordine, 70% alla consegna: la quota pagata si legge dalle due
     spunte, non da una percentuale tenuta in pari a mano. */
  const pagato = (deal?.acconto_30_pagato ? 30 : 0) + (deal?.saldo_70_pagato ? 70 : 0)
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
      </PageHead>

      {c.stato === 'rifiutato' && c.motivo_rifiuto && (
        <p className="lm-warn">Rifiutato: {c.motivo_rifiuto}</p>
      )}

      <Cascade className="lm-bento">
        <article className="lm-card lm-in" data-span="5" data-reveal>
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

        <article className="lm-card lm-in" data-span="4" data-glow data-reveal>
          <span className="lm-label">Trattativa</span>
          {deal ? (
            <>
              <div style={{ marginTop: '0.9rem' }}>
                <Counter value={deal.prezzo_chiuso ?? deal.prezzo_proposto ?? 0} format="euro" size="lg" />
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
                  <Riga
                    titolo="Acconto 30%"
                    valore={deal.acconto_30_pagato ? dataBreve(deal.acconto_30_data) : 'da incassare'}
                  />
                  <Riga
                    titolo="Saldo 70%"
                    valore={deal.saldo_70_pagato ? dataBreve(deal.saldo_70_data) : 'da incassare'}
                  />
                </div>
              </div>
            </>
          ) : (
            <p className="lm-empty">
              Nessuna trattativa aperta.
              {c.prezzo_consigliato ? ` Prezzo consigliato: ${euro(c.prezzo_consigliato)}.` : ''}
            </p>
          )}
        </article>

        <article className="lm-card lm-in" data-span="3" data-reveal>
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
              </div>
            </>
          ) : (
            <p className="lm-empty">Nessun abbonamento attivo.</p>
          )}
        </article>

        <article className="lm-card lm-in" data-span="5" data-reveal>
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

        <article className="lm-card lm-in" data-span="7" data-reveal>
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
              Ancora nessuna attività. Visite, chiamate e note arrivano qui dalla fase 3.
            </p>
          )}
        </article>
      </Cascade>
    </>
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
            <a href={href} style={{ color: 'inherit' }} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
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
  pacchetto: Pacchetto | null
  prezzo_proposto: number | null
  prezzo_chiuso: number | null
  acconto_30_pagato: boolean
  acconto_30_data: string | null
  saldo_70_pagato: boolean
  saldo_70_data: string | null
  data_chiusura: string | null
}

interface Abbonamento {
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
