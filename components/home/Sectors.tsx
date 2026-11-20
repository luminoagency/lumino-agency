'use client'

import { Fragment, useState } from 'react'
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

  return (
    <section className="lm-section lm-sec" id="settori">
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
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
                data-cursor="open"
              >
                {it.word}
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
