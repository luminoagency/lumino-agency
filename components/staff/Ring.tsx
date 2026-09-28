/**
 * Anello di progresso con la percentuale al centro (ref1, ref2).
 *
 * È un Server Component: nessun stato, nessun effetto. L'animazione
 * dell'arco la fa il CSS con una transizione su `stroke-dashoffset` — parte da
 * intero e si scopre al primo dipinto, senza far dipendere un dato dal JS.
 *
 * Il tracciato è ruotato di -90° nel CSS così lo zero è in alto, dove lo cerca
 * chiunque abbia mai visto un orologio.
 */
export default function Ring({
  value,
  cap,
  size = 78,
  stroke = 7,
  label,
}: {
  /** 0–100. Fuori scala viene tagliato: un 130% disegnato è solo un bug visibile. */
  value: number
  /** La parola sotto il numero, dentro l'anello. */
  cap?: string
  size?: number
  stroke?: number
  /** Cosa legge chi non vede il disegno. */
  label: string
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)))
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r

  return (
    <div className="lm-ring" role="img" aria-label={`${label}: ${pct}%`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle className="lm-ring-track" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} />
        <circle
          className="lm-ring-arc"
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={circ - (circ * pct) / 100}
        />
      </svg>
      <span className="lm-ring-mid" aria-hidden="true">
        <span className="lm-ring-n">{pct}%</span>
        {cap && <span className="lm-ring-cap">{cap}</span>}
      </span>
    </div>
  )
}
