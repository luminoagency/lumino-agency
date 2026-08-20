'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
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
/* Oltre questo tempo senza un caricamento buono, l'incorporamento è da dare
   per rifiutato: il sito blocca il framing, è offline, o la rete è andata
   male. Da fuori non si distinguono, e la risposta è la stessa. */
const EMBED_TIMEOUT_MS = 5000
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

  /* Si chiede al server se il sito si lascia incorporare, PRIMA di mostrare
     un riquadro che potrebbe restare vuoto. Dal browser non è deducibile: un
     frame rifiutato emette gli stessi eventi di uno buono (vedi
     app/api/embeddable). Il timeout resta come rete per i casi che nemmeno il
     server prevede — sito che risponde ma non dipinge, rete che cade a metà. */
  useEffect(() => {
    if (!work.siteUrl) {
      setBlocked(true)
      return
    }

    let alive = true
    fetch(`/api/embeddable?url=${encodeURIComponent(work.siteUrl)}`)
      .then((r) => r.json())
      .then((data) => {
        if (alive && !data.ok) setBlocked(true)
      })
      .catch(() => {
        /* Se il controllo stesso fallisce non si conclude nulla: decide il
           timeout, come prima. */
      })

    return () => {
      alive = false
    }
  }, [work.siteUrl])

  useEffect(() => {
    if (!showEmbed || loaded || blocked) return
    const id = window.setTimeout(() => setBlocked(true), EMBED_TIMEOUT_MS)
    return () => window.clearTimeout(id)
  }, [showEmbed, loaded, blocked])

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

  /**
   * L'overlay si monta in fondo al <body>, non dove sta il componente.
   *
   * Non è una preferenza stilistica, è l'unico modo di uscire dal contesto di
   * impilamento in cui era finito. `.lm main` è `position: relative; z-index: 2`
   * (serve a tenere il contenuto sopra gli aloni, vedi motion.css): questo crea
   * un contesto, e lo z-index 900 dell'overlay valeva soltanto DENTRO main.
   * Fuori, main pesava 2 contro i 60 della nav — quindi la nav copriva tutto
   * l'overlay, backdrop compreso, e il pulsante di chiusura in alto a destra
   * finiva esattamente dietro la sua fascia: c'era, ma non lo si vedeva e non
   * lo si poteva cliccare.
   *
   * Attaccato al body, i 900 tornano a confrontarsi con i 60 della nav e
   * vincono. È anche il posto giusto per un dialogo modale: un `aria-modal`
   * annidato dentro `<main>` racconta una gerarchia che non esiste.
   */
  const overlay = (
    <div className="lm-viewer" role="dialog" aria-modal="true" aria-label={`Il sito di ${work.client}`}>
      <div className="lm-viewer-backdrop" ref={backdropRef} onClick={close} />

      {/* La via d'uscita sta FUORI dalla cornice, non dentro la barra finta del
          browser: lì era un cerchietto chiaro sopra un sito che poteva essere
          altrettanto chiaro, e su telefono finiva stretto fra le altre voci.
          Qui è fisso sullo schermo, sopra ogni cosa, e non se ne va mai —
          nemmeno scorrendo dentro il sito incorporato.
          Esc e il click sul fondo continuano a funzionare, ma non si può
          chiedere a chi non li conosce di indovinarli. */}
      <button
        type="button"
        className="lm-viewer-exit"
        onClick={close}
        ref={closeRef}
        aria-label="Chiudi anteprima"
        data-cursor="grow"
      >
        <span className="lm-viewer-exit-word" aria-hidden="true">
          Chiudi
        </span>
        <span className="lm-viewer-exit-ring" aria-hidden="true">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </span>
      </button>

      <div className="lm-viewer-frame" ref={frameRef}>
        <BrowserChrome tone="viewer" label={work.barLabel} />

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
              l'incorporamento è stato rifiutato o non c'è un indirizzo.
              REGOLA: un click non deve MAI produrre il nulla. Se il sito non
              si può mostrare qui, si mostra comunque il progetto. */}
          {!loaded || blocked ? (
            <div className={`lm-viewer-fallback${blocked ? ' is-blocked' : ''}`}>
              <div className="lm-viewer-shot">
                <WorkMediaView work={work} eager />
              </div>

              {blocked ? (
                <div className="lm-viewer-note">
                  <span className="lm-viewer-note-tag">
                    {work.sector} · {work.year}
                  </span>
                  <h3 className="lm-viewer-note-title">{work.client}</h3>
                  <p>{work.blurb}</p>

                  {work.siteUrl ? (
                    <a
                      className="lm-viewer-cta"
                      href={work.siteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-cursor="grow"
                    >
                      Apri il sito in una nuova scheda →
                    </a>
                  ) : (
                    <span className="lm-viewer-cta is-quiet">Online a breve</span>
                  )}
                </div>
              ) : (
                <span className="lm-viewer-loading">Carico il sito…</span>
              )}
            </div>
          ) : null}
        </div>

        {/* Barra di piede sempre visibile: dice di chi è il sito che si sta
            guardando — dentro l'iframe non c'è modo di saperlo — e offre la
            via d'uscita in avanti, quella che porta al sito vero. */}
        <div className="lm-viewer-bar">
          <span className="lm-viewer-bar-who">
            <b>{work.client}</b>
            <i>{work.sector}</i>
          </span>

          {work.siteUrl ? (
            <a
              className="lm-viewer-bar-out"
              href={work.siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="grow"
            >
              Apri in una nuova scheda
              <span aria-hidden="true">↗</span>
            </a>
          ) : (
            <span className="lm-viewer-bar-out is-quiet">Online a breve</span>
          )}
        </div>
      </div>
    </div>
  )

  /* Il componente si monta solo dopo un click, quindi `document` c'è sempre.
     Il controllo resta perché un portal verso un body inesistente è l'errore
     che si scopre in produzione e non in sviluppo. */
  return typeof document === 'undefined' ? overlay : createPortal(overlay, document.body)
}
