'use client'

import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
import { ArrowUpRight, ChevronDown, Search } from 'lucide-react'
import ClienteCardBody from '@/components/staff/ClienteCardBody'
import FilterBar, { type Filtro } from '@/components/staff/Filters'
import MotivoRifiuto from '@/components/staff/MotivoRifiuto'
import { cambiaStato } from '@/lib/staff/actions'
import {
  SETTORE_LABEL,
  SETTORI,
  SITO_LABEL,
  STATI,
  STATO_LABEL,
  euro,
  type ClienteRiga,
  type Stato,
} from '@/lib/staff/types'

/**
 * La vista a lista: elenco a sinistra, dettaglio a destra (ref3).
 *
 * È l'alternativa al kanban per chi cerca *un* cliente invece di guardare
 * l'insieme. La selezione vive qui e non nell'URL: aprire un cliente in questa
 * vista non è una navigazione, è un'occhiata — la navigazione vera è il
 * pulsante "Apri scheda", che porta alla pagina del cliente.
 *
 * Su schermi stretti la colonna del dettaglio scende sotto la lista: il
 * pannello resta, ma smette di essere affiancato.
 */
export default function ClientiView({
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
  const [sceltoId, setSceltoId] = useState<string | null>(iniziali[0]?.id ?? null)
  const [rifiuto, setRifiuto] = useState<ClienteRiga | null>(null)
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

  /* Il selezionato deve restare dentro l'elenco filtrato: altrimenti si
     leggerebbe il dettaglio di un cliente che la lista accanto non mostra. */
  const scelto = visibili.find((c) => c.id === sceltoId) ?? visibili[0] ?? null

  const elencoFiltri: Filtro[] = [
    {
      key: 'settore',
      label: 'Settore',
      value: filtri.settore,
      options: SETTORI.map((s) => ({ value: s, label: SETTORE_LABEL[s] })),
    },
    { key: 'zona', label: 'Zona', value: filtri.zona, options: zone.map((z) => ({ value: z, label: z })) },
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

  function sposta(id: string, stato: Stato, motivo?: string) {
    const prima = clienti
    setErrore(null)
    setClienti((righe) =>
      righe.map((c) =>
        c.id === id
          ? { ...c, stato, motivo_rifiuto: stato === 'rifiutato' ? (motivo ?? null) : null }
          : c,
      ),
    )
    startTransition(async () => {
      const esito = await cambiaStato(id, stato, motivo)
      if (!esito.ok) {
        setClienti(prima)
        setErrore(esito.error ?? 'Non è stato possibile cambiare stato.')
      }
    })
  }

  return (
    <>
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

      <div className="lm-split">
        <div className="lm-listbox">
          {visibili.map((cliente) => (
            <button
              key={cliente.id}
              type="button"
              className="lm-ccard"
              style={{ textAlign: 'left', cursor: 'pointer' }}
              data-selected={scelto?.id === cliente.id}
              aria-pressed={scelto?.id === cliente.id}
              onClick={() => setSceltoId(cliente.id)}
            >
              <ClienteCardBody cliente={cliente} prezzo={prezzi[cliente.id]} />
            </button>
          ))}
          {!visibili.length && (
            <p className="lm-col-empty">Nessun cliente con questi filtri.</p>
          )}
        </div>

        {scelto ? (
          <div className="lm-detail">
            <article className="lm-card" data-tone="violet">
              <div className="lm-card-top">
                <span className="lm-label">Dettaglio cliente</span>
                <span className="lm-state" data-stato={scelto.stato}>
                  {STATO_LABEL[scelto.stato]}
                </span>
              </div>

              <h2 className="lm-num lm-num-md" style={{ letterSpacing: '-0.03em' }}>
                {scelto.nome}
              </h2>
              <p className="lm-kpi-name" style={{ marginBottom: '1.1rem' }}>
                {SETTORE_LABEL[scelto.settore]}
                {scelto.citta ? ` · ${scelto.citta}` : ''}
                {scelto.zona ? ` · ${scelto.zona}` : ''}
              </p>

              <div className="lm-detail-grid">
                <Voce titolo="Referente" valore={scelto.referente} />
                <Voce titolo="Telefono" valore={scelto.telefono} href={tel(scelto.telefono)} />
                <Voce titolo="Email" valore={scelto.email} href={mail(scelto.email)} />
                <Voce
                  titolo="Sito attuale"
                  valore={scelto.sito_attuale ? SITO_LABEL[scelto.sito_attuale] : null}
                />
                <Voce
                  titolo="Valore"
                  valore={prezzi[scelto.id] ? euro(prezzi[scelto.id]) : null}
                />
                <Voce
                  titolo="Assegnato a"
                  valore={venditori.find((v) => v.id === scelto.assegnato_a)?.nome ?? null}
                />
              </div>

              {scelto.stato === 'rifiutato' && scelto.motivo_rifiuto && (
                <p className="lm-sub" style={{ color: 'rgba(255,255,255,0.8)', marginTop: '0.9rem' }}>
                  Motivo del rifiuto: {scelto.motivo_rifiuto}
                </p>
              )}

              <div className="lm-detail-foot">
                <label className="lm-select" data-on="true">
                  <span className="lm-sr">Stato di {scelto.nome}</span>
                  <select
                    value={scelto.stato}
                    disabled={inCorso}
                    onChange={(event) => {
                      const stato = event.target.value as Stato
                      if (stato === scelto.stato) return
                      if (stato === 'rifiutato') setRifiuto(scelto)
                      else sposta(scelto.id, stato)
                    }}
                  >
                    {STATI.map((stato) => (
                      <option key={stato} value={stato}>
                        {STATO_LABEL[stato]}
                      </option>
                    ))}
                  </select>
                  <ChevronDown aria-hidden="true" />
                </label>

                <Link href={`/staff/clienti/${scelto.id}`} className="lm-btn" data-variant="light">
                  Apri scheda
                  <ArrowUpRight aria-hidden="true" />
                </Link>
              </div>
            </article>
          </div>
        ) : (
          <div className="lm-card">
            <p className="lm-empty">Seleziona un cliente per vederne il dettaglio.</p>
          </div>
        )}
      </div>

      {rifiuto && (
        <MotivoRifiuto
          nome={rifiuto.nome}
          statoAttuale={rifiuto.stato}
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

/** Una sotto-card traslucida del pannello: etichetta piccola, valore sotto. */
function Voce({
  titolo,
  valore,
  href,
}: {
  titolo: string
  valore: string | null
  href?: string
}) {
  return (
    <div className="lm-sub-card">
      <span className="lm-label">{titolo}</span>
      <p style={{ marginTop: '0.25rem', fontSize: '0.86rem', fontWeight: 600 }}>
        {valore ? (
          href ? (
            <a href={href} style={{ color: 'inherit' }}>
              {valore}
            </a>
          ) : (
            valore
          )
        ) : (
          '—'
        )}
      </p>
    </div>
  )
}

const tel = (value: string | null) => (value ? `tel:${value.replace(/\s/g, '')}` : undefined)
const mail = (value: string | null) => (value ? `mailto:${value}` : undefined)
