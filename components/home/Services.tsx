/**
 * Sezione 8 — Servizi. FONDO CHIARO: insieme ai Lavori spezza il buio.
 * Server component.
 */

const SERVICES = [
  {
    title: 'Identità',
    body: 'Nome, logo, palette, voce. Il sistema visivo che tiene insieme il sito, il menu stampato e l’insegna sopra la porta.',
  },
  {
    title: 'Siti su misura',
    body: 'Progettati e scritti da zero sul tuo mestiere. Niente temi comprati, niente costruttori: codice che possiamo tenere veloce nel tempo.',
  },
  {
    title: 'Movimento',
    body: 'Animazioni che servono a capire dove sei e cosa succede. Se una transizione non aggiunge niente, la togliamo.',
  },
  {
    title: 'Cura continua',
    body: 'Aggiornamenti, prestazioni, contenuti nuovi. Un sito è vivo: dopo il lancio resta qualcuno che se ne occupa.',
  },
]

export default function Services() {
  return (
    <section className="lm-section lm-light" id="servizi">
      <div className="lm-wrap">
        <p className="lm-kicker lm-reveal">Servizi</p>
        <h2 className="lm-display lm-d2 lm-reveal" style={{ marginBottom: 'clamp(2.5rem, 6vh, 4rem)' }}>
          Quattro cose,
          <br />
          fatte per intero.
        </h2>

        <div className="lm-services-grid">
          {SERVICES.map((service, i) => (
            <article className="lm-service lm-reveal" key={service.title} data-cursor="grow">
              <span className="lm-service-idx">{String(i + 1).padStart(2, '0')}</span>
              <h3>{service.title}</h3>
              <p>{service.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
