'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'
import {
  ScrollTrigger,
  gsap,
  prefersReducedMotion,
  registerScroller,
  registerScrollTrigger,
} from './useMotion'

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

    /* Chi deve muovere la pagina da codice deve passare da Lenis, non da
       window.scrollTo: quello nativo viene annullato al fotogramma dopo. */
    registerScroller(lenis)

    const onScroll = () => ScrollTrigger.update()
    lenis.on('scroll', onScroll)

    // ANCHE l'evento nativo, non solo quello di Lenis.
    //
    // Lenis emette il proprio evento quando è lui a muovere la pagina, ma uno
    // scroll fatto da codice — `scrollIntoView` di un'ancora, il salto del menu,
    // un ripristino di posizione del browser — cambia lo scroll senza passare
    // da lui. In quei casi ScrollTrigger non veniva avvisato e restava fermo:
    // la sezione pinnata smetteva di essere pinnata e lo scrub non partiva.
    window.addEventListener('scroll', onScroll, { passive: true })

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

    /* E soprattutto: a ogni volta che la pagina cambia altezza.
     *
     * ScrollTrigger misura una volta dove comincia e dove finisce ogni
     * effetto. Se dopo quella misura la pagina si allunga — un'immagine che
     * arriva, una sezione che si apre, un blocco che cresce — quelle posizioni
     * restano riferite a una pagina che non esiste più, e la sezione pinnata
     * smette semplicemente di pinnare. Non è un caso di scuola: è successo
     * appena la home è cresciuta di un paio di sezioni.
     *
     * Il ricalcolo è rimandato di un attimo perché un cambio di altezza arriva
     * spesso a raffica, e rifare i conti a ogni singolo passo costerebbe più
     * dell'aggiornamento stesso. */
    let settle = 0
    let lastHeight = document.documentElement.scrollHeight
    const watchHeight = new ResizeObserver(() => {
      const height = document.documentElement.scrollHeight
      if (Math.abs(height - lastHeight) < 4) return
      lastHeight = height
      window.clearTimeout(settle)
      settle = window.setTimeout(() => ScrollTrigger.refresh(), 180)
    })
    watchHeight.observe(document.body)

    return () => {
      registerScroller(null)
      window.clearTimeout(fallback)
      window.clearTimeout(settle)
      watchHeight.disconnect()
      locks.disconnect()
      lenis.off('scroll', onScroll)
      window.removeEventListener('scroll', onScroll)
      gsap.ticker.remove(raf)
      gsap.ticker.lagSmoothing(500, 33)
      lenis.destroy()
    }
  }, [])

  return null
}
