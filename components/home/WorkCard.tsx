'use client'

import { useEffect, useRef } from 'react'
import type { Work } from './worksData'
import BrowserChrome from './BrowserChrome'
import CardFrame from './CardFrame'
import { POINTER_BREAKPOINT, lerp, mouseEffectsEnabled } from './useMotion'

/**
 * Card progetto: dentro la finestra finta scorre il SITO VERO del cliente,
 * caricato in un iframe (vedi CardFrame).
 *
 * Qui restano solo la cornice e gli effetti legati al mouse: inclinazione verso
 * il puntatore e riflesso di luce, quindi solo da 821px in su con puntatore
 * fine. Lo scorrimento vive in CardFrame perché è legato al ciclo di vita
 * dell'iframe, non a quello della card.
 *
 * L'inclinazione sta sulla CARD, non sulla finestra: un transform su un
 * genitore dell'iframe lo renderebbe sfocato. Per questo la cornice interna
 * resta piatta e a inclinarsi è il contenitore esterno.
 */

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
  const barRef = useRef<HTMLSpanElement>(null)

  const openable = work.siteUrl !== ''

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
          <CardFrame work={work} index={index} viewportRef={viewportRef} barRef={barRef} />

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
