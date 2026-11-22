'use client'

import { useEffect, useRef, useState } from 'react'
import { COMPANY } from '@/lib/company'
import { useI18n } from '@/components/i18n/I18nProvider'
import { prefersReducedMotion } from './useMotion'

/**
 * Contatti — la chat WhatsApp di Lumino.
 *
 * Disegnata come la vera app (tema scuro): barra in alto con la foto profilo
 * di Lumino, due messaggi in arrivo, risposte rapide e il campo che si scrive
 * da solo. Ogni risposta rapida e il tasto invia aprono WhatsApp con il testo
 * già pronto.
 *
 * Per il telefono: l'unico lavoro continuo è la scrittura nel campo, e gira
 * solo mentre la chat è sullo schermo. Niente inclinazione al mouse, niente
 * effetti al passaggio.
 */

const TYPE_MS = 55
const ERASE_MS = 28
const HOLD_MS = 1400

const waUrl = (text: string) => `${COMPANY.whatsapp.waLink}?text=${encodeURIComponent(text)}`

/** La foto profilo: il wordmark LUMINO su fondo scuro, con la I nel gradiente. */
function LuminoAvatar() {
  return (
    <svg className="lm-wa2-avatar" viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="lmwaI" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e53b33" />
          <stop offset=".5" stopColor="#ec6699" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="32" fill="#181412" />
      <text x="9.2" y="38.5" fill="#f4ede3" fontSize="15.5" letterSpacing=".2" style={{ fontFamily: 'var(--font-display), Anton, Impact, sans-serif' }}>
        LUM
      </text>
      <rect x="33.6" y="26.9" width="2.6" height="11.6" fill="url(#lmwaI)" />
      <text x="37.6" y="38.5" fill="#f4ede3" fontSize="15.5" letterSpacing=".2" style={{ fontFamily: 'var(--font-display), Anton, Impact, sans-serif' }}>
        NO
      </text>
    </svg>
  )
}

export default function WhatsAppBlock() {
  const { m } = useI18n()
  const w = m.whatsapp
  const TYPED_HEAD = w.typedHead
  const TYPED_TAILS = w.typedTails
  const rootRef = useRef<HTMLDivElement>(null)
  const typedRef = useRef<HTMLSpanElement>(null)
  const [live, setLive] = useState(false)
  const [sent, setSent] = useState<string | null>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const observer = new IntersectionObserver(([entry]) => setLive(entry.isIntersecting), { threshold: 0.3 })
    observer.observe(root)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const el = typedRef.current
    if (!el) return
    if (prefersReducedMotion()) {
      el.textContent = TYPED_HEAD + TYPED_TAILS[0]
      return
    }
    if (!live) return

    let raf = 0
    let tail = 0
    let chars = 0
    let phase: 'head' | 'type' | 'hold' | 'erase' = 'head'
    let last = performance.now()
    let holdUntil = 0

    const step = (now: number) => {
      const wait = phase === 'erase' ? ERASE_MS : TYPE_MS
      if (phase === 'hold') {
        if (now >= holdUntil) {
          phase = 'erase'
          last = now
        }
      } else if (now - last >= wait) {
        last = now
        if (phase === 'head') {
          chars += 1
          el.textContent = TYPED_HEAD.slice(0, chars)
          if (chars >= TYPED_HEAD.length) {
            phase = 'type'
            chars = 0
          }
        } else if (phase === 'type') {
          chars += 1
          el.textContent = TYPED_HEAD + TYPED_TAILS[tail].slice(0, chars)
          if (chars >= TYPED_TAILS[tail].length) {
            phase = 'hold'
            holdUntil = now + HOLD_MS
          }
        } else {
          chars -= 1
          el.textContent = TYPED_HEAD + TYPED_TAILS[tail].slice(0, Math.max(0, chars))
          if (chars <= 0) {
            tail = (tail + 1) % TYPED_TAILS.length
            phase = 'type'
          }
        }
      }
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [live, TYPED_HEAD, TYPED_TAILS])

  const send = (text: string) => setSent(text)
  const typedNow = () => typedRef.current?.textContent || TYPED_HEAD + TYPED_TAILS[0]

  return (
    <div className="lm-wa-wrap">
      <div ref={rootRef} className={`lm-wa2${live ? ' is-live' : ''}${sent ? ' is-sent' : ''}`}>
        <div className="lm-wa2-bar">
          <LuminoAvatar />
          <div className="lm-wa2-who">
            <b>Lumino</b>
            <span>{live && !sent ? w.typing : w.status}</span>
          </div>
          <a className="lm-wa2-icon" href={`tel:+${COMPANY.whatsapp.number}`} aria-label={COMPANY.whatsapp.display}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.6 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.6 3.6a1 1 0 0 1-.25 1z" />
            </svg>
          </a>
        </div>

        <div className="lm-wa2-chat">
          <span className="lm-wa2-day">{w.today}</span>
          <p className="lm-wa2-msg is-in is-first">
            {w.hello}
            <time>09:41</time>
          </p>
          <p className="lm-wa2-msg is-in">
            {w.bubble}
            <time>09:41</time>
          </p>

          {sent ? (
            <p className="lm-wa2-msg is-out">
              {sent}
              <time>
                {w.now}
                <svg viewBox="0 0 18 12" aria-hidden="true">
                  <path d="M1 6.5l3 3L10 2.5M7 9.5l1 1 7-8" fill="none" stroke="#53bdeb" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </time>
            </p>
          ) : null}

          <div className="lm-wa2-quick">
            {w.quick.map((q: { label: string; text: string }) => (
              <a key={q.label} href={waUrl(q.text)} target="_blank" rel="noopener noreferrer" onClick={() => send(q.text)}>
                {q.label}
              </a>
            ))}
          </div>
        </div>

        <a
          className="lm-wa2-composer"
          href={waUrl(w.message)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={w.cta}
          onClick={() => send(typedNow())}
        >
          <span className="lm-wa2-field">
            <svg className="lm-wa2-emoji" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.7" />
              <circle cx="9" cy="10" r="1.2" fill="currentColor" />
              <circle cx="15" cy="10" r="1.2" fill="currentColor" />
              <path d="M8.2 14.2c1 1.4 2.3 2 3.8 2s2.8-.6 3.8-2" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
            <span className="lm-wa2-text">
              <span ref={typedRef} className="lm-wa2-typed" />
              <span className="lm-wa2-caret" aria-hidden="true" />
            </span>
          </span>
          <span className="lm-wa2-send" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M3.4 20.4 21 12 3.4 3.6 3.4 10.1 15.4 12 3.4 13.9z" />
            </svg>
          </span>
        </a>
      </div>

      <a className="lm-wa-number" href={waUrl(w.message)} target="_blank" rel="noopener noreferrer">
        {COMPANY.whatsapp.display}
      </a>
    </div>
  )
}
