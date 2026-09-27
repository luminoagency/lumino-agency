'use client'

import { useEffect, useRef, useState } from 'react'
import { Minus, Plus } from 'lucide-react'

/**
 * I controlli veri (ref4).
 *
 * Un pannello fatto solo di testo e liste sembra un rapporto, non uno
 * strumento. Un interruttore che scatta, un cursore che si trascina e una
 * segmentata con la pill che scivola dicono, senza scriverlo, che la pagina
 * risponde.
 *
 * Sono tutti costruiti su elementi nativi — `<input type="checkbox">`,
 * `<input type="range">`, `<button>` — travestiti dal CSS: tastiera, lettori
 * di schermo e correzione automatica funzionano senza che qui ci sia una riga
 * di codice per gestirli.
 */

export function Toggle({
  label,
  checked,
  onChange,
  name,
  size,
  disabled,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  name?: string
  /** `sm` accorcia la pista: il pallino si adegua da sé, vedi staff.css. */
  size?: 'sm'
  disabled?: boolean
}) {
  return (
    <label className="lm-toggle" data-size={size}>
      <input
        type="checkbox"
        name={name}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="lm-toggle-track" aria-hidden="true" />
      {label}
    </label>
  )
}

export function Slider({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  suffix = '',
  onChange,
}: {
  label: string
  value: number
  min?: number
  max?: number
  step?: number
  suffix?: string
  onChange: (v: number) => void
}) {
  return (
    <div className="lm-slider">
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <b>
        {value}
        {suffix}
      </b>
    </div>
  )
}

export function Stepper({
  label,
  value,
  min = 0,
  max = 99,
  onChange,
}: {
  label: string
  value: number
  min?: number
  max?: number
  onChange: (v: number) => void
}) {
  return (
    <span className="lm-stepper" role="group" aria-label={label}>
      <button type="button" aria-label="Uno in meno" onClick={() => onChange(Math.max(min, value - 1))}>
        <Minus aria-hidden="true" />
      </button>
      <b aria-live="polite">{value}</b>
      <button type="button" aria-label="Uno in più" onClick={() => onChange(Math.min(max, value + 1))}>
        <Plus aria-hidden="true" />
      </button>
    </span>
  )
}

/**
 * La segmentata con la pill che scivola.
 *
 * L'indicatore è un elemento solo che si sposta e si allarga, non uno sfondo
 * acceso e spento su ogni voce: è quello che fa leggere il passaggio come un
 * movimento invece che come un lampeggio, ed è lo stesso trucco della "layout
 * animation" senza portarsi dietro una libreria per farlo.
 *
 * Le misure si rileggono a ogni cambio e a ogni ridimensionamento: le
 * etichette sono parole di lunghezza diversa, e una pill calcolata una volta
 * sola finirebbe fuori posto al primo `Preventivo inviato`.
 */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  const box = useRef<HTMLDivElement>(null)
  const [stile, setStile] = useState<{ left: number; width: number } | null>(null)

  useEffect(() => {
    const el = box.current
    if (!el) return

    const misura = () => {
      const attivo = el.querySelector<HTMLElement>('[data-on="true"]')
      if (!attivo) return
      setStile({ left: attivo.offsetLeft, width: attivo.offsetWidth })
    }

    misura()
    const ro = new ResizeObserver(misura)
    ro.observe(el)
    return () => ro.disconnect()
  }, [value, options])

  return (
    <div className="lm-seg" ref={box} role="tablist" aria-label={label}>
      {stile && (
        <span
          className="lm-seg-ind"
          aria-hidden="true"
          style={{ transform: `translateX(${stile.left}px)`, width: stile.width }}
        />
      )}
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          data-on={value === o.value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
