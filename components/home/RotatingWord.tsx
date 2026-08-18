'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Chars } from './splitText'
import { prefersReducedMotion } from './useMotion'

/**
 * Il gruppo che ruota dentro il titolo: "il tuo brand" → "il tuo ristorante" →
 * "la tua azienda" → …
 *
 * Ruota l'INTERO gruppo articolo + nome, non il solo nome: "azienda" è
 * femminile e con l'articolo fisso la riga leggeva "il tuo azienda".
 *
 * La larghezza è misurata e animata, altrimenti il resto della riga salterebbe
 * a ogni cambio. La misura arriva da un ResizeObserver sul fantasma in flusso,
 * non da una lettura una tantum: così resta giusta anche quando i font
 * finiscono di caricare o la finestra cambia dimensione, senza dover indovinare
 * il momento buono per rimisurare.
 *
 * In pagina stanno solo il gruppo corrente e quello che sta uscendo: le lettere
 * vengono misurate a ogni frame dal driver del titolo, e tenerne sei significa
 * pagare sei volte per cinque gruppi invisibili.
 */

const GROUPS = [
  'il tuo brand',
  'il tuo ristorante',
  'il tuo hotel',
  'la tua azienda',
  'il tuo negozio',
  'il tuo studio',
]

const INTERVAL_MS = 2600
/** Durata dello scambio: oltre, la maschera va tolta. */
const ROLL_MS = 700

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
        return (i + 1) % GROUPS.length
      })
    }, INTERVAL_MS)

    return () => window.clearInterval(id)
  }, [active])

  // La larghezza segue il fantasma, qualunque cosa la faccia cambiare.
  useLayoutEffect(() => {
    const el = measureRef.current
    if (!el) return

    const read = () => setWidth(el.getBoundingClientRect().width)
    read()

    const observer = new ResizeObserver(read)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Finito lo scambio: via la maschera (altrimenti taglierebbe le lettere che
  // si sollevano o vengono trascinate) e via il gruppo uscito, che resterebbe
  // in pagina a farsi misurare a ogni frame pur essendo invisibile.
  useEffect(() => {
    if (!rolling) return
    const id = window.setTimeout(() => {
      setRolling(false)
      setPrevious(null)
    }, ROLL_MS)
    return () => window.clearTimeout(id)
  }, [rolling, index])

  useEffect(() => {
    onChange?.()
  }, [index, previous, onChange])

  return (
    <span
      className={`lm-rot${rolling ? ' is-rolling' : ''}`}
      style={width ? { width: `${width}px` } : undefined}
    >
      {/* Fantasma in flusso: dà l'altezza alla riga e la larghezza da animare. */}
      <span className="lm-rot-measure" ref={measureRef} aria-hidden="true">
        {GROUPS[index]}
      </span>

      {previous !== null && previous !== index ? (
        <span className="lm-rot-word is-out" key={`out-${previous}`}>
          <Chars text={GROUPS[previous]} />
        </span>
      ) : null}

      <span className="lm-rot-word is-in" key={`in-${index}`}>
        <Chars text={GROUPS[index]} />
      </span>
    </span>
  )
}
