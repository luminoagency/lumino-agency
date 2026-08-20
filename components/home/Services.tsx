'use client'

import { useEffect, useState } from 'react'
import { POINTER_BREAKPOINT } from './useMotion'

/**
 * Sezione 8 — Servizi. FONDO CHIARO: insieme ai Lavori spezza il buio.
 *
 * Quattro bande a tutta larghezza, come l'indice di una rivista, al posto della
 * griglia 2×2 di card: quel pattern è vietato sul progetto perché è il primo
 * che si riconosce come template.
 *
 * Chi comanda l'apertura cambia col dispositivo, e non è un dettaglio:
 *   · col mouse, il passaggio sopra apre — e un click blocca l'apertura
 *   · col dito, la prima è già aperta e le altre si aprono al tocco
 * Su un telefono l'hover non esiste: lasciare la descrizione dietro un hover
 * significherebbe che nessuno la legge mai.
 */

const SERVICES = [
  {
    title: 'Identità',
    keys: 'Nome · Logo · Palette · Voce',
    body: 'Il sistema visivo che tiene insieme il sito, il menu stampato e l’insegna sopra la porta. Prima di costruire, capiamo chi sei: senza quello si decora, non si progetta.',
  },
  {
    title: 'Siti su misura',
    keys: 'Design · Next.js · Nessun tema',
    body: 'Progettati e scritti da zero sul tuo mestiere. Niente temi comprati, niente costruttori a blocchi: codice che possiamo tenere veloce nel tempo e cambiare quando cambi tu.',
  },
  {
    title: 'Movimento',
    keys: 'Scroll · Micro-interazioni · Transizioni',
    body: 'Animazioni che servono a capire dove sei e cosa sta succedendo. Se una transizione non aggiunge niente alla lettura, la togliamo: il movimento non è decorazione.',
  },
  {
    title: 'Cura continua',
    keys: 'Aggiornamenti · Prestazioni · Contenuti',
    body: 'Un sito è vivo: i piatti cambiano, le stagioni cambiano, le prestazioni si degradano. Dopo il lancio resta qualcuno che se ne occupa, non un file consegnato e dimenticato.',
  },
]

export default function Services() {
  /* Su schermo stretto la prima è già aperta: nessuna informazione resta
     dietro un gesto che su quel dispositivo non esiste. */
  const [open, setOpen] = useState(0)
  const [hoverDrives, setHoverDrives] = useState(false)
  /* Un click blocca la banda: da lì in poi il passaggio del mouse non la
     cambia più finché non se ne sceglie un'altra. */
  const [locked, setLocked] = useState(false)

  useEffect(() => {
    const query = window.matchMedia(`(min-width: ${POINTER_BREAKPOINT}px) and (pointer: fine)`)
    const sync = () => setHoverDrives(query.matches)
    query.addEventListener('change', sync)
    sync()
    return () => query.removeEventListener('change', sync)
  }, [])

  return (
    <section className="lm-section lm-light lm-services" id="servizi">
      <div className="lm-wrap">
        <p className="lm-kicker lm-reveal">Servizi</p>
        <h2 className="lm-display lm-d2 lm-reveal lm-services-title">
          Quattro cose,
          <br />
          fatte per intero.
        </h2>

        <div className="lm-bands">
          {SERVICES.map((service, i) => {
            const isOpen = open === i
            return (
              <button
                type="button"
                key={service.title}
                className={`lm-band lm-reveal${isOpen ? ' is-open' : ''}`}
                data-cursor="open"
                aria-expanded={isOpen}
                onPointerEnter={() => {
                  if (hoverDrives && !locked) setOpen(i)
                }}
                onFocus={() => setOpen(i)}
                onClick={() => {
                  setOpen(i)
                  setLocked(true)
                }}
              >
                <span className="lm-band-line" aria-hidden="true" />

                <span className="lm-band-row">
                  <span className="lm-band-num" aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="lm-band-title">{service.title}</span>
                  <span className="lm-band-keys">{service.keys}</span>
                </span>

                {/* 0fr → 1fr: è l'unico modo di andare da altezza zero
                    all'altezza del contenuto senza conoscerla in anticipo. */}
                <span className="lm-band-panel">
                  <span className="lm-band-panel-in">
                    <span className="lm-band-body">{service.body}</span>
                  </span>
                </span>
              </button>
            )
          })}
          <span className="lm-band-line is-last" aria-hidden="true" />
        </div>
      </div>
    </section>
  )
}
