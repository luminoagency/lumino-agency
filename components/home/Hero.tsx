'use client'

import { useEffect, useRef } from 'react'
import { Line, type Segment } from './splitText'
import { gradientAt, onMouseEffectsChange, pointer, trackPointer } from './useMotion'

/**
 * Sezione 1 — Hero.
 *
 * Layout volutamente NON a due colonne e senza media a destra: il titolo occupa
 * la larghezza, ancorato in basso, con le scintille sul canvas dietro.
 * (Vincolo permanente di progetto.)
 *
 * Due effetti, entrambi su rAF + lerp e nessuno su GSAP: girano a 60fps
 * continui e passare da una libreria sarebbe solo overhead.
 *   · lettere che si scostano, si sollevano e si illuminano vicino al cursore
 *   · scintille che salgono lente, scappano dal cursore, esplodono al click
 *
 * Entrambi si spengono quando l'hero esce dal viewport: un IntersectionObserver
 * ferma i loop invece di lasciarli girare a vuoto per tutta la pagina.
 */

export const HERO_TITLE = 'Diamo forma al sito che il tuo brand merita.'

const HERO_LINES: Segment[][] = [
  [{ text: 'Diamo forma', variant: 'thin' }],
  [{ text: 'al sito che il' }],
  [{ text: 'tuo brand ' }, { text: 'merita.', variant: 'grad' }],
]

/* Scintille: stessi numeri del riferimento. */
const SPARK_COUNT = 46
const SPARK_DODGE = 130
const LETTER_RADIUS = 180
const SPARK_COLORS = ['rgba(255,205,150,', 'rgba(236,106,156,', 'rgba(139,92,246,']

interface Spark {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  life: number
  color: string
  burst: boolean
}

export default function Hero() {
  const heroRef = useRef<HTMLElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  /* ── Lettere reattive ──────────────────────────────────────────────────── */
  useEffect(() => {
    const hero = heroRef.current
    const title = titleRef.current
    if (!hero || !title) return

    const chars = Array.from(title.querySelectorAll<HTMLElement>('.lm-char'))
    if (chars.length === 0) return

    // Colore di base delle lettere in gradiente, una per una.
    const gradChars = chars.filter((el) => el.dataset.grad === 'true')
    gradChars.forEach((el, i) => {
      const t = gradChars.length < 2 ? 0 : i / (gradChars.length - 1)
      const color = gradientAt(t)
      el.style.color = color
      el.dataset.base = color
    })

    let raf = 0
    let live = false
    let visible = true

    const reset = (el: HTMLElement) => {
      el.style.transform = ''
      el.style.textShadow = ''
      if (!el.dataset.base) el.style.color = ''
    }

    const tick = () => {
      if (visible) {
        for (const el of chars) {
          const rect = el.getBoundingClientRect()
          const dx = pointer.x - (rect.left + rect.width / 2)
          const dy = pointer.y - (rect.top + rect.height / 2)
          const distance = Math.hypot(dx, dy)

          if (distance < LETTER_RADIUS) {
            const f = 1 - distance / LETTER_RADIUS
            el.style.transform = `translate(${-dx * f * 0.16}px, ${-dy * f * 0.3 - f * 10}px) scale(${1 + f * 0.09})`
            el.style.textShadow = `0 0 ${26 * f}px rgba(255, 205, 150, ${0.55 * f})`
            if (!el.dataset.base) {
              el.style.color = `rgb(244, ${238 - Math.round(20 * f)}, ${228 - Math.round(60 * f)})`
            }
          } else {
            reset(el)
          }
        }
      }
      raf = requestAnimationFrame(tick)
    }

    let stopPointer: (() => void) | null = null

    const unsubscribe = onMouseEffectsChange((enabled) => {
      if (enabled && !live) {
        live = true
        stopPointer = trackPointer()
        raf = requestAnimationFrame(tick)
      } else if (!enabled && live) {
        live = false
        cancelAnimationFrame(raf)
        stopPointer?.()
        stopPointer = null
        chars.forEach(reset)
      }
    })

    // Fuori dal viewport i loop si fermano.
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting
        if (!visible) chars.forEach(reset)
      },
      { threshold: 0 },
    )
    observer.observe(hero)

    return () => {
      unsubscribe()
      observer.disconnect()
      cancelAnimationFrame(raf)
      stopPointer?.()
      chars.forEach(reset)
    }
  }, [])

  /* ── Scintille ─────────────────────────────────────────────────────────── */
  useEffect(() => {
    const hero = heroRef.current
    const canvas = canvasRef.current
    if (!hero || !canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = 0
    let height = 0
    let sparks: Spark[] = []
    let raf = 0
    let live = false
    let visible = true
    let stopPointer: (() => void) | null = null

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = rect.width
      height = rect.height
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const spawn = (n: number, x?: number, y?: number, burst = false) => {
      for (let i = 0; i < n; i += 1) {
        sparks.push({
          x: x ?? Math.random() * width,
          y: y ?? Math.random() * height,
          vx: burst ? (Math.random() - 0.5) * 5 : (Math.random() - 0.5) * 0.22,
          vy: burst ? (Math.random() - 0.5) * 5 : -Math.random() * 0.35 - 0.08,
          r: Math.random() * 1.9 + 0.5,
          life: burst ? 1 : Math.random() * 0.6 + 0.4,
          color: SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)],
          burst,
        })
      }
    }

    const onBurst = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      spawn(18, event.clientX - rect.left, event.clientY - rect.top, true)
    }

    const loop = () => {
      if (visible) {
        ctx.clearRect(0, 0, width, height)
        const rect = canvas.getBoundingClientRect()
        const lx = pointer.x - rect.left
        const ly = pointer.y - rect.top

        sparks = sparks.filter((p) => {
          const dx = p.x - lx
          const dy = p.y - ly
          const d = Math.hypot(dx, dy)

          // Fuga dal cursore.
          if (d < SPARK_DODGE && d > 0) {
            const push = (1 - d / SPARK_DODGE) * 0.42
            p.vx += (dx / d) * push
            p.vy += (dy / d) * push
          }

          p.vx *= 0.965
          p.vy *= 0.965
          p.x += p.vx
          p.y += p.vy

          if (p.burst) {
            p.life -= 0.016
            if (p.life <= 0) return false
          } else {
            if (p.y < -10) p.y = height + 10
            if (p.y > height + 10) p.y = -10
            if (p.x < -10) p.x = width + 10
            if (p.x > width + 10) p.x = -10
          }

          ctx.beginPath()
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
          ctx.fillStyle = `${p.color}${p.burst ? p.life * 0.9 : p.life * 0.55})`
          ctx.fill()
          return true
        })

        if (sparks.filter((p) => !p.burst).length < SPARK_COUNT) spawn(1)
      }
      raf = requestAnimationFrame(loop)
    }

    const enable = () => {
      if (live) return
      live = true
      stopPointer = trackPointer()
      resize()
      sparks = []
      spawn(SPARK_COUNT)
      window.addEventListener('resize', resize)
      hero.addEventListener('pointerdown', onBurst)
      raf = requestAnimationFrame(loop)
    }

    const disable = () => {
      if (!live) return
      live = false
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      hero.removeEventListener('pointerdown', onBurst)
      stopPointer?.()
      stopPointer = null
      ctx.clearRect(0, 0, width, height)
      sparks = []
    }

    const unsubscribe = onMouseEffectsChange((enabled) => (enabled ? enable() : disable()))

    const observer = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting), {
      threshold: 0,
    })
    observer.observe(hero)

    return () => {
      unsubscribe()
      observer.disconnect()
      disable()
    }
  }, [])

  return (
    <section className="lm-hero" id="hero" ref={heroRef}>
      <canvas className="lm-hero-canvas" ref={canvasRef} aria-hidden="true" />

      <div className="lm-wrap">
        <h1 className="lm-display lm-d1 lm-hero-title" ref={titleRef} aria-label={HERO_TITLE}>
          {HERO_LINES.map((segments, i) => (
            <Line segments={segments} key={i} />
          ))}
        </h1>

        <div className="lm-hero-foot">
          <p className="lm-hero-sub">
            Studio digitale. Progettiamo e costruiamo siti per chi ha qualcosa di
            vero da mostrare: ristoranti, hotel, aziende, retail, immobiliare.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.75rem', flexWrap: 'wrap' }}>
            <a className="lm-hero-scroll" href="#lavori" data-cursor="grow">
              Guarda i lavori
              <span className="lm-hero-scroll-line" aria-hidden="true" />
            </a>
            <span className="lm-playhint">passa sopra il titolo — reagisce</span>
          </div>
        </div>
      </div>
    </section>
  )
}
