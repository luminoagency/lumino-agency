/**
 * Sezione 3 — Chi siamo.
 * Server component: nessuna interazione, solo testo.
 */
export default function About() {
  return (
    <section className="lm-section" id="studio">
      <div className="lm-wrap">
        <p className="lm-kicker lm-reveal">Lo studio</p>

        <div className="lm-about-grid">
          <h2 className="lm-display lm-d2 lm-reveal">
            Siamo uno studio,
            <br />
            non un&apos;agenzia.
          </h2>

          <div className="lm-about-copy">
            <p className="lm-reveal">
              La differenza non è la dimensione: è chi risponde. Da noi il progetto
              non passa di mano fra reparti — <strong>chi lo disegna è chi lo scrive</strong>,
              e resta la stessa persona dal primo schizzo alla riga di codice che va
              online.
            </p>
            <p className="lm-reveal">
              Prendiamo pochi progetti per volta perché un sito fatto bene richiede
              di capire un mestiere prima di rappresentarlo. Guardiamo come lavori,
              cosa vendi, chi entra dalla porta. Poi costruiamo qualcosa che somigli
              a te e non al template di qualcun altro.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
