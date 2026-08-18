'use client'

import { useEffect, useRef, useState } from 'react'
import { registerScrollTrigger, ScrollTrigger } from './useMotion'

/**
 * Sezione 6 — Il design: colonna media sticky a sinistra (72vh), tre blocchi di
 * testo che scorrono a destra. Il media cambia in sincrono col blocco attivo.
 *
 * REGOLA CRITICA (vale su tutti i progetti):
 * nessun transform: scale() su un elemento che avvolge un <video>.
 * Il passaggio fra i tre livelli è SOLO un crossfade di opacity — vedi
 * .lm-process-layer in home.css. Se serve movimento, va messo dentro la clip
 * in fase di export, non in CSS.
 *
 * La sincronizzazione non è un'animazione: resta attiva anche con
 * prefers-reduced-motion, dove il crossfade diventa uno scambio istantaneo.
 */

interface Step {
  num: string
  title: string
  body: string
  /** Sorgenti video. Vuoto finché le clip non sono in /public/motion/. */
  ready: boolean
  poster?: string
  sources?: { src: string; type: string }[]
}

/*  TODO ASSET — clip da produrre, 6–8 secondi, mute, loop senza stacco,
    verticali 4:5, WebM + MP4 di fallback, da mettere in /public/motion/:

      design-hero.webm     design-hero.mp4     design-hero.jpg    (poster)
      design-motion.webm   design-motion.mp4   design-motion.jpg
      design-mobile.webm   design-mobile.mp4   design-mobile.jpg

    Il movimento va esportato DENTRO la clip: qui non si scala nulla.
    Quando arrivano: ready: true e il markup <video> qui sotto entra in
    funzione senza altre modifiche.  */

export const PROCESS_STEPS: Step[] = [
  {
    num: '01',
    title: 'Hero immersivo',
    body: 'La prima schermata deve dire dove sei e perché restare. Nessuna promessa generica: una scena, una frase, un motivo per scendere.',
    ready: false,
    poster: '/motion/design-hero.jpg',
    sources: [
      { src: '/motion/design-hero.webm', type: 'video/webm' },
      { src: '/motion/design-hero.mp4', type: 'video/mp4' },
    ],
  },
  {
    num: '02',
    title: 'Motion su misura',
    body: 'Il movimento è al servizio della lettura. Accompagna lo sguardo dove serve, e sparisce quando ha finito il suo lavoro.',
    ready: false,
    poster: '/motion/design-motion.jpg',
    sources: [
      { src: '/motion/design-motion.webm', type: 'video/webm' },
      { src: '/motion/design-motion.mp4', type: 'video/mp4' },
    ],
  },
  {
    num: '03',
    title: 'Mobile first',
    body: 'La maggior parte di chi ti cerca ha una mano sola libera. Il telefono non è una riduzione del sito: è il sito.',
    ready: false,
    poster: '/motion/design-mobile.jpg',
    sources: [
      { src: '/motion/design-mobile.webm', type: 'video/webm' },
      { src: '/motion/design-mobile.mp4', type: 'video/mp4' },
    ],
  },
]

const FALLBACK_TINT = ['var(--bordeaux)', 'var(--blue)', 'var(--violet)']

export default function Process() {
  const [active, setActive] = useState(0)
  const stepsRef = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    registerScrollTrigger()

    const triggers = stepsRef.current
      .filter((el): el is HTMLDivElement => el !== null)
      .map((el, i) =>
        ScrollTrigger.create({
          trigger: el,
          start: 'top 62%',
          end: 'bottom 38%',
          onEnter: () => setActive(i),
          onEnterBack: () => setActive(i),
        }),
      )

    return () => triggers.forEach((trigger) => trigger.kill())
  }, [])

  return (
    <section className="lm-section" id="design">
      <div className="lm-wrap">
        <p className="lm-kicker lm-reveal">Il design</p>

        <div className="lm-process-grid">
          <div className="lm-process-media" aria-hidden="true">
            {PROCESS_STEPS.map((step, i) => (
              <div
                className={`lm-process-layer${i === active ? ' is-active' : ''}`}
                key={step.num}
              >
                {step.ready && step.sources ? (
                  <video poster={step.poster} muted loop playsInline autoPlay preload="metadata">
                    {step.sources.map((source) => (
                      <source key={source.src} src={source.src} type={source.type} />
                    ))}
                  </video>
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      background: `linear-gradient(150deg, var(--surface), ${FALLBACK_TINT[i]})`,
                      opacity: 0.55,
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="lm-process-steps">
            {PROCESS_STEPS.map((step, i) => (
              <div
                className={`lm-process-step${i === active ? ' is-active' : ''}`}
                key={step.num}
                ref={(el) => {
                  stepsRef.current[i] = el
                }}
              >
                <span className="lm-process-num">{step.num}</span>
                <h3 className="lm-display lm-d3">{step.title}</h3>
                <p className="lm-lead">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
