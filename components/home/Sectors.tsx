'use client'

import { Fragment, useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from './useMotion'
import { useI18n } from '@/components/i18n/I18nProvider'

/**
 * Per chi lavoriamo.
 *
 * Una frase sola, composta grande: "Lavoriamo con ristoranti, hotel, …".
 * Ogni settore è una parola della frase e si sceglie lì dentro (hover sul
 * desktop, tocco sul telefono). Sotto, il pannello cambia e dice cosa vuol
 * dire quel mestiere e cosa costruiamo per chi lo fa.
 *
 * Fondo crema e inchiostro: spezza il buio delle sezioni intorno senza
 * aloni colorati dietro al testo.
 */

type Sector = { name: string; word: string; pre?: string; body: string; builds: string[] }

export default function Sectors() {
  const { m } = useI18n()
  const items = m.sectors.items as Sector[]
  const s = m.sectors.sentence
  const [active, setActive] = useState(0)
  const current = items[active]
  const sectionRef = useRef<HTMLElement>(null)
  const touched = useRef(false)

  /* Finché nessuno la tocca, la frase cambia parola da sola mentre è in vista. */
  useEffect(() => {
    const el = sectionRef.current
    if (!el || prefersReducedMotion()) return
    let id = 0
    const io = new IntersectionObserver(([e]) => {
      window.clearInterval(id)
      if (!e.isIntersecting) return
      id = window.setInterval(() => {
        if (touched.current) return window.clearInterval(id)
        setActive((a) => (a + 1) % items.length)
      }, 3400)
    }, { threshold: 0.4 })
    io.observe(el)
    return () => {
      io.disconnect()
      window.clearInterval(id)
    }
  }, [items.length])

  const pick = (i: number) => {
    touched.current = true
    setActive(i)
  }

  return (
    <section className="lm-section lm-sec" id="settori" ref={sectionRef}>
      <div className="lm-wrap">
        <p className="lm-kicker lm-reveal">{m.sectors.kicker}</p>

        <h2 className="lm-sec-sentence lm-reveal" role="tablist" aria-label={m.sectors.kicker}>
          {s.before}
          {items.map((it, i) => (
            <Fragment key={it.word}>
              {i > 0 ? (i === items.length - 1 ? s.and : ', ') : null}
              {it.pre}
              <button
                type="button"
                role="tab"
                id={`lm-sec-tab-${i}`}
                aria-selected={i === active}
                aria-controls="lm-sec-panel"
                className={`lm-sec-word${i === active ? ' is-on' : ''}`}
                onMouseEnter={() => pick(i)}
                onFocus={() => pick(i)}
                onClick={() => pick(i)}
                data-cursor="open"
              >
                {it.word}
                <svg className="lm-sec-mark" viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden="true">
                  <path pathLength={1} d="M3 8.5C38 4 70 3.2 104 5.6S168 9.4 197 4.2" />
                </svg>
              </button>
            </Fragment>
          ))}
          {s.after}
        </h2>

        <p className="lm-sec-hint lm-reveal" aria-hidden="true">{s.hint}</p>

        <div
          className="lm-sec-panel lm-reveal"
          id="lm-sec-panel"
          role="tabpanel"
          aria-labelledby={`lm-sec-tab-${active}`}
        >
          <div className="lm-sec-panel-in" key={active}>
            <p className="lm-sec-name">{current.name}</p>
            <p className="lm-sec-body">{current.body}</p>
            <div className="lm-sec-builds">
              <span className="lm-sec-builds-title">{m.sectors.buildLabel}</span>
              <ul>
                {current.builds.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
