'use client'

import Image from 'next/image'
import { useEffect, useRef } from 'react'
import HeroTicker from './HeroTicker'
import { createHeroDriver } from './heroMotion'
import {
  HERO_ENTRANCE_MS,
  HERO_LETTERS,
  HERO_PAYOFF_ACCENT,
  HERO_PAYOFF_LEAD,
  HERO_TITLE,
  HERO_WINDOWS,
} from './heroScene'
import {
  POINTER_BREAKPOINT,
  onAmbientMotionChange,
  onMouseEffectsChange,
  prefersReducedMotion,
  trackPointer,
} from './useMotion'

/**
 * Sezione 1 — Hero.
 *
 * Il protagonista è il wordmark LUMINO gigante. Attorno, intrecciate con le
 * lettere, quattro finestre con gli screenshot veri dei nostri siti: due in
 * alto, più scure e più piccole, quindi lontane; due in basso, più luminose e
 * più grandi, davanti alle lettere.
 *
 * REGOLA COMPOSITIVA — il wordmark possiede la fascia centrale. Le finestre
 * stanno sopra e sotto quella fascia e sfiorano solo le lettere esterne: LUMINO
 * si deve leggere per intero, sempre. Per questo le quattro finestre sono figlie
 * DIRETTE dell'hero e non del contenitore del wordmark: ancorarle a quello le
 * faceva seguire una scatola che cambia misura col testo, ed era il motivo per
 * cui su telefono finivano addosso alle lettere.
 *
 * Niente wrapper attorno alle finestre, per lo stesso motivo per cui non stanno
 * dentro al wordmark: un contenitore posizionato creerebbe un contesto di
 * impilamento, e le due finestre davanti alle lettere non potrebbero più stare
 * davvero davanti.
 *
 * UN SOLO requestAnimationFrame: uscita allo scroll e parallasse sono lo stesso
 * driver (heroMotion.ts), perché muovono gli stessi elementi nello stesso
 * istante. Il loop parte a entrata finita, si ferma quando l'hero esce dal
 * viewport e non esiste affatto con prefers-reduced-motion — lì il CSS mostra
 * la composizione finale, ferma.
 */

export default function Hero() {
  const heroRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return

    const driver = createHeroDriver({
      letters: Array.from(hero.querySelectorAll<HTMLElement>('.lm-hero-ch')),
      windows: Array.from(hero.querySelectorAll<HTMLElement>('.lm-hero-win')),
      bloom: hero.querySelector<HTMLElement>('.lm-hero-bloom'),
      payoff: hero.querySelector<HTMLElement>('.lm-hero-foot'),
      ticker: hero.querySelector<HTMLElement>('.lm-hticker'),
    })

    let raf = 0
    let running = false
    /* Tre condizioni, tutte necessarie: l'entrata deve essere finita (prima
       comanda il CSS), l'hero deve essere in vista, e il movimento deve essere
       ammesso. Basta che una cada e il loop si ferma. */
    let settled = false
    let visible = true
    let motionOk = !prefersReducedMotion()

    const loop = () => {
      driver.update()
      raf = requestAnimationFrame(loop)
    }
    const start = () => {
      if (running || !settled || !visible || !motionOk) return
      running = true
      raf = requestAnimationFrame(loop)
    }
    const stop = () => {
      if (!running) return
      running = false
      cancelAnimationFrame(raf)
    }

    /* Finché l'entrata è in corso comanda il CSS: un'animazione in corso ha la
       precedenza sullo stile inline, quindi scrivere adesso non servirebbe a
       nulla e al termine dell'animazione tornerebbe tutto indietro di scatto.
       `is-settled` stacca le animazioni d'entrata e lascia il campo al driver. */
    const settle = window.setTimeout(() => {
      settled = true
      hero.classList.add('is-settled')
      start()
    }, HERO_ENTRANCE_MS)

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting
        if (visible) start()
        else stop()
      },
      { threshold: 0 },
    )
    observer.observe(hero)

    /* Due percorsi, non uno spento e uno acceso. Su schermo stretto l'uscita
       c'è ma è alleggerita: stessa coreografia, niente sfocatura, corse più
       corte (vedi PROFILES in heroMotion.ts). Con motion ridotto non c'è
       affatto — e va deciso qui, perché il loop parte comunque per il
       parallasse e senza questo veto scriverebbe l'uscita lo stesso. */
    const narrow = window.matchMedia(`(max-width: ${POINTER_BREAKPOINT - 1}px)`)
    const syncExit = () => {
      if (prefersReducedMotion()) driver.setExit('off')
      else driver.setExit(narrow.matches ? 'light' : 'full')
    }
    narrow.addEventListener('change', syncExit)
    syncExit()

    /* Il parallasse è roba da mouse: col dito non esiste il passare sopra
       senza toccare. Il puntatore condiviso si accende solo se serve. */
    let stopPointer: (() => void) | null = null
    const unsubscribePointer = onMouseEffectsChange((enabled) => {
      driver.setParallax(enabled)
      if (enabled && !stopPointer) {
        stopPointer = trackPointer()
      } else if (!enabled && stopPointer) {
        stopPointer()
        stopPointer = null
      }
    })

    const unsubscribeMotion = onAmbientMotionChange((enabled) => {
      motionOk = enabled
      // La preferenza può cambiare a pagina aperta: il profilo va rideciso.
      syncExit()
      if (enabled) {
        start()
      } else {
        stop()
        driver.reset()
      }
    })

    return () => {
      window.clearTimeout(settle)
      observer.disconnect()
      narrow.removeEventListener('change', syncExit)
      unsubscribePointer()
      unsubscribeMotion()
      stopPointer?.()
      stop()
      driver.reset()
    }
  }, [])

  return (
    <section className="lm-hero" id="hero" ref={heroRef}>
      {/* Il bagliore: due nuclei separati e saturi — rosso a sinistra, blu-viola
          a destra — più un centro caldo. Il respiro sta sul nucleo interno e non
          qui, perché su questo elemento scrive il driver dell'uscita: un
          contenitore che si anima da solo non si lascia comandare da fuori. */}
      <div className="lm-hero-bloom" aria-hidden="true">
        <span className="lm-hero-bloom-core" />
      </div>

      <h1 className="lm-hero-word">
        <span className="lm-sr">{HERO_TITLE}</span>
        <span className="lm-hero-letters" aria-hidden="true">
          {HERO_LETTERS.map((letter) => (
            <span className={`lm-hero-ch${letter === 'I' ? ' is-grad' : ''}`} key={letter}>
              {letter}
            </span>
          ))}
        </span>
      </h1>

      {HERO_WINDOWS.map((win) => (
        <div className={`lm-hero-win ${win.slot}`} key={win.slot}>
          <span className="lm-hero-win-bar" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <Image
            src={win.src}
            alt={`${win.client} — sito realizzato da Lumino`}
            width={win.width}
            height={win.height}
            sizes={`(max-width: ${POINTER_BREAKPOINT - 1}px) 42vw, 18vw`}
            /* Tutte e quattro sono in prima schermata: caricate pigramente
               entrerebbero a composizione già finita, lasciando due buchi.
               Il conto è basso comunque — `sizes` fa servire ritagli da
               ~230px, non gli screenshot interi. */
            priority
          />
        </div>
      ))}

      <div className="lm-hero-foot">
        <p className="lm-hero-payoff">
          {HERO_PAYOFF_LEAD}
          <em>{HERO_PAYOFF_ACCENT}</em>
        </p>

        <a className="lm-hero-cta" href="#lavori" data-cursor="grow">
          <span className="lm-hero-cta-ring" aria-hidden="true">
            ↓
          </span>
          Guarda i lavori
        </a>
      </div>

      <HeroTicker />

      <div className="lm-hero-vig" aria-hidden="true" />
      <div className="lm-hero-grain" aria-hidden="true" />
    </section>
  )
}
