'use client'

import Link from 'next/link'
import { useState } from 'react'
import { DEMO_RESTAURANTS, type DemoTemplate } from '@/templates/_shared/demoData'

const CATEGORIES = [
  { key: 'all', label: 'Tutti', icon: '✦' },
  { key: 'fine-dining', label: 'Fine dining', icon: '☆' },
  { key: 'pizza', label: 'Pizzeria', icon: '◇' },
  { key: 'sushi', label: 'Sushi', icon: '◊' },
  { key: 'trattoria', label: 'Trattoria', icon: '◐' },
  { key: 'fast-food', label: 'Fast food', icon: '◍' },
  { key: 'ramen', label: 'Ramen', icon: '◉' },
] as const

const TEMPLATE_LABEL: Record<DemoTemplate, string> = {
  cinematico: 'Cinematico',
  bento: 'Bento',
  panoramico: 'Panoramico',
  aurora: 'Aurora',
  mercato: 'Mercato',
}

export default function PortfolioPage() {
  const [filter, setFilter] = useState<string>('all')
  const filtered = filter === 'all' ? DEMO_RESTAURANTS : DEMO_RESTAURANTS.filter(r => r.category === filter)

  return (
    <div className="lum-portfolio">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500&family=Inter:wght@300;400;500;600;700;800&display=swap');
        body { background: #0a0a0a; margin: 0; }
        .lum-portfolio {
          min-height: 100vh;
          background: #0a0a0a;
          color: #fff;
          font-family: 'Inter', system-ui, sans-serif;
          position: relative;
          overflow-x: hidden;
        }
        .lum-portfolio::before {
          content: '';
          position: fixed;
          inset: 0;
          background:
            radial-gradient(800px circle at 12% 18%, rgba(229, 45, 29, 0.08), transparent 50%),
            radial-gradient(700px circle at 88% 75%, rgba(167, 139, 250, 0.06), transparent 50%);
          pointer-events: none;
          animation: lpAurora 22s ease-in-out infinite alternate;
          z-index: 0;
        }
        @keyframes lpAurora {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(3%, -2%) scale(1.05); }
          100% { transform: translate(-2%, 3%) scale(0.98); }
        }
        .lp-content { position: relative; z-index: 1; }

        /* TOP NAV */
        .lp-nav {
          padding: 22px 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          backdrop-filter: blur(20px);
        }
        .lp-logo {
          display: inline-flex;
          align-items: baseline;
          gap: 4px;
          color: #fff;
          text-decoration: none;
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 26px;
          font-weight: 500;
          letter-spacing: -0.01em;
          line-height: 1;
        }
        .lp-logo-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #e52d1d;
          box-shadow: 0 0 12px #e52d1d;
          align-self: flex-end;
          margin-bottom: 5px;
          animation: lpDot 2.5s ease-in-out infinite;
        }
        @keyframes lpDot {
          0%, 100% { box-shadow: 0 0 12px #e52d1d, 0 0 0 0 rgba(229,45,29,0.5); }
          50% { box-shadow: 0 0 18px #e52d1d, 0 0 0 6px rgba(229,45,29,0); }
        }
        .lp-nav-links { display: flex; gap: 28px; align-items: center; }
        .lp-nav-link { color: rgba(255,255,255,0.65); text-decoration: none; font-size: 13px; font-weight: 500; transition: color 0.2s; }
        .lp-nav-link:hover { color: #fff; }
        .lp-nav-cta {
          padding: 9px 18px;
          background: #e52d1d;
          color: #fff;
          text-decoration: none;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.05em;
          border-radius: 100px;
          transition: transform 0.25s, box-shadow 0.25s;
        }
        .lp-nav-cta:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(229,45,29,0.4); }

        /* HERO */
        .lp-hero {
          padding: 6rem 2rem 4rem;
          max-width: 1300px;
          margin: 0 auto;
          text-align: center;
        }
        .lp-eyebrow {
          font-size: 12px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: #e52d1d;
          margin: 0 0 16px;
          font-weight: 600;
        }
        .lp-title {
          font-family: 'Fraunces', Georgia, serif;
          font-size: clamp(2.5rem, 6vw, 4.5rem);
          font-weight: 300;
          letter-spacing: -0.04em;
          line-height: 1.02;
          margin: 0 0 18px;
        }
        .lp-title em {
          font-style: italic;
          background: linear-gradient(135deg, #e52d1d, #a78bfa);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .lp-sub {
          color: rgba(255,255,255,0.65);
          font-size: clamp(1rem, 1.5vw, 1.15rem);
          line-height: 1.6;
          max-width: 640px;
          margin: 0 auto 32px;
        }

        /* FILTERS */
        .lp-filters {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: center;
          padding: 0 1rem 3rem;
        }
        .lp-filter {
          padding: 9px 18px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.7);
          border-radius: 100px;
          font-family: inherit;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: all 0.25s;
        }
        .lp-filter:hover {
          color: #fff;
          border-color: rgba(255,255,255,0.2);
        }
        .lp-filter.active {
          background: #fff;
          color: #0a0a0a;
          border-color: #fff;
        }

        /* GRID */
        .lp-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 22px;
          padding: 0 2rem 6rem;
          max-width: 1400px;
          margin: 0 auto;
        }
        .lp-card {
          position: relative;
          background: rgba(20, 20, 22, 0.7);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 18px;
          overflow: hidden;
          text-decoration: none;
          color: inherit;
          backdrop-filter: blur(20px);
          transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.4s, box-shadow 0.4s;
        }
        .lp-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 24px 60px rgba(0,0,0,0.3);
        }
        .lp-card-img {
          position: relative;
          aspect-ratio: 16/10;
          overflow: hidden;
        }
        .lp-card-img img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .lp-card:hover .lp-card-img img { transform: scale(1.06); }
        .lp-card-badges {
          position: absolute;
          top: 14px;
          left: 14px;
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          z-index: 2;
        }
        .lp-card-badge {
          padding: 5px 12px;
          background: rgba(0,0,0,0.65);
          backdrop-filter: blur(10px);
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          border-radius: 100px;
          border: 1px solid rgba(255,255,255,0.15);
        }
        .lp-card-info {
          padding: 22px 22px 24px;
        }
        .lp-card-cuisine {
          font-size: 10px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.45);
          margin: 0 0 8px;
          font-weight: 600;
        }
        .lp-card-name {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 22px;
          font-weight: 400;
          line-height: 1.15;
          letter-spacing: -0.02em;
          margin: 0 0 6px;
          color: #fff;
        }
        .lp-card-tagline {
          color: rgba(255,255,255,0.55);
          font-size: 13px;
          line-height: 1.5;
          margin: 0 0 16px;
          font-style: italic;
        }
        .lp-card-meta {
          display: flex;
          align-items: center;
          gap: 10px;
          padding-top: 14px;
          border-top: 1px solid rgba(255,255,255,0.06);
          font-size: 11px;
          color: rgba(255,255,255,0.5);
        }
        .lp-card-cta {
          margin-left: auto;
          color: #e52d1d;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.05em;
          transition: transform 0.3s;
        }
        .lp-card:hover .lp-card-cta {
          transform: translateX(4px);
        }

        /* BOTTOM CTA */
        .lp-bottom-cta {
          margin: 0 auto 6rem;
          max-width: 800px;
          padding: 3.5rem 2rem;
          text-align: center;
          background: linear-gradient(135deg, rgba(229,45,29,0.12), rgba(167,139,250,0.08));
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
          margin-left: 2rem;
          margin-right: 2rem;
        }
        .lp-bottom-cta h2 {
          font-family: 'Fraunces', Georgia, serif;
          font-size: clamp(1.8rem, 4vw, 2.8rem);
          font-weight: 300;
          letter-spacing: -0.03em;
          margin: 0 0 12px;
        }
        .lp-bottom-cta h2 em {
          font-style: italic;
          background: linear-gradient(135deg, #e52d1d, #a78bfa);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .lp-bottom-cta p {
          color: rgba(255,255,255,0.65);
          font-size: 15px;
          line-height: 1.6;
          margin: 0 0 24px;
        }
        .lp-bottom-cta a {
          display: inline-block;
          padding: 14px 32px;
          background: #fff;
          color: #0a0a0a;
          text-decoration: none;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          border-radius: 100px;
          transition: transform 0.25s, box-shadow 0.25s;
        }
        .lp-bottom-cta a:hover { transform: translateY(-2px); box-shadow: 0 16px 40px rgba(255,255,255,0.15); }

        @media (max-width: 768px) {
          .lp-nav { padding: 16px 18px; }
          .lp-nav-links { gap: 14px; }
          .lp-nav-link { display: none; }
          .lp-hero { padding: 3rem 1.5rem 2rem; }
          .lp-grid { padding: 0 1.5rem 4rem; gap: 16px; grid-template-columns: 1fr; }
          .lp-bottom-cta { margin-left: 1.5rem; margin-right: 1.5rem; padding: 2.5rem 1.5rem; }
        }
      `}</style>

      <div className="lp-content">
        {/* NAV */}
        <nav className="lp-nav">
          <Link href="/" className="lp-logo">
            <span>Lumino</span>
            <span className="lp-logo-dot" />
          </Link>
          <div className="lp-nav-links">
            <Link href="/portfolio" className="lp-nav-link">Portfolio</Link>
            <Link href="/pricing" className="lp-nav-link">Prezzi</Link>
            <Link href="/login" className="lp-nav-link">Accedi</Link>
            <Link href="/register" className="lp-nav-cta">Inizia gratis</Link>
          </div>
        </nav>

        {/* HERO */}
        <section className="lp-hero">
          <p className="lp-eyebrow">✦ il portfolio</p>
          <h1 className="lp-title">
            Esempi di siti<br />che <em>realizziamo</em>.
          </h1>
          <p className="lp-sub">
            Esempi di siti che potremmo realizzare per il tuo locale. Clicca su uno per vederlo dal vivo.
          </p>
        </section>

        {/* FILTERS */}
        <div className="lp-filters">
          {CATEGORIES.map(c => (
            <button
              key={c.key}
              className={`lp-filter ${filter === c.key ? 'active' : ''}`}
              onClick={() => setFilter(c.key)}
            >
              {c.icon} {c.label}
            </button>
          ))}
        </div>

        {/* GRID */}
        <div className="lp-grid">
          {filtered.map(r => (
            <Link key={r.slug} href={`/demo/${r.slug}`} className="lp-card">
              <div className="lp-card-img">
                <img src={r.data.heroImage} alt={r.data.restaurantName} loading="lazy" />
              </div>
              <div className="lp-card-info">
                <p className="lp-card-cuisine">{r.cuisine}</p>
                <h3 className="lp-card-name">{r.data.restaurantName}</h3>
                <p className="lp-card-tagline">{r.data.tagline}</p>
                <div className="lp-card-meta">
                  <span>{r.data.address?.split(',').slice(-2, -1)[0]?.trim() || '—'}</span>
                  <span className="lp-card-cta">Vedi il sito →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* BOTTOM CTA */}
        <div className="lp-bottom-cta">
          <h2>Vuoi un sito così per il tuo <em>ristorante</em>?</h2>
          <p>30 secondi per registrarti. Il primo sito è gratis.</p>
          <Link href="/register">Inizia adesso →</Link>
        </div>
      </div>
    </div>
  )
}
