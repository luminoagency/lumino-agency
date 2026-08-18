'use client'

import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from './useMotion'

/**
 * Sezione 9 — Statistiche con contatori animati.
 *
 * Il conteggio parte solo quando il numero è davvero in viewport
 * (IntersectionObserver, soglia 0.6) e gira su requestAnimationFrame: con
 * setInterval continuerebbe a contare a scheda nascosta, arrivando in fondo
 * prima ancora che qualcuno lo veda.
 *
 * Il valore corretto è già nel markup renderizzato dal server: se il JS non
 * parte, o con motion ridotto, il numero resta quello giusto.
 */

const COUNT_MS = 1100

export const STATS = [
  { value: 5, suffix: '', label: 'settori in cui abbiamo già costruito e messo online' },
  { value: 100, suffix: '%', label: 'dei progetti scritti da zero, senza temi comprati' },
  { value: 1, suffix: '', label: 'referente unico dal primo schizzo alla messa online' },
]

export default function Stats() {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root || prefersReducedMotion()) return

    const numbers = Array.from(root.querySelectorAll<HTMLElement>('[data-target]'))
    const frames: number[] = []

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const el = entry.target as HTMLElement
          observer.unobserve(el)

          const target = Number(el.dataset.target ?? 0)
          const suffix = el.dataset.suffix ?? ''
          const start = performance.now()

          const step = (now: number) => {
            const t = Math.min(1, (now - start) / COUNT_MS)
            // easeOutCubic: parte veloce e si posa, invece di arrivare di colpo.
            const eased = 1 - Math.pow(1 - t, 3)
            el.textContent = `${Math.round(target * eased)}${suffix}`
            if (t < 1) frames.push(requestAnimationFrame(step))
          }

          el.textContent = `0${suffix}`
          frames.push(requestAnimationFrame(step))
        })
      },
      { threshold: 0.6 },
    )

    numbers.forEach((el) => observer.observe(el))

    return () => {
      observer.disconnect()
      frames.forEach((id) => cancelAnimationFrame(id))
    }
  }, [])

  return (
    <section className="lm-section" id="numeri">
      <div className="lm-wrap">
        <p className="lm-kicker lm-reveal">In breve</p>

        <div className="lm-stats" ref={rootRef}>
          {STATS.map((stat) => (
            <div className="lm-stat lm-reveal" key={stat.label}>
              <span className="lm-stat-num" data-target={stat.value} data-suffix={stat.suffix}>
                {stat.value}
                {stat.suffix}
              </span>
              <span className="lm-stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
