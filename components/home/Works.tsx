import { WORKS } from './worksData'
import WorkCard from './WorkCard'

/**
 * Sezione 4 — Lavori. FONDO CHIARO: insieme ai Servizi spezza il buio.
 *
 * Usa dati propri (worksData.ts): NON legge da templates/_shared/demoData.ts,
 * che contiene ristoranti demo fittizi condivisi con /portfolio e /demo/[slug].
 */
export default function Works() {
  return (
    <section className="lm-section lm-light" id="lavori">
      <div className="lm-wrap">
        <div className="lm-works-head">
          <div>
            <p className="lm-kicker lm-reveal">Lavori</p>
            <h2 className="lm-display lm-d2 lm-reveal">Quello che abbiamo costruito.</h2>
          </div>
          <p className="lm-lead lm-reveal" style={{ maxWidth: '32ch' }}>
            Passa sopra una card: scorre il sito vero, dall&apos;alto in basso.
          </p>
        </div>

        <div className="lm-works-grid">
          {WORKS.map((work, i) => (
            <WorkCard work={work} index={i} key={work.id} />
          ))}
        </div>
      </div>
    </section>
  )
}
