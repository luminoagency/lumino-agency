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

    /* Solo `opacity` e `y`, cioè solo trasformazioni.
       Qui c'era anche un `filter: blur(9px)` che si apriva: l'idea era bella —
       le card mettevano a fuoco — ma il blur non è una proprietà che la GPU sa
       comporre, quindi per ogni fotogramma dell'entrata il browser doveva
       rasterizzare di nuovo ognuna delle dodici card, sopra un pannello già
       sfocato. Era il mezzo secondo più costoso della pagina, ed era il mezzo
       secondo in cui si guardava. */
    const tween = gsap.fromTo(
      items,
      { opacity: 0, y: 18 },
      {
        opacity: 1,
        y: 0,
        duration: 0.55,
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
