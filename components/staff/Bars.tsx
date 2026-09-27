/**
 * Le due barre del sistema: orizzontale di progresso e lollipop (ref2).
 *
 * Entrambe Server Component — sono dati disegnati, non interazioni.
 */

/** Barra orizzontale con etichetta e valore sopra. */
export function Progress({
  label,
  value,
  max,
  display,
  tone = 'violet',
}: {
  label: string
  value: number
  max: number
  /** Cosa si legge a destra: se manca, la percentuale. */
  display?: string
  tone?: 'violet' | 'grad'
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0

  return (
    <div className="lm-prog">
      <div className="lm-prog-top">
        <span className="lm-muted">{label}</span>
        <b>{display ?? `${Math.round(pct)}%`}</b>
      </div>
      <div
        className="lm-prog-track"
        role="progressbar"
        aria-label={label}
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span
          className="lm-prog-fill"
          data-tone={tone === 'grad' ? 'grad' : undefined}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

/**
 * Lollipop: un gambo sottile e una testa tonda per ogni voce.
 *
 * Le colonne a zero restano visibili come moncone: una categoria vuota è
 * un'informazione, e farla sparire fa perdere il conto delle posizioni.
 */
export function Lollipop({
  items,
}: {
  items: { label: string; value: number; href?: string }[]
}) {
  const max = Math.max(1, ...items.map((i) => i.value))

  return (
    <div className="lm-lolli">
      {items.map((item) => {
        const h = Math.max(6, (item.value / max) * 100)
        return (
          <div key={item.label} className="lm-lolli-col" title={`${item.label}: ${item.value}`}>
            <span className="lm-num lm-num-sm" style={{ fontSize: '0.8rem' }}>
              {item.value}
            </span>
            <span
              className="lm-lolli-stem"
              data-on={item.value > 0}
              style={{ height: `${h}%` }}
              aria-hidden="true"
            />
            <span className="lm-lolli-cap">{item.label}</span>
          </div>
        )
      })}
    </div>
  )
}
