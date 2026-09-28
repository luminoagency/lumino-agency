'use client'

import { useEffect, useRef, useState } from 'react'
import { Mic, Square } from 'lucide-react'

/**
 * La nota vocale, trascritta dal browser.
 *
 * Web Speech API: gratis, nessun servizio da pagare e nessun audio che lascia
 * il telefono — il riconoscimento su Chrome passa dai server di Google, ma
 * quello che torna qui e che finisce nel database è solo testo. Non si salva
 * nessun file audio, ed è voluto: costa Storage, e dentro c'è la voce di una
 * persona che non ha acconsentito a essere registrata.
 *
 * La trascrizione arriva **dentro un campo di testo modificabile**, non in una
 * riga da leggere. Il riconoscimento sbaglia i nomi propri e i dialetti — e i
 * titolari di locale parlano di nomi propri e in dialetto. Il dettato fa il
 * grosso, il pollice corregge.
 *
 * Il supporto non c'è ovunque (Firefox non ce l'ha): dove manca resta il campo
 * di testo e il bottone sparisce. Una funzione che non c'è non deve rompere
 * l'unica che serve davvero, cioè scrivere.
 */
export default function VoiceNote({
  value,
  onChange,
  label = 'Nota vocale',
  hint,
}: {
  value: string
  onChange: (value: string) => void
  label?: string
  hint?: string
}) {
  const [supporto, setSupporto] = useState(false)
  const [ascolto, setAscolto] = useState(false)
  const [parziale, setParziale] = useState('')
  const [errore, setErrore] = useState<string | null>(null)

  const rec = useRef<Riconoscitore | null>(null)
  /* Il valore corrente serve dentro i callback del riconoscitore, che vengono
     creati una volta sola: senza questo ref leggerebbero per sempre la prima
     versione del testo e ogni frase sovrascriverebbe la precedente. */
  const valore = useRef(value)
  const vivo = useRef(false)
  /* Anche il callback passa da un ref: il riconoscitore si costruisce una
     volta sola, e se l'effetto dipendesse da `onChange` una funzione inline
     del genitore lo ricostruirebbe a ogni render — cioè fermerebbe il dettato
     a ogni parola trascritta. */
  const cambia = useRef(onChange)

  useEffect(() => {
    valore.current = value
    cambia.current = onChange
  })

  useEffect(() => {
    const w = window as unknown as {
      SpeechRecognition?: CostruttoreRiconoscitore
      webkitSpeechRecognition?: CostruttoreRiconoscitore
    }
    const Costruttore = w.SpeechRecognition ?? w.webkitSpeechRecognition
    if (!Costruttore) return

    setSupporto(true)
    const r = new Costruttore()
    r.lang = 'it-IT'
    r.continuous = true
    r.interimResults = true

    r.onresult = (event) => {
      let definitivo = ''
      let provvisorio = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const testo = event.results[i][0]?.transcript ?? ''
        if (event.results[i].isFinal) definitivo += testo
        else provvisorio += testo
      }
      setParziale(provvisorio)
      if (definitivo.trim()) {
        const unito = `${valore.current} ${definitivo.trim()}`.trim()
        valore.current = unito
        cambia.current(unito)
      }
    }

    r.onerror = (event) => {
      /* "no-speech" scatta a ogni pausa di respiro: dirlo sarebbe rumore. */
      if (event.error === 'no-speech' || event.error === 'aborted') return
      setErrore(
        event.error === 'not-allowed'
          ? 'Il microfono è bloccato: concedilo dalle impostazioni del sito.'
          : 'Il dettato si è interrotto. Puoi scrivere a mano.',
      )
      vivo.current = false
      setAscolto(false)
    }

    /* Chrome chiude la sessione da solo dopo qualche secondo di silenzio.
       Finché il bottone è acceso si riparte: chi sta parlando con un titolare
       non può accorgersi che il dettato è morto a metà frase. */
    r.onend = () => {
      if (!vivo.current) {
        setAscolto(false)
        setParziale('')
        return
      }
      try {
        r.start()
      } catch {
        vivo.current = false
        setAscolto(false)
      }
    }

    rec.current = r

    return () => {
      vivo.current = false
      r.onend = null
      r.onresult = null
      r.onerror = null
      try {
        r.stop()
      } catch {
        /* già ferma */
      }
    }
  }, [])

  function commuta() {
    const r = rec.current
    if (!r) return

    if (ascolto) {
      vivo.current = false
      r.stop()
      setAscolto(false)
      setParziale('')
      return
    }

    setErrore(null)
    vivo.current = true
    try {
      r.start()
      setAscolto(true)
    } catch {
      vivo.current = false
      setErrore('Il dettato non è partito. Puoi scrivere a mano.')
    }
  }

  return (
    <div className="lm-field">
      <div className="lm-voice-top">
        <span className="lm-label">{label}</span>
        {supporto && (
          <button
            type="button"
            className="lm-pill"
            data-on={ascolto}
            onClick={commuta}
            aria-label={ascolto ? 'Ferma il dettato' : 'Detta la nota'}
          >
            {ascolto ? <Square aria-hidden="true" /> : <Mic aria-hidden="true" />}
            {ascolto ? 'Ferma' : 'Detta'}
            {ascolto && <span className="lm-voice-live" aria-hidden="true" />}
          </button>
        )}
      </div>

      <textarea
        value={ascolto && parziale ? `${value} ${parziale}`.trim() : value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Cosa ha detto, com'è il locale, cosa hai notato entrando…"
        rows={4}
      />

      <p className="lm-field-hint">
        {errore ??
          (ascolto
            ? 'Parla pure: la trascrizione arriva qui e si può correggere.'
            : (hint ??
              (supporto
                ? 'Il dettato è del browser: resta testo, nessun audio viene salvato.'
                : 'Questo browser non detta. Su Chrome o Safari compare il microfono.')))}
      </p>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */

/* La Web Speech API non sta in lib.dom.d.ts: il minimo indispensabile,
   dichiarato qui invece di un `any` sparso per il file. */

interface RisultatoAlternativa {
  transcript: string
}
interface Risultato {
  isFinal: boolean
  length: number
  [index: number]: RisultatoAlternativa
}
interface EventoRisultato {
  resultIndex: number
  results: { length: number; [index: number]: Risultato }
}
interface EventoErrore {
  error: string
}
interface Riconoscitore {
  lang: string
  continuous: boolean
  interimResults: boolean
  start(): void
  stop(): void
  onresult: ((event: EventoRisultato) => void) | null
  onerror: ((event: EventoErrore) => void) | null
  onend: (() => void) | null
}
interface CostruttoreRiconoscitore {
  new (): Riconoscitore
}
