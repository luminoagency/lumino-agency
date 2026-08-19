'use client'

import { useEffect, useRef } from 'react'
import HeroBlobs from './HeroBlobs'

/**
 * I tre demo della sezione "Il design".
 *
 * Ognuno mostra una TECNICA che usiamo davvero, riusando i pezzi del sito
 * invece di illustrarli: il primo è una miniatura viva del nostro hero (stessi
 * blob, stesso filtro gooey, stesso titolo che entra lettera per lettera), il
 * secondo mette in fila le micro-interazioni della pagina, il terzo il
 * comportamento mobile. Sono autodimostrativi: quello che il testo accanto
 * promette, il riquadro lo sta facendo.
 *
 * Il movimento è in @keyframes CSS, ma NON gira a tempo: la sezione è pinnata e
 * lo scroll pilota il fotogramma. Trucco: animazione in pausa più
 * `animation-delay` negativo — un'animazione ferma viene comunque valutata al
 * tempo `-delay`, quindi spostando il ritardo si scorre fotogramma per
 * fotogramma. Zero lavoro JS per frame.
 *
 * I blob del primo demo riusano il componente dell'hero ma sono mossi da
 * keyframe, non dal driver rAF: il driver lavora a tempo reale e non saprebbe
 * farsi scrubbare.
 *
 * Tre modalità:
 *   scrub  → il fotogramma lo decide lo scroll (desktop, sezione pinnata)
 *   auto   → ciclo continuo a tempo (mobile: niente pin, parte in viewport)
 *   still  → fermo sul fotogramma finale (prefers-reduced-motion)
 */

export type DemoMode = 'scrub' | 'auto' | 'still'

/** Durata di un giro completo, per demo. Serve a mappare progresso → tempo. */
export const DEMO_DURATIONS = [6, 6, 6]

const D3_TARGET = 1.4
const D3_COUNT_SHARE = 0.34
/** Punteggi Lighthouse mostrati dal terzo demo. */
const D3_SCORES = [98, 100, 100]
const D3_SCORE_START = 0.42
const D3_SCORE_SHARE = 0.4

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

function countAt(progress: number) {
  return (D3_TARGET * easeOut(clamp01(progress / D3_COUNT_SHARE))).toFixed(1)
}

/**
 * Porta un demo al fotogramma corrispondente al progresso (0→1).
 *
 * Scrive una variabile CSS e, per il terzo demo, i numeri: sono l'unica cosa
 * che il CSS non sa disegnare da solo.
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

/* ── 01 — Hero che ferma il pollice ─────────────────────────────────────── */

const D1_LETTERS = Array.from('Benvenuti')

/**
 * Miniatura del nostro hero, viva: blob che si fondono e si separano, titolo
 * serif che entra lettera per lettera, un cursore che attraversa e fa scostare
 * le lettere che incontra, scintille che salgono.
 */
function DemoHero() {
  return (
    <div className="lm-demo lm-demo-1">
      {/* Stesso componente dell'hero: tre cerchi invece di cinque, e senza
          ripetere il <defs> — l'id del filtro è già in pagina. */}
      <HeroBlobs count={3} defs={false} />

      <div className="lm-d1-sparks">
        {Array.from({ length: 7 }, (_, i) => (
          <i key={i} style={{ left: `${8 + i * 13}%`, animationDelay: `calc(var(--seek, 0s) + ${(i * 0.7).toFixed(2)}s)` }} />
        ))}
      </div>

      <div className="lm-d1-copy">
        <span className="lm-d1-eyebrow" />
        <span className="lm-d1-title">
          {D1_LETTERS.map((char, i) => (
            <i
              key={i}
              className="lm-d1-letter"
              style={{ animationDelay: `calc(var(--seek, 0s) + ${(0.35 + i * 0.08).toFixed(2)}s)` }}
            >
              <b style={{ animationDelay: `calc(var(--seek, 0s) + ${(1.7 + i * 0.13).toFixed(2)}s)` }}>
                {char}
              </b>
            </i>
          ))}
        </span>
        <span className="lm-d1-btn" />
      </div>

      {/* Il cursore che passa: è al suo passaggio che le lettere si scostano. */}
      <span className="lm-d1-cursor" />
    </div>
  )
}

/* ── 02 — Movimento su misura ───────────────────────────────────────────── */

/**
 * Le micro-interazioni della pagina messe in fila, ~1,5s ciascuna: card che si
 * inclina in 3D col riflesso che segue il cursore, click che genera un'onda
 * circolare, riga di lista in cui sale la luce del gradiente, bottone che si
 * riempie dal basso.
 */
function DemoMotion() {
  return (
    <div className="lm-demo lm-demo-2">
      <div className="lm-d2-card">
        <span className="lm-d2-card-sheen" />
        <span className="lm-d2-card-line" />
        <span className="lm-d2-card-line is-short" />
      </div>

      <span className="lm-d2-wave" />

      <div className="lm-d2-row">
        <span className="lm-d2-row-light" />
        <span className="lm-d2-row-label" />
        <span className="lm-d2-row-meta" />
      </div>

      <div className="lm-d2-btn">
        <span className="lm-d2-btn-fill" />
        <span className="lm-d2-btn-label" />
      </div>

      <span className="lm-d2-cursor" />
    </div>
  )
}

/* ── 03 — Prima il telefono ─────────────────────────────────────────────── */

const D3_CYCLE_MS = DEMO_DURATIONS[2] * 1000

function DemoMobile({ mode }: { mode: DemoMode }) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    // In scrub i numeri li scrive seekDemo, in still sono già arrivati.
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

    let raf = 0
    const started = performance.now()
    const tick = (now: number) => {
      const phase = ((now - started) % D3_CYCLE_MS) / D3_CYCLE_MS
      const v = root.querySelector<HTMLElement>('[data-count]')
      if (v) v.textContent = countAt(phase)
      const t = easeOut(clamp01((phase - D3_SCORE_START) / D3_SCORE_SHARE))
      root.querySelectorAll<HTMLElement>('[data-score]').forEach((el, i) => {
        el.textContent = String(Math.round((D3_SCORES[i] ?? 100) * t))
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [mode])

  return (
    <div className="lm-demo lm-demo-3" ref={rootRef}>
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
          {/* Il dito che scorre: lo swipe che dà l'inerzia al contenuto. */}
          <span className="lm-d3-thumb" />
        </div>
      </div>

      <div className="lm-d3-side">
        <div className="lm-d3-meter">
          <span className="lm-d3-value">
            <span data-count>0.0</span>s
          </span>
          <span className="lm-d3-label">caricamento</span>
        </div>

        <div className="lm-d3-scores">
          {['Performance', 'Accessibilità', 'SEO'].map((name, i) => (
            <span className="lm-d3-score" key={name}>
              <i className="lm-d3-bar" style={{ animationDelay: `calc(var(--seek, 0s) + ${(2.6 + i * 0.25).toFixed(2)}s)` }} />
              <b data-score={D3_SCORES[i]}>0</b>
              <em>{name}</em>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function ProcessDemo({ index, mode }: { index: number; mode: DemoMode }) {
  const content =
    index === 0 ? <DemoHero /> : index === 1 ? <DemoMotion /> : <DemoMobile mode={mode} />

  return <div className={`lm-demo-stage is-${mode}`}>{content}</div>
}
