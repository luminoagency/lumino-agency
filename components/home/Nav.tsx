'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import Wordmark from './Wordmark'
import { prefersReducedMotion, scrollPageTo } from './useMotion'
import { WA_LINK } from './whatsappLink'
import { COMPANY } from '@/lib/company'

/**
 * Nav fissa + menu overlay.
 *
 * Al passaggio su una voce, la stessa parola compare gigante sul fondo in solo
 * contorno e le altre voci sbiadiscono. (Prima c'era un riquadro di anteprima:
 * senza immagini era un rettangolo scuro, e senza immagini nostre resterebbe
 * tale — la tipografia dice la stessa cosa senza chiedere asset.)
 *
 * Al click la navigazione diventa una transizione: un pannello di colore sale a
 * coprire lo schermo, la pagina si sposta dietro il pannello, poi il pannello
 * scopre verso l'alto. Non si vede mai il salto.
 */

interface MenuItem {
  href: string
  label: string
}

const MENU: MenuItem[] = [
  { href: '#studio', label: 'Chi siamo' },
  { href: '#lavori', label: 'Lavori' },
  { href: '#settori', label: 'Cosa facciamo' },
  { href: '#contatti', label: 'Contatti' },
]

/** Durata del pannello, allineata a @keyframes lm-swipe in motion.css. */
const SWIPE_MS = 1100
/** A metà corsa il pannello copre tutto: è lì che si salta. */
const SWIPE_MID_MS = 520

export default function Nav() {
  const [open, setOpen] = useState(false)
  const [hot, setHot] = useState<number | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const [swiping, setSwiping] = useState(false)

  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const timers = useRef<number[]>([])

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
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

  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), [])

  const goTo = (href: string) => {
    const target = document.querySelector(href)
    target?.scrollIntoView({ behavior: 'auto', block: 'start' })
  }

  /* Il marchio riporta in cima, scorrendo. Su questa pagina un <Link href="/">
     ricaricherebbe la rotta su cui siamo già: non succede niente, e chi ha
     cliccato resta dov'era senza capire perché. */
  const toTop = (event: React.MouseEvent) => {
    if (window.location.pathname !== '/') return
    event.preventDefault()
    scrollPageTo(0)
  }

  const navigate = (event: React.MouseEvent, href: string) => {
    event.preventDefault()
    setOpen(false)
    setHot(null)

    if (prefersReducedMotion()) {
      goTo(href)
      return
    }

    setSwiping(true)
    // A pannello alzato la pagina si sposta: il salto avviene dietro il colore.
    timers.current.push(window.setTimeout(() => goTo(href), SWIPE_MID_MS))
    timers.current.push(window.setTimeout(() => setSwiping(false), SWIPE_MS))
  }

  const activeLabel = hot === null ? null : MENU[hot].label

  return (
    <>
      <nav className={`lm-nav${scrolled ? ' is-scrolled' : ''}`}>
        <Link
          href="/"
          className="lm-wordmark"
          aria-label="Lumino — torna in cima"
          data-cursor="grow"
          onClick={toTop}
        >
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
          <span className="lm-menu-word">Esplora</span>
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

        {/* La voce puntata, gigante e in solo contorno, sul fondo del menu. */}
        <span className={`lm-ov-ghost${activeLabel ? ' is-on' : ''}`} aria-hidden="true">
          {activeLabel ?? ''}
        </span>

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
            <span>Chiudi</span>
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
              onClick={(event) => navigate(event, item.href)}
              onPointerEnter={() => setHot(i)}
              onPointerLeave={() => setHot(null)}
              onFocus={() => setHot(i)}
              onBlur={() => setHot(null)}
              data-cursor="grow"
            >
              <span className="lm-ix">{String(i + 1).padStart(2, '0')}</span>
              <span className="lm-ov-label">{item.label}</span>
            </a>
          ))}

          {/* Riga a parte, sotto le quattro voci: non è una sezione del sito,
              è un modo di raggiungerci. Il numero sta in chiaro perché a
              qualcuno serve copiarlo, non aprire un'app. */}
          <a
            className="lm-ov-wa"
            href={WA_LINK}
            target="_blank"
            rel="noopener noreferrer"
            onClick={close}
            data-cursor="whatsapp"
          >
            <span className="lm-ov-wa-label">Scrivici su WhatsApp</span>
            <span className="lm-ov-wa-num">{COMPANY.whatsapp.display}</span>
          </a>
        </div>

        <div className="lm-ov-foot">
          <span>EMYRA LTD — Londra</span>
          <Link href="/login" onClick={close} data-cursor="grow">
            Area clienti
          </Link>
        </div>
      </div>

      {swiping ? <div className="lm-swipe is-on" aria-hidden="true" /> : null}
    </>
  )
}
