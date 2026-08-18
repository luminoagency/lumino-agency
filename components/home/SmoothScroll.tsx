'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'
import { ScrollTrigger, gsap, prefersReducedMotion, registerScrollTrigger } from './useMotion'

/**
 * Smooth scroll (Lenis) collegato a ScrollTrigger.
 *
 * Non è una decorazione: senza questo collegamento il pin della sezione "Il
 * design" scatta. Lenis anima lo scroll per conto suo, quindi ScrollTrigger
 * deve aggiornarsi sul suo evento e non su quello nativo, e il raf di Lenis
 * deve girare dentro il ticker di GSAP — altrimenti i due avanzano in momenti
 * diversi dello stesso frame e il contenuto pinnato trema.
 *
 * `lagSmoothing(0)` disattiva la compensazione automatica di GSAP: con lo
 * scroll scrubbato, un frame lungo va assorbito, non recuperato con un salto.
 *
 * Con prefers-reduced-motion Lenis non parte affatto: lo scroll resta quello
 * del browser, che è esattamente ciò che quella preferenza chiede.
 */
export default function SmoothScroll() {
  useEffect(() => {
    if (prefersReducedMotion()) return

    registerScrollTrigger()

    const lenis = new Lenis({
      duration: 1.05,
      // Poco più che lineare in coda: lo scroll deve sembrare pesante, non molle.
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    })

    const onScroll = () => ScrollTrigger.update()
    lenis.on('scroll', onScroll)

    const raf = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    // I pannelli a tutto schermo (menu, finestra dei lavori) bloccano lo scroll
    // con una classe sul body. Lenis ascolta la rotellina sulla finestra, quindi
    // `overflow: hidden` da solo non lo ferma: va fermato lui.
    const syncLock = () => {
      if (document.body.classList.contains('lm-lock')) lenis.stop()
      else lenis.start()
    }
    const locks = new MutationObserver(syncLock)
    locks.observe(document.body, { attributes: true, attributeFilter: ['class'] })
    syncLock()

    // I font cambiano le altezze: un pin calcolato prima del loro arrivo
    // finisce sulle misure sbagliate.
    let refreshed = false
    const refresh = () => {
      if (refreshed) return
      refreshed = true
      ScrollTrigger.refresh()
    }
    document.fonts?.ready.then(refresh).catch(() => {})
    const fallback = window.setTimeout(refresh, 2500)

    return () => {
      window.clearTimeout(fallback)
      locks.disconnect()
      lenis.off('scroll', onScroll)
      gsap.ticker.remove(raf)
      gsap.ticker.lagSmoothing(500, 33)
      lenis.destroy()
    }
  }, [])

  return null
}
