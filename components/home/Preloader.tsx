'use client'

import { useEffect, useRef, useState } from 'react'
import Wordmark from './Wordmark'
import { prefersReducedMotion } from './useMotion'

/**
 * Preloader: contatore 0→100, poi il pannello scorre via verso l'alto.
 *
 * Governa anche due classi sul body da cui dipende l'ingresso dell'hero:
 *   · lm-js     → il JS è vivo, si può nascondere ciò che deve entrare
 *   · lm-loaded → si entra
 *
 * L'ordine conta: senza JS nessuna delle due arriva e la pagina resta
 * interamente visibile, che è il comportamento giusto per una vetrina.
 *
 * Con prefers-reduced-motion il pannello non viene proprio montato e si va
 * dritti allo stato finale.
 */

const TICK_MS = 90

/** Oltre questo tempo il preloader se ne va comunque, qualunque cosa sia
    successo al conteggio. */
const MAX_WAIT_MS = 4000

export default function Preloader() {
  const [count, setCount] = useState(0)
  const [done, setDone] = useState(false)
  const [gone, setGone] = useState(false)
  const rafRef = useRef(0)

  useEffect(() => {
    const body = document.body

    if (prefersReducedMotion()) {
      body.classList.add('lm-js', 'lm-loaded')
      setGone(true)
      return () => body.classList.remove('lm-js', 'lm-loaded')
    }

    body.classList.add('lm-js', 'lm-lock')

    const timers: number[] = []
    let finished = false

    const finish = () => {
      if (finished) return
      finished = true
      cancelAnimationFrame(rafRef.current)
      setCount(100)
      setDone(true)
      body.classList.remove('lm-lock')
      body.classList.add('lm-loaded')
      // Rimuove il pannello dal DOM a transizione finita (1s).
      timers.push(window.setTimeout(() => setGone(true), 1100))
    }

    // Conteggio a scatti irregolari, come nel riferimento, ma su rAF:
    // un setInterval continuerebbe a contare a scheda nascosta, arrivando in
    // fondo prima ancora che qualcuno veda il preloader.
    let value = 0
    let last = performance.now()

    const step = (now: number) => {
      if (now - last >= TICK_MS) {
        last = now
        value = Math.min(100, value + Math.floor(Math.random() * 11) + 4)
        setCount(value)

        if (value >= 100) {
          timers.push(window.setTimeout(finish, 350))
          return
        }
      }
      rafRef.current = requestAnimationFrame(step)
    }

    rafRef.current = requestAnimationFrame(step)

    // Rete di sicurezza: rAF non gira nelle schede in secondo piano. Chi apre
    // il sito in un tab nascosto tornerebbe a trovare il preloader ancora lì,
    // con lo scroll bloccato sotto. setTimeout viene rallentato ma scatta
    // comunque, quindi il pannello se ne va in ogni caso.
    timers.push(window.setTimeout(finish, MAX_WAIT_MS))

    return () => {
      cancelAnimationFrame(rafRef.current)
      timers.forEach((id) => window.clearTimeout(id))
      body.classList.remove('lm-js', 'lm-lock', 'lm-loaded')
    }
  }, [])

  if (gone) return null

  return (
    <div className={`lm-pre${done ? ' is-done' : ''}`} aria-hidden="true">
      <div className="lm-pre-word">
        <Wordmark />
      </div>
      <div className="lm-pre-count">{count}</div>
    </div>
  )
}
