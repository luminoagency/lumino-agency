'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Chars } from './splitText'
import { prefersReducedMotion } from './useMotion'

/**
 * La parola che ruota dentro il titolo: brand → ristorante → hotel → azienda →
 * negozio. La vecchia esce dall'alto, la nuova entra dal basso dietro una
 * maschera verticale.
 *
 * Due dettagli che fanno la differenza:
 *
 *  · La larghezza è misurata e animata. Senza, il resto della riga salterebbe
 *    a ogni cambio, perché "hotel" e "ristorante" non sono larghe uguali.
 *  · Vengono montate solo la parola corrente e quella che sta uscendo. Le
 *    lettere sono osservate a ogni frame dal driver del titolo: tenerne in
 *    pagina cinque parole significherebbe cinquanta misurazioni per frame
 *    invece di venti, per quattro parole invisibili.
 *
 * Con prefers-reduced-motion resta ferma su "brand" e non parte nessun timer.
 */

const WORDS = ['brand', 'ristorante', 'hotel', 'azienda', 'negozio']
const INTERVAL_MS = 2200
/** Durata dello scambio: oltre, la maschera va tolta. */
const ROLL_MS = 680

export default function RotatingWord({
  active = true,
  onChange,
}: {
  /** L'hero è in viewport? Fuori, il ciclo si ferma. */
  active?: boolean
  /** Chiamata dopo ogni cambio: il titolo deve riprendere le nuove lettere. */
  onChange?: () => void
}) {
  const [index, setIndex] = useState(0)
  const [previous, setPrevious] = useState<number | null>(null)
  const [rolling, setRolling] = useState(false)
  const [width, setWidth] = useState<number | null>(null)
  const measureRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!active || prefersReducedMotion()) return

    const id = window.setInterval(() => {
      setIndex((i) => {
        setPrevious(i)
        setRolling(true)
        return (i + 1) % WORDS.length
      })
    }, INTERVAL_MS)

    return () => window.clearInterval(id)
  }, [active])

  // Finito lo scambio: via la maschera (altrimenti taglierebbe le lettere che
  // si sollevano verso il cursore) e via la parola uscita, che altrimenti
  // resterebbe in pagina a farsi misurare a ogni frame pur essendo invisibile.
  useEffect(() => {
    if (!rolling) return
    const id = window.setTimeout(() => {
      setRolling(false)
      setPrevious(null)
    }, ROLL_MS)
    return () => window.clearTimeout(id)
  }, [rolling, index])

  // Misura prima del paint: la larghezza non deve mai essere vista sbagliata.
  useLayoutEffect(() => {
    const el = measureRef.current
    if (el) setWidth(el.offsetWidth)
  }, [index])

  // Rimisura quando i font sono pronti e a ogni resize: la scala del titolo
  // è fluida, quindi la larghezza giusta cambia con la finestra.
  useEffect(() => {
    const remeasure = () => {
      const el = measureRef.current
      if (el) setWidth(el.offsetWidth)
    }
    window.addEventListener('resize', remeasure)
    document.fonts?.ready.then(remeasure).catch(() => {})
    return () => window.removeEventListener('resize', remeasure)
  }, [])

  useEffect(() => {
    onChange?.()
  }, [index, previous, onChange])

  return (
    <span className={`lm-rot${rolling ? ' is-rolling' : ''}`} style={width ? { width } : undefined}>
      {/* Fantasma che dà l'altezza alla riga e la larghezza da animare. */}
      <span className="lm-rot-measure" ref={measureRef} aria-hidden="true">
        {WORDS[index]}
      </span>

      {previous !== null && previous !== index ? (
        <span className="lm-rot-word is-out" key={`out-${previous}`}>
          <Chars text={WORDS[previous]} />
        </span>
      ) : null}

      <span className="lm-rot-word is-in" key={`in-${index}`}>
        <Chars text={WORDS[index]} />
      </span>
    </span>
  )
}
