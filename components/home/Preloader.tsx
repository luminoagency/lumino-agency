'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Wordmark from './Wordmark'
import { prefersReducedMotion } from './useMotion'

/**
 * Preloader: contatore 0→100, poi il pannello scorre via verso l'alto.
 *
 * DISATTIVATO — vedi ENABLE_PRELOADER qui sotto. Il codice resta funzionante:
 * per riaccenderlo basta rimettere il flag a true.
 *
 * Il componente resta comunque montato anche da spento, e NON è una svista:
 * governa le due classi sul body da cui dipende l'ingresso dell'hero
 *   · lm-js     → il JS è vivo, si può nascondere ciò che deve entrare
 *   · lm-loaded → si entra
 * Smontarlo del tutto significherebbe che nessuno le applica: il titolo
 * resterebbe visibile ma piatto, senza mai fare il suo ingresso. Da spento
 * questo componente non disegna nulla, non blocca lo scroll e non ritarda
 * niente — accende solo l'ingresso, subito.
 *
 * Con prefers-reduced-motion si va dritti allo stato finale, senza ingresso.
 */

/** Temporaneo: la splash verrà rifatta. Finché è false, non si vede nulla. */
const ENABLE_PRELOADER = false

const TICK_MS = 90

/** Oltre questo tempo il preloader se ne va comunque, qualunque cosa sia
    successo al conteggio. */
const MAX_WAIT_MS = 4000

export default function Preloader() {
  const [count, setCount] = useState(0)
  const [done, setDone] = useState(false)
  const [gone, setGone] = useState(!ENABLE_PRELOADER)
  const rafRef = useRef(0)

  /* Percorso a preloader spento.
     useLayoutEffect e non useEffect: lo stato "nascosto" va scritto PRIMA che
     il browser dipinga, altrimenti si vedrebbe il titolo comparire, sparire e
     rientrare. Così il primo fotogramma è già quello nascosto e l'ingresso
     parte pulito al frame successivo. */
  useLayoutEffect(() => {
    if (ENABLE_PRELOADER) return
    const body = document.body

    if (prefersReducedMotion()) {
      body.classList.add('lm-js', 'lm-loaded')
      return () => body.classList.remove('lm-js', 'lm-loaded')
    }

    body.classList.add('lm-js')

    // Un frame di distanza: senza, il browser non vede mai lo stato di
    // partenza e la transizione non parte.
    //
    // MA non ci si può appoggiare al solo requestAnimationFrame: in una scheda
    // aperta in secondo piano non viene mai chiamato, e l'hero resterebbe
    // nascosto per sempre in attesa di un frame che non arriva. Il timeout è la
    // rete: viene rallentato ma scatta comunque. Vince chi arriva primo.
    let entered = false
    const enter = () => {
      if (entered) return
      entered = true
      body.classList.add('lm-loaded')
    }

    const frame = requestAnimationFrame(enter)
    const safety = window.setTimeout(enter, 120)

    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(safety)
      body.classList.remove('lm-js', 'lm-loaded')
    }
  }, [])

  /* Percorso a preloader acceso. */
  useEffect(() => {
    if (!ENABLE_PRELOADER) return
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
      timers.push(window.setTimeout(() => setGone(true), 1100))
    }

    // Conteggio a scatti irregolari, ma su rAF: un setInterval continuerebbe a
    // contare a scheda nascosta, arrivando in fondo prima che qualcuno veda.
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

    // Rete di sicurezza: rAF non gira nelle schede in secondo piano. Senza,
    // chi apre il sito in un tab nascosto tornerebbe a trovare il preloader
    // ancora lì, con lo scroll bloccato sotto.
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
