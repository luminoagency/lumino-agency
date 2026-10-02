'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Undo2 } from 'lucide-react'
import {
  annullaCanone,
  annullaIncasso,
  segnaCanone,
  segnaIncasso,
} from '@/lib/staff/azioni-trattativa'
import type { VocePagamento } from '@/lib/staff/pagamenti'
import Modal from './Modal'

/**
 * «È arrivato».
 *
 * Il bottone non scrive da solo: apre una finestrella con **la data**. Sembra
 * un passaggio in più e invece è il punto — un bonifico si vede il lunedì ed è
 * di venerdì, e un incasso segnato col giorno in cui qualcuno ha guardato
 * l'estratto conto finisce nel mese sbagliato del grafico. Il default è oggi,
 * che è il caso frequente, ma si cambia in due secondi.
 *
 * Annullare invece **chiede conferma e non chiede altro**: è un gesto che
 * toglie un numero dai totali di cinque pagine, e chi lo preme di solito ha
 * sbagliato bottone un attimo prima.
 */
export function BottoneIncasso({
  dealId,
  clientId,
  voce,
  compatto,
}: {
  dealId: string
  clientId: string
  voce: VocePagamento
  /** Nelle liste di Soldi c'è posto per due parole, non per quattro. */
  compatto?: boolean
}) {
  const router = useRouter()
  const [aperto, setAperto] = useState<'segna' | 'annulla' | null>(null)
  const [errore, setErrore] = useState<string | null>(null)
  const [inCorso, avvia] = useTransition()

  const etichetta =
    voce.chiave === 'unico'
      ? 'Pagamento ricevuto'
      : voce.chiave === 'acconto'
        ? 'Acconto ricevuto'
        : 'Saldo ricevuto'

  function chiudi(rinfresca: boolean) {
    setAperto(null)
    setErrore(null)
    if (rinfresca) router.refresh()
  }

  if (voce.pagato) {
    return (
      <>
        <button
          type="button"
          className="lm-btn"
          data-variant="ghost"
          data-size="sm"
          disabled={inCorso}
          onClick={() => setAperto('annulla')}
          aria-label={`Annulla ${voce.nome} di questa trattativa`}
        >
          <Undo2 aria-hidden="true" />
          {compatto ? 'Annulla' : 'Annulla l’incasso'}
        </button>
        {aperto === 'annulla' && (
          <Conferma
            titolo={`Annullare ${voce.nome}?`}
            testo={`${voce.etichetta} torna «da incassare», e l’importo esce dai totali di Soldi, della home e del Team. La data si perde.`}
            azione="Sì, annulla"
            errore={errore}
            inCorso={inCorso}
            onAnnulla={() => chiudi(false)}
            onConferma={() =>
              avvia(async () => {
                const esito = await annullaIncasso(dealId, clientId, voce.chiave)
                if (esito.ok) chiudi(true)
                else setErrore(esito.error ?? 'Non è stato annullato.')
              })
            }
          />
        )}
      </>
    )
  }

  return (
    <>
      <button
        type="button"
        className="lm-btn"
        data-variant="dark"
        data-size="sm"
        disabled={inCorso}
        onClick={() => setAperto('segna')}
      >
        <Check aria-hidden="true" />
        {compatto ? 'Ricevuto' : etichetta}
      </button>
      {aperto === 'segna' && (
        <ConData
          titolo={etichetta}
          sotto={voce.etichetta}
          errore={errore}
          inCorso={inCorso}
          onAnnulla={() => chiudi(false)}
          onConferma={(data) =>
            avvia(async () => {
              const esito = await segnaIncasso(dealId, clientId, voce.chiave, data)
              if (esito.ok) chiudi(true)
              else setErrore(esito.error ?? 'Non è stato segnato.')
            })
          }
        />
      )}
    </>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Il canone del mese.
 *
 * Non è una spunta ma **una riga per mese** (migration 0039): un abbonamento
 * si incassa dodici volte l'anno, e un booleano direbbe solo «l'ultima volta
 * sì». Qui si segna sempre il mese corrente, che è quello che si guarda
 * quando si apre Soldi.
 */
export function BottoneCanone({
  subscriptionId,
  clientId,
  importo,
  pagato,
  compatto,
}: {
  subscriptionId: string
  clientId: string
  importo: number
  pagato: boolean
  compatto?: boolean
}) {
  const router = useRouter()
  const [aperto, setAperto] = useState<'segna' | 'annulla' | null>(null)
  const [errore, setErrore] = useState<string | null>(null)
  const [inCorso, avvia] = useTransition()

  const oggi = dataOggi()
  const mese = `${oggi.slice(0, 7)}-01`
  const nomeMese = new Date(`${mese}T12:00:00`).toLocaleDateString('it-IT', {
    month: 'long',
    year: 'numeric',
  })

  function chiudi(rinfresca: boolean) {
    setAperto(null)
    setErrore(null)
    if (rinfresca) router.refresh()
  }

  return (
    <>
      <button
        type="button"
        className="lm-btn"
        data-variant={pagato ? 'ghost' : 'dark'}
        data-size="sm"
        disabled={inCorso}
        onClick={() => setAperto(pagato ? 'annulla' : 'segna')}
        aria-label={
          pagato
            ? `Annulla il canone di ${nomeMese}`
            : `Segna il canone di ${nomeMese} come incassato`
        }
      >
        {pagato ? <Undo2 aria-hidden="true" /> : <Check aria-hidden="true" />}
        {pagato
          ? compatto
            ? 'Annulla'
            : 'Annulla il mese'
          : compatto
            ? 'Mese ok'
            : 'Mese incassato'}
      </button>

      {aperto === 'segna' && (
        <ConData
          titolo={`Canone di ${nomeMese}`}
          sotto={`${importo.toLocaleString('it-IT')} € · il mese si può segnare una volta sola`}
          errore={errore}
          inCorso={inCorso}
          onAnnulla={() => chiudi(false)}
          onConferma={(data) =>
            avvia(async () => {
              const esito = await segnaCanone(subscriptionId, clientId, mese, data)
              if (esito.ok) chiudi(true)
              else setErrore(esito.error ?? 'Non è stato segnato.')
            })
          }
        />
      )}

      {aperto === 'annulla' && (
        <Conferma
          titolo={`Annullare ${nomeMese}?`}
          testo="Il canone di questo mese torna da incassare e esce dal grafico degli incassi. Gli altri mesi restano."
          azione="Sì, annulla"
          errore={errore}
          inCorso={inCorso}
          onAnnulla={() => chiudi(false)}
          onConferma={() =>
            avvia(async () => {
              const esito = await annullaCanone(subscriptionId, clientId, mese)
              if (esito.ok) chiudi(true)
              else setErrore(esito.error ?? 'Non è stato annullato.')
            })
          }
        />
      )}
    </>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */

/** Quando è arrivato: oggi, o il giorno vero del bonifico. */
function ConData({
  titolo,
  sotto,
  errore,
  inCorso,
  onAnnulla,
  onConferma,
}: {
  titolo: string
  sotto: string
  errore: string | null
  inCorso: boolean
  onAnnulla: () => void
  onConferma: (data: string) => void
}) {
  const oggi = dataOggi()
  const [data, setData] = useState(oggi)

  return (
    <Modal
      title={titolo}
      onClose={onAnnulla}
      head={
        <>
          <span className="lm-label">incasso</span>
          <h2>{titolo}</h2>
        </>
      }
    >
      <form
        className="lm-modal-form"
        onSubmit={(e) => {
          e.preventDefault()
          onConferma(data)
        }}
      >
        <div className="lm-modal-corpo">
          <p className="lm-sub">{sotto}</p>

          <div className="lm-field" style={{ marginTop: '1rem' }}>
            <label htmlFor="inc-data">Quando è arrivato</label>
            <input
              id="inc-data"
              type="date"
              value={data}
              max={oggi}
              required
              onChange={(e) => setData(e.target.value)}
            />
            <p className="lm-field-hint">
              Il giorno vero, non quello in cui te ne sei accorto: il grafico degli incassi conta
              questo.
            </p>
          </div>

          {errore && (
            <p className="lm-error" role="alert">
              {errore}
            </p>
          )}
        </div>

        <div className="lm-modal-actions">
          <button type="button" className="lm-btn" data-variant="ghost" onClick={onAnnulla}>
            Annulla
          </button>
          <button type="submit" className="lm-btn" disabled={inCorso}>
            {inCorso ? 'Segno…' : 'Segna incassato'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

/** Una domanda e due bottoni. Niente campi: annullare non ha parametri. */
function Conferma({
  titolo,
  testo,
  azione,
  errore,
  inCorso,
  onAnnulla,
  onConferma,
}: {
  titolo: string
  testo: string
  azione: string
  errore: string | null
  inCorso: boolean
  onAnnulla: () => void
  onConferma: () => void
}) {
  return (
    <Modal
      title={titolo}
      onClose={onAnnulla}
      head={
        <>
          <span className="lm-label">attenzione</span>
          <h2>{titolo}</h2>
        </>
      }
    >
      <div className="lm-modal-corpo">
        <p className="lm-sub">{testo}</p>
        {errore && (
          <p className="lm-error" role="alert">
            {errore}
          </p>
        )}
      </div>
      <div className="lm-modal-actions">
        <button type="button" className="lm-btn" data-variant="ghost" onClick={onAnnulla}>
          Lascia com’è
        </button>
        <button
          type="button"
          className="lm-btn"
          data-variant="danger"
          disabled={inCorso}
          onClick={onConferma}
        >
          {inCorso ? 'Annullo…' : azione}
        </button>
      </div>
    </Modal>
  )
}

/**
 * Oggi, nel fuso di chi guarda.
 *
 * `toISOString()` passa da UTC: alle 23 di sera in Italia darebbe domani, e
 * il campo data si aprirebbe su un giorno che il server rifiuta.
 */
function dataOggi(): string {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const g = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${g}`
}
