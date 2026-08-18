'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Chars, Line } from './splitText'
import HeroBlobs from './HeroBlobs'
import HeroWindows from './HeroWindows'
import HeroTicker from './HeroTicker'
import RotatingWord from './RotatingWord'
import {
  createBlobsDriver,
  createLettersDriver,
  createSparksDriver,
  createWindowsDriver,
  type Driver,
} from './heroMotion'
import { onMouseEffectsChange, pointer, trackPointer } from './useMotion'

/**
 * Sezione 1 — Hero.
 *
 * Layout volutamente NON a due colonne e senza media incolonnato a destra: il
 * titolo occupa la larghezza, ancorato in basso, e tutto il resto — blob
 * liquidi, finestre, scintille — sta sparso dietro di lui.
 * (Vincolo permanente di progetto.)
 *
 * UN SOLO requestAnimationFrame per tutto. I quattro effetti sono driver
 * (vedi heroMotion.ts) che ricevono lo stesso stato del frame: quattro loop
 * separati si contenderebbero lo stesso budget senza mai vedere lo stesso
 * istante. Il loop non parte affatto sotto 821px o con motion ridotto, e si
 * ferma quando l'hero esce dal viewport.
 */

export const HERO_TITLE = 'Diamo forma al sito che il tuo brand merita.'

export default function Hero() {
  const heroRef = useRef<HTMLElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const blobsRef = useRef<HTMLDivElement>(null)
  const winsRef = useRef<HTMLDivElement>(null)
  const lettersRef = useRef<Driver | null>(null)

  const [active, setActive] = useState(true)

  // Dopo ogni cambio della parola rotante il titolo ha lettere nuove:
  // il driver deve riprenderle, altrimenti smettono di reagire al cursore.
  const handleWordChange = useCallback(() => {
    lettersRef.current?.refresh?.()
  }, [])

  useEffect(() => {
    const hero = heroRef.current
    const title = titleRef.current
    const canvas = canvasRef.current
    const blobs = blobsRef.current
    const wins = winsRef.current
    if (!hero || !title || !canvas || !blobs || !wins) return

    let drivers: Driver[] = []
    let raf = 0
    let live = false
    let visible = true
    let stopPointer: (() => void) | null = null
    let started = 0

    // Velocità di scroll: accumulata dal listener, smorzata nel loop.
    let scrollVel = 0
    let lastScroll = window.scrollY
    const onScroll = () => {
      scrollVel += window.scrollY - lastScroll
      lastScroll = window.scrollY
    }

    const tick = (now: number) => {
      if (visible) {
        const state = {
          pointerX: pointer.x,
          pointerY: pointer.y,
          scrollVel,
          time: now - started,
        }
        for (const driver of drivers) driver.update(state)
      }
      // Smorzamento fuori dal blocco: da fermi i blob devono tornare a fondersi
      // anche mentre l'hero è appena uscito dal viewport.
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

      drivers = [
        letters,
        createSparksDriver(canvas, hero),
        createBlobsDriver(blobs, Array.from(blobs.querySelectorAll<HTMLElement>('.lm-blob'))),
        createWindowsDriver(wins, Array.from(wins.querySelectorAll<HTMLElement>('.lm-hwin'))),
      ]

      lastScroll = window.scrollY
      window.addEventListener('scroll', onScroll, { passive: true })
      hero.classList.add('is-live')
      raf = requestAnimationFrame(tick)
    }

    const disable = () => {
      if (!live) return
      live = false
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      hero.classList.remove('is-live')
      drivers.forEach((driver) => {
        driver.reset()
        driver.destroy?.()
      })
      drivers = []
      lettersRef.current = null
      stopPointer?.()
      stopPointer = null
    }

    const unsubscribe = onMouseEffectsChange((enabled) => (enabled ? enable() : disable()))

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
        <div ref={winsRef}>
          <HeroWindows />
        </div>
        <canvas className="lm-hero-canvas" ref={canvasRef} />
      </div>

      <div className="lm-wrap">
        <h1 className="lm-display lm-d1 lm-hero-title" ref={titleRef} aria-label={HERO_TITLE}>
          <Line segments={[{ text: 'Diamo forma', variant: 'thin' }]} />
          <Line segments={[{ text: 'al sito che il' }]} />
          <Line>
            <Chars text="tuo " />
            <RotatingWord active={active} onChange={handleWordChange} />
            <Chars text=" " />
            <Chars text="merita." variant="grad" />
          </Line>
        </h1>

        <div className="lm-hero-foot">
          <p className="lm-hero-sub">
            Studio digitale. Progettiamo e costruiamo siti per chi ha qualcosa di
            vero da mostrare: ristoranti, hotel, aziende, retail, immobiliare.
          </p>

          <div className="lm-hero-actions">
            <a className="lm-hero-scroll" href="#lavori" data-cursor="grow">
              Guarda i lavori
              <span className="lm-hero-scroll-line" aria-hidden="true" />
            </a>
            <span className="lm-playhint">passa sopra il titolo — reagisce</span>
          </div>
        </div>
      </div>

      <HeroTicker />
    </section>
  )
}
