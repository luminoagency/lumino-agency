'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { COMPANY } from '@/lib/company'

/**
 * Cornice condivisa per le pagine istituzionali e legali del sito Lumino.
 * Fornisce: sfondo aurora, nav fissa + drawer mobile, footer completo (azienda + legale),
 * stili condivisi (incluse le classi `.ls-prose` per i testi legali) e un header di pagina
 * standardizzato opzionale.
 *
 * Le pagine restano server component: importano questa cornice (client) e passano i contenuti
 * come children.
 */

export interface PageHeader {
  kicker?: string
  title: React.ReactNode
  intro?: React.ReactNode
  updated?: string
}

const NAV_LINKS = [
  { href: '/chi-siamo', label: 'Chi siamo' },
  { href: '/come-funziona', label: 'Come funziona' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/pricing', label: 'Piani' },
  { href: '/contatti', label: 'Contatti' },
]

const FOOTER_COMPANY = [
  { href: '/chi-siamo', label: 'Chi siamo' },
  { href: '/come-funziona', label: 'Come funziona' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/pricing', label: 'Piani e prezzi' },
  { href: '/faq', label: 'Domande frequenti' },
  { href: '/contatti', label: 'Contatti' },
]

const FOOTER_LEGAL = [
  { href: '/privacy-policy', label: 'Privacy Policy' },
  { href: '/cookie-policy', label: 'Cookie Policy' },
  { href: '/termini-condizioni', label: 'Termini e Condizioni' },
  { href: '/gdpr', label: 'Informativa GDPR' },
  { href: '/resi-rimborsi', label: 'Resi e Rimborsi' },
  { href: '/disclaimer', label: 'Disclaimer' },
]

export default function SiteChrome({
  children,
  header,
}: {
  children: React.ReactNode
  header?: PageHeader
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  const year = new Date().getFullYear()

  return (
    <div className="ls-root">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Inter:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; background: #0a0a0a; }

        .ls-root { position: relative; min-height: 100vh; background: #0a0a0a; color: #fff; font-family: 'Inter', system-ui, sans-serif; overflow-x: hidden; }
        .ls-root ::selection { background: rgba(229,45,29,0.35); }
        .ls-root a { color: inherit; }

        /* ── Background aurora ───────────────────────────────────────── */
        .ls-bg { position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background:
            radial-gradient(820px circle at 12% 14%, rgba(167,139,250,0.10), transparent 50%),
            radial-gradient(720px circle at 88% 78%, rgba(229,45,29,0.07), transparent 50%),
            radial-gradient(600px circle at 60% 40%, rgba(96,165,250,0.05), transparent 55%);
          animation: lsAurora 24s ease-in-out infinite alternate;
        }
        @keyframes lsAurora { 0% { transform: translate(0,0) scale(1); } 50% { transform: translate(2%,-2%) scale(1.05); } 100% { transform: translate(-2%,2%) scale(0.98); } }
        .ls-rel { position: relative; z-index: 1; }

        /* ── Nav ─────────────────────────────────────────────────────── */
        .ls-nav { position: sticky; top: 0; z-index: 100; padding: 18px 32px; display: flex; align-items: center; justify-content: space-between; background: rgba(10,10,10,0.6); backdrop-filter: blur(24px); border-bottom: 1px solid rgba(255,255,255,0.06); }
        .ls-logo { display: inline-flex; align-items: baseline; gap: 2px; color: #fff; text-decoration: none; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 27px; font-weight: 500; line-height: 1; letter-spacing: -0.01em; }
        .ls-logo-dot { width: 6px; height: 6px; border-radius: 50%; background: #e52d1d; box-shadow: 0 0 12px #e52d1d; align-self: flex-end; margin: 0 0 5px 4px; }
        .ls-nav-links { display: flex; gap: 26px; align-items: center; }
        .ls-nav-link { color: rgba(255,255,255,0.68); text-decoration: none; font-size: 13px; font-weight: 500; transition: color 0.2s; }
        .ls-nav-link:hover { color: #fff; }
        .ls-nav-cta { padding: 10px 20px; background: #fff; color: #0a0a0a; text-decoration: none; font-size: 12px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; border-radius: 100px; transition: transform 0.25s, box-shadow 0.25s; }
        .ls-nav-cta:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(255,255,255,0.18); }

        .ls-burger { display: none; background: transparent; border: 0; padding: 8px; width: 40px; height: 40px; cursor: pointer; position: relative; z-index: 130; }
        .ls-burger span { display: block; width: 22px; height: 2px; background: #fff; margin: 5px auto; transition: transform 0.35s cubic-bezier(0.22,1,0.36,1), opacity 0.25s; border-radius: 2px; }
        .ls-burger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
        .ls-burger.open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
        .ls-burger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

        .ls-drawer { position: fixed; inset: 0; z-index: 120; background: rgba(10,10,10,0.9); backdrop-filter: blur(28px); opacity: 0; pointer-events: none; transition: opacity 0.35s cubic-bezier(0.22,1,0.36,1); display: flex; align-items: center; justify-content: center; }
        .ls-drawer.open { opacity: 1; pointer-events: auto; }
        .ls-drawer-inner { display: flex; flex-direction: column; gap: 4px; width: 100%; max-width: 420px; padding: 32px; transform: translateY(20px); opacity: 0; transition: opacity 0.4s 0.05s, transform 0.4s 0.05s; }
        .ls-drawer.open .ls-drawer-inner { transform: translateY(0); opacity: 1; }
        .ls-drawer-link { padding: 16px 20px; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 26px; font-style: italic; font-weight: 400; color: #fff; text-decoration: none; border-bottom: 1px solid rgba(255,255,255,0.06); letter-spacing: -0.01em; }
        .ls-drawer-cta { margin-top: 22px; padding: 16px 24px; background: linear-gradient(135deg,#e52d1d,#c9241a); color: #fff; text-decoration: none; font-size: 13px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; border-radius: 100px; text-align: center; box-shadow: 0 14px 40px rgba(229,45,29,0.4); }

        /* ── Page header ─────────────────────────────────────────────── */
        .ls-container { max-width: 920px; margin: 0 auto; padding: 0 2rem; }
        .ls-container-wide { max-width: 1200px; margin: 0 auto; padding: 0 2rem; }
        .ls-page-head { max-width: 920px; margin: 0 auto; padding: 4.5rem 2rem 2rem; }
        .ls-kicker { font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase; color: #e52d1d; font-weight: 600; margin: 0 0 16px; }
        .ls-h1 { font-family: 'Cormorant Garamond', Georgia, serif; font-size: clamp(2.4rem, 6vw, 4rem); font-weight: 400; letter-spacing: -0.035em; line-height: 1.04; margin: 0 0 18px; color: #fff; }
        .ls-h1 em { font-style: italic; background: linear-gradient(135deg,#e52d1d,#a78bfa); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
        .ls-lead { color: rgba(255,255,255,0.7); font-size: clamp(1.02rem, 1.6vw, 1.2rem); line-height: 1.65; max-width: 680px; margin: 0; font-weight: 300; }
        .ls-updated { margin: 18px 0 0; font-size: 12.5px; color: rgba(255,255,255,0.4); }

        /* ── Prose (legal text) ──────────────────────────────────────── */
        .ls-prose { padding: 1rem 0 5rem; color: rgba(255,255,255,0.74); font-size: 15px; line-height: 1.75; }
        .ls-prose h2 { font-family: 'Cormorant Garamond', Georgia, serif; font-size: clamp(1.5rem, 3vw, 2rem); font-weight: 500; color: #fff; letter-spacing: -0.02em; margin: 2.6rem 0 0.9rem; }
        .ls-prose h3 { font-size: 1.05rem; font-weight: 700; color: #fff; margin: 1.8rem 0 0.6rem; }
        .ls-prose p { margin: 0 0 1rem; }
        .ls-prose ul, .ls-prose ol { margin: 0 0 1.1rem; padding-left: 1.2rem; }
        .ls-prose li { margin: 0 0 0.5rem; }
        .ls-prose a { color: #a78bfa; text-decoration: underline; text-underline-offset: 2px; }
        .ls-prose a:hover { color: #fff; }
        .ls-prose strong { color: #fff; font-weight: 600; }
        .ls-prose code { background: rgba(255,255,255,0.07); padding: 2px 6px; border-radius: 6px; font-size: 0.9em; }
        .ls-prose hr { border: 0; border-top: 1px solid rgba(255,255,255,0.08); margin: 2.2rem 0; }
        .ls-note { margin-top: 2.4rem; padding: 18px 22px; background: rgba(167,139,250,0.06); border: 1px solid rgba(167,139,250,0.18); border-radius: 14px; font-size: 13.5px; color: rgba(255,255,255,0.7); }

        /* table for legal pages */
        .ls-table { width: 100%; border-collapse: collapse; margin: 0.5rem 0 1.4rem; font-size: 13.5px; }
        .ls-table th, .ls-table td { text-align: left; padding: 10px 12px; border: 1px solid rgba(255,255,255,0.1); vertical-align: top; }
        .ls-table th { background: rgba(255,255,255,0.04); color: #fff; font-weight: 600; }

        /* ── Generic content cards (for company pages) ───────────────── */
        .ls-grid { display: grid; gap: 18px; }
        .ls-grid-2 { grid-template-columns: repeat(2, 1fr); }
        .ls-grid-3 { grid-template-columns: repeat(3, 1fr); }
        .ls-grid-4 { grid-template-columns: repeat(4, 1fr); }
        .ls-card { padding: 28px 24px; background: rgba(20,20,22,0.6); border: 1px solid rgba(255,255,255,0.07); border-radius: 18px; backdrop-filter: blur(16px); }
        .ls-card h3 { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 1.5rem; font-style: italic; font-weight: 400; color: #fff; margin: 0 0 10px; }
        .ls-card p { color: rgba(255,255,255,0.62); font-size: 14px; line-height: 1.6; margin: 0; }
        .ls-card-n { font-family: 'Cormorant Garamond', Georgia, serif; font-style: italic; font-size: 2.8rem; line-height: 1; background: linear-gradient(135deg,#e52d1d,#a78bfa); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 14px; }
        .ls-section { padding: 3rem 0; }
        .ls-section-title { font-family: 'Cormorant Garamond', Georgia, serif; font-size: clamp(1.8rem, 4vw, 2.8rem); font-weight: 400; letter-spacing: -0.03em; color: #fff; margin: 0 0 12px; }
        .ls-section-title em { font-style: italic; background: linear-gradient(135deg,#e52d1d,#a78bfa); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
        .ls-btn { display: inline-flex; align-items: center; gap: 8px; padding: 15px 30px; border-radius: 100px; text-decoration: none; font-size: 13px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; transition: transform 0.25s, box-shadow 0.25s; }
        .ls-btn-primary { background: linear-gradient(135deg,#e52d1d,#c9241a); color: #fff; box-shadow: 0 14px 40px rgba(229,45,29,0.4); }
        .ls-btn-primary:hover { transform: translateY(-3px); box-shadow: 0 20px 48px rgba(229,45,29,0.5); }
        .ls-btn-secondary { background: rgba(255,255,255,0.05); color: #fff; border: 1px solid rgba(255,255,255,0.18); }
        .ls-btn-secondary:hover { background: rgba(255,255,255,0.1); transform: translateY(-3px); }

        /* ── Footer ──────────────────────────────────────────────────── */
        .ls-footer { border-top: 1px solid rgba(255,255,255,0.07); margin-top: 2rem; }
        .ls-footer-top { max-width: 1200px; margin: 0 auto; padding: 3.5rem 2rem 2.5rem; display: grid; grid-template-columns: 1.6fr 1fr 1fr 1fr; gap: 40px; }
        .ls-footer-brand-logo { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 26px; color: #fff; font-weight: 500; }
        .ls-footer-brand p { color: rgba(255,255,255,0.5); font-size: 13px; line-height: 1.6; margin: 14px 0 0; max-width: 280px; }
        .ls-footer-col h4 { font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(255,255,255,0.4); font-weight: 700; margin: 0 0 16px; }
        .ls-footer-col a { display: block; color: rgba(255,255,255,0.62); text-decoration: none; font-size: 13.5px; padding: 5px 0; transition: color 0.2s; }
        .ls-footer-col a:hover { color: #fff; }
        .ls-footer-bottom { border-top: 1px solid rgba(255,255,255,0.06); }
        .ls-footer-bottom-in { max-width: 1200px; margin: 0 auto; padding: 1.5rem 2rem; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px; color: rgba(255,255,255,0.4); font-size: 12px; }
        .ls-footer-bottom-in a { color: rgba(255,255,255,0.5); text-decoration: none; }
        .ls-footer-bottom-in a:hover { color: #fff; }

        @media (max-width: 900px) {
          .ls-grid-2, .ls-grid-3, .ls-grid-4 { grid-template-columns: 1fr; }
          .ls-footer-top { grid-template-columns: 1fr 1fr; gap: 28px; }
        }
        @media (max-width: 760px) {
          .ls-nav { padding: 14px 18px; }
          .ls-nav-links { display: none; }
          .ls-burger { display: block; }
          .ls-page-head { padding: 3rem 1.4rem 1.5rem; }
          .ls-container, .ls-container-wide { padding: 0 1.4rem; }
          .ls-footer-top { grid-template-columns: 1fr; }
          .ls-footer-bottom-in { flex-direction: column; }
        }
      ` }} />

      <div className="ls-bg" />

      <div className="ls-rel">
        {/* NAV */}
        <nav className="ls-nav">
          <Link href="/" className="ls-logo">
            <span>Lumino</span>
            <span className="ls-logo-dot" />
          </Link>
          <div className="ls-nav-links">
            {NAV_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="ls-nav-link">
                {l.label}
              </Link>
            ))}
            <Link href="/inizia" className="ls-nav-cta">
              Inizia ora
            </Link>
          </div>
          <button
            type="button"
            className={`ls-burger ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? 'Chiudi menu' : 'Apri menu'}
            aria-expanded={menuOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </nav>

        {/* MOBILE DRAWER */}
        <div
          className={`ls-drawer ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(false)}
          aria-hidden={!menuOpen}
        >
          <div className="ls-drawer-inner" onClick={(e) => e.stopPropagation()}>
            {NAV_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="ls-drawer-link" onClick={() => setMenuOpen(false)}>
                {l.label}
              </Link>
            ))}
            <Link href="/login" className="ls-drawer-link" onClick={() => setMenuOpen(false)}>
              Accedi
            </Link>
            <Link href="/inizia" className="ls-drawer-cta" onClick={() => setMenuOpen(false)}>
              Inizia ora →
            </Link>
          </div>
        </div>

        {/* OPTIONAL STANDARD HEADER */}
        {header && (
          <header className="ls-page-head">
            {header.kicker && <p className="ls-kicker">{header.kicker}</p>}
            <h1 className="ls-h1">{header.title}</h1>
            {header.intro && <p className="ls-lead">{header.intro}</p>}
            {header.updated && <p className="ls-updated">Ultimo aggiornamento: {header.updated}</p>}
          </header>
        )}

        {/* PAGE CONTENT */}
        <main>{children}</main>

        {/* FOOTER */}
        <footer className="ls-footer">
          <div className="ls-footer-top">
            <div className="ls-footer-brand">
              <div className="ls-footer-brand-logo">
                Lumino<span style={{ color: '#e52d1d' }}>.</span>
              </div>
              <p>
                Siti professionali su misura per ristoranti e attività locali, curati nei
                minimi dettagli e pronti in pochi giorni.
              </p>
            </div>
            <div className="ls-footer-col">
              <h4>Azienda</h4>
              {FOOTER_COMPANY.map((l) => (
                <Link key={l.href} href={l.href}>
                  {l.label}
                </Link>
              ))}
            </div>
            <div className="ls-footer-col">
              <h4>Legale</h4>
              {FOOTER_LEGAL.map((l) => (
                <Link key={l.href} href={l.href}>
                  {l.label}
                </Link>
              ))}
            </div>
            <div className="ls-footer-col">
              <h4>Contatti</h4>
              <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
              <Link href="/login">Accedi</Link>
              <Link href="/inizia">Crea il tuo sito</Link>
            </div>
          </div>
          <div className="ls-footer-bottom">
            <div className="ls-footer-bottom-in">
              <div>
                © {year} Lumino — un brand di {COMPANY.legalName}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
