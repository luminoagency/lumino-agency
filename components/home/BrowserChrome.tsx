import type { ReactNode } from 'react'

/**
 * Barra finta del browser: tre pallini + pillola con l'etichetta.
 *
 * Condivisa fra la card in griglia e la finestra a tutto schermo, così le due
 * sono davvero la stessa finestra che cresce, non due grafiche simili.
 *
 * L'etichetta è il NOME del progetto, non l'indirizzo del deploy: un
 * "*.vercel.app" scritto su una vetrina la fa sembrare un esercizio.
 */
export default function BrowserChrome({
  label,
  actions,
  tone = 'card',
}: {
  label: string
  actions?: ReactNode
  tone?: 'card' | 'viewer'
}) {
  return (
    <div className={`lm-chrome lm-chrome-${tone}`}>
      <span className="lm-chrome-dots" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span className="lm-chrome-label">{label}</span>
      {actions ? <span className="lm-chrome-actions">{actions}</span> : null}
    </div>
  )
}
