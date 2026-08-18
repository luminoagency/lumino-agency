'use client'

import { useEffect, useRef, useState } from 'react'
import { registerScrollTrigger, ScrollTrigger } from './useMotion'
import ProcessDemo from './ProcessDemos'

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
    verticali 4:5, da mettere in /public/motion/:

      01-hero.webm     01-hero.mp4     01-hero.jpg    (poster)
      02-motion.webm   02-motion.mp4   02-motion.jpg
      03-mobile.webm   03-mobile.mp4   03-mobile.jpg

    Il movimento va esportato DENTRO la clip: qui non si scala nulla.
    Quando arrivano: ready: true e il markup <video> qui sotto entra in
    funzione senza altre modifiche.  */

export const PROCESS_STEPS: Step[] = [
  {
    num: '01',
    title: 'Hero che ferma il pollice',
    body: 'La prima schermata decide se restano o se ne vanno. Costruiamo aperture che non somigliano a nessun’altra: tipografia che reagisce, media che respira, nessun template.',
    ready: false,
    poster: '/motion/01-hero.jpg',
    sources: [
      { src: '/motion/01-hero.webm', type: 'video/webm' },
      { src: '/motion/01-hero.mp4', type: 'video/mp4' },
    ],
  },
  {
    num: '02',
    title: 'Movimento su misura',
    body: 'Ogni animazione ha un motivo. Il movimento guida l’occhio dove serve, racconta il prodotto e resta sotto i 60 millisecondi di risposta.',
    ready: false,
    poster: '/motion/02-motion.jpg',
    sources: [
      { src: '/motion/02-motion.webm', type: 'video/webm' },
      { src: '/motion/02-motion.mp4', type: 'video/mp4' },
    ],
  },
  {
    num: '03',
    title: 'Prima il telefono',
    body: 'L’80% dei tuoi clienti arriva da mobile. Progettiamo lì per primo, poi allarghiamo. Caricamento sotto i due secondi, sempre.',
    ready: false,
    poster: '/motion/03-mobile.jpg',
    sources: [
      { src: '/motion/03-mobile.webm', type: 'video/webm' },
      { src: '/motion/03-mobile.mp4', type: 'video/mp4' },
    ],
  },
]

export default function Process() {
  const [active, setActive] = useState(0)
  const [visible, setVisible] = useState(false)
  const stepsRef = useRef<(HTMLDivElement | null)[]>([])
  const sectionRef = useRef<HTMLElement>(null)

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

    // Fuori dalla sezione i demo si fermano: sono animazioni cicliche, e
    // lasciarle girare a vuoto per tutta la pagina non serve a nessuno.
    const section = sectionRef.current
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      threshold: 0,
    })
    if (section) observer.observe(section)

    return () => {
      triggers.forEach((trigger) => trigger.kill())
      observer.disconnect()
    }
  }, [])

  return (
    <section className="lm-section" id="design" ref={sectionRef}>
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
                  <ProcessDemo index={i} playing={visible && i === active} />
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
