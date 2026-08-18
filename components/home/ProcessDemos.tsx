'use client'

import { useEffect, useRef } from 'react'

/**
 * I tre demo della sezione "Il design": finti mini-siti animati, costruiti in
 * codice, zero asset esterni.
 *
 * Il movimento è tutto in CSS (@keyframes + animation-play-state): sono
 * animazioni cicliche e indipendenti, e lasciarle al compositore costa meno di
 * qualsiasi loop JS, oltre a fermarsi da sole quando si mette in pausa. L'unica
 * cosa che gira su requestAnimationFrame è il contatore del terzo demo, perché
 * è testo che cambia e il CSS non sa scriverlo: è UN solo loop, condiviso, e
 * parte solo quando quel demo è davvero in scena.
 *
 * In pausa quando la sezione è fuori dal viewport. Con prefers-reduced-motion
 * tutto resta sul fotogramma finale — mai un riquadro vuoto.
 */

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
            <i key={i} style={{ animationDelay: `${0.5 + i * 0.09}s` }}>
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

/** Valore finale del contatore, in secondi. */
const D3_TARGET = 1.4
const D3_CYCLE_MS = 6000
const D3_COUNT_MS = 2200

function DemoMobile({ playing }: { playing: boolean }) {
  const valueRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = valueRef.current
    if (!el) return

    if (!playing) {
      el.textContent = D3_TARGET.toFixed(1)
      return
    }

    let raf = 0
    const started = performance.now()

    const tick = (now: number) => {
      // Il conteggio riparte a ogni giro del ciclo, in fase con il CSS.
      const phase = (now - started) % D3_CYCLE_MS
      const t = Math.min(1, phase / D3_COUNT_MS)
      const eased = 1 - Math.pow(1 - t, 3)
      el.textContent = (D3_TARGET * eased).toFixed(1)
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing])

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
          <span ref={valueRef}>0.0</span>s
        </span>
        <span className="lm-d3-label">caricamento</span>
      </div>
    </div>
  )
}

/**
 * `playing` è vero solo per il demo attivo mentre la sezione è in viewport:
 * gli altri due restano montati (il crossfade è di sola opacità e ha bisogno
 * che ci siano) ma con le animazioni in pausa.
 */
export default function ProcessDemo({ index, playing }: { index: number; playing: boolean }) {
  const content =
    index === 0 ? <DemoHero /> : index === 1 ? <DemoMotion /> : <DemoMobile playing={playing} />

  return <div className={`lm-demo-stage${playing ? ' is-playing' : ''}`}>{content}</div>
}
