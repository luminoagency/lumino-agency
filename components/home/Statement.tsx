/**
 * Sezione 5 — Statement a tutto schermo.
 * Server component: la frase è il contenuto, il resto è respiro.
 */
export default function Statement() {
  return (
    <section className="lm-section lm-statement">
      <div className="lm-wrap">
        <h2 className="lm-display lm-d2 lm-reveal">
          Un sito non è una brochure.
          <br />
          È il primo posto in cui
          <br />
          <span className="lm-grad-text">qualcuno ti sceglie.</span>
        </h2>
      </div>
    </section>
  )
}
