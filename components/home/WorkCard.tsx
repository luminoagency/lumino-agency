'use client'

import { useEffect, useRef, useState } from 'react'
import type { Work } from './worksData'
import BrowserChrome from './BrowserChrome'
import WorkMediaView from './WorkMediaView'
import { POINTER_BREAKPOINT, gsap, lerp, mouseEffectsEnabled, prefersReducedMotion } from './useMotion'

/**
 * Card progetto: deve leggersi come un browser che scorre il sito del cliente.
 *
 * Lo scorrimento parte DA SOLO quando la card entra in viewport e va in loop
 * lento e continuo — una card ferma sembra un'immagine, e nessuno scopre che
 * si muove se prima non ci passa sopra. L'hover non avvia niente: accelera
 * quello che sta già andando.
 *
 * Le velocità sono sfalsate fra le card: quattro nastri sincronizzati si
 * leggono come un'unica animazione, quattro sfasati come quattro siti.
 *
 * Tilt e riflesso restano legati al mouse, quindi solo da 821px in su con
 * puntatore fine. Lo scorrimento no: quello serve anche su mobile.
 */

/** Durata base di una passata, allungata di card in card. */
const SCROLL_BASE_S = 15
const SCROLL_STEP_S = 2.6
const HOVER_BOOST = 2.4
const TILT_MAX = 6

export default function WorkCard({
  work,
  index,
  onOpen,
}: {
  work: Work
  index: number
  onOpen: (work: Work, origin: DOMRect) => void
}) {
  const cardRef = useRef<HTMLElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLSpanElement>(null)
  const [near, setNear] = useState(index < 2)

  const openable = work.siteUrl !== ''

  /* ── Scorrimento automatico in loop ────────────────────────────────────── */
  useEffect(() => {
    const card = cardRef.current
    const viewport = viewportRef.current
    const scroller = scrollRef.current
    const bar = barRef.current
    if (!card || !viewport || !scroller || !bar) return

    const video = scroller.querySelector('video')
    let tl: gsap.core.Timeline | null = null

    const build = () => {
      const distance = scroller.scrollHeight - viewport.clientHeight
      if (distance <= 1) return null

      const duration = SCROLL_BASE_S + index * SCROLL_STEP_S
      const timeline = gsap.timeline({ repeat: -1, yoyo: true, paused: true })
      timeline
        .fromTo(
          scroller,
          { y: 0 },
          { y: -distance, duration, ease: 'none' },
          0,
        )
        .fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration, ease: 'none' }, 0)
      return timeline
    }

    // rootMargin generoso: il nastro è già in moto quando la card arriva
    // davvero sotto gli occhi, e l'immagine ha iniziato a scaricarsi prima.
    const observer = new IntersectionObserver(
      ([entry]) => {
        setNear(entry.isIntersecting)
        if (prefersReducedMotion()) return

        if (entry.isIntersecting) {
          if (!tl) tl = build()
          tl?.play()
          if (video) void video.play().catch(() => {})
        } else {
          tl?.pause()
          if (video) video.pause()
        }
      },
      { rootMargin: '400px 0px', threshold: 0 },
    )
    observer.observe(card)

    // Se il contenuto cambia altezza (immagine arrivata, resize) la corsa va
    // ricalcolata, altrimenti si ferma prima o sfonda.
    const resize = new ResizeObserver(() => {
      if (!tl) return
      const progress = tl.progress()
      tl.kill()
      gsap.set(scroller, { y: 0 })
      tl = build()
      if (tl) {
        tl.progress(progress)
        tl.play()
      }
    })
    resize.observe(scroller)

    const onEnter = () => tl?.timeScale(HOVER_BOOST)
    const onLeave = () => tl?.timeScale(1)
    card.addEventListener('pointerenter', onEnter)
    card.addEventListener('pointerleave', onLeave)

    return () => {
      observer.disconnect()
      resize.disconnect()
      card.removeEventListener('pointerenter', onEnter)
      card.removeEventListener('pointerleave', onLeave)
      tl?.kill()
      gsap.set(scroller, { y: 0 })
      gsap.set(bar, { scaleX: 0 })
    }
  }, [index])

  /* ── Tilt e riflesso: legati al mouse, quindi solo da 821px in su ──────── */
  useEffect(() => {
    const card = cardRef.current
    const viewport = viewportRef.current
    if (!card || !viewport) return

    const target = { x: 0, y: 0 }
    const current = { x: 0, y: 0 }
    let raf = 0
    let running = false

    const tick = () => {
      current.x = lerp(current.x, target.x, 0.12)
      current.y = lerp(current.y, target.y, 0.12)
      card.style.transform = `perspective(1100px) rotateX(${current.y}deg) rotateY(${current.x}deg)`

      const settled = Math.abs(current.x - target.x) < 0.01 && Math.abs(current.y - target.y) < 0.01
      if (settled && target.x === 0 && target.y === 0) {
        card.style.transform = ''
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
      const rect = card.getBoundingClientRect()
      const px = (event.clientX - rect.left) / rect.width
      const py = (event.clientY - rect.top) / rect.height
      target.x = (px - 0.5) * 2 * TILT_MAX
      target.y = -(py - 0.5) * 2 * TILT_MAX
      viewport.style.setProperty('--mx', `${px * 100}%`)
      viewport.style.setProperty('--my', `${py * 100}%`)
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
      card.addEventListener('pointermove', onMove)
      card.addEventListener('pointerleave', onLeave)
      attached = true
    }
    const detach = () => {
      if (!attached) return
      card.removeEventListener('pointermove', onMove)
      card.removeEventListener('pointerleave', onLeave)
      attached = false
      cancelAnimationFrame(raf)
      running = false
      card.style.transform = ''
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

  const open = () => {
    const frame = frameRef.current
    if (!frame || !openable) return
    onOpen(work, frame.getBoundingClientRect())
  }

  return (
    <article
      ref={cardRef}
      className="lm-card lm-reveal"
      data-work={work.id}
      data-cursor={openable ? 'label' : undefined}
      style={{ ['--accent' as string]: work.accent }}
    >
      <div className="lm-card-frame" ref={frameRef}>
        <BrowserChrome label={work.barLabel} />

        <div className="lm-card-viewport" ref={viewportRef}>
          <div className="lm-card-scroll" ref={scrollRef}>
            <WorkMediaView work={work} eager={near} />
          </div>

          <div className="lm-card-progress" aria-hidden="true">
            <span ref={barRef} />
          </div>
          <div className="lm-card-sheen" aria-hidden="true" />

          {openable ? (
            <button type="button" className="lm-card-open" onClick={open}>
              <span className="lm-sr">Apri il sito di {work.client} nella vetrina</span>
            </button>
          ) : null}
        </div>
      </div>

      <div className="lm-card-meta">
        <h3 className="lm-card-client">{work.client}</h3>
        <span className="lm-card-tag">
          {work.sector} · {work.year}
        </span>
        <p className="lm-card-blurb">{work.blurb}</p>
      </div>
    </article>
  )
}
