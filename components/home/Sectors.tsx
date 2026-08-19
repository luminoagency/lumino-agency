'use client'

import { useState } from 'react'

/**
 * Sezione 7 — Cosa facciamo.
 *
 * Al click la riga si apre e mostra cosa vuol dire lavorare in quel settore,
 * spingendo giù le altre. L'apertura usa grid-template-rows (0fr → 1fr): è
 * l'unico modo di animare "da altezza zero all'altezza del contenuto" senza
 * conoscerla in anticipo e senza animare height, che costerebbe un layout a
 * ogni frame.
 */

const SECTORS = [
  {
    name: 'Ristoranti',
    meta: 'Menu · Prenotazioni · Sala',
    body: 'Il menu è il prodotto: va aggiornato in giornata, letto col pollice e trovato su Google. Prenotazioni che arrivano in sala senza intermediari che trattengono una percentuale.',
  },
  {
    name: 'Hotel',
    meta: 'Camere · Booking diretto · Stagioni',
    body: 'Ogni prenotazione diretta è una commissione che non paghi. Camere raccontate una per una, disponibilità sempre vera, e un sito che cambia col cambiare della stagione.',
  },
  {
    name: 'Aziende',
    meta: 'Identità · Cataloghi · Rete vendita',
    body: 'Chi ti cerca sta valutando anche altri tre. Il sito deve dire in trenta secondi cosa fai, per chi, e perché sei tu — poi mettere in mano alla rete vendita materiale che regge il confronto.',
  },
  {
    name: 'Retail',
    meta: 'Vetrina · Catalogo · Negozio',
    body: 'Il negozio fisico e quello online sono lo stesso negozio. Catalogo che si sfoglia veloce, disponibilità reale, e un motivo per venire in via a ritirare invece di aspettare un corriere.',
  },
  {
    name: 'Immobiliare',
    meta: 'Portfolio · Visite · Trattative',
    body: 'Un immobile si vende con le foto e con il percorso che ci porta. Schede che si leggono dal telefono durante una pausa, e una richiesta di visita che arriva prima della concorrenza.',
  },
]

export default function Sectors() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className="lm-section" id="settori">
      <div className="lm-wrap">
        <p className="lm-kicker lm-reveal">Cosa facciamo</p>
        <p className="lm-lead lm-reveal" style={{ marginBottom: 'clamp(3rem, 7vh, 5rem)' }}>
          Cambia il mestiere, non il metodo. Ogni settore ha un modo diverso di
          farsi scegliere: il nostro lavoro è capire quale sia il tuo.
        </p>

        <div className="lm-sectors">
          {SECTORS.map((sector, i) => {
            const isOpen = open === i
            return (
              <div className={`lm-sector-item${isOpen ? ' is-open' : ''}`} key={sector.name}>
                <button
                  type="button"
                  className="lm-sector lm-reveal"
                  data-cursor="open"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                >
                  <span className="lm-sector-num" aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="lm-sector-name">{sector.name}</span>
                  <span className="lm-sector-meta">{sector.meta}</span>
                  <span className="lm-sector-sign" aria-hidden="true" />
                </button>

                <div className="lm-sector-panel">
                  <div className="lm-sector-panel-in">
                    <p>{sector.body}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
