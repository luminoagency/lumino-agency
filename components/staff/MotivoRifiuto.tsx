'use client'

import { useState } from 'react'
import Modal from './Modal'
import { STATO_LABEL, type Stato } from '@/lib/staff/types'

/**
 * La modale del rifiuto.
 *
 * Sta in un componente suo perché la stessa domanda arriva da due gesti
 * diversi — il trascinamento sul kanban e il cambio di stato dalla scheda — e
 * una domanda posta in due modi è una domanda che prima o poi si dimentica di
 * porre in uno dei due.
 *
 * Il motivo è obbligatorio qui e nel check constraint della tabella: una
 * regola che vive solo nell'interfaccia non è una regola.
 */
export default function MotivoRifiuto({
  nome,
  statoAttuale,
  onAnnulla,
  onConferma,
  inCorso,
}: {
  nome: string
  statoAttuale: Stato
  onAnnulla: () => void
  onConferma: (motivo: string) => void
  inCorso?: boolean
}) {
  const [motivo, setMotivo] = useState('')

  return (
    <Modal
      title="Motivo del rifiuto"
      onClose={onAnnulla}
      head={
        <>
          <span className="lm-label">{nome}</span>
          <h2>Perché non se n’è fatto niente?</h2>
        </>
      }
    >
      <form
        className="lm-modal-form"
        onSubmit={(event) => {
          event.preventDefault()
          if (motivo.trim()) onConferma(motivo.trim())
        }}
      >
        <div className="lm-modal-corpo">
          <p className="lm-sub" style={{ marginBottom: '1rem' }}>
            È l’unico dato che dice perché si perde, ed è quello che si salta sempre. Senza, il
            cliente resta in «{STATO_LABEL[statoAttuale]}».
          </p>

          <div className="lm-field">
            <label htmlFor="motivo-rifiuto">Motivo</label>
            <textarea
              id="motivo-rifiuto"
              value={motivo}
              required
              onChange={(event) => setMotivo(event.target.value)}
              placeholder="Prezzo troppo alto, ha già un cugino che glielo fa, non risponde più…"
            />
          </div>
        </div>

        <div className="lm-modal-actions">
          <button type="button" className="lm-btn" data-variant="ghost" onClick={onAnnulla}>
            Annulla
          </button>
          <button
            type="submit"
            className="lm-btn"
            data-variant="danger"
            disabled={!motivo.trim() || inCorso}
          >
            Segna come rifiutato
          </button>
        </div>
      </form>
    </Modal>
  )
}
