'use client'

import { useEffect, useRef, useState } from 'react'
import type { Work } from './worksData'
import WorkMediaView from './WorkMediaView'
import { gsap, prefersReducedMotion } from './useMotion'

/**
 * Il sito vero del cliente dentro la card, scorrevole.
 *
 * L'iframe è renderizzato a larghezza desktop e poi rimpicciolito con scale():
 * così si vede il layout desktop del sito, non la sua versione mobile schiacciata
 * in 600px.
 *
 * Lo scorrimento trasla l'iframe, non scrolla il documento dentro: quello è
 * cross-origin e non è raggiungibile da qui. Traslazione e scala stanno sullo
 * stesso elemento — un transform su un genitore creerebbe un contesto di
 * impilamento che rende sfocato il contenuto incorporato.
 *
 * Caricamento pigro VERO: l'attributo src si popola solo quando la card si
 * avvicina al viewport, e si svuota quando se n'è andata da qualche secondo.
 * Quattro siti interi caricati all'apertura della home sarebbero pagati da
 * tutti, anche da chi non scende mai fin lì.
 */

/** Larghezza a cui il sito viene renderizzato prima di essere rimpicciolito. */
const DESKTOP_WIDTH = 1440
/**
 * Margine in più a destra dove far cadere la barra di scorrimento del sito
 * incorporato. È un documento di un'altra origine: la sua scrollbar non si può
 * nascondere via CSS, ma si può mandarla oltre il bordo ritagliato.
 * La scala resta calcolata su DESKTOP_WIDTH, così il layout non si restringe.
 */
const SCROLLBAR_BLEED = 22
/** Altezza dell'iframe: quanto di pagina vogliamo poter scorrere. */
const FRAME_HEIGHT = 2400

const SCROLL_DOWN_S = 12
const HOLD_S = 1
const SCROLL_UP_S = 2
const HOVER_TIMESCALE = SCROLL_DOWN_S / 5
/** Oltre questo tempo senza `load`, l'incorporamento è da considerarsi fallito. */
const LOAD_TIMEOUT_MS = 5000
/** Quanto aspettare, una volta fuori vista, prima di liberare la memoria. */
const UNLOAD_DELAY_MS = 4000

/* Non più di quattro siti vivi insieme: ogni iframe è un documento completo,
   con il suo JS e le sue immagini. Con quattro card il limite non morde mai,
   ma il giorno che diventano otto la home non deve caricarne otto. */
const MAX_LIVE = 4
const live = new Set<string>()

function claimSlot(id: string) {
  if (live.has(id)) return true
  if (live.size >= MAX_LIVE) return false
  live.add(id)
  return true
}

function releaseSlot(id: string) {
  live.delete(id)
}

export default function CardFrame({
  work,
  index,
  viewportRef,
  barRef,
}: {
  work: Work
  index: number
  /** La finestra della card: serve a calcolare scala e corsa. */
  viewportRef: React.RefObject<HTMLDivElement>
  /** Barra di avanzamento: segue la stessa corsa del sito. */
  barRef: React.RefObject<HTMLSpanElement>
}) {
  const frameRef = useRef<HTMLIFrameElement>(null)
  const [src, setSrc] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  /* Il banner cookie del sito cliente comparirebbe anche qui dentro e
     coprirebbe l'anteprima. Il parametro è innocuo finché i template non lo
     leggono (verificato: tutti rispondono 200 con il parametro in coda). */
  const previewUrl = work.siteUrl
    ? `${work.siteUrl}${work.siteUrl.includes('?') ? '&' : '?'}preview=1`
    : ''

  /* ── Caricamento pigro e scarico ───────────────────────────────────────── */
  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport || !previewUrl) return

    let unloadTimer = 0

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          window.clearTimeout(unloadTimer)
          if (claimSlot(work.id)) setSrc((current) => current || previewUrl)
        } else {
          // Non si scarica appena esce: un rimbalzo di scroll ricaricherebbe
          // tutto da capo. Si aspetta di essere sicuri che se n'è andata.
          unloadTimer = window.setTimeout(() => {
            releaseSlot(work.id)
            setSrc('')
            setLoaded(false)
            setFailed(false)
          }, UNLOAD_DELAY_MS)
        }
      },
      { rootMargin: '200px 0px', threshold: 0 },
    )
    observer.observe(viewport)

    return () => {
      observer.disconnect()
      window.clearTimeout(unloadTimer)
      releaseSlot(work.id)
    }
  }, [previewUrl, work.id, viewportRef])

  /* Se il `load` non arriva, il sito ha rifiutato di farsi incorporare (o la
     rete è andata male): si ripiega sul finto-sito. Mai una card bianca. */
  useEffect(() => {
    if (!src || loaded) return
    const timer = window.setTimeout(() => setFailed(true), LOAD_TIMEOUT_MS)
    return () => window.clearTimeout(timer)
  }, [src, loaded])

  /* ── Scala e scorrimento ───────────────────────────────────────────────── */
  useEffect(() => {
    const frame = frameRef.current
    const viewport = viewportRef.current
    if (!frame || !viewport || !loaded || failed) return
    if (prefersReducedMotion()) return

    let timeline: gsap.core.Timeline | null = null

    const build = () => {
      timeline?.kill()

      const scale = viewport.clientWidth / DESKTOP_WIDTH
      gsap.set(frame, { transformOrigin: 'top left', scale, y: 0 })

      // Corsa in pixel di schermo: l'altezza rimpicciolita meno la finestra.
      const travel = Math.max(0, FRAME_HEIGHT * scale - viewport.clientHeight)
      if (travel < 4) return

      // Velocità sfalsate: quattro nastri sincronizzati si leggono come una
      // sola animazione, quattro sfasati come quattro siti diversi.
      const duration = SCROLL_DOWN_S + index * 1.6

      const bar = barRef.current
      timeline = gsap
        .timeline({ repeat: -1 })
        .to(frame, { y: -travel, duration, ease: 'none' })
        .to(frame, { y: -travel, duration: HOLD_S })
        .to(frame, { y: 0, duration: SCROLL_UP_S, ease: 'power2.inOut' })

      // La barra segue la stessa corsa: è la posizione nella pagina, non un
      // effetto a sé, quindi va sulla stessa timeline e non su una parallela.
      if (bar) {
        timeline
          .fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration, ease: 'none' }, 0)
          .to(bar, { scaleX: 0, duration: SCROLL_UP_S, ease: 'power2.inOut' }, duration + HOLD_S)
      }

      // Ognuna parte da un punto diverso del giro.
      timeline.progress((index * 0.19) % 1)
    }

    build()

    const resize = new ResizeObserver(build)
    resize.observe(viewport)

    const card = viewport.closest('.lm-card')
    const onEnter = () => timeline?.timeScale(HOVER_TIMESCALE)
    const onLeave = () => timeline?.timeScale(1)
    card?.addEventListener('pointerenter', onEnter)
    card?.addEventListener('pointerleave', onLeave)

    return () => {
      resize.disconnect()
      card?.removeEventListener('pointerenter', onEnter)
      card?.removeEventListener('pointerleave', onLeave)
      timeline?.kill()
      gsap.set(frame, { clearProps: 'transform' })
      if (barRef.current) gsap.set(barRef.current, { scaleX: 0 })
    }
  }, [loaded, failed, index, viewportRef, barRef])

  const showFallback = !loaded || failed

  return (
    <>
      {src && !failed ? (
        <iframe
          ref={frameRef}
          className="lm-card-frame-site"
          src={src}
          title={`Il sito di ${work.client}`}
          width={DESKTOP_WIDTH + SCROLLBAR_BLEED}
          height={FRAME_HEIGHT}
          loading="lazy"
          sandbox="allow-scripts allow-same-origin"
          tabIndex={-1}
          aria-hidden="true"
          onLoad={() => setLoaded(true)}
        />
      ) : null}

      {showFallback ? (
        <div className="lm-card-scroll lm-card-fallback">
          <WorkMediaView work={work} eager={index < 2} />
        </div>
      ) : null}
    </>
  )
}
