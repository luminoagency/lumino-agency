import type { Messages } from '@/lib/i18n/messages'

/**
 * Sezione 3 — Lo studio.
 *
 * Server component: è testo e basta. Le stringhe arrivano come props, così
 * questo non entra nel bundle del client.
 *
 * Il primo paragrafo è spezzato in tre pezzi perché ha una parte in grassetto
 * nel mezzo: tenerlo come stringa unica avrebbe voluto dire o perdere il
 * grassetto o mettere HTML dentro il catalogo, e l'HTML nei file di traduzione
 * è la porta da cui entrano i tag rotti.
 */
export default function About({ m }: { m: Messages }) {
  return (
    <section className="lm-section" id="studio">
      <div className="lm-wrap">
        <p className="lm-kicker lm-reveal">{m.about.kicker}</p>

        <div className="lm-about-grid">
          <h2 className="lm-display lm-d2 lm-reveal">
            {m.about.titleLine1}
            <br />
            {m.about.titleLine2}
          </h2>

          <div className="lm-about-copy">
            <p className="lm-reveal">
              {m.about.body1Before}
              <strong>{m.about.body1Strong}</strong>
              {m.about.body1After}
            </p>
            <p className="lm-reveal">{m.about.body2}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
