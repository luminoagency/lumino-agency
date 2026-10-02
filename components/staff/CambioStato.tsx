'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cambiaStato } from '@/lib/staff/actions'
import { STATI, STATO_LABEL, type Stato } from '@/lib/staff/types'
import Modal from './Modal'
import MotivoRifiuto from './MotivoRifiuto'

/**
 * Uscire da «Accettato» non è come cambiare stato.
 *
 * Dalla 0038 l'accettazione **crea roba**: una trattativa chiusa, un progetto
 * in brief, forse un abbonamento. Tornare indietro non le cancella — e non
 * deve: un cliente messo su «Accettato» per sbaglio e corretto dopo due
 * minuti è un caso raro, mentre un progetto cancellato perché qualcuno ha
 * trascinato la card sbagliata nel kanban è un disastro silenzioso. Quello che
 * serve è che chi lo fa **sappia** cosa resta in giro, e questa è la finestra
 * che glielo dice.
 *
 * Sta in un componente suo perché la stessa domanda va fatta da due posti — la
 * scheda del cliente e l'elenco — e una domanda posta in uno dei due è una
 * domanda che si dimentica nell'altro. È la stessa ragione di `MotivoRifiuto`.
 */
export function ConfermaUscitaAccettato({
  nome,
  verso,
  inCorso,
  onAnnulla,
  onConferma,
}: {
  nome: string
  verso: Stato
  inCorso?: boolean
  onAnnulla: () => void
  onConferma: () => void
}) {
  return (
    <Modal
      title={`Togliere ${nome} da Accettato`}
      onClose={onAnnulla}
      head={
        <>
          <span className="lm-label">{nome}</span>
          <h2>Non era accettato?</h2>
        </>
      }
    >
      <div className="lm-modal-corpo">
        <p className="lm-sub">
          Passa a «{STATO_LABEL[verso]}». La trattativa chiusa, il progetto e l’eventuale
          abbonamento <b>restano dove sono</b>: non si cancellano da qui, perché un progetto sparito
          per un trascinamento sbagliato non si recupera.
        </p>
        <p className="lm-field-hint" style={{ marginTop: '0.7rem' }}>
          Se il cliente ha davvero fatto marcia indietro, il progetto va chiuso a mano e la
          trattativa corretta dalla sua scheda.
        </p>
      </div>
      <div className="lm-modal-actions">
        <button type="button" className="lm-btn" data-variant="ghost" onClick={onAnnulla}>
          Lascia accettato
        </button>
        <button
          type="button"
          className="lm-btn"
          data-variant="danger"
          disabled={inCorso}
          onClick={onConferma}
        >
          {inCorso ? 'Sposto…' : `Sposta in ${STATO_LABEL[verso]}`}
        </button>
      </div>
    </Modal>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * La tendina di stato della scheda cliente.
 *
 * Fino a oggi lo stato si cambiava dall'elenco e dal kanban, e **non dalla
 * pagina del cliente** — cioè proprio dalla schermata che si apre per decidere
 * se lo si è chiuso o no. Qui c'è la stessa tendina dell'elenco, con le stesse
 * due domande: il motivo quando si rifiuta, l'avviso quando si esce da
 * «Accettato».
 *
 * Non tiene uno stato ottimistico come fa l'elenco: lì la riga è una di venti
 * in una lista che si riordina, qui è l'unica cosa in pagina e un
 * `router.refresh()` rifà anche la card della trattativa e quella del
 * progetto, che dopo un'accettazione sono appena nate.
 */
export default function CambioStato({
  clientId,
  nome,
  stato,
}: {
  clientId: string
  nome: string
  stato: Stato
}) {
  const router = useRouter()
  const [chiede, setChiede] = useState<{ tipo: 'rifiuto' | 'uscita'; verso: Stato } | null>(null)
  const [errore, setErrore] = useState<string | null>(null)
  const [inCorso, avvia] = useTransition()

  function sposta(verso: Stato, motivo?: string) {
    setErrore(null)
    avvia(async () => {
      const esito = await cambiaStato(clientId, verso, motivo)
      if (esito.ok) {
        setChiede(null)
        router.refresh()
      } else {
        setChiede(null)
        setErrore(esito.error ?? 'Non è stato possibile cambiare stato.')
      }
    })
  }

  return (
    <>
      <label className="lm-select" data-on="true">
        <span className="lm-sr">Stato di {nome}</span>
        <select
          value={stato}
          disabled={inCorso}
          onChange={(event) => {
            const verso = event.target.value as Stato
            if (verso === stato) return
            if (verso === 'rifiutato') setChiede({ tipo: 'rifiuto', verso })
            else if (stato === 'accettato') setChiede({ tipo: 'uscita', verso })
            else sposta(verso)
          }}
        >
          {STATI.map((s) => (
            <option key={s} value={s}>
              {STATO_LABEL[s]}
            </option>
          ))}
        </select>
      </label>

      {errore && (
        <p className="lm-error" role="alert">
          {errore}
        </p>
      )}

      {chiede?.tipo === 'rifiuto' && (
        <MotivoRifiuto
          nome={nome}
          statoAttuale={stato}
          inCorso={inCorso}
          onAnnulla={() => setChiede(null)}
          onConferma={(motivo) => sposta('rifiutato', motivo)}
        />
      )}

      {chiede?.tipo === 'uscita' && (
        <ConfermaUscitaAccettato
          nome={nome}
          verso={chiede.verso}
          inCorso={inCorso}
          onAnnulla={() => setChiede(null)}
          onConferma={() => sposta(chiede.verso)}
        />
      )}
    </>
  )
}
