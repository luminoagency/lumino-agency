'use client'

import { useEffect, useRef } from 'react'
import { useI18n } from '@/components/i18n/I18nProvider'
import { HERO_LETTERS, WALL_COLS, tilesForColumn } from './heroScene'
import { POINTER_BREAKPOINT, ScrollTrigger, prefersReducedMotion, registerScrollTrigger } from './useMotion'

/**
 * Sezione 1 — Hero «muro dei contenuti».
 *
 * La sezione è alta più schermi e dentro ha un blocco `position: sticky` alto
 * uno schermo: è il browser a tenerlo fermo, non un pin in JavaScript. Su
 * telefono è l'unico modo per avere un'animazione davvero attaccata al dito,
 * senza il salto del pin-spacer quando la barra dell'indirizzo cambia altezza.
 *
 * Lo scroll diventa un numero tra 0 e 1 (ScrollTrigger, già sincronizzato con
 * Lenis) e quel numero muove SOLO transform, opacity e clip-path di pochi
 * livelli: il muro intero, il video in primo piano, i testi, le schede.
 *
 *   0.00–0.30  il muro inclinato si raddrizza, il titolo sale e sparisce
 *   0.28–0.60  il video del videomaker esce dal muro e prende tutto lo schermo
 *   0.58–1.00  sopra il video arrivano i risultati, una frase alla volta
 *
 * Quando il video copre lo schermo il muro si ferma e si nasconde: niente
 * colonne che scorrono dietro un video a tutto schermo, niente lavoro sprecato.
 */

const clamp = (x: number) => Math.min(1, Math.max(0, x))
const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a))
const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
const out = (x: number) => 1 - Math.pow(1 - x, 3)

export default function Hero() {
  const { m } = useI18n()
  const h = m.hero
  const rootRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const q = <T extends HTMLElement>(s: string) => root.querySelector<T>(s)!
    const wall = q('.lm-hw-wall')
    const shade = q('.lm-hw-shade')
    const dim = q('.lm-hw-dim')
    const copy = q('.lm-hw-copy')
    const hint = q('.lm-hw-hint')
    const focus = q('.lm-hw-focus')
    const video = q<HTMLVideoElement>('.lm-hw-focus video')
    const chips = Array.from(root.querySelectorAll<HTMLElement>('.lm-hw-chip'))
    const lines = Array.from(root.querySelectorAll<HTMLElement>('.lm-hw-line'))
    const views = q('.lm-hw-views')
    const tileVideos = Array.from(root.querySelectorAll<HTMLVideoElement>('.lm-hw-tile video'))

    const reduced = prefersReducedMotion()
    const desktop = window.matchMedia(`(min-width: ${POINTER_BREAKPOINT}px)`).matches
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true

    /* Il video in primo piano: versione leggera su telefono. */
    video.src = desktop ? '/hero/wall/focus.mp4' : '/hero/wall/focus-m.mp4'

    /* I video del muro solo su PC: su telefono restano le foto. */
    if (desktop && !reduced && !saveData) {
      tileVideos.forEach((v) => {
        v.src = v.dataset.src!
        v.play().catch(() => {})
      })
    }

    root.classList.add('is-ready', desktop ? 'is-desk' : 'is-mob')
    if (reduced) {
      root.classList.add('is-static')
      return
    }

    let vw = window.innerWidth
    let vh = window.innerHeight
    let lastDeep = false
    let lastP = -1
    let focusPlaying = false

    const tileW = () => (desktop ? 250 : 132)

    const apply = (p: number) => {
      if (Math.abs(p - lastP) < 0.0004) return
      lastP = p

      /* 1 · il muro si raddrizza e si avvicina.
         Da telefono il muro NON cambia scala: Safari ridisegnerebbe tutto il
         livello a ogni fotogramma. Si raddrizza soltanto e poi si spegne. */
      const flat = ease(seg(p, 0, 0.32))
      const zoom = ease(seg(p, 0.26, 0.6))
      if (desktop) {
        const s = 1.18 + flat * 0.12 + zoom * 0.55
        wall.style.transform = `translate3d(-50%,-50%,0) rotateX(${(1 - flat) * 28}deg) rotateZ(${(1 - flat) * -14}deg) scale(${s})`
      } else {
        wall.style.transform = `translate3d(-50%,-50%,0) rotate(${(1 - flat) * -14}deg) scale(1.25)`
      }
      shade.style.opacity = String(0.62 + 0.3 * seg(p, 0.2, 0.5))
      dim.style.opacity = String(0.8 * ease(seg(p, 0.3, 0.6)))

      /* il titolo se ne va */
      const c = seg(p, 0.03, 0.2)
      copy.style.opacity = String(1 - c)
      copy.style.transform = `translate3d(0,${-70 * out(c)}px,0)`
      hint.style.opacity = String(1 - seg(p, 0, 0.06))

      /* 2 · il video esce dal muro e prende lo schermo */
      const f = ease(seg(p, 0.32, 0.6))
      focus.style.opacity = String(seg(p, 0.27, 0.34))
      if (desktop) {
        const th0 = Math.min(vh * 0.62, tileW() * (16 / 9) * (1.3 + 0.4 * zoom))
        /* Da PC il video resta verticale, grande al centro, col muro scuro
           intorno: a tutto schermo andrebbe tagliato e si vedrebbe sgranato. */
        const thEnd = vh * 0.84
        const th = th0 + (thEnd - th0) * f
        const tw = th * (9 / 16)
        const ix = Math.max(0, (vw - tw) / 2)
        const iy = Math.max(0, (vh - th) / 2)
        focus.style.clipPath = `inset(${iy}px ${ix}px ${iy}px ${ix}px round 26px)`
      } else {
        /* Da telefono solo scale: un livello, zero ridisegni. */
        focus.style.transform = `translate3d(0,0,0) scale(${0.46 + 0.54 * f})`
      }

      const deep = !desktop && f > 0.99
      if (deep !== lastDeep) {
        root.classList.toggle('is-deep', deep)
        lastDeep = deep
      }

      const wantPlay = p > 0.22 && p < 0.999
      if (wantPlay !== focusPlaying) {
        focusPlaying = wantPlay
        if (wantPlay) video.play().catch(() => {})
        else video.pause()
      }

      /* 3 · i risultati sopra il video */
      const starts = [0.6, 0.7, 0.8, 0.88]
      chips.forEach((el, i) => {
        const k = out(seg(p, starts[i], starts[i] + 0.06))
        el.style.opacity = String(k)
        el.style.transform = `translate3d(0,${(1 - k) * 26}px,0) scale(${0.92 + 0.08 * k})`
      })
      const n = Math.round(1200 + 47000 * out(seg(p, 0.6, 0.76)))
      views.textContent = n.toLocaleString('it-IT').replace(/ /g, '.')

      const bands = [
        [0.56, 0.7],
        [0.7, 0.82],
        [0.82, 1.01],
      ]
      lines.forEach((el, i) => {
        const [a, b] = bands[i]
        const inn = out(seg(p, a, a + 0.04))
        const gone = i < 2 ? seg(p, b - 0.03, b) : 0
        el.style.opacity = String(inn * (1 - gone))
        el.style.transform = `translate3d(0,${(1 - inn) * 30 - gone * 20}px,0)`
      })
    }

    registerScrollTrigger()
    const st = ScrollTrigger.create({
      trigger: root,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => apply(self.progress),
      onRefresh: (self) => {
        vw = window.innerWidth
        vh = window.innerHeight
        lastP = -1
        apply(self.progress)
      },
    })
    apply(st.progress)

    /* Fuori dallo schermo: si ferma tutto (muro, video). */
    const io = new IntersectionObserver(
      ([e]) => {
        root.classList.toggle('is-off', !e.isIntersecting)
        if (!e.isIntersecting) {
          video.pause()
          focusPlaying = false
          tileVideos.forEach((v) => v.pause())
        } else if (desktop && !saveData) {
          tileVideos.forEach((v) => v.src && v.play().catch(() => {}))
        }
      },
      { threshold: 0 },
    )
    io.observe(root)

    return () => {
      st.kill()
      io.disconnect()
    }
  }, [])

  const seen = new Set<string>()

  return (
    <section ref={rootRef} className="lm-hw" id="top" aria-label={h.srTitle}>
      <div className="lm-hw-sticky">
        <div className="lm-hw-stage" aria-hidden="true">
          <div className="lm-hw-wall">
            {Array.from({ length: WALL_COLS }, (_, c) => {
              const tiles = tilesForColumn(c)
              const loop = [...tiles, ...tiles]
              return (
                <div className={`lm-hw-col ${c % 2 ? 'is-up' : 'is-down'}`} key={c} style={{ ['--d' as string]: `${46 + (c % 3) * 9}s` }}>
                  <div className="lm-hw-col-in">
                    {loop.map((t, i) => {
                      const firstVideo = t.video && i < tiles.length && !seen.has(t.name)
                      if (firstVideo) seen.add(t.name)
                      return (
                        <div className="lm-hw-tile" key={i} style={{ backgroundImage: `url(/hero/wall/${t.name}.webp)` }}>
                          {firstVideo && <video data-src={`/hero/wall/${t.name}.mp4`} muted loop playsInline preload="none" />}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="lm-hw-shade" />
        <div className="lm-hw-dim" />

        <div className="lm-hw-focus" aria-hidden="true">
          <video muted loop playsInline preload="metadata" poster="/hero/wall/focus.webp" />
          <div className="lm-hw-focus-grad" />
        </div>

        <div className="lm-hw-chips" aria-hidden="true">
          <div className="lm-hw-chip c1">
            <b className="lm-hw-views">1.200</b>
            <span>{h.chipViews}</span>
          </div>
          <div className="lm-hw-chip c2">
            <span className="tag">{h.chipAdTag}</span>
            <b>{h.chipAd}</b>
          </div>
          <div className="lm-hw-chip c3">
            <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#25d366" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2z" />
              <path fill="#fff" d="M8.6 7.3c.2-.4.4-.4.7-.4h.5c.2 0 .4 0 .6.5l.8 1.9c.1.2.1.4 0 .6l-.4.6c-.1.2-.2.3 0 .6.5.9 1.3 1.7 2.2 2.2.3.2.5.1.6 0l.6-.7c.2-.2.3-.2.6-.1l1.8.9c.3.1.4.2.4.4 0 .4-.1 1-.6 1.4-.5.5-1.3.8-2 .6-1.1-.3-2.6-1-3.9-2.3-1.6-1.6-2.3-3.1-2.4-4 0-.9.3-1.6.5-2.2z" />
            </svg>
            <div>
              <b>{h.chipWa}</b>
              <span>{h.chipWaMeta}</span>
            </div>
          </div>
          <div className="lm-hw-chip c4">
            <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">
              <rect width="24" height="24" rx="6" fill="#34c759" />
              <path fill="#fff" d="M8.2 6.3c.3-.3.8-.3 1.1 0l1.4 1.8c.3.3.2.8 0 1.1l-.8.9a8 8 0 0 0 3.9 3.9l.9-.8c.3-.3.8-.3 1.1 0l1.8 1.4c.3.3.3.8 0 1.1l-.9 1c-.5.5-1.3.7-2 .4a12 12 0 0 1-6.9-6.9c-.3-.7-.1-1.5.4-2z" />
            </svg>
            <div>
              <b>{h.chipCall}</b>
              <span>{h.chipCallMeta}</span>
            </div>
          </div>
        </div>

        <div className="lm-hw-lines" aria-hidden="true">
          {h.lines.map((l: string, i: number) => (
            <p className="lm-hw-line" key={i}>
              {l}
            </p>
          ))}
        </div>

        <div className="lm-hw-copy">
          <p className="lm-hw-kicker">{h.kicker}</p>
          <h1 className="lm-hw-title">
            <span className="lm-sr">{h.srTitle}</span>
            <span className="lm-hw-word" aria-hidden="true">
              {HERO_LETTERS.map((ch, i) => (
                <span className={`lm-hw-ch${ch === 'I' ? ' is-i' : ''}`} key={i} style={{ ['--i' as string]: i }}>
                  {ch}
                </span>
              ))}
            </span>
          </h1>
          <p className="lm-hw-pay">
            {h.payoffLead}
            <em>{h.payoffAccent}</em>
          </p>
          <div className="lm-hw-ctas">
            <a className="lm-hw-btn is-main" href="#contatti">
              {h.ctaMain}
            </a>
            <a className="lm-hw-btn" href="#metodo">
              {h.cta}
            </a>
          </div>
        </div>

        <div className="lm-hw-hint" aria-hidden="true">
          <span />
        </div>
      </div>
    </section>
  )
}
