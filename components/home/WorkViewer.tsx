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
/** Durata della visita guidata prima che l utente prenda il controllo. */
const TOUR_S = 26

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
  /** false = sta scorrendo da solo · true = comanda l'utente. */
  const [taken, setTaken] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const tourRef = useRef<gsap.core.Tween | null>(null)
  const closingRef = useRef(false)

  /**
   * Il primo gesto dell'utente ferma la visita guidata e gli lascia il sito.
   * L'iframe torna a filo del riquadro e riprende la sua altezza naturale:
   * da lì in poi si scorre col suo scroll, come un sito qualsiasi.
   */
  const takeOver = useCallback(() => {
    if (taken) return
    setTaken(true)
    tourRef.current?.kill()
    tourRef.current = null
    if (iframeRef.current) {
      gsap.to(iframeRef.current, { y: 0, duration: 0.35, ease: 'power2.out' })
    }
  }, [taken])

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

  /* Visita guidata: appena il sito ha caricato scorre da solo dall'alto in
     basso. Non è lo scroll del documento — è cross-origin, irraggiungibile —
     ma l'iframe stesso, reso più alto del riquadro e traslato. */
  useEffect(() => {
    const frame = iframeRef.current
    if (!frame || !loaded || blocked || taken || prefersReducedMotion()) return

    const travel = frame.offsetHeight - (frame.parentElement?.clientHeight ?? 0)
    if (travel <= 8) return

    tourRef.current = gsap.to(frame, {
      y: -travel,
      duration: TOUR_S,
      ease: 'none',
      delay: 0.8,
    })

    return () => {
      tourRef.current?.kill()
      tourRef.current = null
    }
  }, [loaded, blocked, taken])

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
              ref={iframeRef}
              className={`lm-viewer-iframe${taken ? ' is-taken' : ''}`}
              src={work.siteUrl}
              title={`Il sito di ${work.client}`}
              loading="lazy"
              onLoad={() => setLoaded(true)}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          ) : null}

          {/* Mentre scorre da solo, l'iframe è inerte e sopra c'è questo velo
              trasparente: un iframe di un'altra origine si mangia gli eventi,
              quindi senza velo non ci sarebbe modo di accorgersi che l'utente
              vuole prendere il controllo. Al primo gesto il velo sparisce e il
              sito diventa navigabile. */}
          {showEmbed && !blocked && !taken ? (
            <div
              className="lm-viewer-grab"
              onPointerDown={takeOver}
              onWheel={takeOver}
              onTouchStart={takeOver}
              role="presentation"
            >
              <span className="lm-viewer-grab-hint">tocca per navigare</span>
            </div>
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
