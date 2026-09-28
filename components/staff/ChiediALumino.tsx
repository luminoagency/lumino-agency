'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowRight, Sparkles } from 'lucide-react'

/** Dove la domanda aspetta il passaggio di pagina. Vedi il commento sotto. */
export const CHIAVE_DOMANDA = 'lm_lab_domanda'

/**
 * La riga «Chiedi a Lumino» in cima alla home.
 *
 * Era un `<input disabled>` con accanto la scritta «Fase 5»: un campo che
 * sembrava un campo e non accettava niente. Adesso che il Lab esiste, scrive
 * davvero — si batte la domanda qui e la pagina del Lab si apre già rispondendo.
 *
 * **La domanda passa da `sessionStorage`, non dall'indirizzo.** Un
 * `?q=…` sarebbe stato più corto da scrivere e avrebbe messo la domanda nella
 * barra degli indirizzi, nella cronologia e in ogni `Referer` che parte da
 * quella pagina — e le domande di questa dashboard nominano clienti veri
 * («perché Hotel Cristallo non ha ancora firmato?»). Nella memoria di sessione
 * resta nella scheda, si consuma una volta sola e non lascia traccia.
 *
 * Senza chiave il campo non finge: resta spento e lo dice. È la stessa regola
 * della pagina del Lab — un campo che accetta una domanda e poi risponde
 * «servizio non configurato» fa fare un giro per scoprire che non si poteva
 * fare.
 */
export default function ChiediALumino({ attivo }: { attivo: boolean }) {
  const router = useRouter()
  const [q, setQ] = useState('')

  function manda(e: React.FormEvent) {
    e.preventDefault()
    const t = q.trim()
    if (!t || !attivo) return
    try {
      sessionStorage.setItem(CHIAVE_DOMANDA, t)
    } catch {
      /* Finestra privata o storage negato: si apre il Lab vuoto, e la domanda si
         ribatte. Meglio che non aprire niente. */
    }
    router.push('/staff/lab-ai')
  }

  return (
    <form className="lm-ask" onSubmit={manda}>
      <span className="lm-ask-spark" aria-hidden="true">
        <Sparkles />
      </span>
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        disabled={!attivo}
        /* Corto, perché su un telefono da 390px il resto non si vede: prima il
           testo finiva tagliato a metà parola sotto la pill accanto. */
        placeholder={attivo ? 'Chiedi ai tuoi dati…' : 'Lab da attivare'}
        aria-label="Chiedi a Lumino"
      />
      {attivo ? (
        <button type="submit" className="lm-ask-vai" disabled={!q.trim()} aria-label="Chiedi">
          <ArrowRight aria-hidden="true" />
        </button>
      ) : (
        <span className="lm-ask-note">da attivare</span>
      )}
    </form>
  )
}
