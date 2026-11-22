'use client'

import { useEffect, useRef } from 'react'
import { useI18n } from '@/components/i18n/I18nProvider'
import { prefersReducedMotion } from './useMotion'

/**
 * Sezione 6 — In breve.
 *
 * Tre schede, ognuna mostra quello che dice invece di scriverlo soltanto:
 *   3  i tre mestieri, con le foto del lavoro vero
 *   1  la dashboard condivisa, in piccolo (dati di esempio, dichiarati)
 *   1  il referente unico, come una chat
 *
 * Il movimento parte quando la sezione entra (classe is-in) ed è tutto CSS:
 * nessun lavoro per fotogramma oltre al conteggio dei tre numeri.
 */

const COUNT_MS = 1100
const ROLE_PICS = ['/hero/wall/maker.webp', '/hero/wall/scroll.webp', '/hero/wall/shop.webp']
const BARS = [34, 48, 41, 62, 55, 78, 70, 92]

export default function Stats() {
  const { m } = useI18n()
  const s = m.stats
  const rootRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    if (prefersReducedMotion()) {
      root.classList.add('is-in')
      return
    }
    const nums = Array.from(root.querySelectorAll<HTMLElement>('[data-target]'))
    const frames: number[] = []
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        io.disconnect()
        root.classList.add('is-in')
        const start = performance.now()
        const step = (now: number) => {
          const t = Math.min(1, (now - start) / COUNT_MS)
          const k = 1 - Math.pow(1 - t, 3)
          nums.forEach((el) => (el.textContent = String(Math.max(1, Math.round(Number(el.dataset.target) * k)))))
          if (t < 1) frames.push(requestAnimationFrame(step))
        }
        frames.push(requestAnimationFrame(step))
      },
      { threshold: 0.25 },
    )
    io.observe(root)
    return () => {
      io.disconnect()
      frames.forEach(cancelAnimationFrame)
    }
  }, [])

  const [a, b, c] = s.items

  return (
    <section className="lm-section lm-brief" id="numeri" ref={rootRef}>
      <div className="lm-wrap">
        <p className="lm-kicker lm-reveal">{s.kicker}</p>
        <h2 className="lm-brief-head">{s.headline}</h2>

        <div className="lm-brief-grid">
          {/* 3 — i mestieri */}
          <article className="lm-brief-card is-roles">
            <div className="lm-brief-top">
              <span className="lm-brief-num" data-target={a.value}>
                {a.value}
              </span>
              <p className="lm-brief-label">{a.label}</p>
            </div>
            <ul className="lm-brief-roles">
              {s.roles.map((r: string, i: number) => (
                <li key={r} style={{ ['--k' as string]: i }}>
                  <span className="pic" style={{ backgroundImage: `url(${ROLE_PICS[i]})` }} />
                  <b>{r}</b>
                </li>
              ))}
            </ul>
          </article>

          {/* 1 — la dashboard */}
          <article className="lm-brief-card is-dash">
            <div className="lm-brief-top">
              <span className="lm-brief-num" data-target={b.value}>
                {b.value}
              </span>
              <p className="lm-brief-label">{b.label}</p>
            </div>
            <div className="lm-brief-dash" aria-hidden="true">
              <div className="dh">
                <b>{s.dashTitle}</b>
                <i>{s.dashNote}</i>
              </div>
              <div className="bars">
                {BARS.map((h, i) => (
                  <span key={i} style={{ ['--h' as string]: `${h}%`, ['--k' as string]: i }} />
                ))}
              </div>
              {s.dashRows.map((r: string[], i: number) => (
                <div className="row" key={r[0]} style={{ ['--k' as string]: i }}>
                  <span className="av">{r[0][0]}</span>
                  <b>{r[0]}</b>
                  <em>{r[1]}</em>
                </div>
              ))}
            </div>
          </article>

          {/* 1 — il referente */}
          <article className="lm-brief-card is-person">
            <div className="lm-brief-top">
              <span className="lm-brief-num" data-target={c.value}>
                {c.value}
              </span>
              <p className="lm-brief-label">{c.label}</p>
            </div>
            <div className="lm-brief-chat" aria-hidden="true">
              <p>{s.chat}</p>
              <span>{s.chatMeta}</span>
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}
