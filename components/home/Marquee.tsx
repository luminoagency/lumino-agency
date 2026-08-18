'use client'

import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from './useMotion'

/**
 * Sezione 2 — Marquee: testo gigante, trascinabile con inerzia.
 *
 * Tre forze sommate nello stesso loop, come nel riferimento:
 *   · deriva costante verso sinistra (1.3px a frame)
 *   · inerzia del trascinamento, che si smorza (×0.93)
 *   · velocità di scroll della pagina, che accelera il nastro e lo inclina
 *     (skewX limitato a ±7°, altrimenti il testo diventa illeggibile)
 *
 * Il nastro è duplicato in due metà identiche: quando la prima è uscita del
 * tutto, base torna indietro di metà larghezza e il giro ricomincia senza
 * stacco visibile.
 *
 * Con motion ridotto il loop non parte proprio: il nastro resta fermo e
 * leggibile.
 */

const PHRASE = ['Identità', 'Interfacce', 'Movimento', 'Codice']

function Star() {
  return (
    <svg className="lm-marquee-star" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0c.6 6.2 5.2 10.8 12 12-6.8 1.2-11.4 5.8-12 12-.6-6.2-5.2-10.8-12-12C6.8 10.8 11.4 6.2 12 0z" />
    </svg>
  )
}

function Half({ ghost }: { ghost: boolean }) {
  return (
    <>
      {PHRASE.map((word) => (
        <span key={word} style={{ display: 'contents' }}>
          <span className="lm-marquee-item" data-ghost={ghost ? 'true' : 'false'}>
            {word}
          </span>
          <Star />
        </span>
      ))}
    </>
  )
}

export default function Marquee() {
  const wrapRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const wrap = wrapRef.current
    const track = trackRef.current
    if (!wrap || !track) return
    if (prefersReducedMotion()) return

    let half = track.scrollWidth / 2
    let base = 0
    let scrollVel = 0
    let lastScroll = window.scrollY
    let dragging = false
    let startX = 0
    let startBase = 0
    let lastX = 0
    let dragVel = 0
    let raf = 0

    const onScroll = () => {
      scrollVel += window.scrollY - lastScroll
      lastScroll = window.scrollY
    }

    const onResize = () => {
      half = track.scrollWidth / 2
    }

    const onDown = (event: PointerEvent) => {
      dragging = true
      startX = event.clientX
      lastX = event.clientX
      startBase = base
      dragVel = 0
      wrap.setPointerCapture(event.pointerId)
      wrap.classList.add('is-dragging')
    }

    const onMove = (event: PointerEvent) => {
      if (!dragging) return
      base = startBase + (event.clientX - startX)
      dragVel = event.clientX - lastX
      lastX = event.clientX
    }

    const onUp = () => {
      dragging = false
      wrap.classList.remove('is-dragging')
    }

    const tick = () => {
      if (!dragging) {
        base -= 1.3
        base += dragVel
        dragVel *= 0.93
        scrollVel *= 0.88
        base -= scrollVel * 0.35
      }

      if (half) {
        if (base <= -half) base += half
        if (base > 0) base -= half
      }

      const skew = Math.max(-7, Math.min(7, scrollVel * -0.25 + dragVel * -0.18))
      track.style.transform = `translateX(${base}px) skewX(${skew}deg)`
      raf = requestAnimationFrame(tick)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    wrap.addEventListener('pointerdown', onDown)
    wrap.addEventListener('pointermove', onMove)
    wrap.addEventListener('pointerup', onUp)
    wrap.addEventListener('pointercancel', onUp)
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      wrap.removeEventListener('pointerdown', onDown)
      wrap.removeEventListener('pointermove', onMove)
      wrap.removeEventListener('pointerup', onUp)
      wrap.removeEventListener('pointercancel', onUp)
      track.style.transform = ''
    }
  }, [])

  return (
    <section
      className="lm-marquee"
      ref={wrapRef}
      aria-label="Identità, interfacce, movimento, codice"
    >
      <span className="lm-grabhint" aria-hidden="true">
        ↔ trascina
      </span>
      <div className="lm-marquee-track" ref={trackRef} aria-hidden="true">
        <Half ghost={false} />
        <Half ghost />
      </div>
    </section>
  )
}
