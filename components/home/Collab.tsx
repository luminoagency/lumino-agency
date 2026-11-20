'use client'

import { useEffect, useState } from 'react'
import { useI18n } from '@/components/i18n/I18nProvider'
import { prefersReducedMotion } from './useMotion'

/**
 * Collaborazioni.
 *
 * In alto, grande: «LUMINO ×» fisso e il nome del partner che gira come una
 * slot. Sotto, l'elenco vero: chi è e cosa facciamo insieme. Passando su una
 * riga, la slot si ferma su quel nome.
 */

type Partner = { name: string; role: string; url: string }

export default function Collab() {
  const { m } = useI18n()
  const c = m.collab
  const items = c.items as Partner[]
  const [i, setI] = useState(0)
  const [hold, setHold] = useState<number | null>(null)

  useEffect(() => {
    if (prefersReducedMotion()) return
    const id = window.setInterval(() => setI((v) => (v + 1) % items.length), 2200)
    return () => window.clearInterval(id)
  }, [items.length])

  const shown = hold ?? i

  return (
    <section className="lm-section cb" id="collaborazioni">
      <div className="lm-wrap">
        <p className="lm-kicker lm-reveal">{c.kicker}</p>

        <h2 className="cb-big lm-reveal" aria-label={`Lumino × ${items.map((p) => p.name).join(', ')}`}>
          <span className="cb-lumino" aria-hidden="true">
            LUM<i>I</i>NO
          </span>
          <span className="cb-x" aria-hidden="true">×</span>
          <span className="cb-slot" aria-hidden="true">
            <span className="cb-reel" style={{ transform: `translateY(${-shown * 1.04}em)` }}>
              {items.map((p) => (
                <span key={p.name}>{p.name}</span>
              ))}
            </span>
          </span>
        </h2>

        <div className="cb-grid">
          <p className="lm-lead lm-reveal">{c.lead}</p>
          <ul className="cb-list">
            {items.map((p, k) => {
              const inner = (
                <>
                  <span className="cb-num">0{k + 1}</span>
                  <b>{p.name}</b>
                  <em>{p.role}</em>
                </>
              )
              return (
                <li
                  key={p.name}
                  className={shown === k ? 'is-on' : undefined}
                  onMouseEnter={() => setHold(k)}
                  onMouseLeave={() => setHold(null)}
                >
                  {p.url ? (
                    <a href={p.url} target="_blank" rel="noopener noreferrer" data-cursor="open">
                      {inner}
                    </a>
                  ) : (
                    <div>{inner}</div>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}
