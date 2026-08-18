'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Sezione 8 — Servizi. FONDO CHIARO: insieme ai Lavori spezza il buio.
 *
 * Al click la card si solleva e ruota appena, poi torna: è un riscontro fisico
 * al tocco, non una navigazione — queste card non portano da nessuna parte, e
 * fingere il contrario sarebbe peggio che non reagire affatto.
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

/** Allineata a @keyframes lm-service-pop in motion.css. */
const POP_MS = 620

export default function Services() {
  const [popped, setPopped] = useState<number | null>(null)
  const timer = useRef(0)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const pop = (i: number) => {
    setPopped(i)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setPopped(null), POP_MS)
  }

  return (
    <section className="lm-section lm-light" id="servizi">
      <div className="lm-wrap">
        <p className="lm-kicker lm-reveal">Servizi</p>
        <h2
          className="lm-display lm-d2 lm-reveal"
          style={{ marginBottom: 'clamp(2.5rem, 6vh, 4rem)' }}
        >
          Quattro cose,
          <br />
          fatte per intero.
        </h2>

        <div className="lm-services-grid">
          {SERVICES.map((service, i) => (
            <article
              className={`lm-service lm-reveal${popped === i ? ' is-popped' : ''}`}
              key={service.title}
              data-cursor="grow"
              onPointerDown={() => pop(i)}
            >
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
