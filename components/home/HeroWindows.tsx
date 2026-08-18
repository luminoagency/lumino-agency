import { HERO_WINDOWS } from './heroMotion'
import { WORKS } from './worksData'
import WorkMediaView from './WorkMediaView'

/**
 * Mini finestre browser sparse nell'hero.
 *
 * Stanno DIETRO il titolo: il testo le attraversa. Sono sfalsate e a rotazioni
 * diverse, mai incolonnate — il layout "testo a sinistra + media a destra in
 * due colonne" è vietato in modo permanente su tutti i progetti.
 *
 * Opacità bassa: devono suggerire che sotto c'è del lavoro vero, senza rubare
 * leggibilità al titolo.
 */
export default function HeroWindows() {
  return (
    <div className="lm-hwins" aria-hidden="true">
      {HERO_WINDOWS.map((win, i) => {
        const work = WORKS[i]
        if (!work) return null

        return (
          <div
            className="lm-hwin"
            key={work.id}
            style={{
              left: `${win.x}%`,
              top: `${win.y}%`,
              width: `${win.width}px`,
              transform: `rotate(${win.rotate}deg)`,
            }}
          >
            <div className="lm-hwin-bar">
              <i />
              <i />
              <i />
            </div>
            <div className="lm-hwin-shot">
              <WorkMediaView work={work} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
