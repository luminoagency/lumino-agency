'use client'

import { useState } from 'react'

/**
 * Sezione 7 — Cosa facciamo.
 *
 * Al click la riga si apre e mostra due cose insieme: cosa vuol dire lavorare
 * in quel settore, e cosa costruiamo concretamente per chi ci lavora.
 *
 * Le due cose stavano in due sezioni diverse — questa e "Quattro cose, fatte
 * per intero" — e la seconda diceva le stesse quattro parole (identità, siti su
 * misura, movimento, cura) per tutti. Dette in astratto non significano niente:
 * "identità" per un hotel e per un'officina sono due lavori diversi. Qui sono
 * scritte nella lingua del settore, e si leggono nel posto in cui il visitatore
 * ha appena detto chi è.
 *
 * L'apertura usa grid-template-rows (0fr → 1fr): è l'unico modo di animare "da
 * altezza zero all'altezza del contenuto" senza conoscerla in anticipo e senza
 * animare height, che costerebbe un layout a ogni frame.
 *
 * Il testo NON compare in dissolvenza: si apre la banda, e le frasi sono già
 * lì, ferme e leggibili. Un testo che sfuma mentre stai cominciando a leggerlo
 * si legge due volte.
 */

interface Sector {
  name: string
  meta: string
  body: string
  /** Cosa costruiamo, detto nella lingua del settore. Tre o quattro voci. */
  builds: string[]
}

const SECTORS: Sector[] = [
  {
    name: 'Ristoranti',
    meta: 'Menu · Prenotazioni · Sala',
    body: 'Il menu è il prodotto: va aggiornato in giornata, letto col pollice e trovato su Google. Prenotazioni che arrivano in sala senza intermediari che trattengono una percentuale.',
    builds: [
      'Menù che aggiorni da solo, senza chiamarci',
      'Prenotazioni diritte in sala, senza commissioni',
      'Foto dei piatti trattate come si deve',
      'Recensioni Google che si aggiornano da sole',
    ],
  },
  {
    name: 'Hotel',
    meta: 'Camere · Booking diretto · Stagioni',
    body: 'Ogni prenotazione diretta è una commissione che non paghi. Camere raccontate una per una, disponibilità sempre vera, e un sito che cambia col cambiare della stagione.',
    builds: [
      'Camere raccontate una per una, non un elenco',
      'Booking diretto collegato al tuo gestionale',
      'Disponibilità e prezzi sempre veri',
      'Il sito che cambia vestito con la stagione',
    ],
  },
  {
    name: 'Aziende',
    meta: 'Identità · Cataloghi · Rete vendita',
    body: 'Chi ti cerca sta valutando anche altri tre. Il sito deve dire in trenta secondi cosa fai, per chi, e perché sei tu — poi mettere in mano alla rete vendita materiale che regge il confronto.',
    builds: [
      'Identità visiva e voce, prima del sito',
      'Cataloghi che la rete vendita può mostrare in visita',
      'Casi studio che reggono il confronto',
      'Manutenzione e prestazioni tenute nel tempo',
    ],
  },
  {
    name: 'Retail',
    meta: 'Vetrina · Catalogo · Negozio',
    body: 'Il negozio fisico e quello online sono lo stesso negozio. Catalogo che si sfoglia veloce, disponibilità reale, e un motivo per venire in via a ritirare invece di aspettare un corriere.',
    builds: [
      'Catalogo che si sfoglia col pollice, senza attese',
      'Disponibilità vera, negozio per negozio',
      'Ritiro in negozio prenotabile online',
      'Cambi di stagione senza rifare il sito',
    ],
  },
  {
    name: 'Immobiliare',
    meta: 'Portfolio · Visite · Trattative',
    body: 'Un immobile si vende con le foto e con il percorso che ci porta. Schede che si leggono dal telefono durante una pausa, e una richiesta di visita che arriva prima della concorrenza.',
    builds: [
      'Schede immobile che si leggono in una pausa caffè',
      'Gallerie e planimetrie messe in ordine',
      'Richiesta di visita in due tocchi',
      'Portfolio che si aggiorna a ogni trattativa chiusa',
    ],
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

                  {/* Nome e parole chiave in un contenitore solo: sul desktop
                      stanno ai due capi della riga, su telefono la seconda va a
                      capo sotto la prima invece di uscire dallo schermo. */}
                  <span className="lm-sector-head">
                    <span className="lm-sector-name">{sector.name}</span>
                    <span className="lm-sector-meta">{sector.meta}</span>
                  </span>

                  <span className="lm-sector-sign" aria-hidden="true" />
                </button>

                <div className="lm-sector-panel">
                  <div className="lm-sector-panel-in">
                    <div className="lm-sector-grid">
                      <p className="lm-sector-body">{sector.body}</p>

                      <div className="lm-sector-builds">
                        <span className="lm-sector-builds-title">Cosa costruiamo</span>
                        <ul>
                          {sector.builds.map((build) => (
                            <li key={build}>{build}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
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
