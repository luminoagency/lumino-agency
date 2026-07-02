'use client'

import CookieBannerRestaurant from './CookieBannerRestaurant'
import { setLocaleCookie, type Locale } from '@/lib/sites/i18n'
import { POWERED_BY } from '@/lib/company'
import { RESTAURANT_OPEN_PREFERENCES_EVENT } from '@/lib/cookies/restaurantConsent'
import type { PolicySection } from '@/lib/policies/policyContent'

/**
 * Chrome delle pagine legali del ristoratore (Cookie/Privacy Policy).
 * Header con nome ristorante + selettore lingua, contenuto, footer con
 * "Sito realizzato da Lumino" + link legali. Monta anche il banner cookie.
 */

type Props = {
  restaurantName: string
  accentColor: string
  locale: Locale
  kind: 'cookie' | 'privacy'
  sections: PolicySection[]
  slug?: string
}

export default function PolicyPage({ restaurantName, accentColor, locale, kind, sections, slug }: Props) {
  const base = slug ? `/sites/${slug}` : ''
  const isIt = locale === 'it'
  const pageTitle = kind === 'cookie' ? 'Cookie Policy' : 'Privacy Policy'
  const backLabel = isIt ? '← Torna al sito' : '← Back to site'
  const manageLabel = isIt ? 'Gestisci cookie' : 'Manage cookies'

  const pickLocale = (l: Locale) => {
    setLocaleCookie(l)
    if (typeof window !== 'undefined') window.location.reload()
  }
  const openPreferences = () => {
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(RESTAURANT_OPEN_PREFERENCES_EVENT))
  }

  return (
    <div className="pol-root">
      <style>{`
        .pol-root { min-height: 100vh; background: #fafaf8; color: #1a1a1a; font-family: 'Inter', system-ui, sans-serif; }
        .pol-head { border-bottom: 1px solid rgba(0,0,0,0.08); }
        .pol-head-in { max-width: 780px; margin: 0 auto; padding: 22px 22px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
        .pol-brand { font-size: 17px; font-weight: 700; letter-spacing: 0.01em; color: #111; text-decoration: none; }
        .pol-lang { display: flex; gap: 5px; }
        .pol-lang button { padding: 5px 10px; font-size: 11px; font-weight: 700; letter-spacing: 0.04em; border-radius: 7px; cursor: pointer; background: transparent; border: 1px solid rgba(0,0,0,0.18); color: rgba(0,0,0,0.55); font-family: inherit; }
        .pol-lang button.on { background: ${accentColor}; border-color: ${accentColor}; color: #fff; }
        .pol-main { max-width: 780px; margin: 0 auto; padding: 40px 22px 64px; }
        .pol-back { display: inline-block; font-size: 13px; color: ${accentColor}; text-decoration: none; margin-bottom: 20px; }
        .pol-title { font-size: 30px; font-weight: 800; letter-spacing: -0.02em; margin: 0 0 6px; }
        .pol-sub { font-size: 14px; color: rgba(0,0,0,0.5); margin: 0 0 34px; }
        .pol-sec { margin-bottom: 26px; }
        .pol-h2 { font-size: 17px; font-weight: 700; color: #111; margin: 0 0 10px; padding-left: 12px; border-left: 3px solid ${accentColor}; }
        .pol-sec p { font-size: 14.5px; line-height: 1.7; color: rgba(0,0,0,0.75); margin: 0 0 10px; }
        .pol-sec ul { margin: 0; padding-left: 20px; }
        .pol-sec li { font-size: 14.5px; line-height: 1.7; color: rgba(0,0,0,0.75); margin-bottom: 6px; }
        .pol-foot { border-top: 1px solid rgba(0,0,0,0.08); }
        .pol-foot-in { max-width: 780px; margin: 0 auto; padding: 26px 22px 40px; text-align: center; }
        .pol-foot-brand { font-size: 12px; color: rgba(0,0,0,0.55); }
        .pol-foot-brand a { color: inherit; text-decoration: none; border-bottom: 1px solid currentColor; }
        .pol-foot-links { margin-top: 10px; font-size: 11px; color: rgba(0,0,0,0.45); display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
        .pol-foot-links a, .pol-foot-links button { color: rgba(0,0,0,0.5); text-decoration: none; background: none; border: 0; cursor: pointer; font: inherit; padding: 0; }
        .pol-foot-links a:hover, .pol-foot-links button:hover { color: ${accentColor}; }
        @media (max-width: 600px) { .pol-title { font-size: 25px; } }
      `}</style>

      <CookieBannerRestaurant accentColor={accentColor} cookiePolicyHref={`${base}/cookie-policy`} />

      <header className="pol-head">
        <div className="pol-head-in">
          <a href={base || '/'} className="pol-brand">{restaurantName}</a>
          <div className="pol-lang" role="group" aria-label="Lingua / Language">
            <button type="button" className={isIt ? 'on' : ''} onClick={() => pickLocale('it')} aria-pressed={isIt}>IT</button>
            <button type="button" className={!isIt ? 'on' : ''} onClick={() => pickLocale('en')} aria-pressed={!isIt}>EN</button>
          </div>
        </div>
      </header>

      <main className="pol-main">
        <a href={base || '/'} className="pol-back">{backLabel}</a>
        <h1 className="pol-title">{pageTitle}</h1>
        <p className="pol-sub">{restaurantName}</p>

        {sections.map((sec, i) => (
          <section className="pol-sec" key={i}>
            <h2 className="pol-h2">{sec.heading}</h2>
            {sec.blocks.map((b, j) =>
              b.type === 'p'
                ? <p key={j}>{b.text}</p>
                : <ul key={j}>{b.items.map((it, k) => <li key={k}>{it}</li>)}</ul>
            )}
          </section>
        ))}
      </main>

      <footer className="pol-foot">
        <div className="pol-foot-in">
          <p className="pol-foot-brand">
            <a href={POWERED_BY.url} target="_blank" rel="noopener noreferrer">{POWERED_BY.label}</a>
          </p>
          <div className="pol-foot-links">
            <a href={`${base}/cookie-policy`}>Cookie Policy</a>
            <span>·</span>
            <a href={`${base}/privacy-policy`}>Privacy Policy</a>
            <span>·</span>
            <button type="button" onClick={openPreferences}>{manageLabel}</button>
          </div>
        </div>
      </footer>
    </div>
  )
}
