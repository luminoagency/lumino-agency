'use client'

import { prefersReducedMotion } from './useMotion'

/**
 * Text scramble: la stringa si ricompone lettera per lettera, ognuna con il
 * proprio momento di partenza e di arrivo.
 *
 * Gira su requestAnimationFrame (mai setInterval) e restituisce una funzione
 * di annullamento: se il mouse rientra prima che l'animazione sia finita, la
 * precedente va fermata, altrimenti due cicli si sovrascrivono il testo.
 */

const POOL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&@/*'

export function scramble(el: HTMLElement, text: string): () => void {
  if (prefersReducedMotion()) {
    el.textContent = text
    return () => {}
  }

  const queue = Array.from(text).map((char, i) => {
    const start = Math.floor(Math.random() * 10) + i * 1.1
    return { char, start, end: start + 9 }
  })

  let frame = 0
  let raf = 0

  const run = () => {
    let out = ''
    let done = 0

    for (const item of queue) {
      if (frame >= item.end) {
        out += item.char
        done += 1
      } else if (frame >= item.start) {
        out += POOL[Math.floor(Math.random() * POOL.length)]
      } else {
        out += item.char
      }
    }

    el.textContent = out
    if (done < queue.length) {
      frame += 1
      raf = requestAnimationFrame(run)
    }
  }

  raf = requestAnimationFrame(run)

  return () => {
    cancelAnimationFrame(raf)
    el.textContent = text
  }
}

/**
 * Aggancia lo scramble all'hover di un elemento.
 * Restituisce l'unsubscribe da usare nel cleanup dell'effetto.
 */
export function bindScramble(el: HTMLElement, text: string): () => void {
  let cancel: (() => void) | null = null

  const onEnter = () => {
    cancel?.()
    cancel = scramble(el, text)
  }

  el.addEventListener('pointerenter', onEnter)

  return () => {
    el.removeEventListener('pointerenter', onEnter)
    cancel?.()
  }
}
