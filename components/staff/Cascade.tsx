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

    /* Niente animazione se non si può vedere: con `prefers-reduced-motion`
       perché è stato chiesto, e in una scheda in secondo piano perché lì
       requestAnimationFrame non gira — GSAP si fermerebbe a metà dissolvenza e
       tornando sulla scheda si troverebbero card semitrasparenti. */
    if (prefersReducedMotion() || document.visibilityState === 'hidden') {
      items.forEach((item) => {
        item.style.opacity = '1'
      })
      return
    }

    const tween = gsap.fromTo(
      items,
      /* Il blur in entrata: le card arrivano come se stessero mettendo a
         fuoco. Su un pannello di vetro è il movimento giusto — e costa un
         filtro solo per mezzo secondo, non una proprietà animata per sempre. */
      { opacity: 0, y: 18, filter: 'blur(9px)' },
      {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: 0.62,
        ease: 'power2.out',
        stagger: 0.05,
        clearProps: 'transform,filter',
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
