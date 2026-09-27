'use client'

import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from '@/components/home/useMotion'

/**
 * L'inclinazione e il riflesso che seguono il puntatore.
 *
 * Serve a una cosa sola: far sentire che le card sono **oggetti di vetro** e
 * non rettangoli stampati. L'inclinazione è minuscola (4 gradi al massimo) —
 * oltre diventa un giocattolo, e una dashboard di lavoro non si inclina come
 * una carta collezionabile.
 *
 * Scrive due variabili CSS (`--mx`, `--my`) che il foglio usa per posizionare
 * il riflesso: così il gradiente vive nel CSS, dove si può cambiare senza
 * ricompilare, e il JS fa solo il mestiere che il CSS non sa fare — sapere
 * dov'è il mouse.
 *
 * Tocca il DOM direttamente e non passa da uno stato React: un `setState` per
 * ogni `pointermove` rirenderizzerebbe l'albero decine di volte al secondo per
 * muovere un'ombra.
 *
 * Solo dove c'è un puntatore fine: su un telefono non esiste l'hover, e
 * l'inclinazione resterebbe incastrata dopo il primo tocco.
 */
export default function Tilt({
  children,
  className,
  max = 4,
}: {
  children: React.ReactNode
  className?: string
  /** Gradi massimi di inclinazione. */
  max?: number
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (prefersReducedMotion()) return
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return

    const carte = () => Array.from(el.querySelectorAll<HTMLElement>('[data-hover]'))

    function muovi(event: PointerEvent) {
      for (const card of carte()) {
        const r = card.getBoundingClientRect()
        const dentro =
          event.clientX >= r.left &&
          event.clientX <= r.right &&
          event.clientY >= r.top &&
          event.clientY <= r.bottom

        if (!dentro) {
          card.style.transform = ''
          continue
        }

        const px = (event.clientX - r.left) / r.width
        const py = (event.clientY - r.top) / r.height
        card.style.setProperty('--mx', `${px * 100}%`)
        card.style.setProperty('--my', `${py * 100}%`)
        card.style.transform = `perspective(900px) rotateX(${(0.5 - py) * max}deg) rotateY(${(px - 0.5) * max}deg)`
        card.style.transition = 'transform 0.18s ease-out, box-shadow 0.45s var(--ease)'
      }
    }

    function esci() {
      for (const card of carte()) {
        card.style.transform = ''
        card.style.transition = 'transform 0.6s var(--ease), box-shadow 0.45s var(--ease)'
      }
    }

    window.addEventListener('pointermove', muovi, { passive: true })
    el.addEventListener('pointerleave', esci)
    return () => {
      window.removeEventListener('pointermove', muovi)
      el.removeEventListener('pointerleave', esci)
    }
  }, [max])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
