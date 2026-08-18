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

/** Scorciatoia: gli effetti mouse vanno accesi? */
export function mouseEffectsEnabled(): boolean {
  return hasFinePointer() && !prefersReducedMotion()
}

/** Interpolazione lineare usata da tutti i loop rAF. */
export function lerp(from: number, to: number, amount: number): number {
  return from + (to - from) * amount
}

export { gsap, ScrollTrigger }
