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
 * Lollipop: un gambo sottile e una testa tonda per ogni voce (ref1).
 *
 * Gambo di due pixel e pallino in cima, non una barra piena: a parità di dato
 * occupa un quarto dell'inchiostro e lascia respirare una card che ne contiene
 * sette di fila.
 */
export function Lollipop({
  items,
  selezionato,
}: {
  items: { label: string; value: number }[]
  /** L'etichetta della colonna evidenziata, se ce n'è una. */
  selezionato?: string
}) {
  const max = Math.max(1, ...items.map((i) => i.value))

  return (
    /* Sopra le cinque voci le colonne scendono sotto i trenta pixel e nessuna
       etichetta ci sta più in orizzontale: da lì in poi si girano. */
    <div className="lm-lolli" data-fitte={items.length > 5}>
      {items.map((item) => {
        /* Una colonna a zero resta un moncone visibile: farla sparire fa
           perdere il conto delle posizioni, ed è proprio la categoria vuota
           l'informazione che si stava cercando. */
        const h = Math.max(6, (item.value / max) * 100)
        return (
          <div
            key={item.label}
            className="lm-lolli-col"
            data-sel={selezionato === item.label}
            title={`${item.label}: ${item.value}`}
          >
            <span className="lm-lolli-n">{item.value}</span>
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
