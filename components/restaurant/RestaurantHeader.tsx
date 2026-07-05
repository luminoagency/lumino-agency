'use client'

import { useEffect, useState } from 'react'
import { PAGE_KEYS, pageHref, type PageKey, type SitePages } from '@/lib/sites/pages'
import { setLocaleCookie, type Locale } from '@/lib/sites/i18n'

/**
 * Header/nav dei siti multi-pagina (Pro/Premium). Basic non lo monta.
 *
 * `variant` dà a ogni template il suo carattere. Ogni variante usa solo font
 * che il template rispettivo carica davvero (con fallback di sistema):
 *  - 'sticky-transparent' (Cinematico): trasparente sopra l'hero, scuro col blur
 *    allo scroll; brand in serif con kerning ampio.
 *  - 'sticky-compact'     (Bento): sticky, tinta piena nell'accent, testo bold
 *    compatto, ombra netta allo scroll.
 *  - 'show-hide'          (Panoramico): sticky; si nasconde scrollando giù,
 *    riappare scrollando su; linee sottili, estetica marina.
 *  - 'sticky-minimal'     (Aurora): sticky sempre visibile, fondo semitrasparente,
 *    peso leggero e tracking ampio.
 *  - 'static'             (Mercato): non sticky, scorre via col contenuto;
 *    masthead da menù stampato in serif maiuscolo.
 *  - 'default'            (fallback neutro).
 */

export type HeaderVariant =
  | 'default'
  | 'sticky-transparent'
  | 'sticky-compact'
  | 'show-hide'
  | 'sticky-minimal'
  | 'static'

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

/** Testo leggibile (nero/bianco) su un colore di sfondo pieno. */
function readableOn(hex: string): string {
  const h = hex.replace('#', '')
  if (h.length !== 6) return '#fff'
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum > 0.62 ? '#111' : '#fff'
}

/** Tipografia fissa per variante (i font seguono quelli caricati dal template). */
const TYPO: Record<HeaderVariant, {
  brandFont: string; brandWeight: number; brandLS: string; brandTransform: string; brandSize: string; brandItalic?: boolean
  linkFont: string; linkWeight: number; linkLS: string; linkTransform: string; linkSize: string
  pad: string
}> = {
  'sticky-transparent': {
    brandFont: "Georgia, 'Times New Roman', serif", brandWeight: 500, brandLS: '0.16em', brandTransform: 'uppercase', brandSize: '16px',
    linkFont: "'Inter', system-ui, sans-serif", linkWeight: 600, linkLS: '0.2em', linkTransform: 'uppercase', linkSize: '11px',
    pad: '18px 22px',
  },
  'sticky-compact': {
    brandFont: "var(--font-inter, 'Inter'), system-ui, sans-serif", brandWeight: 800, brandLS: '-0.01em', brandTransform: 'none', brandSize: '17px',
    linkFont: "var(--font-inter, 'Inter'), system-ui, sans-serif", linkWeight: 700, linkLS: '0.02em', linkTransform: 'none', linkSize: '13px',
    pad: '12px 22px',
  },
  'show-hide': {
    brandFont: "'Inter', system-ui, sans-serif", brandWeight: 500, brandLS: '0.16em', brandTransform: 'uppercase', brandSize: '13.5px',
    linkFont: "'Inter', system-ui, sans-serif", linkWeight: 500, linkLS: '0.08em', linkTransform: 'none', linkSize: '12.5px',
    pad: '16px 22px',
  },
  'sticky-minimal': {
    brandFont: "'Inter', system-ui, sans-serif", brandWeight: 300, brandLS: '0.24em', brandTransform: 'uppercase', brandSize: '13.5px',
    linkFont: "'Inter', system-ui, sans-serif", linkWeight: 400, linkLS: '0.14em', linkTransform: 'uppercase', linkSize: '11px',
    pad: '18px 22px',
  },
  'static': {
    brandFont: "'Playfair Display', 'Cormorant Garamond', Georgia, serif", brandWeight: 600, brandLS: '0.12em', brandTransform: 'uppercase', brandSize: '21px', brandItalic: false,
    linkFont: "'Cormorant Garamond', Georgia, serif", linkWeight: 600, linkLS: '0.1em', linkTransform: 'uppercase', linkSize: '14px',
    pad: '20px 22px',
  },
  'default': {
    brandFont: "'Inter', system-ui, sans-serif", brandWeight: 700, brandLS: '0.02em', brandTransform: 'none', brandSize: '16px',
    linkFont: "'Inter', system-ui, sans-serif", linkWeight: 600, linkLS: '0.04em', linkTransform: 'none', linkSize: '13px',
    pad: '16px 22px',
  },
}

export default function RestaurantHeader({
  restaurantName, logoUrl, accentColor, pages, currentPage, slug, locale, variant = 'default',
}: Props) {
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [lastY, setLastY] = useState(0)

  useEffect(() => {
    if (variant === 'static') return // scorre via col contenuto: niente listener
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 40)
      if (variant === 'show-hide') {
        setHidden(y > lastY && y > 140)
        setLastY(y)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [variant, lastY])

  const visiblePages = PAGE_KEYS.filter(k => pages[k]?.enabled)
  const typo = TYPO[variant]

  const pickLocale = (l: Locale) => {
    setLocaleCookie(l)
    if (typeof window !== 'undefined') window.location.reload()
  }

  // ── Sfondo / posizione per variante ──
  const isSticky = variant !== 'static'
  const isTransparentTop = variant === 'sticky-transparent' && !scrolled

  let bg: string
  switch (variant) {
    case 'sticky-transparent': bg = scrolled ? 'rgba(10,10,10,0.9)' : 'transparent'; break
    case 'sticky-compact':     bg = accentColor; break
    case 'sticky-minimal':     bg = 'rgba(12,12,12,0.5)'; break
    case 'show-hide':          bg = 'rgba(10,10,10,0.85)'; break
    case 'static':             bg = 'rgba(18,16,14,0.96)'; break
    default:                   bg = 'rgba(10,10,10,0.92)'
  }

  const blur = isTransparentTop ? 'none' : (variant === 'sticky-compact' ? 'none' : 'blur(14px)')
  const fg = variant === 'sticky-compact'
    ? readableOn(accentColor)
    : variant === 'static'
      ? '#efe7db'
      : '#fff'

  // Regola/ombra allo scroll a seconda della variante
  const showShadow = scrolled && (variant === 'sticky-compact' || variant === 'sticky-transparent')
  const boxShadow = showShadow ? '0 6px 24px rgba(0,0,0,0.28)' : 'none'
  let borderBottom = 'none'
  if (variant === 'show-hide') borderBottom = '1px solid rgba(255,255,255,0.14)'
  else if (variant === 'sticky-minimal') borderBottom = '1px solid rgba(255,255,255,0.08)'
  else if (variant === 'static') borderBottom = '1px solid rgba(239,231,219,0.25)'
  else if (variant === 'sticky-transparent' && scrolled) borderBottom = '1px solid rgba(255,255,255,0.1)'
  const borderTop = variant === 'static' ? '3px double rgba(239,231,219,0.35)' : 'none'

  const translateY = variant === 'show-hide' && hidden ? '-100%' : '0'

  // Chip lingua attiva: sfondo = testo header, testo = colore pieno dietro l'header
  const langOnText = variant === 'sticky-compact'
    ? accentColor
    : variant === 'static'
      ? '#141210'
      : '#111'

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
          border-top: ${borderTop};
          border-bottom: ${borderBottom};
          box-shadow: ${boxShadow};
          transition: background 0.35s ease, transform 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease;
          transform: translateY(${translateY});
        }
        .rh-inner { max-width: 1180px; margin: 0 auto; padding: ${typo.pad}; display: flex; align-items: center; justify-content: space-between; gap: 20px; }
        .rh-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; color: inherit; font-family: ${typo.brandFont}; font-weight: ${typo.brandWeight}; font-size: ${typo.brandSize}; letter-spacing: ${typo.brandLS}; text-transform: ${typo.brandTransform}; font-style: ${typo.brandItalic ? 'italic' : 'normal'}; white-space: nowrap; }
        .rh-logo { height: 28px; width: auto; display: block; }
        .rh-nav { display: none; align-items: center; gap: 26px; }
        .rh-link { color: inherit; text-decoration: none; font-family: ${typo.linkFont}; font-size: ${typo.linkSize}; font-weight: ${typo.linkWeight}; letter-spacing: ${typo.linkLS}; text-transform: ${typo.linkTransform}; opacity: 0.74; transition: opacity 0.2s; white-space: nowrap; }
        .rh-link:hover, .rh-link.active { opacity: 1; }
        .rh-link.active { border-bottom: 2px solid currentColor; padding-bottom: 3px; }
        .rh-right { display: flex; align-items: center; gap: 14px; }
        .rh-lang { display: none; gap: 4px; }
        .rh-lang button { padding: 4px 8px; font-size: 10.5px; font-weight: 700; letter-spacing: 0.04em; border-radius: 6px; cursor: pointer; background: transparent; border: 1px solid currentColor; opacity: 0.55; color: inherit; font-family: 'Inter', system-ui, sans-serif; transition: opacity 0.2s; }
        .rh-lang button:hover { opacity: 0.85; }
        .rh-lang button.on { opacity: 1; background: currentColor; color: ${langOnText}; }
        .rh-burger { display: flex; flex-direction: column; gap: 4px; background: none; border: 0; cursor: pointer; padding: 6px; color: inherit; }
        .rh-burger span { width: 20px; height: 2px; background: currentColor; display: block; }
        .rh-mobile-panel { position: fixed; inset: 0; z-index: 999; background: rgba(8,8,9,0.98); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 26px; }
        .rh-mobile-panel a { color: #fff; text-decoration: none; font-size: 22px; font-weight: 700; letter-spacing: 0.02em; }
        .rh-mobile-panel a.active { color: ${accentColor}; }
        .rh-mobile-close { position: absolute; top: 20px; right: 20px; background: none; border: 0; color: #fff; font-size: 28px; cursor: pointer; line-height: 1; }
        .rh-mobile-lang { display: flex; gap: 10px; margin-top: 10px; }
        .rh-mobile-lang button { padding: 6px 14px; font-size: 12px; font-weight: 700; border-radius: 8px; border: 1px solid rgba(255,255,255,0.3); background: transparent; color: #fff; cursor: pointer; }
        .rh-mobile-lang button.on { background: ${accentColor}; border-color: ${accentColor}; color: ${readableOn(accentColor)}; }
        @media (min-width: 768px) {
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
