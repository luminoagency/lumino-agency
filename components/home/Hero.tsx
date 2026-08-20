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
    /* L'entrata è finita (o è stata interrotta)? Finché non lo è, comanda il
       CSS: un'animazione in corso ha la precedenza sullo stile inline, quindi
       il driver può anche scrivere ma non si vede nulla. */
    let settled = false
    let visible = true
    let motionOk = !prefersReducedMotion()

    /**
     * Chiude l'entrata, subito.
     *
     * `is-settled` toglie le animazioni d'ingresso (`animation: none`) e mette
     * gli elementi al loro stato d'arrivo. Da quel momento lo stile inline del
     * driver ha via libera.
     *
     * Si chiama al primo pixel di scroll, non a fine entrata: erano due cose
     * che si contendevano le stesse proprietà, e vinceva sempre l'animazione.
     * Chi scrollava mentre l'hero stava ancora entrando non vedeva succedere
     * niente finché l'entrata non finiva da sola — e non era una questione di
     * durate, era la cascata.
     *
     * `driver.update()` alla fine e non al prossimo fotogramma: così la scena
     * passa dallo stato d'arrivo alla posizione che le compete per lo scroll
     * corrente dentro lo STESSO frame, e non si vede lampeggiare la
     * composizione ferma prima che l'uscita la sposti.
     */
    const settleNow = () => {
      if (settled) return
      settled = true
      window.clearTimeout(settle)
      hero.classList.add('is-settled')
      start()
      driver.update()
    }

    const loop = () => {
      /* Il primo pixel di scroll chiude l'entrata. La condizione sta qui e non
         in un listener perché il loop gira già: un secondo ascoltatore dello
         stesso numero è solo un'altra cosa che può disallinearsi. */
      if (!settled && window.scrollY > 0) settleNow()
      driver.update()
      raf = requestAnimationFrame(loop)
    }
    /* Il loop parte SENZA aspettare l'entrata: è lui che si accorge dello
       scroll. Finché l'entrata è in corso non dipinge nulla di visibile — al
       progresso zero esce subito — ma è vivo e pronto. */
    const start = () => {
      if (running || !visible || !motionOk) return
      running = true
      raf = requestAnimationFrame(loop)
    }
    const stop = () => {
      if (!running) return
      running = false
      cancelAnimationFrame(raf)
    }

    /* Se nessuno scrolla, l'entrata finisce per conto suo e a quel punto va
       comunque staccata: da lì in poi il campo è del driver. */
    const settle = window.setTimeout(settleNow, HERO_ENTRANCE_MS)

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

    /* Chi ricarica a metà pagina non deve vedere un'entrata: è già oltre.
       Si chiude qui, prima del primo fotogramma, così l'hero compare già nello
       stato che gli compete per la posizione in cui si trova. Va dopo
       syncExit(), altrimenti il primo dipinto userebbe il profilo sbagliato. */
    if (window.scrollY > 0) settleNow()

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
