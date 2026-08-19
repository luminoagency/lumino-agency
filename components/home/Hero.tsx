'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Chars, Line } from './splitText'
import HeroBlobs from './HeroBlobs'
import HeroTicker from './HeroTicker'
import RotatingWord from './RotatingWord'
import {
  WAVE_LIFE,
  createBlobsDriver,
  createLettersDriver,
  createSparksDriver,
  type Driver,
  type Wave,
} from './heroMotion'
import { onMouseEffectsChange, pointer, trackPointer } from './useMotion'

/**
 * Sezione 1 — Hero.
 *
 * Il titolo occupa la larghezza piena e quasi tutta l'altezza della prima
 * schermata; dietro non ci sono immagini, solo blob liquidi e scintille.
 * Nessuna colonna media a destra: quel layout è vietato in modo permanente.
 *
 * UN SOLO requestAnimationFrame per tutto. I tre effetti sono driver (vedi
 * heroMotion.ts) che ricevono lo stesso stato del frame — puntatore, velocità
 * di scroll, tempo e onde attive — così reagiscono tutti alla stessa
 * perturbazione nello stesso istante. Il loop non parte sotto 821px o con
 * motion ridotto, e si ferma quando l'hero esce dal viewport.
 */

export const HERO_TITLE = 'Diamo forma al sito che il tuo brand merita.'

export default function Hero() {
  const heroRef = useRef<HTMLElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const blobsRef = useRef<HTMLDivElement>(null)
  const lettersRef = useRef<Driver | null>(null)

  const [active, setActive] = useState(true)
  /* Gli effetti mouse sono accesi? Governa anche il puntino d'invito: senza
     puntatore non c'è niente da invitare a fare. */
  const [effects, setEffects] = useState(false)
  /* idle → pulsa piano · nudge → una singola oscillazione più marcata dopo
     sei secondi di inattività · gone → l'utente ha interagito, sparisce e non
     torna più. */
  const [hint, setHint] = useState<'idle' | 'nudge' | 'gone'>('idle')

  // Dopo ogni cambio del gruppo rotante il titolo ha lettere nuove: il driver
  // deve riprenderle e rimisurarne le posizioni di riposo.
  const handleWordChange = useCallback(() => {
    lettersRef.current?.refresh?.()
  }, [])

  /* Dopo sei secondi senza che nessuno abbia toccato, il puntino fa una
     singola oscillazione più marcata e torna calmo. Non insiste oltre: se non
     è bastata quella, insistere diventa fastidio. */
  const nudgedRef = useRef(false)

  useEffect(() => {
    if (!effects || nudgedRef.current) return

    const nudge = window.setTimeout(() => {
      nudgedRef.current = true
      setHint((current) => (current === 'idle' ? 'nudge' : current))
      // Torna calmo da solo. Una sola volta: insistere oltre diventa fastidio.
      window.setTimeout(() => setHint((current) => (current === 'nudge' ? 'idle' : current)), 900)
    }, 6000)

    return () => window.clearTimeout(nudge)
  }, [effects])

  useEffect(() => {
    const hero = heroRef.current
    const title = titleRef.current
    const canvas = canvasRef.current
    const blobs = blobsRef.current
    if (!hero || !title || !canvas || !blobs) return

    let drivers: Driver[] = []
    let sparks: Driver | null = null
    let raf = 0
    let live = false
    let visible = true
    let stopPointer: (() => void) | null = null
    let started = 0
    let waves: Wave[] = []

    let scrollVel = 0
    let lastScroll = window.scrollY
    const onScroll = () => {
      scrollVel += window.scrollY - lastScroll
      lastScroll = window.scrollY
    }

    // Il click non disegna un cerchio sopra: genera una perturbazione che
    // lettere, blob e scintille leggono dallo stato del frame.
    const onDown = (event: PointerEvent) => {
      const now = performance.now() - started
      waves.push({ x: event.clientX, y: event.clientY, born: now })
      sparks?.burst?.(event.clientX, event.clientY)
      // Ha toccato: l'invito ha esaurito il suo compito e non torna più.
      setHint('gone')
    }

    const tick = (now: number) => {
      const time = now - started
      // Le onde esaurite escono dalla lista: nessuno deve continuare a
      // interrogare un fronte che non esiste più.
      if (waves.length) waves = waves.filter((w) => time - w.born <= WAVE_LIFE)

      if (visible) {
        const state = { pointerX: pointer.x, pointerY: pointer.y, scrollVel, time, waves }
        for (const driver of drivers) driver.update(state)
      }
      scrollVel *= 0.9
      raf = requestAnimationFrame(tick)
    }

    const enable = () => {
      if (live) return
      live = true
      started = performance.now()
      stopPointer = trackPointer()

      const letters = createLettersDriver(title)
      lettersRef.current = letters
      sparks = createSparksDriver(canvas)

      drivers = [
        letters,
        sparks,
        createBlobsDriver(blobs, Array.from(blobs.querySelectorAll<HTMLElement>('.lm-blob'))),
      ]

      lastScroll = window.scrollY
      window.addEventListener('scroll', onScroll, { passive: true })
      hero.addEventListener('pointerdown', onDown)
      hero.classList.add('is-live')
      raf = requestAnimationFrame(tick)
    }

    const disable = () => {
      if (!live) return
      live = false
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      hero.removeEventListener('pointerdown', onDown)
      hero.classList.remove('is-live')
      drivers.forEach((driver) => {
        driver.reset()
        driver.destroy?.()
      })
      drivers = []
      sparks = null
      lettersRef.current = null
      waves = []
      stopPointer?.()
      stopPointer = null
    }

    const unsubscribe = onMouseEffectsChange((enabled) => {
      setEffects(enabled)
      return enabled ? enable() : disable()
    })

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting
        setActive(entry.isIntersecting)
        if (!visible) drivers.forEach((driver) => driver.reset())
      },
      { threshold: 0 },
    )
    observer.observe(hero)

    return () => {
      unsubscribe()
      observer.disconnect()
      disable()
    }
  }, [])

  return (
    <section className="lm-hero" id="hero" ref={heroRef}>
      <div className="lm-hero-bg" aria-hidden="true">
        <div ref={blobsRef}>
          <HeroBlobs />
        </div>
        <canvas className="lm-hero-canvas" ref={canvasRef} />
      </div>

      <div className="lm-wrap lm-hero-inner">
        <h1 className="lm-display lm-hero-title" ref={titleRef} aria-label={HERO_TITLE}>
          <Line segments={[{ text: 'Diamo forma', variant: 'thin' }]} />
          <Line segments={[{ text: 'al sito che' }]} />
          <Line>
            <RotatingWord active={active} onChange={handleWordChange} />
            <Chars text=" " />
            <Chars text="merita." variant="grad" />
          </Line>
        </h1>

        {/* Invito senza istruzioni: un puntino che pulsa vicino al titolo.
            Chi lo nota tocca, e scopre da sé che le lettere si trascinano.
            Sparisce al primo tocco e non torna. */}
        {effects && hint !== 'gone' ? (
          <span
            className={`lm-hint${hint === 'nudge' ? ' is-nudge' : ''}`}
            aria-hidden="true"
          />
        ) : null}

        <div className="lm-hero-foot">
          <p className="lm-hero-sub">
            Progettiamo e costruiamo. Il resto lo stai già vedendo.
          </p>

          <div className="lm-hero-actions">
            <a className="lm-hero-scroll" href="#lavori" data-cursor="grow">
              Guarda i lavori
              <span className="lm-hero-scroll-line" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>

      <HeroTicker />
    </section>
  )
}
