'use client'

import { ChevronDown, X } from 'lucide-react'

export interface Filtro {
  key: string
  /** Cosa si legge quando il filtro è spento: "Settore", "Zona"… */
  label: string
  value: string
  options: { value: string; label: string }[]
}

/**
 * La barra dei filtri a pill (ref3).
 *
 * Ogni filtro è un <select> vero travestito da pill: su un telefono il
 * selettore di sistema — ruota, ricerca, accessibilità — batte qualunque lista
 * disegnata a mano, e costa zero righe di JS.
 *
 * Il contatore non è decorazione: è la risposta alla domanda "perché non vedo
 * il cliente che cerco". Senza, una vista filtrata sembra una vista vuota.
 */
export default function FilterBar({
  filtri,
  onChange,
  onReset,
  children,
}: {
  filtri: Filtro[]
  onChange: (key: string, value: string) => void
  onReset: () => void
  /** Ricerca o altre pill da mettere in testa alla barra. */
  children?: React.ReactNode
}) {
  const attivi = filtri.filter((f) => f.value !== '').length

  return (
    <div className="lm-filters">
      {children}

      <span className="lm-filters-count">
        Filtri attivi
        <span className="lm-pill-n">{attivi}</span>
      </span>

      {filtri.map((filtro) => (
        <span key={filtro.key} className="lm-select" data-on={filtro.value !== ''}>
          <select
            value={filtro.value}
            aria-label={filtro.label}
            onChange={(event) => onChange(filtro.key, event.target.value)}
          >
            <option value="">{filtro.label}</option>
            {filtro.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown aria-hidden="true" />
        </span>
      ))}

      {attivi > 0 && (
        <button type="button" className="lm-pill" onClick={onReset}>
          <X aria-hidden="true" />
          Azzera
        </button>
      )}
    </div>
  )
}
