'use client'

import { useEffect, useRef } from 'react'
import { lerp, onMouseEffectsChange, pointer, trackPointer } from './useMotion'

/**
 * Cursore custom + aurora + aloni di fondo.
 *
 * Punto secco che segue senza ritardo, anello che insegue con lerp .18, alone
 * caldo che insegue molto più lento (lerp .045) e schiarisce il fondo in
 * mix-blend-mode: screen.
 *
 * Un solo loop rAF per tutti e tre: sono gli unici effetti che girano di
 * continuo, e tenerli separati significherebbe tre loop concorrenti.
 *
 * Gli stati dell'anello arrivano per delega dal documento, non da un listener
 * per elemento: qualunque nodo con data-cursor="grow" lo fa crescere,
 * data-cursor="label" lo trasforma nella pastiglia rossa con scritto "Vedi".
 */
export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const auroraRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const dot = dotRef.current
    const ring = ringRef.current
    const aurora = auroraRef.current
    if (!dot || !ring || !aurora) return

    let stopPointer: (() => void) | null = null
    let raf = 0
    let live = false

    // Anello e aurora partono al centro, come nel riferimento.
    const ringPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    const auroraPos = { x: window.innerWidth / 2, y: window.innerHeight * 0.45 }

    const tick = () => {
      dot.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0)`

      ringPos.x = lerp(ringPos.x, pointer.x, 0.18)
      ringPos.y = lerp(ringPos.y, pointer.y, 0.18)
      ring.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0)`

      auroraPos.x = lerp(auroraPos.x, pointer.x, 0.045)
      auroraPos.y = lerp(auroraPos.y, pointer.y, 0.045)
      aurora.style.transform = `translate3d(${auroraPos.x}px, ${auroraPos.y}px, 0)`

      raf = requestAnimationFrame(tick)
    }

    const onOver = (event: PointerEvent) => {
      const el = (event.target as Element | null)?.closest?.('[data-cursor]')
      const mode = el?.getAttribute('data-cursor')
      dot.classList.toggle('is-hidden', mode === 'grow' || mode === 'label')
      ring.classList.toggle('is-grown', mode === 'grow')
      ring.classList.toggle('is-label', mode === 'label')
    }

    // Quando il puntatore esce dalla finestra, punto e anello restano fermi
    // dov'erano: in uno screenshot sembrano un pulsante appiccicato al bordo,
    // e stando sopra a tutto (z-index 9999) si vedono anche sopra il menu.
    // Fuori dalla finestra il cursore custom non deve esistere.
    const onLeaveWindow = (event: PointerEvent) => {
      if (event.relatedTarget === null) document.body.classList.add("lm-cursor-away")
    }
    const onEnterWindow = () => document.body.classList.remove("lm-cursor-away")

    const enable = () => {
      if (live) return
      live = true
      stopPointer = trackPointer()
      document.body.classList.add('lm-cursor-on')
      // Nasconde punto e anello finché il puntatore non si muove davvero: al
      // caricamento la posizione è un'ipotesi (il centro), e un cerchio fermo
      // in mezzo allo schermo si legge come un elemento dell'interfaccia.
      document.body.classList.add('lm-cursor-away')
      window.addEventListener('pointermove', onEnterWindow, { once: false })
      document.addEventListener('pointerover', onOver)
      document.addEventListener('pointerout', onLeaveWindow)
      document.addEventListener('pointerover', onEnterWindow)
      raf = requestAnimationFrame(tick)
    }

    const disable = () => {
      if (!live) return
      live = false
      cancelAnimationFrame(raf)
      document.removeEventListener('pointerover', onOver)
      document.removeEventListener('pointerout', onLeaveWindow)
      document.removeEventListener('pointerover', onEnterWindow)
      window.removeEventListener('pointermove', onEnterWindow)
      document.body.classList.remove('lm-cursor-on', 'lm-cursor-away')
      
      stopPointer?.()
      stopPointer = null
      dot.classList.remove('is-hidden')
      ring.classList.remove('is-grown', 'is-label')
    }

    const unsubscribe = onMouseEffectsChange((enabled) => (enabled ? enable() : disable()))

    return () => {
      unsubscribe()
      disable()
    }
  }, [])

  return (
    <>
      <div className="lm-dawn" aria-hidden="true" />
      <div className="lm-glow lm-glow-a" aria-hidden="true" />
      <div className="lm-glow lm-glow-b" aria-hidden="true" />
      <div className="lm-aurora" ref={auroraRef} aria-hidden="true" />
      <div className="lm-cur" ref={dotRef} aria-hidden="true" />
      <div className="lm-cur-ring" ref={ringRef} aria-hidden="true">
        <span>Vedi</span>
      </div>
    </>
  )
}
