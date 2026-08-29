'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  getConsent,
  setConsent,
  hasDecided,
  OPEN_PREFERENCES_EVENT,
} from '@/lib/cookies/consent'

/**
 * Banner cookie GDPR + Garante 2021.
 *
 * È una BARRA sottile in fondo, non un pannello: l'informativa è un obbligo,
 * non un contenuto, e occupare mezza schermata per una cosa che nessuno vuole
 * leggere significa nascondere il sito dietro un adempimento. Qui il sito resta
 * visibile e navigabile — niente velo scuro dietro.
 *
 * Restano tutti i requisiti che non sono negoziabili:
 *  · tre scelte di pari rilevanza visiva (Accetta / Rifiuta / Personalizza),
 *    stessa misura, nessuna nascosta o resa meno evidente delle altre
 *  · pannello di dettaglio con le tre categorie, i tecnici sempre attivi
 *  · la scelta si salva e il banner non torna
 *
 * Il pannello "Personalizza" invece il velo ce l'ha, ed è giusto: lì si sta
 * decidendo qualcosa, e una finestra di dialogo che non ferma il resto è una
 * finestra che si chiude per sbaglio.
 *
 * NON è il banner dei siti dei clienti: quelli montano
 * components/restaurant/CookieBannerRestaurant.tsx dai loro template. Questo
 * si toglie di mezzo su /sites/ e /demo/ (vedi sotto), quindi le due cose non
 * si incontrano mai.
 *
 * Montato una sola volta app-wide (vedi app/layout.tsx).
 */

/** Quanto aspetta prima di farsi vedere. L'hero deve poter essere guardato:
    un banner che compare insieme alla pagina è la prima cosa che si legge, e
    non deve esserlo. */
const APPEAR_MS = 1000

export default function CookieBanner() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [decided, setDecided] = useState(true) // assume deciso finché non sappiamo (no flash SSR)
  const [panelOpen, setPanelOpen] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [marketing, setMarketing] = useState(false)
  /** Montato ma non ancora entrato: serve a far partire la transizione. */
  const [shown, setShown] = useState(false)

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

  /* L'entrata ritardata. Parte solo se il banner ha davvero qualcosa da dire:
     se la scelta è già stata fatta, il timer non serve. */
  useEffect(() => {
    if (!mounted || decided) return
    const id = window.setTimeout(() => setShown(true), APPEAR_MS)
    return () => window.clearTimeout(id)
  }, [mounted, decided])

  // Riapertura del pannello dal footer.
  useEffect(() => {
    const open = () => {
      const c = getConsent()
      setAnalytics(c?.analytics ?? false)
      setMarketing(c?.marketing ?? false)
      setPanelOpen(true)
      setShown(true)
    }
    window.addEventListener(OPEN_PREFERENCES_EVENT, open)
    return () => window.removeEventListener(OPEN_PREFERENCES_EVENT, open)
  }, [])

  const finish = useCallback(() => {
    setDecided(true)
    setPanelOpen(false)
    setShown(false)
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
  // Sui siti dei ristoratori (e sui loro demo) vale il loro banner cookie,
  // non quello di Lumino: qui ci togliamo di mezzo.
  if (pathname?.startsWith('/sites/') || pathname?.startsWith('/demo/')) return null
  // Niente banner se già deciso, a meno che il pannello sia stato riaperto dal footer.
  if (decided && !panelOpen) return null

  return (
    <>
      <style>{`
        /* ── La barra ──────────────────────────────────────────────────────
           Fissa in fondo, sottile, e soprattutto senza velo: il sito dietro
           resta leggibile e cliccabile. La z-index sta sopra il pulsante
           WhatsApp (55) ma il contenuto non lo copre — vedi il margine
           riservato più sotto. */
        .ck-bar {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px 20px;
          flex-wrap: wrap;
          padding: 12px clamp(14px, 3vw, 26px);
          padding-bottom: max(12px, env(safe-area-inset-bottom, 0px));
          background: rgba(23, 18, 16, 0.94);
          backdrop-filter: blur(12px);
          border-top: 1px solid rgba(244, 238, 228, 0.16);
          color: #f4eee4;
          font-family: var(--font-sans), system-ui, sans-serif;
          /* Entra dal basso, discreta. */
          transform: translateY(110%);
          opacity: 0;
          transition: transform 0.55s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.45s;
        }
        .ck-bar.is-in { transform: none; opacity: 1; }

        /* Il pulsante WhatsApp sta in basso a destra. La barra non gli passa
           sopra: si FERMA prima della sua colonna. Riservare solo il padding
           non bastava — la barra restava larga tutto lo schermo e il suo fondo
           copriva comunque il pulsante, rendendolo pure non cliccabile. */
        @media (min-width: 821px) {
          .ck-bar {
            right: calc(clamp(1rem, 2.5vw, 1.5rem) * 2 + 3.25rem);
            border-right: 1px solid rgba(244, 238, 228, 0.16);
            border-top-right-radius: 12px;
          }
        }

        .ck-copy {
          font-size: 13px;
          line-height: 1.5;
          color: rgba(244, 238, 228, 0.72);
          margin: 0;
          flex: 1 1 22rem;
          min-width: 0;
        }
        .ck-copy a {
          color: #f4eee4;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .ck-copy a:hover { color: #ec6a9c; }

        /* Tre scelte, stessa misura: il GDPR chiede che rifiutare costi quanto
           accettare, e "stessa misura" è il modo in cui lo si vede. */
        /* Griglia a colonne uguali, non flex: il GDPR chiede che rifiutare
           costi quanto accettare, e con flex ogni pulsante prendeva la
           larghezza della propria parola — "Personalizza" usciva mezzo dito
           più largo di "Rifiuta". */
        .ck-acts {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
          flex: 0 0 auto;
        }
        .ck-btn {
          min-height: 38px;
          padding: 0 14px;
          border-radius: 999px;
          border: 1px solid rgba(244, 238, 228, 0.22);
          background: transparent;
          color: #f4eee4;
          font-family: inherit;
          font-size: 12px;
          letter-spacing: 0.06em;
          font-weight: 500;
          white-space: nowrap;
          cursor: pointer;
          transition: background 0.25s, border-color 0.25s;
        }
        .ck-btn:hover { background: rgba(244, 238, 228, 0.1); border-color: rgba(244, 238, 228, 0.4); }
        .ck-btn:focus-visible { outline: 2px solid #e5342a; outline-offset: 2px; }

        @media (max-width: 820px) {
          /* Sopra il pulsante WhatsApp (3rem + 1rem dal fondo), non addosso. */
          .ck-bar {
            bottom: calc(3rem + 1.6rem + env(safe-area-inset-bottom, 0px));
            border-bottom: 1px solid rgba(244, 238, 228, 0.16);
            padding-bottom: 12px;
            /* Il tetto chiesto: un quarto dello schermo, mai di più. */
            max-height: 25vh;
            overflow-y: auto;
          }
          .ck-copy { flex-basis: 100%; font-size: 12.5px; }
          .ck-acts { width: 100%; }
          /* 44px: sotto quella misura il pollice sbaglia bersaglio. */
          .ck-btn { min-height: 44px; font-size: 11.5px; padding: 0 8px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .ck-bar { transition: opacity 0.2s; transform: none; }
          .ck-bar:not(.is-in) { opacity: 0; }
        }

        /* ── Il pannello di dettaglio ───────────────────────────────────────
           Questo sì che ferma il resto: ci si sta decidendo qualcosa. */
        .ck-overlay { position: fixed; inset: 0; z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 18px; background: rgba(9, 6, 5, 0.62); backdrop-filter: blur(4px); }
        .ck-card { width: 100%; max-width: 560px; max-height: calc(100vh - 40px); overflow-y: auto; background: #171210; border: 1px solid rgba(244, 238, 228, 0.16); border-radius: 16px; box-shadow: 0 24px 70px rgba(0,0,0,0.6); color: #f4eee4; font-family: var(--font-sans), system-ui, sans-serif; padding: 22px; }
        .ck-title { font-family: var(--font-serif), Georgia, serif; font-size: 24px; font-weight: 500; margin: 0 0 8px; letter-spacing: -0.01em; }
        .ck-text { font-size: 13.5px; line-height: 1.6; color: rgba(244, 238, 228, 0.7); margin: 0 0 18px; }
        .ck-text a { color: #ec6a9c; }
        .ck-cats { display: flex; flex-direction: column; gap: 12px; margin: 4px 0 18px; }
        .ck-cat { border: 1px solid rgba(244, 238, 228, 0.1); border-radius: 12px; padding: 14px 16px; background: rgba(244, 238, 228, 0.03); }
        .ck-cat-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 6px; }
        .ck-cat-name { font-size: 14px; font-weight: 600; }
        .ck-cat-desc { font-size: 12.5px; line-height: 1.55; color: rgba(244, 238, 228, 0.6); margin: 0; }
        .ck-always { font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #22c55e; white-space: nowrap; }
        .ck-toggle { width: 46px; height: 26px; border-radius: 9999px; background: rgba(244, 238, 228, 0.14); border: 0; position: relative; cursor: pointer; transition: background 0.2s; padding: 0; flex-shrink: 0; }
        .ck-toggle.on { background: #22c55e; }
        .ck-toggle:disabled { opacity: 0.6; cursor: not-allowed; }
        .ck-knob { display: block; width: 20px; height: 20px; border-radius: 50%; background: #fff; position: absolute; top: 3px; left: 3px; transition: left 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.3); }
        .ck-toggle.on .ck-knob { left: 23px; }
        .ck-panel-acts { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
        @media (max-width: 520px) { .ck-panel-acts { grid-template-columns: 1fr; } }
      `}</style>

      {!panelOpen ? (
        /* ── La barra (prima visita) ── */
        <div
          className={`ck-bar${shown ? ' is-in' : ''}`}
          role="region"
          aria-label="Informativa cookie"
        >
          <p className="ck-copy">
            Usiamo cookie tecnici e, col tuo consenso, di analisi e marketing.{' '}
            <Link href="/cookie-policy">Cookie Policy</Link>
          </p>

          <div className="ck-acts">
            <button type="button" className="ck-btn" onClick={acceptAll}>
              Accetta
            </button>
            <button type="button" className="ck-btn" onClick={rejectAll}>
              Rifiuta
            </button>
            <button type="button" className="ck-btn" onClick={() => setPanelOpen(true)}>
              Personalizza
            </button>
          </div>
        </div>
      ) : (
        /* ── Pannello "Personalizza" ── */
        <div className="ck-overlay" role="dialog" aria-modal="true" aria-label="Preferenze cookie">
          <div className="ck-card">
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

            <div className="ck-panel-acts">
              <button type="button" className="ck-btn" onClick={savePrefs}>
                Salva preferenze
              </button>
              <button type="button" className="ck-btn" onClick={acceptAll}>
                Accetta tutti
              </button>
              <button type="button" className="ck-btn" onClick={rejectAll}>
                Rifiuta tutti
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
