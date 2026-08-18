'use client'

import { useEffect } from 'react'
import { prefersReducedMotion } from './useMotion'

/**
 * Reveal allo scroll per ogni .lm-reveal della pagina.
 *
 * IntersectionObserver, mai animazioni che partono fuori viewport: un elemento
 * entra solo quando è davvero visibile, e viene subito smesso di osservare.
 *
 * Marca il contenitore con .lm-js-ready: è quella classe ad attivare lo stato
 * iniziale nascosto in home.css. Senza JS non viene mai aggiunta e tutto resta
 * visibile — il contenuto non dipende dall'animazione per esistere.
 */
export default function Reveal({ scopeSelector = '.lm' }: { scopeSelector?: string }) {
  useEffect(() => {
    const scope = document.querySelector(scopeSelector)
    if (!scope) return

    const targets = Array.from(scope.querySelectorAll<HTMLElement>('.lm-reveal'))

    if (prefersReducedMotion()) {
      targets.forEach((el) => el.classList.add('is-in'))
      return
    }

    scope.classList.add('lm-js-ready')

    // Scaglionamento leggero: elementi vicini non entrano tutti insieme.
    targets.forEach((el, i) => {
      el.style.transitionDelay = `${(i % 4) * 0.06}s`
    })

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('is-in')
          observer.unobserve(entry.target)
        })
      },
      { threshold: 0.14 },
    )

    targets.forEach((el) => observer.observe(el))

    return () => {
      observer.disconnect()
      scope.classList.remove('lm-js-ready')
    }
  }, [scopeSelector])

  return null
}
