import { WORKS } from './worksData'

/**
 * Striscia sul bordo inferiore della prima schermata: nomi dei lavori e
 * settore, che scorrono lentamente.
 *
 * Serve a dire che sotto c'è dell'altro — la sola freccia "guarda i lavori"
 * chiede fiducia, questa mostra già la merce. Si ferma al passaggio del mouse,
 * così un nome si può leggere davvero.
 *
 * Il nastro è duplicato: quando la prima metà è uscita, l'animazione riparte da
 * capo e il taglio non si vede.
 */
export default function HeroTicker() {
  const items = WORKS.map((work) => ({ id: work.id, client: work.client, sector: work.sector }))

  return (
    <div className="lm-hticker" aria-hidden="true">
      <div className="lm-hticker-track">
        {[0, 1].map((half) => (
          <span className="lm-hticker-half" key={half}>
            {items.map((item) => (
              <span className="lm-hticker-item" key={`${half}-${item.id}`}>
                <span className="lm-hticker-name">{item.client}</span>
                <span className="lm-hticker-sector">{item.sector}</span>
                <span className="lm-hticker-star">✦</span>
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  )
}
