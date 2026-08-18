'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Work } from './worksData'
import BrowserChrome from './BrowserChrome'
import WorkMediaView from './WorkMediaView'
import { gsap, prefersReducedMotion } from './useMotion'

/**
 * Il sito del cliente aperto DENTRO la vetrina.
 *
 * Il visitatore non deve uscire da bylumino per vedere un lavoro: la card
 * cresce fino a diventare una finestra a tutto schermo che carica il sito vero
 * in un iframe, navigabile lì dentro.
 *
 * Scelte che vale la pena conoscere:
 *
 *  · L'apertura anima top/left/width/height, non transform: scale(). Scalare
 *    un iframe lo rende sfocato e costringe il documento dentro a rifare il
 *    layout a ogni frame.
 *  · L'iframe si monta solo a crescita finita. Durante l'animazione si vede lo
 *    screenshot: niente richiesta di rete partita a vuoto se l'utente chiude
 *    subito, e niente riquadro bianco mentre la finestra si muove.
 *  · Se il sito rifiuta di farsi incorporare (X-Frame-Options / CSP), il load
 *    non arriva: dopo qualche secondo si ripiega sullo screenshot con il
 *    bottone per aprirlo in una scheda nuova. Mai un riquadro bianco.
 */

const OPEN_MS = 0.55
const CLOSE_MS = 0.4
/* Oltre questo tempo senza `load` diamo l'incorporamento per rifiutato. */
const EMBED_TIMEOUT_MS = 6000

function targetRect() {
  const width = Math.min(1240, window.innerWidth * 0.94)
  const height = Math.min(window.innerHeight * 0.9, window.innerHeight - 48)
  return {
    left: (window.innerWidth - width) / 2,
    top: (window.innerHeight - height) / 2,
    width,
    height,
  }
}

export default function WorkViewer({
  work,
  origin,
  onClose,
}: {
  work: Work
  origin: DOMRect
  onClose: () => void
}) {
  const frameRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const [showEmbed, setShowEmbed] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const closingRef = useRef(false)

  /* Chiusura: la finestra torna esattamente dov'era la card. */
  const close = useCallback(() => {
    if (closingRef.current) return
    closingRef.current = true

    const frame = frameRef.current
    const backdrop = backdropRef.current
    if (!frame || prefersReducedMotion()) {
      onClose()
      return
    }

    setShowEmbed(false)
    if (backdrop) gsap.to(backdrop, { opacity: 0, duration: CLOSE_MS, ease: 'power2.in' })
    gsap.to(frame, {
      top: origin.top,
      left: origin.left,
      width: origin.width,
      height: origin.height,
      duration: CLOSE_MS,
      ease: 'power3.in',
      onComplete: onClose,
    })

    // Rete di sicurezza: rAF si ferma nelle schede in secondo piano, quindi una
    // tween avviata e mai completata lascerebbe l'overlay montato E lo scroll
    // del body bloccato sotto. Chiudere due volte non fa danno.
    window.setTimeout(onClose, CLOSE_MS * 1000 + 300)
  }, [onClose, origin])

  /* Apertura + blocco dello scroll + Esc. */
  useEffect(() => {
    const frame = frameRef.current
    const backdrop = backdropRef.current
    if (!frame) return

    document.body.classList.add('lm-lock')
    closeRef.current?.focus()

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)

    const to = targetRect()
    // Stessa rete di sicurezza in apertura: se la crescita non arriva in fondo,
    // l'iframe non partirebbe mai e resterebbe lo screenshot con "Carico…".
    const embedSafety = window.setTimeout(() => setShowEmbed(true), OPEN_MS * 1000 + 400)

    if (prefersReducedMotion()) {
      gsap.set(frame, to)
      if (backdrop) gsap.set(backdrop, { opacity: 1 })
      setShowEmbed(true)
    } else {
      gsap.set(frame, {
        top: origin.top,
        left: origin.left,
        width: origin.width,
        height: origin.height,
      })
      if (backdrop) gsap.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: OPEN_MS })
      gsap.to(frame, {
        ...to,
        duration: OPEN_MS,
        ease: 'power3.out',
        // L'iframe parte solo ora: durante la crescita si vede lo screenshot.
        onComplete: () => setShowEmbed(true),
      })
    }

    return () => {
      window.clearTimeout(embedSafety)
      document.body.classList.remove('lm-lock')
      document.removeEventListener('keydown', onKey)
      gsap.killTweensOf([frame, backdrop])
    }
  }, [close, origin])

  /* Se il `load` non arriva, il sito ha rifiutato di farsi incorporare. */
  useEffect(() => {
    if (!showEmbed || loaded) return
    const id = window.setTimeout(() => setBlocked(true), EMBED_TIMEOUT_MS)
    return () => window.clearTimeout(id)
  }, [showEmbed, loaded])

  return (
    <div className="lm-viewer" role="dialog" aria-modal="true" aria-label={`Il sito di ${work.client}`}>
      <div className="lm-viewer-backdrop" ref={backdropRef} onClick={close} />

      <div className="lm-viewer-frame" ref={frameRef}>
        <BrowserChrome
          tone="viewer"
          label={work.barLabel}
          actions={
            <>
              <a
                className="lm-viewer-out"
                href={work.siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="grow"
              >
                Apri in una scheda nuova
              </a>
              <button
                type="button"
                className="lm-viewer-close"
                onClick={close}
                ref={closeRef}
                aria-label="Chiudi"
                data-cursor="grow"
              >
                <span aria-hidden="true">✕</span>
              </button>
            </>
          }
        />

        <div className="lm-viewer-body">
          {showEmbed && !blocked ? (
            <iframe
              className="lm-viewer-iframe"
              src={work.siteUrl}
              title={`Il sito di ${work.client}`}
              loading="lazy"
              onLoad={() => setLoaded(true)}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          ) : null}

          {/* Sotto l'iframe finché non ha caricato, e unica cosa visibile se
              l'incorporamento è stato rifiutato. */}
          {!loaded || blocked ? (
            <div className="lm-viewer-fallback">
              <div className="lm-viewer-shot">
                <WorkMediaView work={work} eager />
              </div>

              {blocked ? (
                <div className="lm-viewer-note">
                  <p>Questo sito non si lascia incorporare in una finestra.</p>
                  <a
                    className="lm-viewer-cta"
                    href={work.siteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-cursor="grow"
                  >
                    Aprilo in una scheda nuova →
                  </a>
                </div>
              ) : (
                <span className="lm-viewer-loading">Carico il sito…</span>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
