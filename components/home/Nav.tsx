'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import Wordmark from './Wordmark'
import { bindScramble } from './scramble'
import { lerp, onMouseEffectsChange, pointer, trackPointer } from './useMotion'

/**
 * Nav fissa + menu overlay.
 *
 * Comportamenti replicati dal riferimento:
 *   · 4 punti che ruotano di 45°, si allargano e prendono i colori della palette
 *   · overlay che si apre dall'alto (clip-path), voci a scaglioni
 *   · all'hover di una voce le altre sbiadiscono e il fondo si tinge
 *   · anteprima che insegue il cursore con lerp
 *   · "Chiudi" che ruota di 180° e diventa rosso
 *   · scramble su "Esplora", "Chiudi" e sulle voci
 */

interface MenuItem {
  href: string
  label: string
  /* Immagine dell'anteprima. Assente → riquadro in gradiente (nessuna
     dipendenza da immagini esterne finché non abbiamo le nostre).
     TODO ASSET: 4 anteprime 580×400 in /public/menu/. */
  preview?: string
  tint: string
}

const MENU: MenuItem[] = [
  { href: '#studio', label: 'Chi siamo', tint: 'var(--bordeaux)' },
  { href: '#lavori', label: 'Lavori', tint: 'var(--red)' },
  { href: '#settori', label: 'Cosa facciamo', tint: 'var(--blue)' },
  { href: '#contatti', label: 'Contatti', tint: 'var(--violet)' },
]

export default function Nav() {
  const [open, setOpen] = useState(false)
  const [hot, setHot] = useState<number | null>(null)

  const menuWordRef = useRef<HTMLSpanElement>(null)
  const closeWordRef = useRef<HTMLSpanElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([])

  const [scrolled, setScrolled] = useState(false)

  const close = useCallback(() => setOpen(false), [])

  /* Nav compatta appena si scrolla. */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* Scramble su tutte le etichette del menu. */
  useEffect(() => {
    const unbinds: (() => void)[] = []

    if (menuWordRef.current) unbinds.push(bindScramble(menuWordRef.current, 'Esplora'))
    if (closeWordRef.current) unbinds.push(bindScramble(closeWordRef.current, 'Chiudi'))
    linkRefs.current.forEach((el, i) => {
      const label = el?.querySelector<HTMLElement>('.lm-ov-label')
      if (label) unbinds.push(bindScramble(label, MENU[i].label))
    })

    return () => unbinds.forEach((fn) => fn())
  }, [])

  /* Blocco dello scroll + chiusura con Esc mentre l'overlay è aperto. */
  useEffect(() => {
    if (!open) return

    document.body.classList.add('lm-lock')
    closeBtnRef.current?.focus()

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)

    return () => {
      document.body.classList.remove('lm-lock')
      document.removeEventListener('keydown', onKey)
    }
  }, [open, close])

  /* L'anteprima insegue il cursore. Solo da 821px in su e fuori da
     motion ridotto, e solo mentre l'overlay è davvero aperto. */
  useEffect(() => {
    const preview = previewRef.current
    if (!preview || !open) return

    let stopPointer: (() => void) | null = null
    let raf = 0
    let live = false
    const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 }

    const tick = () => {
      pos.x = lerp(pos.x, pointer.x, 0.12)
      pos.y = lerp(pos.y, pointer.y, 0.12)
      preview.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`
      raf = requestAnimationFrame(tick)
    }

    const unsubscribe = onMouseEffectsChange((enabled) => {
      if (enabled && !live) {
        live = true
        stopPointer = trackPointer()
        raf = requestAnimationFrame(tick)
      } else if (!enabled && live) {
        live = false
        cancelAnimationFrame(raf)
        stopPointer?.()
        stopPointer = null
      }
    })

    return () => {
      unsubscribe()
      cancelAnimationFrame(raf)
      stopPointer?.()
    }
  }, [open])

  const active = hot === null ? null : MENU[hot]

  return (
    <>
      <nav className={`lm-nav${scrolled ? ' is-scrolled' : ''}`}>
        <Link href="/" className="lm-wordmark" aria-label="Lumino — home" data-cursor="grow">
          <Wordmark />
        </Link>

        <button
          type="button"
          className="lm-menu-btn"
          onClick={() => setOpen(true)}
          aria-label="Apri il menu"
          aria-expanded={open}
          data-cursor="grow"
        >
          <span className="lm-menu-word" ref={menuWordRef}>
            Esplora
          </span>
          <span className="lm-halo" aria-hidden="true" />
          <span className="lm-cluster" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
        </button>
      </nav>

      <div
        className={`lm-overlay${open ? ' is-open' : ''}${hot !== null ? ' is-hot' : ''}`}
        id="lm-menu"
        aria-hidden={!open}
      >
        <div className="lm-ov-wash" aria-hidden="true" />

        <div className="lm-ov-top">
          <span className="lm-wordmark" aria-hidden="true">
            <Wordmark />
          </span>

          <button
            type="button"
            className="lm-close"
            onClick={close}
            ref={closeBtnRef}
            data-cursor="grow"
          >
            <span ref={closeWordRef}>Chiudi</span>
            <span className="lm-close-ring" aria-hidden="true">
              <i />
              <i />
            </span>
          </button>
        </div>

        <div className={`lm-ov-links${hot !== null ? ' is-hot' : ''}`}>
          {MENU.map((item, i) => (
            <a
              href={item.href}
              key={item.href}
              onClick={close}
              onPointerEnter={() => setHot(i)}
              onPointerLeave={() => setHot(null)}
              onFocus={() => setHot(i)}
              onBlur={() => setHot(null)}
              data-cursor="grow"
              ref={(el) => {
                linkRefs.current[i] = el
              }}
            >
              <span className="lm-ix">{String(i + 1).padStart(2, '0')}</span>
              <span className="lm-ov-label">{item.label}</span>
            </a>
          ))}
        </div>

        <div className="lm-ov-foot">
          <span>EMYRA LTD — Londra</span>
          <Link href="/login" onClick={close} data-cursor="grow">
            Area clienti
          </Link>
        </div>
      </div>

      {/* Anteprima che insegue il cursore: fuori dall'overlay per non essere
          tagliata dal clip-path che lo apre. */}
      <div
        className={`lm-ovprev${open && active ? ' is-on' : ''}`}
        ref={previewRef}
        aria-hidden="true"
      >
        <div
          className="lm-ovprev-inner"
          style={{
            background: active
              ? `linear-gradient(150deg, var(--surface), ${active.tint})`
              : undefined,
          }}
        />
      </div>
    </>
  )
}
