'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useI18n } from '@/components/i18n/I18nProvider'
import { POINTER_BREAKPOINT, prefersReducedMotion, registerScrollTrigger, ScrollTrigger } from './useMotion'

/**
 * Servizi — siti, social, campagne, AI.
 *
 * Quattro pannelli su una pista orizzontale: sul desktop la sezione si ferma
 * e lo scroll fa scorrere la pista, sul telefono si sfoglia col dito.
 *
 * Ogni pannello ha in alto un oggetto con cui si gioca, non un grafico da
 * guardare: il sito scorre sotto il mouse, il reel si tocca e prende i like,
 * il budget si sposta e la campagna risponde, alla chat si fa una domanda.
 * Con prefers-reduced-motion restano tutti fermi e leggibili.
 */

type Demo = {
  webLabel: string
  webHint: string
  webHintTouch: string
  handle: string
  reelCaptions: string[]
  likes: string
  reelHint: string
  budgetLabel: string
  adsKpis: string[]
  adsHint: string
  adsNote: string
  leadTitle: string
  leadCount: string
  leadButton: string
  leadSources: string[]
  leadPool: string[][]
}

const tagOf = (locale: string) => (locale === 'en' ? 'en-GB' : locale === 'fr' ? 'fr-FR' : 'it-IT')

/** true quando l'elemento entra in vista (una volta sola). */
function useLive<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [live, setLive] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setLive(true)
          io.disconnect()
        }
      },
      { threshold: 0.3 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return { ref, live }
}

/** Un numero che corre verso il valore nuovo invece di saltarci. */
function useTween(value: number, ms = 600) {
  const [v, setV] = useState(value)
  const from = useRef(value)
  useEffect(() => {
    if (prefersReducedMotion()) {
      setV(value)
      from.current = value
      return
    }
    const start = from.current
    const t0 = performance.now()
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms)
      const cur = start + (value - start) * (1 - Math.pow(1 - p, 3))
      from.current = cur
      setV(cur)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, ms])
  return v
}

/* ── 1. Il sito che scorre sotto la mano ─────────────────────────────────── */

function WebTool({ d, live }: { d: Demo; live: boolean }) {
  const viewRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const target = useRef(0)
  const pos = useRef(0)
  const hover = useRef(false)
  const drag = useRef<number | null>(null)
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (!live) return
    const view = viewRef.current
    const img = imgRef.current
    if (!view || !img) return
    const reduce = prefersReducedMotion()
    let raf = 0
    const t0 = performance.now()
    const loop = (t: number) => {
      const max = Math.max(0, img.offsetHeight - view.clientHeight)
      // Da solo scorre piano avanti e indietro; appena arriva la mano, comanda lei.
      if (!hover.current && drag.current === null && !reduce) {
        target.current = (0.5 - 0.5 * Math.cos((t - t0) / 5200)) * max
      }
      target.current = Math.max(0, Math.min(max, target.current))
      pos.current += (target.current - pos.current) * 0.09
      img.style.transform = `translate3d(0, ${(-pos.current).toFixed(1)}px, 0)`
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [live])

  const onMove = (e: React.PointerEvent) => {
    const view = viewRef.current
    const img = imgRef.current
    if (!view || !img) return
    const max = Math.max(0, img.offsetHeight - view.clientHeight)
    if (e.pointerType === 'mouse') {
      const r = view.getBoundingClientRect()
      const ratio = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height))
      target.current = ratio * max
    } else if (drag.current !== null) {
      target.current = Math.max(0, Math.min(max, target.current - (e.clientY - drag.current) * 2.2))
      drag.current = e.clientY
    }
  }

  return (
    <div className="sv-web">
      <div className="sv-web-bar">
        <span className="sv-web-url">{d.webLabel}</span>
      </div>
      <div
        className="sv-web-view"
        ref={viewRef}
        data-cursor="grow"
        onPointerEnter={(e) => {
          if (e.pointerType === 'mouse') {
            hover.current = true
            setTouched(true)
          }
        }}
        onPointerLeave={() => {
          hover.current = false
        }}
        onPointerDown={(e) => {
          if (e.pointerType !== 'mouse') {
            drag.current = e.clientY
            setTouched(true)
          }
        }}
        onPointerUp={() => {
          drag.current = null
        }}
        onPointerCancel={() => {
          drag.current = null
        }}
        onPointerMove={onMove}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img ref={imgRef} src="/servizi/sito.webp" alt="" loading="lazy" width={560} height={2040} draggable={false} />
      </div>
      <span className={`sv-hint${touched ? ' is-gone' : ''}`}>
        <span className="sv-hint-fine">{d.webHint}</span>
        <span className="sv-hint-touch">{d.webHintTouch}</span>
      </span>
    </div>
  )
}

/* ── 2. Il reel che si tocca ─────────────────────────────────────────────── */

type Burst = { id: number; x: number; y: number; r: number }

const HEART = 'M12 20.5s-7.5-4.6-9.3-9.2C1.4 7.9 3.6 4.5 7 4.5c2 0 3.6 1.1 5 2.9 1.4-1.8 3-2.9 5-2.9 3.4 0 5.6 3.4 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2z'

function ReelTool({ d, live }: { d: Demo; live: boolean }) {
  const { locale } = useI18n()
  const [idx, setIdx] = useState(0)
  const [likes, setLikes] = useState(1284)
  const [liked, setLiked] = useState(false)
  const [bursts, setBursts] = useState<Burst[]>([])
  const [touched, setTouched] = useState(false)
  const paused = useRef(false)
  const n = d.reelCaptions.length
  const shown = useTween(likes, 350)

  useEffect(() => {
    if (!live || prefersReducedMotion()) return
    const id = window.setInterval(() => {
      if (paused.current) return
      setIdx((i) => (i + 1) % n)
      setLiked(false)
    }, 3200)
    return () => window.clearInterval(id)
  }, [live, n])

  const like = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const b = { id: performance.now(), x: e.clientX - r.left, y: e.clientY - r.top, r: Math.random() * 30 - 15 }
    setBursts((list) => [...list.slice(-5), b])
    window.setTimeout(() => setBursts((list) => list.filter((x) => x.id !== b.id)), 900)
    setLikes((v) => v + 1)
    setLiked(true)
    setTouched(true)
  }

  return (
    <div className="sv-reel">
      {/* Fondo: lo stesso fotogramma, sfocato e grande. */}
      <div className="sv-reel-bg" aria-hidden="true">
        {d.reelCaptions.map((_, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={`/servizi/reel-${i + 1}.webp`} alt="" loading="lazy" className={i === idx ? 'is-on' : ''} />
        ))}
      </div>

      <div
        className="sv-phone"
        data-cursor="grow"
        onPointerEnter={() => {
          paused.current = true
        }}
        onPointerLeave={() => {
          paused.current = false
        }}
        onPointerDown={like}
      >
        <div className="sv-phone-screen">
          {d.reelCaptions.map((_, i) => {
            const rel = (i - idx + n) % n
            const cls = rel === 0 ? 'is-on' : rel === n - 1 ? 'is-out' : 'is-next'
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={`/servizi/reel-${i + 1}.webp`} alt="" loading="lazy" className={`sv-frame ${cls}`} draggable={false} />
            )
          })}
          <span className="sv-progress" key={`p${idx}`} aria-hidden="true" />
          <div className="sv-reel-meta">
            <b>@{d.handle}</b>
            <span key={`c${idx}`}>{d.reelCaptions[idx]}</span>
          </div>
          <div className="sv-reel-rail" aria-hidden="true">
            <span className={`sv-heart${liked ? ' is-on' : ''}`} key={`h${likes}`}>
              <svg viewBox="0 0 24 24"><path d={HEART} /></svg>
            </span>
            <small>{Math.round(shown).toLocaleString(tagOf(locale))}</small>
            <span className="sv-ico">
              <svg viewBox="0 0 24 24"><path d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.5-4A8 8 0 1 1 20 11.5z" /></svg>
            </span>
            <span className="sv-ico">
              <svg viewBox="0 0 24 24"><path d="M21 4 10 14M21 4l-7 17-4-7-7-4z" /></svg>
            </span>
          </div>
          {bursts.map((b) => (
            <span key={b.id} className="sv-burst" style={{ left: b.x, top: b.y, ['--r' as string]: `${b.r}deg` }} aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d={HEART} /></svg>
            </span>
          ))}
        </div>
      </div>

      <span className={`sv-hint sv-hint-side${touched ? ' is-gone' : ''}`}>{d.reelHint}</span>
    </div>
  )
}

/* ── 3. La campagna che risponde al budget ───────────────────────────────── */

const BAR_SHAPE = [0.42, 0.55, 0.48, 0.62, 0.7, 0.58, 0.76, 0.82, 0.72, 0.9, 0.86, 1]

function AdsTool({ d, live }: { d: Demo; live: boolean }) {
  const { locale } = useI18n()
  const [net, setNet] = useState(0)
  const [budget, setBudget] = useState(10)
  const [touched, setTouched] = useState(false)

  // Al primo ingresso il cursore si sposta da solo, per far capire che si muove.
  useEffect(() => {
    if (!live || touched) return
    const t = window.setTimeout(() => setBudget(30), prefersReducedMotion() ? 0 : 500)
    return () => window.clearTimeout(t)
  }, [live, touched])

  const g = net === 0
  const clicks = Math.round(budget * 30 * (g ? 0.92 : 1.45))
  const leads = Math.max(1, Math.round(clicks * (g ? 0.062 : 0.038)))
  const cpl = (budget * 30) / leads
  const vC = useTween(clicks)
  const vL = useTween(leads)
  const vP = useTween(cpl)
  const tag = tagOf(locale)
  const scale = 0.18 + (budget / 100) * 0.82

  return (
    <div className="sv-ads">
      <div className="sv-ads-top">
        <div className="sv-ads-tabs" role="tablist">
          {['Google Ads', 'Meta Ads'].map((x, i) => (
            <button
              key={x}
              type="button"
              role="tab"
              aria-selected={i === net}
              className={i === net ? 'is-on' : ''}
              onClick={() => {
                setNet(i)
                setTouched(true)
              }}
            >
              {x}
            </button>
          ))}
        </div>
        <em>{d.adsNote}</em>
      </div>

      <div className="sv-ads-kpis">
        <div><span>{d.adsKpis[0]}</span><b>{Math.round(vC).toLocaleString(tag)}</b></div>
        <div><span>{d.adsKpis[1]}</span><b>{Math.round(vL).toLocaleString(tag)}</b></div>
        <div><span>{d.adsKpis[2]}</span><b>{vP.toLocaleString(tag, { maximumFractionDigits: 1, minimumFractionDigits: 1 })} €</b></div>
      </div>

      <div className={`sv-bars${g ? '' : ' is-meta'}`} aria-hidden="true">
        {BAR_SHAPE.map((h, i) => (
          <i key={i} style={{ transform: `scaleY(${(h * scale).toFixed(3)})`, transitionDelay: `${i * 22}ms` }} />
        ))}
      </div>

      <label className="sv-budget" data-cursor="grow">
        <span>
          {d.budgetLabel} <b>{budget} €</b>
        </span>
        <input
          type="range"
          min={5}
          max={100}
          step={1}
          value={budget}
          onChange={(e) => {
            setBudget(Number(e.target.value))
            setTouched(true)
          }}
          style={{ ['--p' as string]: `${((budget - 5) / 95) * 100}%` }}
        />
      </label>
      <span className={`sv-hint sv-hint-ads${touched ? ' is-gone' : ''}`}>{d.adsHint}</span>
    </div>
  )
}

/* ── 4. La dashboard dei contatti che si riempie ─────────────────────────── */

type Lead = { id: number; name: string; what: string; src: number }

function LeadTool({ d, live }: { d: Demo; live: boolean }) {
  const { locale } = useI18n()
  const pool = d.leadPool
  const [list, setList] = useState<Lead[]>(() => pool.slice(0, 2).map((l, i) => ({ id: i, name: l[0], what: l[1], src: Number(l[2]) })))
  const [count, setCount] = useState(29)
  const next = useRef(2)
  const shown = useTween(count, 500)

  const push = useCallback(() => {
    const l = pool[next.current % pool.length]
    next.current += 1
    setList((cur) => [{ id: next.current + 100, name: l[0], what: l[1], src: Number(l[2]) }, ...cur].slice(0, 4))
    setCount((c) => c + 1)
  }, [pool])

  useEffect(() => {
    if (!live || prefersReducedMotion()) return
    const id = window.setInterval(push, 2600)
    return () => window.clearInterval(id)
  }, [live, push])

  return (
    <div className="sv-lead">
      <div className="sv-lead-head">
        <span>{d.leadTitle}</span>
        <em>{d.adsNote}</em>
      </div>
      <div className="sv-lead-kpi">
        <b>{Math.round(shown).toLocaleString(tagOf(locale))}</b>
        <span>{d.leadCount}</span>
      </div>
      <ul className="sv-lead-list" aria-live="polite">
        {list.map((l) => (
          <li key={l.id}>
            <span className="sv-lead-av">{l.name.charAt(0)}</span>
            <span className="sv-lead-txt">
              <b>{l.name}</b>
              <em>{l.what}</em>
            </span>
            <span className={`sv-lead-src sv-lead-src-${l.src}`}>{d.leadSources[l.src]}</span>
          </li>
        ))}
      </ul>
      <button type="button" className="sv-lead-btn" onClick={push} data-cursor="grow">
        {d.leadButton}
      </button>
    </div>
  )
}

/* ── Pannello ────────────────────────────────────────────────────────────── */

type Item = { name: string; body: string; builds: string[]; tool: string }

function Panel({ i, item, d, label }: { i: number; item: Item; d: Demo; label: string }) {
  const { ref, live } = useLive<HTMLElement>()
  const toolRef = useRef<HTMLDivElement>(null)

  // Il piano dello strumento si inclina appena verso il mouse.
  const tilt = (e: React.PointerEvent) => {
    const el = toolRef.current
    if (!el || e.pointerType !== 'mouse' || prefersReducedMotion()) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    el.style.setProperty('--ry', `${(x * 7).toFixed(2)}deg`)
    el.style.setProperty('--rx', `${(-y * 6).toFixed(2)}deg`)
    el.style.setProperty('--gx', `${((x + 0.5) * 100).toFixed(1)}%`)
    el.style.setProperty('--gy', `${((y + 0.5) * 100).toFixed(1)}%`)
  }
  const untilt = () => {
    const el = toolRef.current
    if (!el) return
    el.style.setProperty('--ry', '0deg')
    el.style.setProperty('--rx', '0deg')
  }

  return (
    <article ref={ref} className={`sv-panel sv-panel-${i}${live ? ' is-live' : ''}`}>
      <div className="sv-tool-wrap" onPointerMove={tilt} onPointerLeave={untilt}>
        <div className="sv-tool" ref={toolRef}>
          {item.tool === 'reel' && <ReelTool d={d} live={live} />}
          {item.tool === 'ads' && <AdsTool d={d} live={live} />}
          {item.tool === 'leads' && <LeadTool d={d} live={live} />}
          {item.tool === 'web' && <WebTool d={d} live={live} />}
          <span className="sv-sheen" aria-hidden="true" />
        </div>
      </div>
      <h3 className="sv-name">{item.name}</h3>
      <p className="sv-body">{item.body}</p>
      <ul className="sv-builds" aria-label={label}>
        {item.builds.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
    </article>
  )
}

export default function Services() {
  const { m } = useI18n()
  const sv = m.services
  const sectionRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  /* Desktop: la sezione si ferma e lo scroll verticale fa scorrere la pista. */
  useEffect(() => {
    const section = sectionRef.current
    const track = trackRef.current
    if (!section || !track) return
    const mq = window.matchMedia(`(min-width: ${POINTER_BREAKPOINT}px)`)
    if (!mq.matches || prefersReducedMotion()) return

    const gsap = registerScrollTrigger()
    const distance = () => Math.max(0, track.scrollWidth - track.clientWidth)
    const tween = gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => `+=${distance()}`,
        pin: true,
        scrub: 0.6,
        invalidateOnRefresh: true,
      },
    })
    return () => {
      tween.scrollTrigger?.kill()
      tween.kill()
      ScrollTrigger.refresh()
    }
  }, [])

  return (
    <section className="lm-section sv" id="servizi" ref={sectionRef}>
      <div className="lm-wrap sv-head">
        <p className="lm-kicker lm-reveal">{sv.kicker}</p>
        <div className="sv-head-grid">
          <h2 className="lm-display lm-d2 lm-reveal">
            {sv.titleLine1}
            <br />
            {sv.titleLine2}
            <em className="sv-accent">{sv.titleAccent}</em>
          </h2>
          <p className="lm-lead lm-reveal">{sv.lead}</p>
        </div>
      </div>

      <div className="sv-track" ref={trackRef}>
        {sv.items.map((item, i) => (
          <Panel key={item.name} i={i} item={item as Item} d={sv.demo as Demo} label={sv.buildLabel} />
        ))}
      </div>
    </section>
  )
}
