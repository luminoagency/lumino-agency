'use client'

import { useEffect, useRef } from 'react'

/**
 * I tre demo della sezione "Il design": finti mini-siti animati, costruiti in
 * codice, zero asset esterni.
 *
 * Il movimento è tutto in @keyframes CSS, ma NON gira a tempo: la sezione è
 * pinnata e lo scroll pilota il fotogramma. Il trucco è quello classico —
 * animazione in pausa più `animation-delay` negativo: un'animazione ferma
 * viene comunque valutata al tempo `-delay`, quindi spostando il ritardo si
 * scorre l'animazione fotogramma per fotogramma. Zero lavoro JS per frame, e
 * i keyframe restano quelli scritti in CSS.
 *
 * Il ritardo arriva da una sola variabile `--seek` sul contenitore; i singoli
 * elementi che avevano già un ritardo proprio lo sommano con calc(). Così
 * l'intera scena si scorre toccando una variabile.
 *
 * Tre modalità:
 *   scrub  → il fotogramma lo decide lo scroll (desktop, sezione pinnata)
 *   auto   → ciclo continuo a tempo (mobile: niente pin, parte in viewport)
 *   still  → fermo sul fotogramma finale (prefers-reduced-motion)
 */

export type DemoMode = 'scrub' | 'auto' | 'still'

/** Durata di un giro completo, per demo. Serve a mappare progresso → tempo. */
export const DEMO_DURATIONS = [6, 7, 6]

/** Valore finale del contatore del terzo demo, in secondi. */
const D3_TARGET = 1.4
/** Frazione del ciclo in cui il contatore arriva a destinazione. */
const D3_COUNT_SHARE = 0.37

function countAt(progress: number) {
  const t = Math.min(1, Math.max(0, progress / D3_COUNT_SHARE))
  const eased = 1 - Math.pow(1 - t, 3)
  return (D3_TARGET * eased).toFixed(1)
}

/**
 * Porta un demo al fotogramma corrispondente al progresso (0→1).
 *
 * Chiamata dal driver dello scroll a ogni aggiornamento: scrive una variabile
 * CSS e, per il terzo demo, il testo del contatore — che è l'unica cosa che il
 * CSS non sa disegnare da solo.
 */
export function seekDemo(stage: HTMLElement, index: number, progress: number) {
  const duration = DEMO_DURATIONS[index] ?? 6
  stage.style.setProperty('--seek', `${(-progress * duration).toFixed(3)}s`)

  if (index === 2) {
    const value = stage.querySelector<HTMLElement>('[data-count]')
    if (value) value.textContent = countAt(progress)
  }
}

/* ── 01 — Hero che ferma il pollice ─────────────────────────────────────── */

const D1_LETTERS = Array.from('Benvenuti')

function DemoHero() {
  return (
    <div className="lm-demo lm-demo-1">
      <div className="lm-d1-media" />
      <div className="lm-d1-copy">
        <span className="lm-d1-eyebrow" />
        <span className="lm-d1-title">
          {D1_LETTERS.map((char, i) => (
            <i
              key={i}
              style={{ animationDelay: `calc(var(--seek, 0s) + ${(0.5 + i * 0.09).toFixed(2)}s)` }}
            >
              {char}
            </i>
          ))}
        </span>
        <span className="lm-d1-btn" />
      </div>
    </div>
  )
}

/* ── 02 — Movimento su misura ───────────────────────────────────────────── */

function DemoMotion() {
  return (
    <div className="lm-demo lm-demo-2">
      <div className="lm-d2-bar">
        <i />
        <i className="is-wide" />
      </div>
      <div className="lm-d2-grid">
        <span className="lm-d2-card lm-d2-card-a" />
        <span className="lm-d2-card lm-d2-card-b" />
        <span className="lm-d2-card lm-d2-card-c" />
      </div>
      <div className="lm-d2-panel">
        <i />
        <i />
        <i className="is-short" />
      </div>
      <span className="lm-d2-cursor" />
    </div>
  )
}

/* ── 03 — Prima il telefono ─────────────────────────────────────────────── */

const D3_CYCLE_MS = DEMO_DURATIONS[2] * 1000

function DemoMobile({ mode }: { mode: DemoMode }) {
  const valueRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = valueRef.current
    if (!el) return

    // In scrub il contatore lo scrive seekDemo, in still è già arrivato.
    if (mode !== 'auto') {
      if (mode === 'still') el.textContent = D3_TARGET.toFixed(1)
      return
    }

    let raf = 0
    const started = performance.now()
    const tick = (now: number) => {
      const phase = ((now - started) % D3_CYCLE_MS) / D3_CYCLE_MS
      el.textContent = countAt(phase)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [mode])

  return (
    <div className="lm-demo lm-demo-3">
      <div className="lm-d3-phone">
        <span className="lm-d3-notch" />
        <div className="lm-d3-screen">
          <div className="lm-d3-scroll">
            <span className="lm-d3-block is-hero" />
            <span className="lm-d3-line" />
            <span className="lm-d3-line is-short" />
            <span className="lm-d3-block" />
            <span className="lm-d3-line" />
            <span className="lm-d3-block is-alt" />
            <span className="lm-d3-line is-short" />
            <span className="lm-d3-block" />
          </div>
        </div>
      </div>

      <div className="lm-d3-meter">
        <span className="lm-d3-value">
          <span ref={valueRef} data-count>
            0.0
          </span>
          s
        </span>
        <span className="lm-d3-label">caricamento</span>
      </div>
    </div>
  )
}

export default function ProcessDemo({ index, mode }: { index: number; mode: DemoMode }) {
  const content =
    index === 0 ? <DemoHero /> : index === 1 ? <DemoMotion /> : <DemoMobile mode={mode} />

  return <div className={`lm-demo-stage is-${mode}`}>{content}</div>
}
