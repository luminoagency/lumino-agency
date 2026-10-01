'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil } from 'lucide-react'
import { aggiornaCondizioni } from '@/lib/staff/azioni-trattativa'
import { MODALITA_LABEL, MODALITA_PAGAMENTO, type ModalitaPagamento } from '@/lib/staff/pagamenti'
import Modal from './Modal'

/**
 * Come si incassa questa trattativa, e se c'è un canone.
 *
 * Sta in una modale e non in due controlli dentro la card nera della scheda:
 * quella card è l'unica cosa nera della schermata e serve a far leggere **un
 * numero**, non a ospitare un modulo. Due campi lì dentro l'avrebbero
 * trasformata in un pannello di impostazioni.
 *
 * Il canone si concorda qui ma **non diventa un abbonamento finché il cliente
 * non accetta**: lo fa `staff_applica_accettazione()` nel database. Se il
 * cliente è già accettato la server action la richiama, così il ricorrente
 * compare subito invece di aspettare un cambio di stato che non arriverà.
 */
export default function CondizioniDeal({
  dealId,
  clientId,
  modalita,
  abbonamentoMensile,
}: {
  dealId: string
  clientId: string
  modalita: ModalitaPagamento
  abbonamentoMensile: number | null
}) {
  const [aperto, setAperto] = useState(false)

  return (
    <>
      <button
        type="button"
        className="lm-btn"
        data-variant="ghost"
        data-size="sm"
        onClick={() => setAperto(true)}
      >
        <Pencil aria-hidden="true" /> Condizioni
      </button>
      {aperto && (
        <Form
          dealId={dealId}
          clientId={clientId}
          modalita={modalita}
          abbonamentoMensile={abbonamentoMensile}
          chiudi={() => setAperto(false)}
        />
      )}
    </>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */

function Form({
  dealId,
  clientId,
  modalita,
  abbonamentoMensile,
  chiudi,
}: {
  dealId: string
  clientId: string
  modalita: ModalitaPagamento
  abbonamentoMensile: number | null
  chiudi: () => void
}) {
  const router = useRouter()
  const [scelta, setScelta] = useState<ModalitaPagamento>(modalita)
  const [canone, setCanone] = useState(abbonamentoMensile == null ? '' : String(abbonamentoMensile))
  const [errore, setErrore] = useState<string | null>(null)
  const [inCorso, avvia] = useTransition()

  return (
    <Modal
      title="Condizioni della trattativa"
      onClose={chiudi}
      head={
        <>
          <span className="lm-label">Trattativa</span>
          <h2>Come si incassa</h2>
        </>
      }
    >
      <form
        className="lm-modal-form"
        onSubmit={(e) => {
          e.preventDefault()
          avvia(async () => {
            const esito = await aggiornaCondizioni(dealId, clientId, {
              modalita: scelta,
              abbonamentoMensile: canone,
            })
            if (esito.ok) {
              chiudi()
              router.refresh()
            } else {
              setErrore(esito.error ?? 'Non è stato salvato. Riprova.')
            }
          })
        }}
      >
        <div className="lm-modal-corpo">
          <div className="lm-chips" role="group" aria-label="Modalità di pagamento">
            {MODALITA_PAGAMENTO.map((m) => (
              <button key={m} type="button" data-on={scelta === m} onClick={() => setScelta(m)}>
                {MODALITA_LABEL[m]}
              </button>
            ))}
          </div>
          <p className="lm-field-hint">
            {scelta === '30_70'
              ? 'Due voci in Soldi: il 30% alla firma e il 70% alla messa online.'
              : 'Una voce sola in Soldi, per l’intero importo. Il saldo 70% sparisce.'}
          </p>

          <div className="lm-field" style={{ marginTop: '1.1rem' }}>
            <label htmlFor="cd-canone">Canone mensile</label>
            <input
              id="cd-canone"
              inputMode="decimal"
              value={canone}
              placeholder="nessuno"
              onChange={(e) => setCanone(e.target.value)}
            />
            <p className="lm-field-hint">
              In euro, vuoto se non c’è. Diventa un abbonamento quando il cliente accetta, e non
              prima: un ricorrente che compare in Soldi prima di essere stato venduto è un numero
              falso.
            </p>
          </div>

          {errore && (
            <p className="lm-error" role="alert">
              {errore}
            </p>
          )}
        </div>

        <div className="lm-modal-actions">
          <button type="button" className="lm-btn" data-variant="ghost" onClick={chiudi}>
            Annulla
          </button>
          <button type="submit" className="lm-btn" disabled={inCorso}>
            {inCorso ? 'Salvo…' : 'Salva'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
