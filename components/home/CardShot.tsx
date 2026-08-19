'use client'

import { useEffect, useRef } from 'react'
import type { Work } from './worksData'
import WorkMediaView from './WorkMediaView'
import { gsap, prefersReducedMotion } from './useMotion'

/**
 * Lo screenshot dentro la finestra della card, e il suo movimento.
 *
 * Il comportamento lo decidono le PROPORZIONI dell'immagine, non una
 * configurazione: il codice misura quanto verrebbe alta l'immagine a larghezza
 * piena e sceglie da sé.
 *
 *   · più alta del riquadro  → c'è pagina da scorrere: scorrimento dall'alto
 *     in basso, pausa, risalita, in loop. È il caso degli screenshot full-page.
 *   · alta quanto o meno     → non c'è niente da scorrere: simularlo sarebbe
 *     una bugia. L'immagine viene portata a coprire il riquadro e si muove
 *     appena in orizzontale, con uno zoom quasi impercettibile. È il caso
 *     degli screenshot della sola prima schermata.
 *
 * Sostituendo i file con le versioni full-page — stessi nomi — la prima strada
 * si attiva da sola, senza toccare una riga.
 *
 * Nota sul transform: qui si scala, ed è lecito perché il contenuto è
 * un'immagine. Se il media fosse un <video> lo zoom viene saltato: scalare un
 * wrapper di video è vietato su tutti i progetti.
 */

/* Pagina che scorre. */
const SCROLL_DOWN_S = 12
const HOLD_S = 1
const SCROLL_UP_S = 2
const SCROLL_HOVER = SCROLL_DOWN_S / 5

/* Deriva lenta, quando non c'è nulla da scorrere. */
const DRIFT_S = 26
const DRIFT_HOVER = 1.7
/* Quanto zoom in più oltre la copertura: deve appena respirare. */
const DRIFT_ZOOM = 0.045
/**
 * Quante volte il riquadro deve essere superato perché valga la pena
 * scorrere. Uno screenshot full-page sta fra le 3 e le 6 volte; la sola
 * prima schermata resta molto sotto.
 */
const SCROLLABLE_RATIO = 1.6

export default function CardShot({
  work,
  index,
  viewportRef,
  barRef,
}: {
  work: Work
  index: number
  viewportRef: React.RefObject<HTMLDivElement>
  barRef: React.RefObject<HTMLSpanElement>
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const viewport = viewportRef.current
    const scroller = scrollRef.current
    if (!viewport || !scroller) return

    const isVideo = work.media.kind === 'video'
    const ratio = work.media.height / work.media.width
    let timeline: gsap.core.Timeline | null = null
    const reduced = prefersReducedMotion()

    const build = () => {
      timeline?.kill()
      timeline = null

      const vw = viewport.clientWidth
      const vh = viewport.clientHeight
      if (vw === 0 || vh === 0) return

      // Quanto sarebbe alta l'immagine occupando tutta la larghezza.
      const naturalH = vw * ratio
      const bar = barRef.current

      // Soglia larga, e non un semplice "più alta": un centinaio di pixel di
      // eccedenza non è una pagina da scorrere, è un ritaglio un po' più alto
      // del riquadro — scorrerlo simulerebbe una pagina che non c'è. Uno
      // screenshot full-page supera il riquadro di tre o più volte, quindi
      // questa soglia la passa senza incertezze.
      if (naturalH > vh * SCROLLABLE_RATIO) {
        // ── C'è pagina da scorrere ──────────────────────────────────────────
        gsap.set(scroller, { scale: 1, x: 0, y: 0 })
        const travel = naturalH - vh
        if (reduced) return

        const duration = SCROLL_DOWN_S + index * 1.6
        timeline = gsap
          .timeline({ repeat: -1 })
          .to(scroller, { y: -travel, duration, ease: 'none' })
          .to(scroller, { y: -travel, duration: HOLD_S })
          .to(scroller, { y: 0, duration: SCROLL_UP_S, ease: 'power2.inOut' })

        if (bar) {
          timeline
            .fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration, ease: 'none' }, 0)
            .to(bar, { scaleX: 0, duration: SCROLL_UP_S, ease: 'power2.inOut' }, duration + HOLD_S)
        }
        timeline.progress((index * 0.19) % 1)
        timeline.timeScale(1)
        scroller.dataset.mode = 'scroll'
        return
      }

      // ── Niente da scorrere: coprire il riquadro e derivare appena ─────────
      scroller.dataset.mode = 'drift'
      // La barra di avanzamento non ha senso senza una pagina da percorrere.
      if (bar) gsap.set(bar, { scaleX: 0 })

      // Da che parte c'è margine per muoversi dipende da come l'immagine
      // riempie il riquadro, e cambia col cambiare della sua forma:
      //   · più bassa del riquadro → va ingrandita per coprirlo, e il margine
      //     che avanza è ai lati: deriva orizzontale
      //   · già più alta → copre da sola, e il margine è sopra e sotto:
      //     deriva verticale, corta
      // Lo zoom non si applica ai video: scalare un wrapper di video è vietato.
      const vertical = naturalH >= vh
      const scale = isVideo || vertical ? 1 : (vh / naturalH) * (1 + DRIFT_ZOOM)
      const slack = vertical ? naturalH - vh : Math.max(0, vw * scale - vw)
      const axis = vertical ? 'y' : 'x'
      const from = vertical ? 0 : slack / 2
      const to = vertical ? -slack : -slack / 2

      gsap.set(scroller, { scale, x: 0, y: 0, transformOrigin: 'center center', [axis]: from })
      if (reduced || slack < 6) return

      timeline = gsap.timeline({ repeat: -1, yoyo: true }).fromTo(
        scroller,
        { [axis]: from, scale },
        {
          [axis]: to,
          scale: isVideo ? 1 : scale * 1.02,
          duration: DRIFT_S + index * 3,
          ease: 'sine.inOut',
        },
      )
      timeline.progress((index * 0.23) % 1)
    }

    build()

    // Fuori dal viewport si mette in pausa: cinque animazioni che girano a
    // vuoto lungo tutta la pagina non le vede nessuno e si pagano lo stesso.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) timeline?.play()
        else timeline?.pause()
      },
      { rootMargin: '200px 0px', threshold: 0 },
    )
    observer.observe(viewport)

    const resize = new ResizeObserver(build)
    resize.observe(viewport)

    const card = viewport.closest('.lm-card')
    const boost = () =>
      timeline?.timeScale(scroller.dataset.mode === 'scroll' ? SCROLL_HOVER : DRIFT_HOVER)
    const calm = () => timeline?.timeScale(1)
    card?.addEventListener('pointerenter', boost)
    card?.addEventListener('pointerleave', calm)

    return () => {
      observer.disconnect()
      resize.disconnect()
      card?.removeEventListener('pointerenter', boost)
      card?.removeEventListener('pointerleave', calm)
      timeline?.kill()
      gsap.set(scroller, { clearProps: 'transform' })
      if (barRef.current) gsap.set(barRef.current, { scaleX: 0 })
    }
  }, [work.media, index, viewportRef, barRef])

  return (
    <div className="lm-card-scroll" ref={scrollRef}>
      <WorkMediaView work={work} eager={index < 2} />
    </div>
  )
}
