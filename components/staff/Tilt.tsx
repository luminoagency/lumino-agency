'use client'

import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from '@/components/home/useMotion'

/**
 * L'inclinazione e il riflesso che seguono il puntatore.
 *
 * Serve a una cosa sola: far sentire che le card sono **oggetti di vetro** e non
 * rettangoli stampati. L'inclinazione è minuscola (4 gradi al massimo) — oltre
 * diventa un giocattolo, e una dashboard di lavoro non si inclina come una carta
 * collezionabile.
 *
 * ## Perché questo file è stato riscritto
 *
 * La prima versione era la causa principale dello scatto della home, e vale la
 * pena dire perché: a **ogni** `pointermove` — sessanta o più al secondo —
 * faceva una `querySelectorAll` su tutto il sottoalbero e poi un
 * `getBoundingClientRect()` su ognuna delle dodici card. Ogni `getBoundingClientRect`
 * costringe il browser a ricalcolare il layout prima di poter rispondere; dodici
 * per sessanta fa settecento layout forzati al secondo per muovere un'ombra.
 * Muovendo il mouse la pagina non aveva più tempo per disegnare.
 *
 * Ora:
 *
 * 1. **Le card e i loro rettangoli si misurano una volta**, e si rimisurano solo
 *    quando possono essere cambiati davvero — scroll, resize, o una card che
 *    entra o esce (`MutationObserver`). Fra un evento e l'altro il puntatore si
 *    confronta con numeri già in memoria.
 * 2. **Si lavora una volta per fotogramma** (`requestAnimationFrame`): dieci
 *    `pointermove` arrivati fra due frame producono un solo aggiornamento, che
 *    è l'unico che si sarebbe visto.
 * 3. **Si tocca solo la card sotto il puntatore**, e quella lasciata. Prima si
 *    riscriveva lo `style` di tutte e dodici a ogni movimento: undici scritture
 *    su tre proprietà per non cambiare niente.
 * 4. Le transizioni stanno nel CSS (`.lm-card[data-hover]`), non riscritte da JS
 *    a ogni movimento.
 *
 * Restano le due variabili CSS (`--mx`, `--my`): il gradiente del riflesso vive
 * nel foglio di stile, dove si cambia senza ricompilare, e il JS fa solo il
 * mestiere che il CSS non sa fare — sapere dov'è il mouse.
 *
 * Niente `setState`: un render React per ogni movimento del mouse è l'altro modo
 * classico di rendere pesante un effetto che costa zero.
 *
 * Solo dove c'è un puntatore fine: su un telefono non esiste l'hover, e
 * l'inclinazione resterebbe incastrata dopo il primo tocco.
 */
export default function Tilt({
  children,
  className,
  max = 4,
}: {
  children: React.ReactNode
  className?: string
  /** Gradi massimi di inclinazione. */
  max?: number
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (prefersReducedMotion()) return
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return

    let carte: { el: HTMLElement; r: DOMRect }[] = []
    let dentro: HTMLElement | null = null
    let x = 0
    let y = 0
    let inCoda = false
    let daMisurare = true

    function misura() {
      carte = Array.from(el!.querySelectorAll<HTMLElement>('[data-hover]')).map((c) => ({
        el: c,
        r: c.getBoundingClientRect(),
      }))
      daMisurare = false
    }

    function applica() {
      inCoda = false
      if (daMisurare) misura()

      /* La ricerca è lineare su una dozzina di rettangoli: sono confronti fra
         numeri, non domande al layout, e costano qualche microsecondo. */
      let trovata: { el: HTMLElement; r: DOMRect } | null = null
      for (const c of carte) {
        if (x >= c.r.left && x <= c.r.right && y >= c.r.top && y <= c.r.bottom) {
          trovata = c
          break
        }
      }

      if (dentro && dentro !== trovata?.el) {
        dentro.style.transform = ''
        dentro = null
      }
      if (!trovata) return

      const px = (x - trovata.r.left) / trovata.r.width
      const py = (y - trovata.r.top) / trovata.r.height
      const s = trovata.el.style
      s.setProperty('--mx', `${(px * 100).toFixed(1)}%`)
      s.setProperty('--my', `${(py * 100).toFixed(1)}%`)
      s.transform = `perspective(900px) rotateX(${((0.5 - py) * max).toFixed(2)}deg) rotateY(${((px - 0.5) * max).toFixed(2)}deg)`
      dentro = trovata.el
    }

    function muovi(event: PointerEvent) {
      x = event.clientX
      y = event.clientY
      if (inCoda) return
      inCoda = true
      requestAnimationFrame(applica)
    }

    function esci() {
      if (!dentro) return
      dentro.style.transform = ''
      dentro = null
    }

    /* Scroll e resize spostano i rettangoli senza che il mouse si muova: si
       segna che vanno rimisurati e lo si fa al primo movimento utile, non
       subito — durante uno scroll veloce sarebbero centinaia di misure per una
       card su cui magari non passerà nessuno. */
    const invalida = () => {
      daMisurare = true
    }

    misura()
    window.addEventListener('pointermove', muovi, { passive: true })
    window.addEventListener('scroll', invalida, { passive: true, capture: true })
    window.addEventListener('resize', invalida)
    el.addEventListener('pointerleave', esci)
    /* Le card compaiono e spariscono coi filtri: senza questo, dopo un filtro
       si inclinerebbero rettangoli che non ci sono più. */
    const mo = new MutationObserver(invalida)
    mo.observe(el, { childList: true, subtree: true })

    return () => {
      window.removeEventListener('pointermove', muovi)
      window.removeEventListener('scroll', invalida, { capture: true })
      window.removeEventListener('resize', invalida)
      el.removeEventListener('pointerleave', esci)
      mo.disconnect()
    }
  }, [max])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
