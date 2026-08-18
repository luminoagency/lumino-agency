/**
 * Sezione 9 — Statistiche.
 * Blocco 3: numeri statici. Il conteggio animato arriva nel Blocco 4.
 *
 * I valori sono dichiarati qui una volta sola: il contatore leggerà
 * data-target, così il numero resta corretto anche senza JS.
 */

export const STATS = [
  { value: 5, suffix: '', label: 'settori in cui abbiamo già costruito e messo online' },
  { value: 100, suffix: '%', label: 'dei progetti scritti da zero, senza temi comprati' },
  { value: 1, suffix: '', label: 'referente unico dal primo schizzo alla messa online' },
]

export default function Stats() {
  return (
    <section className="lm-section" id="numeri">
      <div className="lm-wrap">
        <p className="lm-kicker lm-reveal">In breve</p>

        <div className="lm-stats">
          {STATS.map((stat) => (
            <div className="lm-stat lm-reveal" key={stat.label}>
              <span className="lm-stat-num" data-target={stat.value} data-suffix={stat.suffix}>
                {stat.value}
                {stat.suffix}
              </span>
              <span className="lm-stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
