'use client'

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/**
 * Base condivisa del movimento della home.
 *
 * Divisione dei compiti decisa a monte:
 *  · GSAP + ScrollTrigger  → scroll, reveal, sticky, tween con easing
 *  · requestAnimationFrame + lerp → cursore, aurora, particelle, lettere
 *    reattive (girano a 60fps continui: con GSAP sarebbe solo overhead)
 *
 * Qui vivono solo le decisioni che ogni sezione deve prendere allo stesso modo:
 * registrazione del plugin, motion ridotto, e la soglia oltre la quale gli
 * effetti legati al mouse hanno senso.
 */

/** Sotto questa larghezza il puntatore è un dito: niente effetti mouse. */
export const POINTER_BREAKPOINT = 821

let registered = false

/** Registra ScrollTrigger una volta sola, lato client. */
export function registerScrollTrigger(): typeof gsap {
  if (!registered && typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger)
    registered = true
  }
  return gsap
}

/** true se l'utente ha chiesto meno movimento: in quel caso non si anima nulla. */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * true solo su puntatore fine e schermo ≥ 821px.
 * Governa cursore custom, tilt, riflessi e fughe delle particelle.
 */
export function hasFinePointer(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia(`(min-width: ${POINTER_BREAKPOINT}px) and (pointer: fine)`).matches
}

/**
 * Serve un mouse? Vale SOLO per ciò che senza puntatore non ha senso: cursore
 * custom, alone che lo insegue, inclinazioni verso il puntatore.
 */
export function mouseEffectsEnabled(): boolean {
  return hasFinePointer() && !prefersReducedMotion()
}

/**
 * Si può animare?
 *
 * È una domanda DIVERSA dalla precedente, e per un pezzo le due sono state la
 * stessa: il risultato era che sotto 821px si spegneva tutto — blob, scintille,
 * trascinamento delle lettere, onda al tocco — e dal telefono il sito sembrava
 * morto. Un dito non è un mouse, ma è comunque un puntatore: quello che non
 * può fare è passare *sopra* le cose senza toccarle.
 *
 * Qui l'unico veto è la preferenza dell'utente.
 */
export function ambientMotionEnabled(): boolean {
  return !prefersReducedMotion()
}

/** Chiama `handler` con lo stato corrente e a ogni cambio della preferenza. */
export function onAmbientMotionChange(handler: (enabled: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => {}

  const query = window.matchMedia('(prefers-reduced-motion: reduce)')
  const sync = () => handler(ambientMotionEnabled())
  query.addEventListener('change', sync)
  sync()

  return () => query.removeEventListener('change', sync)
}

/**
 * Schermo stretto: si riducono le QUANTITÀ, non le funzionalità. Meno
 * particelle, meno cerchi, sfocature più corte — le stesse cose, che costano
 * meno.
 */
export function isCompactViewport(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia(`(max-width: ${POINTER_BREAKPOINT - 1}px)`).matches
}

/**
 * Chiama `handler` con lo stato corrente e a ogni cambio (resize oltre la
 * soglia, motion ridotto attivato a pagina aperta). Restituisce l'unsubscribe.
 *
 * Serve perché lo stato non è deciso una volta al mount: chi apre la finestra
 * stretta e poi la allarga deve ottenere comunque il comportamento giusto.
 */
export function onMouseEffectsChange(handler: (enabled: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => {}

  const queries = [
    window.matchMedia(`(min-width: ${POINTER_BREAKPOINT}px) and (pointer: fine)`),
    window.matchMedia('(prefers-reduced-motion: reduce)'),
  ]
  const sync = () => handler(mouseEffectsEnabled())

  queries.forEach((query) => query.addEventListener('change', sync))
  sync()

  return () => queries.forEach((query) => query.removeEventListener('change', sync))
}

/** Interpolazione lineare usata da tutti i loop rAF. */
export function lerp(from: number, to: number, amount: number): number {
  return from + (to - from) * amount
}

/**
 * Posizione del puntatore condivisa da tutti gli effetti (cursore, aurora,
 * lettere dell'hero, scintille, anteprima del menu).
 *
 * Nel riferimento HTML è una coppia di variabili globali `mx, my` alimentata da
 * un solo listener. Qui è lo stesso: un singolo listener a livello di modulo,
 * invece di uno per componente, così cinque effetti non si contendono lo stesso
 * evento a ogni movimento del mouse.
 */
export const pointer = { x: -1000, y: -1000 }

let tracking = 0

/** Avvia il tracciamento (idempotente). Restituisce la funzione per fermarlo. */
export function trackPointer(): () => void {
  if (typeof window === 'undefined') return () => {}

  if (tracking === 0) {
    if (pointer.x < 0) {
      pointer.x = window.innerWidth / 2
      pointer.y = window.innerHeight / 2
    }
    window.addEventListener('pointermove', onPointerMove, { passive: true })
  }
  tracking += 1

  let released = false
  return () => {
    if (released) return
    released = true
    tracking -= 1
    if (tracking === 0) window.removeEventListener('pointermove', onPointerMove)
  }
}

function onPointerMove(event: PointerEvent) {
  pointer.x = event.clientX
  pointer.y = event.clientY
}

/** Colori della firma, per interpolare il gradiente lettera per lettera. */
const GRADIENT_STOPS: [number, number, number][] = [
  [229, 52, 42], // --red
  [236, 106, 156], // --pink
  [139, 92, 246], // --violet
]

/**
 * Colore del gradiente firma alla posizione t (0→1).
 *
 * Serve a dipingere le lettere UNA PER UNA: con background-clip il gradiente è
 * ancorato al riquadro del testo, quindi appena una lettera si sposta il colore
 * le resta indietro. Colorandole singolarmente ognuna si porta dietro il suo.
 */
export function gradientAt(t: number): string {
  const span = t * (GRADIENT_STOPS.length - 1)
  const i = Math.min(Math.floor(span), GRADIENT_STOPS.length - 2)
  const f = span - i
  const a = GRADIENT_STOPS[i]
  const b = GRADIENT_STOPS[i + 1]

  const mix = (k: number) => Math.round(a[k] + (b[k] - a[k]) * f)
  return `rgb(${mix(0)}, ${mix(1)}, ${mix(2)})`
}

export { gsap, ScrollTrigger }
