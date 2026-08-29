import type { Messages } from '@/lib/i18n/messages'

/**
 * Sezione 5 — Statement a tutto schermo.
 *
 * Server component: la frase è il contenuto, il resto è respiro. Le stringhe
 * arrivano come props e non dal contesto, perché restando server component non
 * finisce nel bundle del client — e per tre righe di testo sarebbe uno spreco.
 */
export default function Statement({ m }: { m: Messages }) {
  return (
    <section className="lm-section lm-statement">
      <div className="lm-wrap">
        <h2 className="lm-display lm-d2 lm-reveal">
          {m.statement.line1}
          <br />
          {m.statement.line2}
          <br />
          <span className="lm-grad-text">{m.statement.line3}</span>
        </h2>
      </div>
    </section>
  )
}
