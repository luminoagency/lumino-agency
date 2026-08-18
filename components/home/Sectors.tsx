/**
 * Sezione 7 — Cosa facciamo: elenco dei settori.
 * Blocco 3: struttura statica. La cinetica (hover, sfoltimento delle altre
 * voci, ingresso a scaglioni) arriva nel Blocco 4.
 */

const SECTORS = [
  { name: 'Ristoranti', meta: 'Menu · Prenotazioni · Sala' },
  { name: 'Hotel', meta: 'Camere · Booking diretto · Stagioni' },
  { name: 'Aziende', meta: 'Identità · Cataloghi · Rete vendita' },
  { name: 'Retail', meta: 'Vetrina · Catalogo · Negozio' },
  { name: 'Immobiliare', meta: 'Portfolio · Visite · Trattative' },
]

export default function Sectors() {
  return (
    <section className="lm-section" id="settori">
      <div className="lm-wrap">
        <p className="lm-kicker lm-reveal">Cosa facciamo</p>
        <p className="lm-lead lm-reveal" style={{ marginBottom: 'clamp(3rem, 7vh, 5rem)' }}>
          Cambia il mestiere, non il metodo. Ogni settore ha un modo diverso di
          farsi scegliere: il nostro lavoro è capire quale sia il tuo.
        </p>

        <div className="lm-sectors">
          {SECTORS.map((sector) => (
            <div className="lm-sector lm-reveal" key={sector.name}>
              <h3 className="lm-sector-name">{sector.name}</h3>
              <span className="lm-sector-meta">{sector.meta}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
