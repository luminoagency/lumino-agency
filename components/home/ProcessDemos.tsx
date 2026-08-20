'use client'

import { useEffect, useRef } from 'react'

/**
 * I tre demo della sezione "Il design".
 *
 * Non sono tre scene scollegate: sono TRE ATTI DELLA STESSA STORIA — un sito
 * che nasce sotto gli occhi di chi guarda. La struttura in pagina è la stessa
 * in tutti e tre (nav, hero, immagine, bottone, blocchi): cambia solo il suo
 * stato.
 *
 *   01  wireframe: rettangoli vuoti che scattano in posizione, con linee guida
 *       e misure, come in un file di progetto
 *   02  gli stessi rettangoli prendono colore, la tipografia entra lettera per
 *       lettera e un cursore attraversa facendo reagire le cose
 *   03  la stessa pagina si restringe e si ricompone dentro un telefono
 *
 * Il movimento è in @keyframes ma NON gira a tempo: la sezione è pinnata e lo
 * scroll decide il fotogramma. Trucco: animazione in pausa più
 * `animation-delay` negativo — un'animazione ferma viene comunque valutata al
 * tempo `-delay`, quindi spostando il ritardo si scorre fotogramma per
 * fotogramma. Zero lavoro JS per frame.
 *
 * REGOLA DI FILE (vale anche in process.css): mai la shorthand `animation:`.
 * Azzera delay e play-state, che sono i due su cui poggia tutto lo scrub.
 */

export type DemoMode = 'scrub' | 'auto' | 'still'

/** Durata di un giro completo, per atto. */
export const DEMO_DURATIONS = [6, 6, 6]

const D3_TARGET = 1.4
const D3_COUNT_SHARE = 0.34
const D3_SCORES = [98, 100, 100]
const D3_SCORE_START = 0.42
const D3_SCORE_SHARE = 0.4

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

function countAt(progress: number) {
  return (D3_TARGET * easeOut(clamp01(progress / D3_COUNT_SHARE))).toFixed(1)
}

/**
 * Porta un atto al fotogramma corrispondente al progresso (0→1).
 * Scrive una variabile CSS e, nel terzo, i numeri: sono l'unica cosa che il
 * CSS non sa disegnare da solo.
 */
export function seekDemo(stage: HTMLElement, index: number, progress: number) {
  const duration = DEMO_DURATIONS[index] ?? 6
  stage.style.setProperty('--seek', `${(-progress * duration).toFixed(3)}s`)

  if (index !== 2) return

  const value = stage.querySelector<HTMLElement>('[data-count]')
  if (value) value.textContent = countAt(progress)

  const t = easeOut(clamp01((progress - D3_SCORE_START) / D3_SCORE_SHARE))
  stage.querySelectorAll<HTMLElement>('[data-score]').forEach((el, i) => {
    el.textContent = String(Math.round((D3_SCORES[i] ?? 100) * t))
  })
}

/* ═══════════════════════════════════════════════════════════════════════════
   La pagina finta, condivisa dai tre atti.
   Stesso markup ovunque: è la CSS di ciascun atto a deciderne lo stato.
   ═══════════════════════════════════════════════════════════════════════════ */

const HERO_WORD = 'Benvenuti'

function FakePage({ act }: { act: 1 | 2 | 3 }) {
  return (
    <div className={`lm-page lm-page-a${act}`}>
      <div className="lm-p-nav">
        <span className="lm-p-logo" />
        <span className="lm-p-links">
          <i />
          <i />
          <i />
        </span>
      </div>

      <div className="lm-p-hero">
        <span className="lm-p-eyebrow" />
        <span className="lm-p-title">
          {Array.from(HERO_WORD).map((char, i) => (
            <b
              key={i}
              style={{ animationDelay: `calc(var(--seek, 0s) + ${(0.9 + i * 0.07).toFixed(2)}s)` }}
            >
              {char}
            </b>
          ))}
        </span>
        <span className="lm-p-btn">
          <i className="lm-p-btn-fill" />
        </span>
      </div>

      <div className="lm-p-media" />

      <div className="lm-p-cols">
        {[0, 1, 2].map((i) => (
          <span className="lm-p-col" key={i} style={{ ['--i' as string]: i }}>
            <i className="lm-p-thumb" />
            <i className="lm-p-line" />
            <i className="lm-p-line is-short" />
          </span>
        ))}
      </div>

      <div className="lm-p-row">
        <i className="lm-p-row-light" />
        <i className="lm-p-line" />
        <i className="lm-p-price" />
      </div>

      {/* Linee guida e misure: si vedono solo nel primo atto. */}
      <span className="lm-p-guide lm-p-guide-v" aria-hidden="true" />
      <span className="lm-p-guide lm-p-guide-h" aria-hidden="true" />
      <span className="lm-p-measure" aria-hidden="true">
        <i />
        <b>1440</b>
        <i />
      </span>
    </div>
  )
}

/* ── Atto 01 — wireframe ─────────────────────────────────────────────────── */
function ActWireframe() {
  return (
    <div className="lm-demo lm-demo-1">
      <FakePage act={1} />
      <span className="lm-act-tag" aria-hidden="true">
        wireframe
      </span>
    </div>
  )
}

/* ── Atto 02 — prende vita ───────────────────────────────────────────────── */
function ActAlive() {
  return (
    <div className="lm-demo lm-demo-2">
      <FakePage act={2} />
      {/* Il cursore che attraversa e fa reagire le cose. */}
      <span className="lm-act-cursor" aria-hidden="true" />
      <span className="lm-act-tag" aria-hidden="true">
        vivo
      </span>
    </div>
  )
}

/* ── Atto 03 — dentro il telefono ────────────────────────────────────────── */
const D3_CYCLE_MS = DEMO_DURATIONS[2] * 1000

function ActMobile({ mode }: { mode: DemoMode }) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    if (mode !== 'auto') {
      if (mode === 'still') {
        const v = root.querySelector<HTMLElement>('[data-count]')
        if (v) v.textContent = D3_TARGET.toFixed(1)
        root.querySelectorAll<HTMLElement>('[data-score]').forEach((el, i) => {
          el.textContent = String(D3_SCORES[i] ?? 100)
        })
      }
      return
    }

    /* I numeri sono l'unica cosa che il CSS non sa disegnare da solo, quindi
       qui serve del JS. Ma non serve a 60 fps e non serve sempre:
       · un contatore che sale non guadagna nulla oltre i dodici passi al
         secondo, e su un telefono ogni fotogramma risparmiato è batteria
       · e non deve girare affatto mentre l'atto è fuori dallo schermo
       La fase riparte da zero a ogni ingresso in viewport, così i numeri
       restano allineati alle animazioni CSS, che ripartono nello stesso
       istante. */
    const TICK_MS = 80

    const paint = (phase: number) => {
      const v = root.querySelector<HTMLElement>('[data-count]')
      if (v) v.textContent = countAt(phase)
      const t = easeOut(clamp01((phase - D3_SCORE_START) / D3_SCORE_SHARE))
      root.querySelectorAll<HTMLElement>('[data-score]').forEach((el, i) => {
        el.textContent = String(Math.round((D3_SCORES[i] ?? 100) * t))
      })
    }

    let timer = 0
    let started = 0

    const start = () => {
      if (timer) return
      started = performance.now()
      paint(0)
      timer = window.setInterval(() => {
        paint(((performance.now() - started) % D3_CYCLE_MS) / D3_CYCLE_MS)
      }, TICK_MS)
    }
    const stop = () => {
      if (!timer) return
      window.clearInterval(timer)
      timer = 0
    }

    const observer = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { threshold: 0.4 },
    )
    observer.observe(root)

    return () => {
      observer.disconnect()
      stop()
    }
  }, [mode])

  return (
    <div className="lm-demo lm-demo-3" ref={rootRef}>
      {/* La stessa pagina: si restringe e si ricompone in colonna. */}
      <div className="lm-phone">
        <span className="lm-phone-notch" />
        <div className="lm-phone-screen">
          <FakePage act={3} />
        </div>
      </div>

      <div className="lm-act-side">
        <div className="lm-act-meter">
          <span className="lm-act-value">
            <span data-count>0.0</span>s
          </span>
          <span className="lm-act-label">caricamento</span>
        </div>

        <div className="lm-act-scores">
          {['Performance', 'Accessibilità', 'SEO'].map((name, i) => (
            <span className="lm-act-score" key={name}>
              <i
                className="lm-act-bar"
                style={{ animationDelay: `calc(var(--seek, 0s) + ${(2.6 + i * 0.25).toFixed(2)}s)` }}
              />
              <b data-score={D3_SCORES[i]}>0</b>
              <em>{name}</em>
            </span>
          ))}
        </div>
      </div>

      <span className="lm-act-tag" aria-hidden="true">
        mobile
      </span>
    </div>
  )
}

export default function ProcessDemo({ index, mode }: { index: number; mode: DemoMode }) {
  const content =
    index === 0 ? <ActWireframe /> : index === 1 ? <ActAlive /> : <ActMobile mode={mode} />

  return <div className={`lm-demo-stage is-${mode}`}>{content}</div>
}
