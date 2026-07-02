'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  getConsent,
  setConsent,
  hasDecided,
  RESTAURANT_OPEN_PREFERENCES_EVENT,
} from '@/lib/cookies/restaurantConsent'
import { getLocaleFromCookie, setLocaleCookie, type Locale } from '@/lib/sites/i18n'

/**
 * Banner cookie GDPR + Garante 2021 per i SITI DEI RISTORATORI.
 * - Parla dal punto di vista del ristorante ("Usiamo..."), non di Lumino.
 * - Appare alla prima visita (finché nessuna scelta valida è salvata, 6 mesi).
 * - 3 bottoni di pari rilevanza: Accetta tutti / Rifiuta tutti / Personalizza.
 * - Selettore lingua IT/EN in alto a destra.
 * - Barra fissa in basso (non modal), a tutta larghezza, colori dal theme del template.
 * - Riapribile dal footer ("Gestisci cookie") via evento window.
 */

type Props = {
  /** Colore accento del template attivo (usato per toggle e lingua attiva). */
  accentColor?: string
  /** Link alla Cookie Policy del ristoratore (default relativo /cookie-policy). */
  cookiePolicyHref?: string
}

const T: Record<Locale, {
  title: string
  before: string
  link: string
  after: string
  acceptAll: string
  rejectAll: string
  customize: string
  prefTitle: string
  prefText: string
  save: string
  always: string
  cats: { tech: [string, string]; analytics: [string, string]; marketing: [string, string] }
}> = {
  it: {
    title: 'Cookie',
    before: 'Usiamo cookie tecnici per il funzionamento del sito. Con il tuo consenso usiamo anche cookie di analisi e marketing per migliorare l’esperienza. Per i dettagli leggi la nostra ',
    link: 'Cookie Policy',
    after: '.',
    acceptAll: 'Accetta tutti',
    rejectAll: 'Rifiuta tutti',
    customize: 'Personalizza',
    prefTitle: 'Le tue preferenze',
    prefText: 'Scegli quali cookie attivare. Le tue scelte si salvano per 6 mesi. Puoi cambiarle quando vuoi dal link in fondo al sito.',
    save: 'Salva preferenze',
    always: 'Sempre attivi',
    cats: {
      tech: ['Cookie tecnici', 'Servono al funzionamento del sito (sessione, preferenze base). Senza, il sito non funziona.'],
      analytics: ['Cookie di analisi', 'Ci aiutano a capire quali pagine vengono visitate. Dati aggregati e anonimi.'],
      marketing: ['Cookie di marketing', 'Servono a mostrare contenuti più rilevanti e a misurare le comunicazioni.'],
    },
  },
  en: {
    title: 'Cookies',
    before: 'We use technical cookies for the site to function. With your consent, we also use analytics and marketing cookies to improve your experience. For details read our ',
    link: 'Cookie Policy',
    after: '.',
    acceptAll: 'Accept all',
    rejectAll: 'Reject all',
    customize: 'Customize',
    prefTitle: 'Your preferences',
    prefText: 'Choose which cookies to enable. Your choices are saved for 6 months. You can change them anytime from the link in the footer.',
    save: 'Save preferences',
    always: 'Always on',
    cats: {
      tech: ['Technical cookies', 'Needed for the site to work (session, basic preferences). Without them the site does not function.'],
      analytics: ['Analytics cookies', 'Help us understand which pages are visited. Aggregated and anonymous data.'],
      marketing: ['Marketing cookies', 'Used to show more relevant content and to measure communications.'],
    },
  },
}

export default function CookieBannerRestaurant({ accentColor, cookiePolicyHref = '/cookie-policy' }: Props) {
  const accent = accentColor || '#c9a84c'
  const [mounted, setMounted] = useState(false)
  const [decided, setDecided] = useState(true) // niente flash SSR
  const [panelOpen, setPanelOpen] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [marketing, setMarketing] = useState(false)
  const [locale, setLocale] = useState<Locale>('it')

  useEffect(() => {
    setMounted(true)
    setDecided(hasDecided())
    setLocale(getLocaleFromCookie())
    const c = getConsent()
    if (c) {
      setAnalytics(c.analytics)
      setMarketing(c.marketing)
    }
  }, [])

  // Riapertura del pannello dal footer ("Gestisci cookie").
  useEffect(() => {
    const open = () => {
      const c = getConsent()
      setAnalytics(c?.analytics ?? false)
      setMarketing(c?.marketing ?? false)
      setLocale(getLocaleFromCookie())
      setPanelOpen(true)
    }
    window.addEventListener(RESTAURANT_OPEN_PREFERENCES_EVENT, open)
    return () => window.removeEventListener(RESTAURANT_OPEN_PREFERENCES_EVENT, open)
  }, [])

  const finish = useCallback(() => {
    setDecided(true)
    setPanelOpen(false)
  }, [])

  const acceptAll = useCallback(() => { setConsent({ analytics: true, marketing: true }); finish() }, [finish])
  const rejectAll = useCallback(() => { setConsent({ analytics: false, marketing: false }); finish() }, [finish])
  const savePrefs = useCallback(() => { setConsent({ analytics, marketing }); finish() }, [analytics, marketing, finish])

  const pickLocale = useCallback((l: Locale) => { setLocale(l); setLocaleCookie(l) }, [])

  if (!mounted) return null
  if (decided && !panelOpen) return null

  const t = T[locale]

  return (
    <>
      <style>{`
        .rck-bar { position: fixed; left: 0; right: 0; bottom: 0; z-index: 2147483000; background: rgba(15,15,16,0.97); backdrop-filter: blur(14px); border-top: 1px solid rgba(255,255,255,0.12); color: #fff; font-family: 'Inter', system-ui, sans-serif; box-shadow: 0 -12px 40px rgba(0,0,0,0.45); }
        .rck-inner { max-width: 1100px; margin: 0 auto; padding: 18px 20px 20px; }
        .rck-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
        .rck-title { font-size: 15px; font-weight: 700; letter-spacing: 0.02em; margin: 0 0 6px; }
        .rck-text { font-size: 13px; line-height: 1.6; color: rgba(255,255,255,0.72); margin: 0; max-width: 760px; }
        .rck-text a { color: ${accent}; text-decoration: underline; text-underline-offset: 2px; }
        .rck-lang { display: flex; gap: 4px; flex-shrink: 0; }
        .rck-lang button { padding: 4px 9px; font-size: 11px; font-weight: 700; letter-spacing: 0.04em; border-radius: 7px; cursor: pointer; background: transparent; border: 1px solid rgba(255,255,255,0.18); color: rgba(255,255,255,0.6); font-family: inherit; }
        .rck-lang button.on { background: ${accent}; border-color: ${accent}; color: #0a0a0a; }
        .rck-btns { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-top: 16px; }
        .rck-btn { padding: 12px 14px; border-radius: 10px; font-family: inherit; font-size: 12.5px; font-weight: 700; letter-spacing: 0.03em; cursor: pointer; transition: transform 0.15s, background 0.2s, border-color 0.2s; border: 1px solid rgba(255,255,255,0.18); background: rgba(255,255,255,0.07); color: #fff; text-align: center; }
        .rck-btn:hover { transform: translateY(-1px); background: rgba(255,255,255,0.13); border-color: rgba(255,255,255,0.3); }
        .rck-cats { display: flex; flex-direction: column; gap: 10px; margin: 14px 0 4px; }
        .rck-cat { border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 12px 14px; background: rgba(255,255,255,0.03); }
        .rck-cat-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 5px; }
        .rck-cat-name { font-size: 13.5px; font-weight: 600; }
        .rck-cat-desc { font-size: 12px; line-height: 1.5; color: rgba(255,255,255,0.6); margin: 0; }
        .rck-always { font-size: 10.5px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: ${accent}; white-space: nowrap; }
        .rck-toggle { width: 44px; height: 25px; border-radius: 9999px; background: rgba(255,255,255,0.14); border: 0; position: relative; cursor: pointer; transition: background 0.2s; padding: 0; flex-shrink: 0; }
        .rck-toggle.on { background: ${accent}; }
        .rck-knob { display: block; width: 19px; height: 19px; border-radius: 50%; background: #fff; position: absolute; top: 3px; left: 3px; transition: left 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.3); }
        .rck-toggle.on .rck-knob { left: 22px; }
        @media (max-width: 640px) {
          .rck-inner { padding: 14px 16px 16px; }
          .rck-text { font-size: 12px; }
          .rck-btns { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="rck-bar" role="dialog" aria-label={t.title} aria-live="polite">
        <div className="rck-inner">
          <div className="rck-top">
            <div>
              <p className="rck-title">{t.title}</p>
              {!panelOpen ? (
                <p className="rck-text">
                  {t.before}
                  <a href={cookiePolicyHref}>{t.link}</a>
                  {t.after}
                </p>
              ) : (
                <p className="rck-text">{t.prefText}</p>
              )}
            </div>
            <div className="rck-lang" role="group" aria-label="Lingua / Language">
              <button type="button" className={locale === 'it' ? 'on' : ''} onClick={() => pickLocale('it')} aria-pressed={locale === 'it'}>IT</button>
              <button type="button" className={locale === 'en' ? 'on' : ''} onClick={() => pickLocale('en')} aria-pressed={locale === 'en'}>EN</button>
            </div>
          </div>

          {panelOpen && (
            <div className="rck-cats">
              <div className="rck-cat">
                <div className="rck-cat-head">
                  <span className="rck-cat-name">{t.cats.tech[0]}</span>
                  <span className="rck-always">{t.always}</span>
                </div>
                <p className="rck-cat-desc">{t.cats.tech[1]}</p>
              </div>
              <div className="rck-cat">
                <div className="rck-cat-head">
                  <span className="rck-cat-name">{t.cats.analytics[0]}</span>
                  <button type="button" className={`rck-toggle ${analytics ? 'on' : ''}`} onClick={() => setAnalytics(v => !v)} aria-pressed={analytics} aria-label={t.cats.analytics[0]}>
                    <span className="rck-knob" />
                  </button>
                </div>
                <p className="rck-cat-desc">{t.cats.analytics[1]}</p>
              </div>
              <div className="rck-cat">
                <div className="rck-cat-head">
                  <span className="rck-cat-name">{t.cats.marketing[0]}</span>
                  <button type="button" className={`rck-toggle ${marketing ? 'on' : ''}`} onClick={() => setMarketing(v => !v)} aria-pressed={marketing} aria-label={t.cats.marketing[0]}>
                    <span className="rck-knob" />
                  </button>
                </div>
                <p className="rck-cat-desc">{t.cats.marketing[1]}</p>
              </div>
            </div>
          )}

          <div className="rck-btns">
            {panelOpen && <button type="button" className="rck-btn" onClick={savePrefs}>{t.save}</button>}
            <button type="button" className="rck-btn" onClick={acceptAll}>{t.acceptAll}</button>
            <button type="button" className="rck-btn" onClick={rejectAll}>{t.rejectAll}</button>
            {!panelOpen && <button type="button" className="rck-btn" onClick={() => setPanelOpen(true)}>{t.customize}</button>}
          </div>
        </div>
      </div>
    </>
  )
}
