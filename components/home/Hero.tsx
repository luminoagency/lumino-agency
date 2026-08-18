import { SplitText } from './splitText'

/**
 * Sezione 1 — Hero.
 *
 * Layout volutamente NON a due colonne e senza media a destra: il titolo
 * occupa la larghezza, ancorato in basso, con le scintille sul canvas dietro.
 * (Vincolo permanente di progetto: niente hero logo-sinistra + testo-sinistra
 * + media-destra.)
 *
 * Blocco 3: statico. Canvas delle scintille e lettere reattive nel Blocco 4.
 */

export const HERO_TITLE = 'Diamo forma al sito che il tuo brand merita.'

export default function Hero() {
  return (
    <section className="lm-hero" id="hero">
      <canvas className="lm-hero-canvas" aria-hidden="true" />

      <div className="lm-wrap">
        <h1 className="lm-display lm-d1 lm-hero-title">
          <SplitText text={HERO_TITLE} gradientWord="forma" />
        </h1>

        <div className="lm-hero-foot">
          <p className="lm-hero-sub">
            Studio digitale. Progettiamo e costruiamo siti per chi ha qualcosa di
            vero da mostrare: ristoranti, hotel, aziende, retail, immobiliare.
          </p>

          <a className="lm-hero-scroll" href="#lavori">
            Guarda i lavori
            <span className="lm-hero-scroll-line" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  )
}
