'use client'

import { useEffect, useRef } from 'react'
import { useI18n } from '@/components/i18n/I18nProvider'

/**
 * I tre atti della sezione "Il metodo" — la strada da sconosciuto a cliente.
 *
 *   01  contenuti: il reel gira, le visualizzazioni salgono
 *   02  annunci: lo stesso contenuto diventa sponsorizzato e il raggio si
 *       allarga sulla zona giusta, mentre arriva anche l'annuncio Google
 *   03  contatti: le richieste entrano una alla volta nella dashboard
 *
 * Un unico motore per tutti e tre: `seekDemo(stage, atto, progresso)`.
 * Con lo scrub il progresso arriva dallo scroll (sezione pinnata); sul
 * telefono lo genera un ciclo a tempo, solo mentre l'atto è in vista; con
 * motion ridotto resta fermo a 1, la scena finita.
 *
 * Cosa fa seekDemo, e niente di più:
 *   · `--p` sul palco (0→1), per ciò che il CSS sa calcolare da solo
 *   · `.is-in` su ogni [data-at] quando il progresso lo supera
 *   · i numeri di ogni [data-to], perché il CSS non sa contare
 *   · il fotogramma attivo fra i [data-frame]
 * Le transizioni sono in CSS e sono reversibili: risalendo, la scena torna
 * indietro.
 */

export type DemoMode = 'scrub' | 'auto' | 'still'

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

function fmt(n: number, kind: string | undefined, locale: string) {
  const tag = locale === 'en' ? 'en-GB' : locale === 'fr' ? 'fr-FR' : 'it-IT'
  if (kind === 'k') {
    if (n < 1000) return Math.round(n).toLocaleString(tag)
    return `${(n / 1000).toLocaleString(tag, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}K`
  }
  if (kind === 'eur') return `${Math.round(n).toLocaleString(tag)} €`
  return Math.round(n).toLocaleString(tag)
}

export function seekDemo(stage: HTMLElement, _index: number, progress: number) {
  const p = clamp01(progress)
  stage.style.setProperty('--p', p.toFixed(4))
  const locale = stage.dataset.locale || 'it'

  stage.querySelectorAll<HTMLElement>('[data-at]').forEach((el) => {
    el.classList.toggle('is-in', p >= Number(el.dataset.at))
  })

  stage.querySelectorAll<HTMLElement>('[data-to]').forEach((el) => {
    const from = Number(el.dataset.from ?? 0)
    const start = Number(el.dataset.start ?? 0)
    const end = Number(el.dataset.end ?? 1)
    const t = easeOut(clamp01((p - start) / Math.max(0.001, end - start)))
    el.textContent = fmt(from + (Number(el.dataset.to) - from) * t, el.dataset.fmt, locale)
  })

  const frames = Array.from(stage.querySelectorAll<HTMLElement>('[data-frame]'))
  if (frames.length) {
    const active = Math.min(frames.length - 1, Math.floor(p * frames.length * 0.999))
    frames.forEach((f, i) => {
      f.classList.toggle('is-on', i === active)
      f.classList.toggle('is-past', i < active)
    })
  }
}

/* ── Atto 01 — contenuti ─────────────────────────────────────────────────── */
function ActContent() {
  const { m } = useI18n()
  const a = m.process.acts
  return (
    <div className="lm-demo gd gd-1">
      <div className="gd-phone">
        <div className="gd-screen">
          {[4, 1, 2, 3].map((n) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={n} data-frame src={`/servizi/reel-${n}.webp`} alt="" loading="lazy" />
          ))}
          <span className="gd-reel-top">{a.reel}</span>
          <span className="gd-reel-handle">@iltuolocale</span>
        </div>
      </div>

      <div className="gd-chip gd-chip-shoot" data-at="0">
        <b>{a.shoot}</b>
        <span>{a.shootSub}</span>
      </div>

      <div className="gd-stat gd-stat-views" data-at="0.03">
        <b data-to="48200" data-fmt="k" data-from="1200" data-start="0.03" data-end="0.95">0</b>
        <span>{a.views}</span>
      </div>
      <div className="gd-stat gd-stat-follow" data-at="0.3">
        <b>
          +<span data-to="612" data-start="0.3" data-end="0.95">0</span>
        </b>
        <span>{a.followers}</span>
      </div>
      <div className="gd-stat gd-stat-saves" data-at="0.55">
        <b data-to="1340" data-start="0.55" data-end="0.98">0</b>
        <span>{a.saves}</span>
      </div>

      <span className="lm-act-tag" aria-hidden="true">{a.tag1}</span>
    </div>
  )
}

/* ── Atto 02 — annunci ───────────────────────────────────────────────────── */
function ActAds() {
  const { m } = useI18n()
  const a = m.process.acts
  return (
    <div className="lm-demo gd gd-2">
      {/* La zona: un raggio che si allarga attorno al locale. */}
      <div className="gd-map" aria-hidden="true">
        <i className="gd-ring gd-ring-1" />
        <i className="gd-ring gd-ring-2" />
        <i className="gd-ring gd-ring-3" />
        <span className="gd-pin" />
        <span className="gd-km">
          <span data-to="15" data-from="2" data-start="0" data-end="0.5">2</span> km
        </span>
      </div>

      <div className="gd-sponsored" data-at="0">
        <div className="gd-sp-head">
          <span className="gd-sp-av">L</span>
          <span>
            <b>iltuolocale</b>
            <em>{a.sponsored}</em>
          </span>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/servizi/reel-3.webp" alt="" loading="lazy" />
        <span className="gd-sp-cta">{a.adCta}</span>
      </div>

      <div className="gd-google" data-at="0.35">
        <small>
          <b>{a.sponsoredShort}</b> · iltuolocale.it
        </small>
        <strong>{a.googleTitle}</strong>
        <p>{a.googleBody}</p>
      </div>

      <div className="gd-reach" data-at="0.02">
        <b data-to="18400" data-from="800" data-start="0.02" data-end="0.95">0</b>
        <span>{a.reach}</span>
      </div>

      <span className="lm-act-tag" aria-hidden="true">{a.tag2}</span>
    </div>
  )
}

/* ── Atto 03 — contatti ──────────────────────────────────────────────────── */
function ActLeads() {
  const { m } = useI18n()
  const a = m.process.acts
  return (
    <div className="lm-demo gd gd-3">
      <div className="gd-dash">
        <div className="gd-dash-head">
          <span>{a.dashTitle}</span>
          <em>{a.example}</em>
        </div>
        <div className="gd-dash-kpis">
          <div>
            <b data-to="37" data-from="1" data-start="0" data-end="0.9">1</b>
            <span>{a.leads}</span>
          </div>
          <div>
            <b data-to="11" data-from="24" data-start="0" data-end="0.9" data-fmt="eur">24 €</b>
            <span>{a.costPerLead}</span>
          </div>
        </div>
        <ul className="gd-leads">
          {a.leadList.map((l: string[], i: number) => (
            <li key={i} data-at={i === 0 ? '0' : (0.06 + i * 0.17).toFixed(2)}>
              <span className="gd-lead-av">{l[0].charAt(0)}</span>
              <span className="gd-lead-txt">
                <b>{l[0]}</b>
                <em>{l[1]}</em>
              </span>
              <span className={`gd-src gd-src-${i % 3}`}>{l[2]}</span>
            </li>
          ))}
        </ul>
      </div>

      <span className="lm-act-tag" aria-hidden="true">{a.tag3}</span>
    </div>
  )
}

const CYCLE_MS = 6500

export default function ProcessDemo({ index, mode }: { index: number; mode: DemoMode }) {
  const { locale } = useI18n()
  const ref = useRef<HTMLDivElement>(null)

  /* Fuori dallo scrub il progresso lo decidiamo noi: fermo sulla scena finita
     con motion ridotto, a tempo e solo in vista sul telefono. */
  useEffect(() => {
    const stage = ref.current
    if (!stage) return
    if (mode === 'still') {
      seekDemo(stage, index, 1)
      return
    }
    if (mode !== 'auto') {
      seekDemo(stage, index, 0)
      return
    }
    let raf = 0
    let t0 = 0
    const loop = (t: number) => {
      if (!t0) t0 = t
      // Sale, resta un attimo sulla scena piena, poi ricomincia.
      const phase = ((t - t0) % CYCLE_MS) / CYCLE_MS
      seekDemo(stage, index, Math.min(1, phase / 0.8))
      raf = requestAnimationFrame(loop)
    }
    const io = new IntersectionObserver(
      ([e]) => {
        cancelAnimationFrame(raf)
        if (e.isIntersecting) {
          t0 = 0
          raf = requestAnimationFrame(loop)
        }
      },
      { threshold: 0.35 },
    )
    io.observe(stage)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [mode, index])

  const content = index === 0 ? <ActContent /> : index === 1 ? <ActAds /> : <ActLeads />
  return (
    <div className={`lm-demo-stage is-${mode}`} ref={ref} data-locale={locale}>
      {content}
    </div>
  )
}
