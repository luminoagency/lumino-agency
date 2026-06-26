'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  getConsent,
  setConsent,
  hasDecided,
  OPEN_PREFERENCES_EVENT,
} from '@/lib/cookies/consent'

/**
 * Banner cookie GDPR + Garante 2021.
 * - Appare alla prima visita (solo se nessuna scelta valida è stata salvata).
 * - 3 bottoni di pari rilevanza visiva: Accetta tutti / Rifiuta tutti / Personalizza.
 * - Pannello "Personalizza" con le 3 categorie (tecnici sempre attivi).
 * - Riapribile dal footer ("Gestisci cookie") via evento window.
 *
 * Montato una sola volta app-wide (vedi app/layout.tsx).
 */
export default function CookieBanner() {
  const [mounted, setMounted] = useState(false)
  const [decided, setDecided] = useState(true) // assume deciso finché non sappiamo (no flash SSR)
  const [panelOpen, setPanelOpen] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [marketing, setMarketing] = useState(false)

  // Init dal localStorage dopo il mount (evita mismatch di hydration).
  useEffect(() => {
    setMounted(true)
    setDecided(hasDecided())
    const c = getConsent()
    if (c) {
      setAnalytics(c.analytics)
      setMarketing(c.marketing)
    }
  }, [])

  // Riapertura del pannello dal footer.
  useEffect(() => {
    const open = () => {
      const c = getConsent()
      setAnalytics(c?.analytics ?? false)
      setMarketing(c?.marketing ?? false)
      setPanelOpen(true)
    }
    window.addEventListener(OPEN_PREFERENCES_EVENT, open)
    return () => window.removeEventListener(OPEN_PREFERENCES_EVENT, open)
  }, [])

  const finish = useCallback(() => {
    setDecided(true)
    setPanelOpen(false)
  }, [])

  const acceptAll = useCallback(() => {
    setConsent({ analytics: true, marketing: true })
    finish()
  }, [finish])

  const rejectAll = useCallback(() => {
    setConsent({ analytics: false, marketing: false })
    finish()
  }, [finish])

  const savePrefs = useCallback(() => {
    setConsent({ analytics, marketing })
    finish()
  }, [analytics, marketing, finish])

  if (!mounted) return null
  // Niente banner se già deciso, a meno che il pannello sia stato riaperto dal footer.
  if (decided && !panelOpen) return null

  return (
    <>
      <style>{`
        .ck-overlay { position: fixed; inset: 0; z-index: 9999; display: flex; align-items: flex-end; justify-content: center; padding: 18px; pointer-events: none; }
        .ck-overlay.modal { align-items: center; background: rgba(0,0,0,0.55); backdrop-filter: blur(4px); pointer-events: auto; }
        .ck-card { pointer-events: auto; width: 100%; max-width: 560px; background: #111113; border: 1px solid rgba(255,255,255,0.1); border-radius: 18px; box-shadow: 0 24px 70px rgba(0,0,0,0.6); color: #fff; font-family: 'Inter', system-ui, sans-serif; padding: 22px 22px; }
        .ck-card.wide { max-width: 600px; max-height: calc(100vh - 40px); overflow-y: auto; }
        .ck-title { font-family: 'Cormorant Garamond', Georgia, serif; font-style: italic; font-size: 26px; font-weight: 500; margin: 0 0 8px; letter-spacing: -0.01em; }
        .ck-text { font-size: 13.5px; line-height: 1.6; color: rgba(255,255,255,0.7); margin: 0 0 18px; }
        .ck-text a { color: #a78bfa; }
        .ck-btns { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
        .ck-btn { padding: 12px 14px; border-radius: 10px; font-family: inherit; font-size: 12.5px; font-weight: 700; letter-spacing: 0.03em; cursor: pointer; transition: transform 0.15s, background 0.2s, border-color 0.2s; border: 1px solid rgba(255,255,255,0.16); background: rgba(255,255,255,0.06); color: #fff; text-align: center; }
        .ck-btn:hover { transform: translateY(-1px); background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.28); }
        .ck-cats { display: flex; flex-direction: column; gap: 12px; margin: 4px 0 18px; }
        .ck-cat { border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 14px 16px; background: rgba(255,255,255,0.02); }
        .ck-cat-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 6px; }
        .ck-cat-name { font-size: 14px; font-weight: 600; color: #fff; }
        .ck-cat-desc { font-size: 12.5px; line-height: 1.55; color: rgba(255,255,255,0.6); margin: 0; }
        .ck-always { font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #22c55e; white-space: nowrap; }
        .ck-toggle { width: 46px; height: 26px; border-radius: 9999px; background: rgba(255,255,255,0.12); border: 0; position: relative; cursor: pointer; transition: background 0.2s; padding: 0; flex-shrink: 0; }
        .ck-toggle.on { background: #22c55e; }
        .ck-toggle:disabled { opacity: 0.6; cursor: not-allowed; }
        .ck-knob { display: block; width: 20px; height: 20px; border-radius: 50%; background: #fff; position: absolute; top: 3px; left: 3px; transition: left 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.3); }
        .ck-toggle.on .ck-knob { left: 23px; }
        @media (max-width: 520px) { .ck-btns { grid-template-columns: 1fr; } }
      `}</style>

      {!panelOpen ? (
        // ── Banner (prima visita) ──
        <div className="ck-overlay" role="dialog" aria-label="Informativa cookie" aria-live="polite">
          <div className="ck-card">
            <h2 className="ck-title">Cookie</h2>
            <p className="ck-text">
              Usiamo cookie tecnici per il funzionamento del sito. Con il tuo consenso usiamo anche
              cookie di analisi e marketing per migliorare l’esperienza e mostrarti contenuti più
              rilevanti. Per i dettagli leggi la nostra{' '}
              <Link href="/cookie-policy">Cookie Policy</Link>.
            </p>
            <div className="ck-btns">
              <button type="button" className="ck-btn" onClick={acceptAll}>Accetta tutti</button>
              <button type="button" className="ck-btn" onClick={rejectAll}>Rifiuta tutti</button>
              <button type="button" className="ck-btn" onClick={() => setPanelOpen(true)}>Personalizza</button>
            </div>
          </div>
        </div>
      ) : (
        // ── Pannello "Personalizza" ──
        <div className="ck-overlay modal" role="dialog" aria-modal="true" aria-label="Preferenze cookie">
          <div className="ck-card wide">
            <h2 className="ck-title">Le tue preferenze</h2>
            <p className="ck-text">
              Scegli quali cookie attivare. Le tue scelte si salvano per 6 mesi, poi te le chiederemo
              di nuovo. Puoi cambiarle quando vuoi dal link in fondo al sito.
            </p>

            <div className="ck-cats">
              <div className="ck-cat">
                <div className="ck-cat-head">
                  <span className="ck-cat-name">Cookie tecnici</span>
                  <span className="ck-always">Sempre attivi</span>
                </div>
                <p className="ck-cat-desc">
                  Servono al funzionamento del sito (login, sessione, preferenze base). Senza, il
                  sito non funziona.
                </p>
              </div>

              <div className="ck-cat">
                <div className="ck-cat-head">
                  <span className="ck-cat-name">Cookie di analisi</span>
                  <button
                    type="button"
                    className={`ck-toggle ${analytics ? 'on' : ''}`}
                    onClick={() => setAnalytics((v) => !v)}
                    aria-pressed={analytics}
                    aria-label={`Cookie di analisi ${analytics ? 'attivi' : 'disattivati'}`}
                  >
                    <span className="ck-knob" />
                  </button>
                </div>
                <p className="ck-cat-desc">
                  Ci aiutano a capire quali pagine vengono visitate e come migliorare il sito. Dati
                  aggregati e anonimi.
                </p>
              </div>

              <div className="ck-cat">
                <div className="ck-cat-head">
                  <span className="ck-cat-name">Cookie di marketing</span>
                  <button
                    type="button"
                    className={`ck-toggle ${marketing ? 'on' : ''}`}
                    onClick={() => setMarketing((v) => !v)}
                    aria-pressed={marketing}
                    aria-label={`Cookie di marketing ${marketing ? 'attivi' : 'disattivati'}`}
                  >
                    <span className="ck-knob" />
                  </button>
                </div>
                <p className="ck-cat-desc">
                  Servono a mostrare contenuti più rilevanti e a misurare l’efficacia delle nostre
                  comunicazioni.
                </p>
              </div>
            </div>

            <div className="ck-btns">
              <button type="button" className="ck-btn" onClick={savePrefs}>Salva preferenze</button>
              <button type="button" className="ck-btn" onClick={acceptAll}>Accetta tutti</button>
              <button type="button" className="ck-btn" onClick={rejectAll}>Rifiuta tutti</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
