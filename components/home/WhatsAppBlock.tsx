'use client'

import { useEffect, useRef, useState } from 'react'
import { COMPANY } from '@/lib/company'
import { POINTER_BREAKPOINT, lerp, mouseEffectsEnabled, prefersReducedMotion } from './useMotion'

/**
 * Blocco WhatsApp della sezione Contatti.
 *
 * Non un pulsante verde generico ma una conversazione già cominciata: prima i
 * tre puntini di "sta scrivendo", poi la risposta in arrivo, poi un campo che
 * si scrive da solo. Chi lo guarda capisce che dall'altra parte c'è qualcuno
 * senza bisogno che glielo si scriva.
 *
 * Il campo di testo NON è un <input>: sarebbe a fuoco alla prima tabulazione e
 * su telefono aprirebbe la tastiera per niente. È un div. Il blocco intero è
 * un <a>, quindi resta una cosa sola, navigabile da tastiera.
 *
 * Il verde di WhatsApp è solo un accento — pulsante di invio e spunte. Il resto
 * è la nostra palette: un blocco verde su una vetrina scura sarebbe un corpo
 * estraneo.
 */

const MESSAGE = 'Ciao Lumino, ho visto il vostro sito e vorrei parlarvi di un progetto.'
const WA_LINK = `${COMPANY.whatsapp.waLink}?text=${encodeURIComponent(MESSAGE)}`

/* Il testo che si scrive da solo: la testa resta, la coda ruota. */
const TYPED_HEAD = 'Ciao Lumino, vorrei un sito per'
const TYPED_TAILS = [' il mio ristorante', ' il mio hotel', ' la mia azienda']

const TYPE_MS = 55
const ERASE_MS = 28
const HOLD_MS = 1400
const TILT_MAX = 4

export default function WhatsAppBlock() {
  const rootRef = useRef<HTMLAnchorElement>(null)
  const typedRef = useRef<HTMLSpanElement>(null)
  const [live, setLive] = useState(false)
  const [burst, setBurst] = useState(false)

  /* La conversazione parte al primo ingresso in viewport e si ferma quando
     esce: è un ciclo, e farlo girare per tutta la pagina non serve a nessuno. */
  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const observer = new IntersectionObserver(([entry]) => setLive(entry.isIntersecting), {
      threshold: 0.3,
    })
    observer.observe(root)
    return () => observer.disconnect()
  }, [])

  /* Il campo che si scrive da solo. */
  useEffect(() => {
    const el = typedRef.current
    if (!el) return

    // Con motion ridotto si mostra il messaggio finito, non un campo vuoto.
    if (prefersReducedMotion()) {
      el.textContent = TYPED_HEAD + TYPED_TAILS[0]
      return
    }
    if (!live) return

    let raf = 0
    let tail = 0
    let chars = 0
    let phase: 'head' | 'type' | 'hold' | 'erase' = 'head'
    let last = performance.now()
    let holdUntil = 0

    const step = (now: number) => {
      const wait = phase === 'erase' ? ERASE_MS : TYPE_MS

      if (phase === 'hold') {
        if (now >= holdUntil) {
          phase = 'erase'
          last = now
        }
      } else if (now - last >= wait) {
        last = now

        if (phase === 'head') {
          chars += 1
          el.textContent = TYPED_HEAD.slice(0, chars)
          if (chars >= TYPED_HEAD.length) {
            phase = 'type'
            chars = 0
          }
        } else if (phase === 'type') {
          chars += 1
          el.textContent = TYPED_HEAD + TYPED_TAILS[tail].slice(0, chars)
          if (chars >= TYPED_TAILS[tail].length) {
            phase = 'hold'
            holdUntil = now + HOLD_MS
          }
        } else {
          chars -= 1
          el.textContent = TYPED_HEAD + TYPED_TAILS[tail].slice(0, Math.max(0, chars))
          if (chars <= 0) {
            tail = (tail + 1) % TYPED_TAILS.length
            phase = 'type'
          }
        }
      }

      raf = requestAnimationFrame(step)
    }

    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [live])

  /* Inclinazione verso il puntatore: roba da mouse, quindi solo lì. */
  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const target = { x: 0, y: 0 }
    const current = { x: 0, y: 0 }
    let raf = 0
    let running = false

    const tick = () => {
      current.x = lerp(current.x, target.x, 0.12)
      current.y = lerp(current.y, target.y, 0.12)
      root.style.transform = `perspective(900px) rotateX(${current.y}deg) rotateY(${current.x}deg)`

      const settled = Math.abs(current.x - target.x) < 0.01 && Math.abs(current.y - target.y) < 0.01
      if (settled && target.x === 0 && target.y === 0) {
        root.style.transform = ''
        running = false
        return
      }
      raf = requestAnimationFrame(tick)
    }

    const start = () => {
      if (running) return
      running = true
      raf = requestAnimationFrame(tick)
    }

    const onMove = (event: PointerEvent) => {
      const rect = root.getBoundingClientRect()
      target.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2 * TILT_MAX
      target.y = -((event.clientY - rect.top) / rect.height - 0.5) * 2 * TILT_MAX
      start()
    }
    const onLeave = () => {
      target.x = 0
      target.y = 0
      start()
    }

    let attached = false
    const attach = () => {
      if (attached) return
      root.addEventListener('pointermove', onMove)
      root.addEventListener('pointerleave', onLeave)
      attached = true
    }
    const detach = () => {
      if (!attached) return
      root.removeEventListener('pointermove', onMove)
      root.removeEventListener('pointerleave', onLeave)
      attached = false
      cancelAnimationFrame(raf)
      running = false
      root.style.transform = ''
      current.x = 0
      current.y = 0
      target.x = 0
      target.y = 0
    }

    const sync = () => (mouseEffectsEnabled() ? attach() : detach())
    const queries = [
      window.matchMedia(`(min-width: ${POINTER_BREAKPOINT}px) and (pointer: fine)`),
      window.matchMedia('(prefers-reduced-motion: reduce)'),
    ]
    queries.forEach((q) => q.addEventListener('change', sync))
    sync()

    return () => {
      queries.forEach((q) => q.removeEventListener('change', sync))
      detach()
    }
  }, [])

  return (
    <div className="lm-wa-wrap">
      <a
        ref={rootRef}
        className={`lm-wa${live ? ' is-live' : ''}${burst ? ' is-burst' : ''}`}
        href={WA_LINK}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Scrivici su WhatsApp"
        data-cursor="whatsapp"
        onPointerDown={() => setBurst(true)}
        onAnimationEnd={() => setBurst(false)}
      >
        <span className="lm-wa-flash" aria-hidden="true" />

        <span className="lm-wa-head">
          <span className="lm-wa-avatar" aria-hidden="true">
            L
          </span>
          <span className="lm-wa-who">
            <b>Lumino</b>
            <i className="lm-wa-status">online</i>
          </span>
        </span>

        {/* Sta scrivendo → poi la bolla in arrivo. */}
        <span className="lm-wa-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>

        <span className="lm-wa-bubble">
          Ciao 👋 Raccontaci del tuo progetto — rispondiamo di solito in giornata.
          <span className="lm-wa-ticks" aria-hidden="true">
            ✓✓
          </span>
        </span>

        {/* Finto campo: un div, non un input — non deve aprire la tastiera. */}
        <span className="lm-wa-composer">
          <span className="lm-wa-field">
            <span ref={typedRef} className="lm-wa-typed" />
            <span className="lm-wa-caret" aria-hidden="true" />
          </span>
          <span className="lm-wa-send" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4 12h14M13 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </span>
      </a>

      <p className="lm-wa-number">{COMPANY.whatsapp.display}</p>
    </div>
  )
}
