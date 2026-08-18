'use client'

import { useCallback, useState } from 'react'
import { WORKS, type Work } from './worksData'
import WorkCard from './WorkCard'
import WorkViewer from './WorkViewer'

/**
 * Sezione 4 — Lavori. FONDO CHIARO: insieme ai Servizi spezza il buio.
 *
 * Usa dati propri (worksData.ts): NON legge da templates/_shared/demoData.ts,
 * che contiene ristoranti demo fittizi condivisi con /portfolio e /demo/[slug].
 *
 * Tiene qui lo stato della finestra aperta, insieme al rettangolo della card di
 * partenza: è quello che permette alla finestra grande di crescere da dove si è
 * cliccato invece di apparire dal nulla.
 */
export default function Works() {
  const [open, setOpen] = useState<{ work: Work; origin: DOMRect } | null>(null)

  const handleOpen = useCallback((work: Work, origin: DOMRect) => {
    setOpen({ work, origin })
  }, [])

  const handleClose = useCallback(() => setOpen(null), [])

  return (
    <section className="lm-section lm-light" id="lavori">
      <div className="lm-wrap">
        <div className="lm-works-head">
          <div>
            <p className="lm-kicker lm-reveal">Lavori</p>
            <h2 className="lm-display lm-d2 lm-reveal">Quello che abbiamo costruito.</h2>
          </div>
          <p className="lm-lead lm-reveal" style={{ maxWidth: '32ch' }}>
            Passa sopra una card per vedere il sito scorrere. Clicca per aprirlo
            e navigarlo davvero, senza uscire da qui.
          </p>
        </div>

        <div className="lm-works-grid">
          {WORKS.map((work, i) => (
            <WorkCard work={work} index={i} key={work.id} onOpen={handleOpen} />
          ))}
        </div>
      </div>

      {open ? <WorkViewer work={open.work} origin={open.origin} onClose={handleClose} /> : null}
    </section>
  )
}
