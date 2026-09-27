'use client'

import { useEffect, useRef } from 'react'
import { gsap, prefersReducedMotion } from '@/components/home/useMotion'

/**
 * Un numero che conta.
 *
 * Il valore finale è nel markup dal primo dipinto (niente "0" servito dal
 * server che poi salta al numero vero, e niente numero mancante se il JS non
 * parte): il conteggio lo riscrive, poi lo rimette esatto.
 *
 * La formattazione passa da Intl a ogni fotogramma perché i separatori delle
 * migliaia devono restare al posto giusto mentre il numero cresce — con un
 * toFixed si vedrebbe "1234" e poi, all'ultimo frame, "1.234".
 */
export default function KpiNumber({
  value,
  format = 'int',
  size = 'md',
}: {
  value: number
  format?: 'int' | 'euro'
  size?: 'md' | 'xl'
}) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion() || value === 0) return

    const state = { n: 0 }
    const tween = gsap.to(state, {
      n: value,
      duration: Math.min(1.5, 0.6 + Math.abs(value) / 4000),
      ease: 'power2.out',
      onUpdate: () => {
        el.textContent = render(state.n, format)
      },
      onComplete: () => {
        el.textContent = render(value, format)
      },
    })

    return () => {
      tween.kill()
    }
  }, [value, format])

  return (
    <span ref={ref} className={`lm-staff-num lm-staff-num-${size}`}>
      {render(value, format)}
    </span>
  )
}

function render(value: number, format: 'int' | 'euro'): string {
  if (format === 'euro') {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
      useGrouping: true,
    }).format(Math.round(value))
  }
  return new Intl.NumberFormat('it-IT', { useGrouping: true }).format(Math.round(value))
}
