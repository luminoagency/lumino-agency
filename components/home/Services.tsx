'use client'

import { useEffect, useRef, useState } from 'react'
import { useI18n } from '@/components/i18n/I18nProvider'
import { POINTER_BREAKPOINT, prefersReducedMotion, registerScrollTrigger, ScrollTrigger } from './useMotion'

/**
 * Servizi — siti, social, campagne, AI.
 *
 * Quattro pannelli su una pista orizzontale. Sul desktop la sezione si ferma
 * e lo scroll fa scorrere la pista; sul telefono si sfoglia col dito
 * (scroll-snap nativo, niente pin). Ogni pannello ha in alto uno strumento
 * vivo che mostra il servizio al lavoro invece di descriverlo: parte quando
 * il pannello entra in vista, e con prefers-reduced-motion resta fermo sul
 * fotogramma finale.
 */

type Demo = {
  webScore: string
  webLabel: string
  handle: string
  followers: string
  posts: string
  reach: string
  toast: string
  adsPeriod: string
  adsKpis: string[]
  chatName: string
  chatOnline: string
  chatUser: string
  chatBot: string
  chatSaved: string
}

function useLive<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [live, setLive] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (prefersReducedMotion()) {
      setLive(true)
      return
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setLive(true)
          io.disconnect()
        }
      },
      { threshold: 0.35 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return { ref, live }
}

function Count({ to, live, decimals = 0, suffix = '', ms = 1600 }: { to: number; live: boolean; decimals?: number; suffix?: string; ms?: number }) {
  const { locale } = useI18n()
  const [v, setV] = useState(0)
  useEffect(() => {
    if (!live) return
    if (prefersReducedMotion()) {
      setV(to)
      return
    }
    let raf = 0
    const t0 = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms)
      setV(to * (1 - Math.pow(1 - p, 3)))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [live, to, ms])
  const tag = locale === 'en' ? 'en-GB' : locale === 'fr' ? 'fr-FR' : 'it-IT'
  return (
    <>
      {v.toLocaleString(tag, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </>
  )
}

/* ── Strumenti ─────────────────────────────────────────────────────────── */

function WebTool({ d, live }: { d: Demo; live: boolean }) {
  return (
    <div className="sv-web">
      <div className="sv-web-bar">
        <span className="sv-web-url">{d.webLabel}</span>
      </div>
      <div className="sv-web-view">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/servizi/sito.webp" alt="" loading="lazy" width={560} height={2040} />
      </div>
      <div className="sv-web-score">
        <svg viewBox="0 0 44 44" aria-hidden="true">
          <circle cx="22" cy="22" r="19" className="sv-ring-bg" />
          <circle cx="22" cy="22" r="19" className="sv-ring" pathLength={100} />
        </svg>
        <b><Count to={98} live={live} /></b>
        <span>{d.webScore}</span>
      </div>
    </div>
  )
}

function SocialTool({ d, live }: { d: Demo; live: boolean }) {
  return (
    <div className="sv-soc">
      <div className="sv-soc-head">
        <span className="sv-soc-avatar" aria-hidden="true"><i>L</i></span>
        <span className="sv-soc-id">
          <b>@{d.handle}</b>
          <span className="sv-soc-nums">
            <span><b><Count to={148} live={live} /></b> {d.posts}</span>
            <span><b><Count to={12480} live={live} ms={2200} /></b> {d.followers}</span>
          </span>
        </span>
      </div>
      <div className="sv-soc-grid">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <span key={n} className="sv-soc-tile" style={{ ['--i' as string]: n }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/servizi/post-${n}.webp`} alt="" loading="lazy" width={320} height={320} />
          </span>
        ))}
      </div>
      <div className="sv-soc-reach">
        <span>{d.reach}</span>
        <b>+<Count to={312} live={live} />%</b>
      </div>
      <div className="sv-soc-toast">{d.toast}</div>
    </div>
  )
}

const ADS = [
  { name: 'Google Ads', kpi: [2418, 136, 4.2], path: 'M0 70 C30 66 45 60 70 58 S120 40 150 42 S210 24 240 20 S290 10 320 6' },
  { name: 'Meta Ads', kpi: [3906, 184, 3.6], path: 'M0 74 C25 72 50 68 80 60 S130 52 160 40 S220 34 250 22 S295 14 320 10' },
]

function AdsTool({ d, live }: { d: Demo; live: boolean }) {
  const [tab, setTab] = useState(0)
  useEffect(() => {
    if (!live || prefersReducedMotion()) return
    const id = window.setInterval(() => setTab((t) => (t + 1) % ADS.length), 3600)
    return () => window.clearInterval(id)
  }, [live])
  const a = ADS[tab]
  return (
    <div className="sv-ads">
      <div className="sv-ads-tabs">
        {ADS.map((x, i) => (
          <span key={x.name} className={i === tab ? 'is-on' : ''}>{x.name}</span>
        ))}
        <em>{d.adsPeriod}</em>
      </div>
      <div className="sv-ads-kpis" key={tab}>
        <div><span>{d.adsKpis[0]}</span><b><Count to={a.kpi[0]} live={live} /></b></div>
        <div><span>{d.adsKpis[1]}</span><b><Count to={a.kpi[1]} live={live} /></b></div>
        <div><span>{d.adsKpis[2]}</span><b><Count to={a.kpi[2]} live={live} decimals={1} suffix="×" /></b></div>
      </div>
      <svg className="sv-ads-chart" viewBox="0 0 320 80" preserveAspectRatio="none" aria-hidden="true" key={`c${tab}`}>
        <defs>
          <linearGradient id={`sv-fill-${tab}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#ec6a9c" stopOpacity=".32" />
            <stop offset="1" stopColor="#ec6a9c" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${a.path} L320 80 L0 80 Z`} fill={`url(#sv-fill-${tab})`} className="sv-ads-area" />
        <path d={a.path} className="sv-ads-line" pathLength={100} />
      </svg>
    </div>
  )
}

function ChatTool({ d }: { d: Demo }) {
  return (
    <div className="sv-chat">
      <div className="sv-chat-head">
        <span className="sv-chat-av" aria-hidden="true">L</span>
        <span><b>{d.chatName}</b><em>{d.chatOnline}</em></span>
      </div>
      <div className="sv-chat-body">
        <p className="sv-msg sv-msg-in">{d.chatUser}</p>
        <p className="sv-typing" aria-hidden="true"><i /><i /><i /></p>
        <p className="sv-msg sv-msg-out">{d.chatBot}</p>
        <p className="sv-chat-saved">{d.chatSaved}</p>
      </div>
    </div>
  )
}

function Panel({ i, item, d, label }: { i: number; item: { name: string; body: string; builds: string[] }; d: Demo; label: string }) {
  const { ref, live } = useLive<HTMLElement>()
  return (
    <article ref={ref} className={`sv-panel sv-panel-${i}${live ? ' is-live' : ''}`}>
      <div className="sv-tool">
        {i === 0 && <WebTool d={d} live={live} />}
        {i === 1 && <SocialTool d={d} live={live} />}
        {i === 2 && <AdsTool d={d} live={live} />}
        {i === 3 && <ChatTool d={d} />}
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
            <span className="lm-grad-text">{sv.titleLine2}</span>
          </h2>
          <p className="lm-lead lm-reveal">{sv.lead}</p>
        </div>
      </div>

      <div className="sv-track" ref={trackRef}>
        {sv.items.map((item, i) => (
          <Panel key={item.name} i={i} item={item} d={sv.demo as Demo} label={sv.buildLabel} />
        ))}
      </div>
    </section>
  )
}
