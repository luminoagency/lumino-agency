'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { Check, FileUp, Upload } from 'lucide-react'
import { importaClienti, type NuovoCliente } from '@/lib/staff/actions'
import { CAMPI_IMPORT, indovinaMappa, leggiCsv, type CampoImport } from '@/lib/staff/csv'

const ANTEPRIMA = 8

/**
 * Import CSV: file, mappatura delle colonne, anteprima, invio.
 *
 * Tre passi e non uno, perché il passo che manca sempre è il secondo: un
 * import che indovina le colonne e basta va bene finché non arriva l'export di
 * un gestionale con "Ragione sociale" e "Recapito", e allora finiscono nomi
 * nel telefono senza che nessuno se ne accorga fino al primo richiamo.
 *
 * La mappa di partenza è indovinata dalle intestazioni ed è tutta
 * modificabile; l'anteprima mostra le prime otto righe *già mappate*, cioè
 * quello che entrerà davvero, non il file.
 */
export default function ImportCsv() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [nomeFile, setNomeFile] = useState<string | null>(null)
  const [intestazioni, setIntestazioni] = useState<string[]>([])
  const [righe, setRighe] = useState<string[][]>([])
  const [mappa, setMappa] = useState<Record<CampoImport, number> | null>(null)
  const [primaRigaDati, setPrimaRigaDati] = useState(true)
  const [sopra, setSopra] = useState(false)
  const [errore, setErrore] = useState<string | null>(null)
  const [fatto, setFatto] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)

  async function carica(file: File | null | undefined) {
    if (!file) return
    setErrore(null)
    setFatto(null)

    const testo = await file.text()
    const tutte = leggiCsv(testo)

    if (tutte.length < 2) {
      setErrore('Il file sembra vuoto, o ha solo l’intestazione.')
      return
    }

    setNomeFile(file.name)
    setIntestazioni(tutte[0])
    setRighe(tutte.slice(1))
    setMappa(indovinaMappa(tutte[0]))
    setPrimaRigaDati(true)
  }

  /** Le righe pronte per il database, mappa applicata. */
  function costruisci(): NuovoCliente[] {
    if (!mappa) return []
    const dati = primaRigaDati ? righe : righe.slice(1)
    return dati
      .map((riga) => {
        const out: Record<string, string> = {}
        for (const campo of CAMPI_IMPORT) {
          const indice = mappa[campo.key]
          if (indice >= 0) out[campo.key] = riga[indice] ?? ''
        }
        return out as unknown as NuovoCliente
      })
      .filter((r) => (r.nome ?? '').trim() !== '')
  }

  const pronte = mappa ? costruisci() : []

  async function importa() {
    setBusy(true)
    setErrore(null)

    const esito = await importaClienti(pronte)
    setBusy(false)

    if (!esito.ok) {
      setErrore(esito.error ?? 'Import non riuscito.')
      return
    }

    setFatto(esito.n ?? pronte.length)
    router.refresh()
  }

  return (
    <>
      {/* ── 1. Il file ───────────────────────────────────────────────────── */}
      <div
        className="lm-drop"
        data-over={sopra}
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click()
        }}
        onDragOver={(event) => {
          event.preventDefault()
          setSopra(true)
        }}
        onDragLeave={() => setSopra(false)}
        onDrop={(event) => {
          event.preventDefault()
          setSopra(false)
          void carica(event.dataTransfer.files?.[0])
        }}
      >
        <FileUp aria-hidden="true" />
        <span style={{ fontWeight: 600 }}>
          {nomeFile ?? 'Trascina qui il CSV, o clicca per sceglierlo'}
        </span>
        <span className="lm-field-hint">
          {nomeFile
            ? `${righe.length} righe lette · ${intestazioni.length} colonne`
            : 'Separatore virgola, punto e virgola o tabulazione. Massimo 500 righe.'}
        </span>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv,text/plain"
          className="lm-sr"
          onChange={(event) => void carica(event.target.files?.[0])}
        />
      </div>

      {errore && (
        <p className="lm-warn" role="alert">
          {errore}
        </p>
      )}

      {fatto !== null && (
        <p className="lm-warn" style={{ borderColor: 'rgba(110,231,168,0.45)', background: 'rgba(110,231,168,0.08)' }}>
          <Check aria-hidden="true" style={{ width: 16, height: 16, verticalAlign: '-2px' }} />{' '}
          Importati {fatto} clienti. Li trovi in pipeline, nella colonna del loro stato.
        </p>
      )}

      {/* ── 2. La mappatura ──────────────────────────────────────────────── */}
      {mappa && (
        <>
          <section className="lm-section">
            <span className="lm-label">Mappatura delle colonne</span>
            <article className="lm-card">
              <div className="lm-form" data-cols="2">
                {CAMPI_IMPORT.map((campo) => (
                  <div key={campo.key} className="lm-field">
                    <label htmlFor={`map-${campo.key}`}>
                      {campo.label}
                      {campo.key === 'nome' ? ' · obbligatorio' : ''}
                    </label>
                    <select
                      id={`map-${campo.key}`}
                      value={mappa[campo.key]}
                      onChange={(event) =>
                        setMappa((m) => (m ? { ...m, [campo.key]: Number(event.target.value) } : m))
                      }
                    >
                      <option value={-1}>— non importare —</option>
                      {intestazioni.map((testa, indice) => (
                        <option key={`${testa}-${indice}`} value={indice}>
                          {testa || `Colonna ${indice + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <label
                className="lm-field-hint"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}
              >
                <input
                  type="checkbox"
                  checked={!primaRigaDati}
                  onChange={(event) => setPrimaRigaDati(!event.target.checked)}
                  style={{ width: 'auto' }}
                />
                La prima riga dopo l’intestazione è a sua volta un’intestazione, saltala
              </label>
            </article>
          </section>

          {/* ── 3. L'anteprima ─────────────────────────────────────────────── */}
          <section className="lm-section">
            <div className="lm-card-top">
              <span className="lm-label">Anteprima</span>
              <span className="lm-pill" data-size="sm">
                {pronte.length} client{pronte.length === 1 ? 'e' : 'i'} da importare
              </span>
            </div>

            <div className="lm-table-wrap">
              <table className="lm-table">
                <thead>
                  <tr>
                    {CAMPI_IMPORT.filter((c) => mappa[c.key] >= 0).map((c) => (
                      <th key={c.key}>{c.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pronte.slice(0, ANTEPRIMA).map((riga, i) => (
                    <tr key={i}>
                      {CAMPI_IMPORT.filter((c) => mappa[c.key] >= 0).map((c) => {
                        const valore = (riga as unknown as Record<string, string>)[c.key]
                        return (
                          <td key={c.key} data-skip={!valore}>
                            {valore || '—'}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pronte.length > ANTEPRIMA && (
              <p className="lm-field-hint">
                …e altre {pronte.length - ANTEPRIMA} righe con la stessa mappatura.
              </p>
            )}

            <div className="lm-modal-actions">
              <button type="button" className="lm-btn" disabled={busy || !pronte.length} onClick={importa}>
                <Upload aria-hidden="true" />
                {busy ? 'Importo…' : `Importa ${pronte.length} clienti`}
              </button>
            </div>
          </section>
        </>
      )}
    </>
  )
}
