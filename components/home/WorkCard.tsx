'use client'

import { useEffect, useRef } from 'react'
import type { Work } from './worksData'
import { POINTER_BREAKPOINT, gsap, lerp, mouseEffectsEnabled } from './useMotion'

/**
 * Card progetto: deve leggersi come un browser che scorre il sito del cliente.
 *
 * All'hover lo screenshot full-page scorre dall'alto in basso in ~5 secondi con
 * easing, la barra in gradiente segue l'avanzamento, la card si inclina verso il
 * mouse e un riflesso di luce insegue il cursore. All'uscita torna su.
 *
 * Il markup accetta indifferentemente uno screenshot full-page o un <video> in
 * loop (vedi WorkMedia in worksData.ts): si cambia sorgente lì senza toccare
 * questo componente.
 *
 * Tutto l'apparato mouse è attivo solo da 821px in su, con puntatore fine e
 * fuori da prefers-reduced-motion. Sotto quella soglia la card resta una
 * card: si vede la testa dello screenshot, e va benissimo così.
 */

const SCROLL_SECONDS = 5
const TILT_MAX = 6

export default function WorkCard({ work, index }: { work: Work; index: number }) {
  const { media } = work
  const cardRef = useRef<HTMLElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const card = cardRef.current
    const viewport = viewportRef.current
    const scroller = scrollRef.current
    const bar = barRef.current
    if (!card || !viewport || !scroller || !bar) return

    const video = scroller.querySelector('video')

    // Tilt: target aggiornato dal mousemove, applicato dal loop rAF con lerp.
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

      // Riflesso di luce: coordinate in percentuale per il radial-gradient.
      viewport.style.setProperty('--mx', `${px * 100}%`)
      viewport.style.setProperty('--my', `${py * 100}%`)
      start()
    }

    const onEnter = () => {
      // Distanza reale calcolata a ogni ingresso: l'immagine può essere
      // arrivata dopo (loading="lazy") e il viewport è responsive.
      const distance = scroller.scrollHeight - viewport.clientHeight
      if (distance > 1) {
        gsap.to(scroller, { y: -distance, duration: SCROLL_SECONDS, ease: 'power1.inOut', overwrite: true })
        gsap.fromTo(
          bar,
          { scaleX: 0 },
          { scaleX: 1, duration: SCROLL_SECONDS, ease: 'power1.inOut', overwrite: true },
        )
      }
      if (video) void video.play().catch(() => {})
    }

    const onLeave = () => {
      gsap.to(scroller, { y: 0, duration: 0.85, ease: 'power3.out', overwrite: true })
      gsap.to(bar, { scaleX: 0, duration: 0.35, ease: 'power2.out', overwrite: true })
      target.x = 0
      target.y = 0
      start()
      if (video) video.pause()
    }

    // I listener si agganciano e si sganciano seguendo la media query: chi
    // apre stretto e poi allarga la finestra (o attiva il motion ridotto a
    // pagina aperta) ottiene comunque il comportamento giusto, senza ricaricare.
    let attached = false

    const attach = () => {
      if (attached) return
      card.addEventListener('pointerenter', onEnter)
      card.addEventListener('pointerleave', onLeave)
      card.addEventListener('pointermove', onMove)
      attached = true
    }

    const detach = () => {
      if (!attached) return
      card.removeEventListener('pointerenter', onEnter)
      card.removeEventListener('pointerleave', onLeave)
      card.removeEventListener('pointermove', onMove)
      attached = false
      cancelAnimationFrame(raf)
      running = false
      gsap.killTweensOf([scroller, bar])
      gsap.set(scroller, { y: 0 })
      gsap.set(bar, { scaleX: 0 })
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
    queries.forEach((query) => query.addEventListener('change', sync))
    sync()

    return () => {
      queries.forEach((query) => query.removeEventListener('change', sync))
      detach()
    }
  }, [])

  return (
    <article
      ref={cardRef}
      className="lm-card lm-reveal"
      data-work={work.id}
      data-cursor="label"
      style={{ ['--accent' as string]: work.accent }}
    >
      {/* Barra finta del browser. La pillola dell'URL resta anche vuota:
          i domini non sono confermati e non vanno inventati (vedi worksData). */}
      <div className="lm-card-browser">
        <span className="lm-card-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="lm-card-url">{work.url}</span>
      </div>

      {/* Finestra: il media scorre qui dentro */}
      <div className="lm-card-viewport" ref={viewportRef}>
        <div className="lm-card-scroll" ref={scrollRef}>
          {!work.ready ? (
            <div className="lm-card-placeholder" aria-hidden="true">
              <span>{work.client}</span>
            </div>
          ) : media.kind === 'video' ? (
            <video
              className="lm-card-media"
              width={media.width}
              height={media.height}
              poster={media.poster}
              muted
              loop
              playsInline
              preload="none"
            >
              {media.sources.map((source) => (
                <source key={source.src} src={source.src} type={source.type} />
              ))}
            </video>
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element -- screenshot
               full-page altissimo: next/image lo ridimensionerebbe sul lato
               sbagliato. Dimensioni esplicite → nessun layout shift. */
            <img
              className="lm-card-media"
              src={media.src}
              width={media.width}
              height={media.height}
              alt={`Il sito di ${work.client}`}
              loading={index < 2 ? 'eager' : 'lazy'}
              decoding="async"
            />
          )}
        </div>

        <div className="lm-card-progress" aria-hidden="true">
          <span ref={barRef} />
        </div>
        <div className="lm-card-sheen" aria-hidden="true" />
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
