'use client'

import { useEffect, useRef } from 'react'
import { gsap, prefersReducedMotion } from '@/components/home/useMotion'

/**
 * Le card che entrano a cascata.
 *
 * Anima ogni discendente marcato `data-reveal`, in ordine di documento, con
 * uno stagger corto (50ms): abbastanza per leggere una direzione, troppo poco
 * per far aspettare chi sta lavorando.
 *
 * Lo stato di partenza (opacity 0) lo dichiara il CSS sulla classe `lm-in`, non
 * questo effetto: se il JS arriva un istante dopo il primo dipinto, le card non
 * lampeggiano già a posto per poi rifare l'entrata.
 */
export default function Cascade({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const items = Array.from(el.querySelectorAll<HTMLElement>('[data-reveal]'))
    if (!items.length) return

    if (prefersReducedMotion()) {
      items.forEach((item) => {
        item.style.opacity = '1'
      })
      return
    }

    const tween = gsap.fromTo(
      items,
      { opacity: 0, y: 18 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: 'power2.out',
        stagger: 0.05,
        clearProps: 'transform',
      },
    )

    return () => {
      tween.kill()
    }
  }, [])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
