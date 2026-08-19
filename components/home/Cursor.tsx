'use client'

import { useEffect, useRef } from 'react'
import { lerp, onMouseEffectsChange, pointer, trackPointer } from './useMotion'

/**
 * Cursore custom + aurora + aloni di fondo.
 *
 * Il cursore ha due parti: un punto che segue senza ritardo e un anello che
 * insegue. Sopra certi elementi l'anello diventa un DISCO pieno translucido con
 * dentro una parola — si vede attraverso quello che c'è sotto, e il disco
 * insegue con più lentezza per dare l'idea di massa.
 *
 * Il markup è diviso in due apposta: l'ancora (.lm-cur-ring) la trasla il JS,
 * il disco (.lm-cur-disc) porta stati e animazioni. Tenerli sullo stesso
 * elemento significherebbe che il rimbalzo al click sovrascrive la posizione.
 *
 * Lo stato lo dichiara l'elemento sorvolato con data-cursor: nessun listener
 * per elemento, una sola delega sul documento.
 */

interface Mode {
  cls: string
  label: string
  /** Disco pieno: nasconde il punto e rallenta l'inseguimento. */
  disc: boolean
}

const MODES: Record<string, Mode> = {
  /* Solo l'anello che cresce, senza parola: link del menu e affini. */
  grow: { cls: 'is-grown', label: '', disc: false },
  /* Card dei lavori. */
  view: { cls: 'is-view', label: 'Vedi', disc: true },
  /* Righe "Cosa facciamo". */
  open: { cls: 'is-open', label: 'Apri', disc: true },
  /* Blocchi di contatto diretto. */
  whatsapp: { cls: 'is-whatsapp', label: 'Scrivici', disc: true },
  copy: { cls: 'is-copy', label: 'Copia', disc: true },
}

const ALL_CLASSES = Object.values(MODES).map((m) => m.cls)

/** Inseguimento normale, e quello più pesante quando è un disco. */
const LAG = 0.18
const LAG_DISC = 0.12

export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const discRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLSpanElement>(null)
  const auroraRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const dot = dotRef.current
    const ring = ringRef.current
    const disc = discRef.current
    const label = labelRef.current
    const aurora = auroraRef.current
    if (!dot || !ring || !disc || !label || !aurora) return

    let stopPointer: (() => void) | null = null
    let raf = 0
    let live = false
    let lag = LAG

    const ringPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    const auroraPos = { x: window.innerWidth / 2, y: window.innerHeight * 0.45 }

    const tick = () => {
      dot.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0)`

      ringPos.x = lerp(ringPos.x, pointer.x, lag)
      ringPos.y = lerp(ringPos.y, pointer.y, lag)
      ring.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0)`

      auroraPos.x = lerp(auroraPos.x, pointer.x, 0.045)
      auroraPos.y = lerp(auroraPos.y, pointer.y, 0.045)
      aurora.style.transform = `translate3d(${auroraPos.x}px, ${auroraPos.y}px, 0)`

      raf = requestAnimationFrame(tick)
    }

    const onOver = (event: PointerEvent) => {
      const el = (event.target as Element | null)?.closest?.('[data-cursor]')
      const mode = el ? MODES[el.getAttribute('data-cursor') ?? ''] : undefined

      disc.classList.remove(...ALL_CLASSES)
      if (mode) disc.classList.add(mode.cls)

      // La parola cambia solo quando ce n'è una: sostituirla con stringa vuota
      // mentre il disco si richiude farebbe sparire il testo di scatto.
      if (mode?.label) label.textContent = mode.label
      disc.classList.toggle('has-label', Boolean(mode?.label))

      dot.classList.toggle('is-hidden', Boolean(mode))
      lag = mode?.disc ? LAG_DISC : LAG

      // Sulle sezioni chiare il viola translucido su bianco non regge: la
      // parola sopra diventa illeggibile. Lì il disco si fa più coperto.
      disc.classList.toggle('on-light', Boolean(el?.closest('.lm-light')))
    }

    // Contrazione e rimbalzo alla pressione: il riscontro parte subito, prima
    // che qualsiasi cosa il click apra abbia cominciato a muoversi.
    const onPress = () => {
      disc.classList.remove('is-press')
      // Forza il riavvio dell'animazione anche a pressioni ravvicinate.
      void disc.offsetWidth
      disc.classList.add('is-press')
    }

    const onLeaveWindow = (event: PointerEvent) => {
      if (event.relatedTarget === null) document.body.classList.add('lm-cursor-away')
    }
    const onEnterWindow = () => document.body.classList.remove('lm-cursor-away')

    const enable = () => {
      if (live) return
      live = true
      stopPointer = trackPointer()
      document.body.classList.add('lm-cursor-on')
      // Nascosto finché il puntatore non si muove davvero: al caricamento la
      // posizione è un'ipotesi, e un cerchio fermo al centro sembra un elemento
      // dell'interfaccia.
      document.body.classList.add('lm-cursor-away')
      window.addEventListener('pointermove', onEnterWindow)
      document.addEventListener('pointerover', onOver)
      document.addEventListener('pointerout', onLeaveWindow)
      document.addEventListener('pointerdown', onPress)
      raf = requestAnimationFrame(tick)
    }

    const disable = () => {
      if (!live) return
      live = false
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onEnterWindow)
      document.removeEventListener('pointerover', onOver)
      document.removeEventListener('pointerout', onLeaveWindow)
      document.removeEventListener('pointerdown', onPress)
      document.body.classList.remove('lm-cursor-on', 'lm-cursor-away')
      stopPointer?.()
      stopPointer = null
      dot.classList.remove('is-hidden')
      disc.classList.remove(...ALL_CLASSES, 'has-label', 'on-light', 'is-press')
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
        <div className="lm-cur-disc" ref={discRef}>
          <span ref={labelRef} />
        </div>
      </div>
    </>
  )
}
