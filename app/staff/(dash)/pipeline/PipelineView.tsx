'use client'

import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
import { Search } from 'lucide-react'
import Cascade from '@/components/staff/Cascade'
import ClienteCardBody from '@/components/staff/ClienteCardBody'
import Counter from '@/components/staff/Counter'
import FilterBar, { type Filtro } from '@/components/staff/Filters'
import MotivoRifiuto from '@/components/staff/MotivoRifiuto'
import { cambiaStato } from '@/lib/staff/actions'
import {
  SETTORE_LABEL,
  SETTORI,
  STATI,
  STATO_LABEL,
  type ClienteRiga,
  type Stato,
} from '@/lib/staff/types'

/**
 * La pipeline.
 *
 * Due viste sullo stesso elenco: kanban trascinabile da 960px in su, tab a
 * pill più lista sotto. Non è una scelta estetica — su un telefono trascinare
 * una card fra colonne che non stanno nello schermo è un gesto che non
 * funziona, e i venditori la pipeline la spostano in piedi davanti a un bar.
 *
 * Lo spostamento è ottimista: la card si muove subito e torna indietro se il
 * database rifiuta. Con una RLS di mezzo un rifiuto è possibile (un venditore
 * che tocca il cliente di un collega), quindi il rollback non è teoria.
 *
 * Il drag & drop è l'HTML5 nativo, senza librerie: una dipendenza in più per
 * un gesto che il browser conosce già sarebbe peso a carico di chi lavora in
 * 4G.
 */
export default function PipelineView({
  clienti: iniziali,
  prezzi,
  venditori,
  zone,
}: {
  clienti: ClienteRiga[]
  prezzi: Record<string, number | null>
  venditori: { id: string; nome: string }[]
  zone: string[]
}) {
  const [clienti, setClienti] = useState(iniziali)
  const [filtri, setFiltri] = useState({ settore: '', zona: '', assegnato: '', stato: '' })
  const [cerca, setCerca] = useState('')
  const [trascinato, setTrascinato] = useState<string | null>(null)
  const [sopra, setSopra] = useState<Stato | null>(null)
  const [rifiuto, setRifiuto] = useState<{ id: string; nome: string; da: Stato } | null>(null)
  const [errore, setErrore] = useState<string | null>(null)
  const [inCorso, startTransition] = useTransition()

  const visibili = useMemo(() => {
    const q = cerca.trim().toLowerCase()
    return clienti.filter((c) => {
      if (filtri.settore && c.settore !== filtri.settore) return false
      if (filtri.zona && (c.zona ?? c.citta) !== filtri.zona) return false
      if (filtri.assegnato && c.assegnato_a !== filtri.assegnato) return false
      if (filtri.stato && c.stato !== filtri.stato) return false
      if (q && !`${c.nome} ${c.citta ?? ''} ${c.referente ?? ''}`.toLowerCase().includes(q)) {
        return false
      }
      return true
    })
  }, [clienti, filtri, cerca])

  const perStato = (stato: Stato) => visibili.filter((c) => c.stato === stato)

  /* Sul telefono le tab *sono* il filtro di stato, non un secondo comando che
     gli somiglia: con due stati separati bastava toccare una tab e poi una
     casella KPI per ritrovarsi una lista vuota senza capire perché. Con
     nessun filtro attivo si parte dall'inizio del funnel. */
  const statoLista: Stato = (filtri.stato as Stato) || 'da_contattare'

  /* Il conteggio dei KPI ignora il filtro di stato ma rispetta gli altri:
     cliccando "Accettato" la riga deve restare leggibile, altrimenti tutte le
     altre caselle andrebbero a zero e non si tornerebbe più indietro. */
  const conteggi = useMemo(() => {
    const base = clienti.filter((c) => {
      if (filtri.settore && c.settore !== filtri.settore) return false
      if (filtri.zona && (c.zona ?? c.citta) !== filtri.zona) return false
      if (filtri.assegnato && c.assegnato_a !== filtri.assegnato) return false
      return true
    })
    const mappa = new Map<Stato, number>()
    for (const c of base) mappa.set(c.stato, (mappa.get(c.stato) ?? 0) + 1)
    return mappa
  }, [clienti, filtri.settore, filtri.zona, filtri.assegnato])

  const elencoFiltri: Filtro[] = [
    {
      key: 'settore',
      label: 'Settore',
      value: filtri.settore,
      options: SETTORI.map((s) => ({ value: s, label: SETTORE_LABEL[s] })),
    },
    {
      key: 'zona',
      label: 'Zona',
      value: filtri.zona,
      options: zone.map((z) => ({ value: z, label: z })),
    },
    {
      key: 'assegnato',
      label: 'Assegnato a',
      value: filtri.assegnato,
      options: venditori.map((v) => ({ value: v.id, label: v.nome })),
    },
    {
      key: 'stato',
      label: 'Stato',
      value: filtri.stato,
      options: STATI.map((s) => ({ value: s, label: STATO_LABEL[s] })),
    },
  ]

  /** Sposta, e se il database dice di no rimetti la card dov'era. */
  function sposta(id: string, stato: Stato, testoMotivo?: string) {
    const prima = clienti
    setErrore(null)
    setClienti((righe) =>
      righe.map((c) =>
        c.id === id
          ? { ...c, stato, motivo_rifiuto: stato === 'rifiutato' ? (testoMotivo ?? null) : null }
          : c,
      ),
    )

    startTransition(async () => {
      const esito = await cambiaStato(id, stato, testoMotivo)
      if (!esito.ok) {
        setClienti(prima)
        setErrore(esito.error ?? 'Non è stato possibile spostare il cliente.')
      }
    })
  }

  /** Il passaggio a "rifiutato" non si fa mai in silenzio: serve il motivo. */
  function chiedi(id: string, stato: Stato) {
    const cliente = clienti.find((c) => c.id === id)
    if (!cliente || cliente.stato === stato) return
    if (stato === 'rifiutato') {
      setRifiuto({ id, nome: cliente.nome, da: cliente.stato })
      return
    }
    sposta(id, stato)
  }

  return (
    <>
      <Cascade className="lm-kpis">
        {STATI.map((stato) => (
          <button
            key={stato}
            type="button"
            className="lm-kpi lm-in"
            data-reveal
            data-on={filtri.stato === stato}
            aria-pressed={filtri.stato === stato}
            onClick={() =>
              setFiltri((f) => ({ ...f, stato: f.stato === stato ? '' : stato }))
            }
          >
            <Counter value={conteggi.get(stato) ?? 0} />
            <span className="lm-kpi-name">{STATO_LABEL[stato]}</span>
          </button>
        ))}
      </Cascade>

      <FilterBar
        filtri={elencoFiltri}
        onChange={(key, value) => setFiltri((f) => ({ ...f, [key]: value }))}
        onReset={() => setFiltri({ settore: '', zona: '', assegnato: '', stato: '' })}
      >
        <span className="lm-search">
          <Search aria-hidden="true" />
          <input
            type="search"
            value={cerca}
            onChange={(event) => setCerca(event.target.value)}
            placeholder="Cerca un cliente…"
            aria-label="Cerca un cliente"
          />
        </span>
      </FilterBar>

      {errore && (
        <p className="lm-warn" role="alert">
          {errore}
        </p>
      )}

      {/* ── Kanban (desktop) ─────────────────────────────────────────────── */}
      <div className="lm-desk">
        <div className="lm-kanban">
          {STATI.map((stato) => {
            const righe = perStato(stato)
            return (
              <section
                key={stato}
                className="lm-col"
                data-over={sopra === stato}
                onDragOver={(event) => {
                  event.preventDefault()
                  setSopra(stato)
                }}
                onDragLeave={() => setSopra((s) => (s === stato ? null : s))}
                onDrop={(event) => {
                  event.preventDefault()
                  setSopra(null)
                  const id = event.dataTransfer.getData('text/plain') || trascinato
                  setTrascinato(null)
                  if (id) chiedi(id, stato)
                }}
              >
                <div className="lm-col-top">
                  <span className="lm-label">{STATO_LABEL[stato]}</span>
                  <span className="lm-col-n">{righe.length}</span>
                </div>
                <div className="lm-col-body">
                  {righe.map((cliente) => (
                    <Link
                      key={cliente.id}
                      href={`/staff/clienti/${cliente.id}`}
                      className="lm-ccard"
                      draggable
                      data-dragging={trascinato === cliente.id}
                      onDragStart={(event) => {
                        event.dataTransfer.setData('text/plain', cliente.id)
                        event.dataTransfer.effectAllowed = 'move'
                        setTrascinato(cliente.id)
                      }}
                      onDragEnd={() => {
                        setTrascinato(null)
                        setSopra(null)
                      }}
                    >
                      <ClienteCardBody cliente={cliente} prezzo={prezzi[cliente.id]} />
                    </Link>
                  ))}
                  {!righe.length && <p className="lm-col-empty">Nessuno qui.</p>}
                </div>
              </section>
            )
          })}
        </div>
      </div>

      {/* ── Tab a pill + lista (mobile) ──────────────────────────────────── */}
      <div className="lm-mob">
        <div className="lm-filters" role="tablist" aria-label="Stato">
          {STATI.map((stato) => (
            <button
              key={stato}
              type="button"
              role="tab"
              className="lm-pill"
              data-on={statoLista === stato}
              aria-selected={statoLista === stato}
              onClick={() => setFiltri((f) => ({ ...f, stato }))}
            >
              {STATO_LABEL[stato]}
              <span className="lm-pill-n">{conteggi.get(stato) ?? 0}</span>
            </button>
          ))}
        </div>

        <div className="lm-col-body" style={{ marginTop: '0.9rem' }}>
          {perStato(statoLista).map((cliente) => (
            <Link key={cliente.id} href={`/staff/clienti/${cliente.id}`} className="lm-ccard">
              <ClienteCardBody cliente={cliente} prezzo={prezzi[cliente.id]} />
            </Link>
          ))}
          {!perStato(statoLista).length && (
            <p className="lm-col-empty">Nessun cliente in «{STATO_LABEL[statoLista]}».</p>
          )}
        </div>
      </div>

      {rifiuto && (
        <MotivoRifiuto
          nome={rifiuto.nome}
          statoAttuale={rifiuto.da}
          inCorso={inCorso}
          onAnnulla={() => setRifiuto(null)}
          onConferma={(motivo) => {
            sposta(rifiuto.id, 'rifiutato', motivo)
            setRifiuto(null)
          }}
        />
      )}
    </>
  )
}
