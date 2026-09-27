'use client'

import { Check } from 'lucide-react'

export interface Opzione {
  value: string
  label: string
}

/**
 * I chip: la risposta a tocco.
 *
 * Sono la ragione per cui una visita si registra in due minuti. Un menù a
 * tendina su un telefono costa due tocchi e una lista che copre lo schermo;
 * un chip ne costa uno e lascia vedere tutte le risposte possibili insieme —
 * che è anche un promemoria di cosa chiedere, per chi sta parlando.
 *
 * Sono pill come i filtri (ref3), stesso disegno: qui il viola pieno non è
 * "filtro attivo" ma "questa è la risposta", ed è lo stesso significato —
 * selezione.
 *
 * Restano <button> e non checkbox travestiti: un chip che si deseleziona
 * ritoccandolo non ha uno stato indeterminato da raccontare, e `aria-pressed`
 * dice già tutto a chi legge con uno screen reader.
 */
export function Chips({
  label,
  hint,
  options,
  value,
  onChange,
}: {
  label: string
  hint?: string
  options: Opzione[]
  value: string[]
  onChange: (value: string[]) => void
}) {
  return (
    <fieldset className="lm-chips-group">
      <legend className="lm-label">{label}</legend>
      {hint && <p className="lm-field-hint lm-chips-hint">{hint}</p>}
      <div className="lm-chips">
        {options.map((o) => {
          const on = value.includes(o.value)
          return (
            <button
              key={o.value}
              type="button"
              className="lm-pill"
              data-on={on}
              aria-pressed={on}
              onClick={() =>
                onChange(on ? value.filter((v) => v !== o.value) : [...value, o.value])
              }
            >
              {on && <Check aria-hidden="true" />}
              {o.label}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

/**
 * La variante a scelta singola.
 *
 * Ritoccare il chip già acceso lo spegne: la reazione e l'obiezione non sono
 * obbligatorie, e senza un modo di tornare indietro un tocco sbagliato
 * resterebbe nei dati per sempre.
 */
export function ChipsOne({
  label,
  hint,
  options,
  value,
  onChange,
}: {
  label: string
  hint?: string
  options: Opzione[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <fieldset className="lm-chips-group">
      <legend className="lm-label">{label}</legend>
      {hint && <p className="lm-field-hint lm-chips-hint">{hint}</p>}
      <div className="lm-chips">
        {options.map((o) => {
          const on = value === o.value
          return (
            <button
              key={o.value}
              type="button"
              className="lm-pill"
              data-on={on}
              aria-pressed={on}
              onClick={() => onChange(on ? '' : o.value)}
            >
              {o.label}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

/** Sì / no / non chiesto — la terza risposta esiste e va poter restare. */
export function ChipsSiNo({
  label,
  hint,
  value,
  onChange,
}: {
  label: string
  hint?: string
  value: boolean | null
  onChange: (value: boolean | null) => void
}) {
  const voci: { v: boolean | null; label: string }[] = [
    { v: true, label: 'Sì' },
    { v: false, label: 'No' },
    { v: null, label: 'Non chiesto' },
  ]

  return (
    <fieldset className="lm-chips-group">
      <legend className="lm-label">{label}</legend>
      {hint && <p className="lm-field-hint lm-chips-hint">{hint}</p>}
      <div className="lm-chips">
        {voci.map((o) => (
          <button
            key={String(o.v)}
            type="button"
            className="lm-pill"
            data-on={value === o.v}
            aria-pressed={value === o.v}
            onClick={() => onChange(o.v)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

/** Da un vocabolario e dalle sue etichette alle opzioni dei chip. */
export function opzioni<T extends string>(
  valori: readonly T[],
  labels: Record<T, string>,
): Opzione[] {
  return valori.map((v) => ({ value: v, label: labels[v] }))
}
