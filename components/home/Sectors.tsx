'use client'

import { useState } from 'react'
import { useI18n } from '@/components/i18n/I18nProvider'

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

export default function Sectors() {
  const { m } = useI18n()
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className="lm-section" id="settori">
      <div className="lm-wrap">
        <p className="lm-kicker lm-reveal">{m.sectors.kicker}</p>
        <p className="lm-lead lm-reveal" style={{ marginBottom: 'clamp(3rem, 7vh, 5rem)' }}>
          {m.sectors.lead}
        </p>

        <div className="lm-sectors">
          {m.sectors.items.map((sector, i) => {
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
                        <span className="lm-sector-builds-title">{m.sectors.buildLabel}</span>
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
