'use client'

import { useEffect, useState } from 'react'
import { PAGE_KEYS, pageHref, type PageKey, type SitePages } from '@/lib/sites/pages'
import { setLocaleCookie, type Locale } from '@/lib/sites/i18n'

/**
 * Header/nav dei siti multi-pagina (Pro/Premium). Basic non lo monta.
 *
 * `variant` seleziona l'estetica per template (STEP C — FASE 5B.2):
 *  - 'sticky-transparent' (Cinematico): trasparente sopra l'hero, scuro col blur allo scroll
 *  - 'sticky-compact'     (Bento): sticky, solid nell'accent, compatto/bold
 *  - 'show-hide'          (Panoramico): si nasconde scrollando giù, riappare scrollando su
 *  - 'sticky-minimal'     (Aurora): sticky, sempre semi-trasparente, minimale
 *  - 'static'             (Mercato): non sticky, scompare scrollando
 *  - 'default'            (fallback neutro, usato finché C non è completato)
 */

export type HeaderVariant = 'default' | 'sticky-transparent' | 'sticky-compact' | 'show-hide' | 'sticky-minimal' | 'static'

type Props = {
  restaurantName: string
  logoUrl?: string
  accentColor: string
  pages: SitePages
  currentPage: PageKey
  slug: string
  locale: Locale
  variant?: HeaderVariant
}

export default function RestaurantHeader({
  restaurantName, logoUrl, accentColor, pages, currentPage, slug, locale, variant = 'default',
}: Props) {
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [lastY, setLastY] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 40)
      if (variant === 'show-hide') {
        setHidden(y > lastY && y > 120)
        setLastY(y)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [variant, lastY])

  const visiblePages = PAGE_KEYS.filter(k => pages[k]?.enabled)

  const pickLocale = (l: Locale) => {
    setLocaleCookie(l)
    if (typeof window !== 'undefined') window.location.reload()
  }

  // ── Stile per variant ──
  const isSticky = variant !== 'static'
  const isTransparentTop = variant === 'sticky-transparent' && !scrolled
  const bg = isTransparentTop
    ? 'transparent'
    : variant === 'sticky-compact'
      ? accentColor
      : variant === 'sticky-minimal'
        ? 'rgba(10,10,10,0.55)'
        : 'rgba(10,10,10,0.92)'
  const blur = isTransparentTop ? 'none' : 'blur(14px)'
  const fg = variant === 'sticky-compact' ? '#0a0a0a' : '#fff'
  const translateY = variant === 'show-hide' && hidden ? '-100%' : '0'

  return (
    <>
      <style>{`
        .rh-bar {
          position: ${isSticky ? 'sticky' : 'static'};
          top: 0; left: 0; right: 0; z-index: 500;
          background: ${bg};
          backdrop-filter: ${blur};
          -webkit-backdrop-filter: ${blur};
          color: ${fg};
          transition: background 0.3s ease, transform 0.3s ease;
          transform: translateY(${translateY});
          font-family: 'Inter', system-ui, sans-serif;
        }
        .rh-inner { max-width: 1180px; margin: 0 auto; padding: 16px 22px; display: flex; align-items: center; justify-content: space-between; gap: 20px; }
        .rh-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; color: inherit; font-weight: 700; font-size: 16px; letter-spacing: 0.02em; }
        .rh-logo { height: 28px; width: auto; display: block; }
        .rh-nav { display: none; align-items: center; gap: 26px; }
        .rh-link { color: inherit; text-decoration: none; font-size: 13px; font-weight: 600; letter-spacing: 0.04em; opacity: 0.78; transition: opacity 0.2s; white-space: nowrap; }
        .rh-link:hover, .rh-link.active { opacity: 1; }
        .rh-link.active { border-bottom: 2px solid currentColor; padding-bottom: 3px; }
        .rh-right { display: flex; align-items: center; gap: 14px; }
        .rh-lang { display: none; gap: 4px; }
        .rh-lang button { padding: 4px 8px; font-size: 10.5px; font-weight: 700; letter-spacing: 0.04em; border-radius: 6px; cursor: pointer; background: transparent; border: 1px solid currentColor; opacity: 0.6; color: inherit; font-family: inherit; }
        .rh-lang button.on { opacity: 1; background: currentColor; }
        .rh-lang button.on { color: ${bg === 'transparent' ? '#fff' : bg}; }
        .rh-burger { display: flex; flex-direction: column; gap: 4px; background: none; border: 0; cursor: pointer; padding: 6px; }
        .rh-burger span { width: 20px; height: 2px; background: currentColor; display: block; }
        .rh-mobile-panel { position: fixed; inset: 0; z-index: 999; background: rgba(8,8,9,0.98); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 26px; }
        .rh-mobile-panel a { color: #fff; text-decoration: none; font-size: 22px; font-weight: 700; }
        .rh-mobile-panel a.active { color: ${accentColor}; }
        .rh-mobile-close { position: absolute; top: 20px; right: 20px; background: none; border: 0; color: #fff; font-size: 28px; cursor: pointer; line-height: 1; }
        .rh-mobile-lang { display: flex; gap: 10px; margin-top: 10px; }
        .rh-mobile-lang button { padding: 6px 14px; font-size: 12px; font-weight: 700; border-radius: 8px; border: 1px solid rgba(255,255,255,0.3); background: transparent; color: #fff; cursor: pointer; }
        .rh-mobile-lang button.on { background: ${accentColor}; border-color: ${accentColor}; color: #0a0a0a; }
        @media (min-width: 860px) {
          .rh-nav { display: flex; }
          .rh-lang { display: flex; }
          .rh-burger { display: none; }
        }
      `}</style>

      <header className="rh-bar" role="banner">
        <div className="rh-inner">
          <a href={pageHref(slug, 'home')} className="rh-brand">
            {logoUrl ? <img src={logoUrl} alt={restaurantName} className="rh-logo" /> : null}
            <span>{restaurantName}</span>
          </a>

          <nav className="rh-nav" aria-label="Menu del sito">
            {visiblePages.map(k => (
              <a key={k} href={pageHref(slug, k)} className={`rh-link ${k === currentPage ? 'active' : ''}`}>
                {pages[k].label}
              </a>
            ))}
          </nav>

          <div className="rh-right">
            <div className="rh-lang" role="group" aria-label="Lingua / Language">
              <button type="button" className={locale === 'it' ? 'on' : ''} onClick={() => pickLocale('it')} aria-pressed={locale === 'it'}>IT</button>
              <button type="button" className={locale === 'en' ? 'on' : ''} onClick={() => pickLocale('en')} aria-pressed={locale === 'en'}>EN</button>
            </div>
            <button type="button" className="rh-burger" aria-label="Apri menu" onClick={() => setMobileOpen(true)}>
              <span /><span /><span />
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="rh-mobile-panel" role="dialog" aria-modal="true" aria-label="Menu del sito">
          <button type="button" className="rh-mobile-close" aria-label="Chiudi menu" onClick={() => setMobileOpen(false)}>×</button>
          {visiblePages.map(k => (
            <a key={k} href={pageHref(slug, k)} className={k === currentPage ? 'active' : ''} onClick={() => setMobileOpen(false)}>
              {pages[k].label}
            </a>
          ))}
          <div className="rh-mobile-lang">
            <button type="button" className={locale === 'it' ? 'on' : ''} onClick={() => pickLocale('it')}>IT</button>
            <button type="button" className={locale === 'en' ? 'on' : ''} onClick={() => pickLocale('en')}>EN</button>
          </div>
        </div>
      )}
    </>
  )
}
