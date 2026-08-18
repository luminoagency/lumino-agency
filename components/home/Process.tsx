'use client'

import { useEffect, useRef, useState } from 'react'
import { POINTER_BREAKPOINT, ScrollTrigger, prefersReducedMotion, registerScrollTrigger } from './useMotion'
import ProcessDemo, { seekDemo, type DemoMode } from './ProcessDemos'

/**
 * Sezione 6 — Il design.
 *
 * La sezione si PINNA e lo scroll pilota il fotogramma dei demo, invece di
 * limitarsi a cambiare step. Prima i demo scorrevano via prima di essersi
 * conclusi: chi scrollava a velocità normale non ne vedeva uno intero.
 * Ora fermandosi si ferma anche l'animazione, scrollando piano la si vede al
 * rallentatore, e risalendo va all'indietro.
 *
 * L'aggiornamento scrive DIRETTAMENTE nel DOM e non passa da uno stato React:
 * gira a ogni frame di scroll, e un re-render per frame sarebbe sprecato.
 *
 * REGOLA CRITICA: il passaggio fra i tre livelli è solo un crossfade di
 * opacity. Mai transform: scale() su un wrapper che può contenere un <video>.
 *
 * Sotto 821px niente pin: un blocco da 300vh su un telefono sembra scroll
 * rotto. Lì le sezioni si impilano e ogni demo parte da solo in viewport.
 * Con prefers-reduced-motion niente pin e nessuna animazione: i tre step uno
 * sotto l'altro, ciascuno sul proprio fotogramma finale.
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

/** Quanto dura la dissolvenza fra due step, in frazione di step. */
const FADE = 0.15
const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

export default function Process() {
  const [mode, setMode] = useState<DemoMode>('auto')
  const sectionRef = useRef<HTMLElement>(null)
  const mediaRef = useRef<HTMLDivElement>(null)
  const stepsRef = useRef<(HTMLDivElement | null)[]>([])
  const barsRef = useRef<(HTMLSpanElement | null)[]>([])

  /* Che modalità: dipende dalla larghezza e dalle preferenze di movimento,
     e può cambiare a pagina aperta. */
  useEffect(() => {
    const queries = [
      window.matchMedia(`(min-width: ${POINTER_BREAKPOINT}px)`),
      window.matchMedia('(prefers-reduced-motion: reduce)'),
    ]
    const sync = () => {
      if (prefersReducedMotion()) setMode('still')
      else setMode(queries[0].matches ? 'scrub' : 'auto')
    }
    queries.forEach((q) => q.addEventListener('change', sync))
    sync()
    return () => queries.forEach((q) => q.removeEventListener('change', sync))
  }, [])

  /* Il pin e lo scrub. */
  useEffect(() => {
    const section = sectionRef.current
    const media = mediaRef.current
    if (!section || !media || mode !== 'scrub') return

    registerScrollTrigger()

    const layers = Array.from(media.querySelectorAll<HTMLElement>('.lm-process-layer'))
    const stages = Array.from(media.querySelectorAll<HTMLElement>('.lm-demo-stage'))
    const steps = stepsRef.current.filter((el): el is HTMLDivElement => el !== null)
    const bars = barsRef.current.filter((el): el is HTMLSpanElement => el !== null)

    const apply = (progress: number) => {
      const raw = clamp01(progress) * 3
      const index = Math.min(2, Math.floor(raw))
      const local = clamp01(raw - index)

      layers.forEach((layer, i) => {
        // Crossfade di sola opacità, e solo nella coda di ogni step: fuori da
        // lì il livello attivo è pieno e gli altri sono spenti.
        let o = 0
        if (i === index) o = index < 2 && local > 1 - FADE ? (1 - local) / FADE : 1
        else if (i === index + 1 && local > 1 - FADE) o = (local - (1 - FADE)) / FADE
        layer.style.opacity = o.toFixed(3)
      })

      steps.forEach((step, i) => step.classList.toggle('is-active', i === index))

      // L'indicatore si riempie in continuo col progresso, non a scatti.
      bars.forEach((bar, i) => {
        bar.style.transform = `scaleX(${clamp01(raw - i).toFixed(3)})`
      })

      // Ogni demo al proprio fotogramma: quello attivo segue il progresso
      // locale, i precedenti restano a fine corsa, i successivi all'inizio.
      stages.forEach((stage, i) => {
        seekDemo(stage, i, i === index ? local : i < index ? 1 : 0)
      })
    }

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      // ~100vh per ciascuno dei tre step.
      end: '+=300%',
      pin: true,
      pinSpacing: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      scrub: true,
      onUpdate: (self) => apply(self.progress),
      onRefresh: (self) => apply(self.progress),
    })

    section.classList.add('is-pinned')
    media.classList.add('is-scrubbed')
    apply(0)

    return () => {
      trigger.kill()
      section.classList.remove('is-pinned')
      media.classList.remove('is-scrubbed')
      layers.forEach((layer) => {
        layer.style.opacity = ''
      })
      bars.forEach((bar) => {
        bar.style.transform = ''
      })
      stages.forEach((stage) => stage.style.removeProperty('--seek'))
    }
  }, [mode])

  /* Senza pin (mobile): ogni demo parte da solo quando entra in viewport. */
  useEffect(() => {
    const section = sectionRef.current
    if (!section || mode !== 'auto') return

    const stages = Array.from(section.querySelectorAll<HTMLElement>('.lm-demo-stage'))
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => entry.target.classList.toggle('is-live', entry.isIntersecting))
      },
      { threshold: 0.25 },
    )
    stages.forEach((stage) => observer.observe(stage))
    return () => observer.disconnect()
  }, [mode])

  return (
    <section className="lm-section lm-process" id="design" ref={sectionRef}>
      <div className="lm-wrap">
        <p className="lm-kicker lm-reveal">Il design</p>

        <div className="lm-process-grid">
          <div className="lm-process-media" ref={mediaRef} aria-hidden="true">
            <div className="lm-process-bars">
              {PROCESS_STEPS.map((step, i) => (
                <i key={step.num}>
                  <span
                    ref={(el) => {
                      barsRef.current[i] = el
                    }}
                  />
                </i>
              ))}
            </div>

            {PROCESS_STEPS.map((step, i) => (
              <div
                className={`lm-process-layer${i === 0 ? ' is-active' : ''}`}
                key={step.num}
              >
                {step.ready && step.sources ? (
                  <video poster={step.poster} muted loop playsInline autoPlay preload="metadata">
                    {step.sources.map((source) => (
                      <source key={source.src} src={source.src} type={source.type} />
                    ))}
                  </video>
                ) : (
                  <ProcessDemo index={i} mode={mode} />
                )}
              </div>
            ))}
          </div>

          <div className="lm-process-steps">
            {PROCESS_STEPS.map((step, i) => (
              <div
                className={`lm-process-step${i === 0 ? ' is-active' : ''}`}
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
