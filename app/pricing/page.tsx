'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { PLANS } from '@/lib/plans'

export default function PricingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif', position: 'relative', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500&family=Inter:wght@300;400;500;600;700;800&display=swap');
        body { margin: 0; background: #0a0a0a; }
        .lp-bg::before {
          content: '';
          position: fixed; inset: 0; z-index: 0;
          background:
            radial-gradient(800px circle at 12% 18%, rgba(167,139,250,0.08), transparent 50%),
            radial-gradient(700px circle at 88% 75%, rgba(229,45,29,0.06), transparent 50%);
          pointer-events: none;
          animation: lp-aurora 22s ease-in-out infinite alternate;
        }
        @keyframes lp-aurora {
          0% { transform: translate(0,0) scale(1); }
          50% { transform: translate(3%, -2%) scale(1.05); }
          100% { transform: translate(-2%, 3%) scale(0.98); }
        }
        .lp-relative { position: relative; z-index: 1; }
        .pr-nav { padding: 22px 32px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .pr-logo { display: inline-flex; align-items: baseline; gap: 4px; color: #fff; text-decoration: none; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 26px; font-weight: 500; line-height: 1; letter-spacing: -0.01em; }
        .pr-logo-dot { width: 6px; height: 6px; border-radius: 50%; background: #e52d1d; box-shadow: 0 0 12px #e52d1d; align-self: flex-end; margin-bottom: 5px; }
        .pr-nav-links { display: flex; gap: 28px; align-items: center; }
        .pr-nav-link { color: rgba(255,255,255,0.65); text-decoration: none; font-size: 13px; font-weight: 500; transition: color 0.2s; }
        .pr-nav-link:hover { color: #fff; }
        .pr-nav-cta { padding: 9px 18px; background: #e52d1d; color: #fff; text-decoration: none; font-size: 12px; font-weight: 700; letter-spacing: 0.05em; border-radius: 100px; }
        .pr-burger { display: none; background: transparent; border: 0; padding: 8px; width: 40px; height: 40px; cursor: pointer; position: relative; z-index: 130; }
        .pr-burger span { display: block; width: 22px; height: 2px; background: #fff; margin: 5px auto; transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.25s; border-radius: 2px; }
        .pr-burger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
        .pr-burger.open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
        .pr-burger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }
        .pr-drawer { position: fixed; inset: 0; z-index: 120; background: rgba(10,10,10,0.88); backdrop-filter: blur(28px); opacity: 0; pointer-events: none; transition: opacity 0.35s cubic-bezier(0.22, 1, 0.36, 1); display: flex; align-items: center; justify-content: center; }
        .pr-drawer.open { opacity: 1; pointer-events: auto; }
        .pr-drawer-inner { display: flex; flex-direction: column; gap: 6px; width: 100%; max-width: 420px; padding: 32px; transform: translateY(20px); opacity: 0; transition: opacity 0.4s 0.05s, transform 0.4s 0.05s; }
        .pr-drawer.open .pr-drawer-inner { transform: translateY(0); opacity: 1; }
        .pr-drawer-link { padding: 18px 22px; font-family: 'Fraunces', Georgia, serif; font-size: 28px; font-weight: 400; color: #fff; text-decoration: none; border-bottom: 1px solid rgba(255,255,255,0.06); letter-spacing: -0.01em; }
        .pr-drawer-cta { margin-top: 22px; padding: 18px 24px; background: #e52d1d; color: #fff; text-decoration: none; font-size: 13px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; border-radius: 100px; text-align: center; box-shadow: 0 14px 40px rgba(229,45,29,0.4); }

        .pr-hero { padding: 5rem 2rem 3rem; max-width: 1200px; margin: 0 auto; text-align: center; }
        .pr-eyebrow { font-size: 12px; letter-spacing: 0.3em; text-transform: uppercase; color: #e52d1d; margin: 0 0 16px; font-weight: 600; }
        .pr-title { font-family: 'Fraunces', Georgia, serif; font-size: clamp(2.5rem, 6vw, 4rem); font-weight: 300; letter-spacing: -0.04em; line-height: 1.05; margin: 0 0 14px; }
        .pr-title em { font-style: italic; background: linear-gradient(135deg, #e52d1d, #a78bfa); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
        .pr-sub { color: rgba(255,255,255,0.65); font-size: clamp(1rem, 1.5vw, 1.15rem); line-height: 1.6; max-width: 640px; margin: 0 auto; }

        .pr-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
          padding: 2rem 2rem 5rem;
          max-width: 1200px;
          margin: 0 auto;
        }
        .pr-card {
          position: relative;
          background: rgba(20, 20, 22, 0.75);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 22px;
          padding: 34px 28px;
          backdrop-filter: blur(20px);
          transition: transform 0.4s, border-color 0.3s, box-shadow 0.4s;
          display: flex;
          flex-direction: column;
        }
        .pr-badge { white-space: nowrap; }
        .pr-card:hover { transform: translateY(-6px); }
        .pr-card.highlight {
          border-color: rgba(167,139,250,0.4);
          background: linear-gradient(180deg, rgba(167,139,250,0.08), rgba(20,20,22,0.75) 60%);
          box-shadow: 0 20px 60px rgba(167,139,250,0.18);
        }
        .pr-badge {
          position: absolute;
          top: -14px;
          left: 50%;
          transform: translateX(-50%);
          padding: 6px 16px;
          background: #a78bfa;
          color: #0a0a0a;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          border-radius: 100px;
          box-shadow: 0 8px 24px rgba(167,139,250,0.4);
        }
        .pr-name {
          font-family: 'Fraunces', Georgia, serif;
          font-style: italic;
          font-size: 2.4rem;
          font-weight: 400;
          color: #fff;
          letter-spacing: -0.02em;
          margin: 0 0 6px;
        }
        .pr-tagline { color: rgba(255,255,255,0.6); font-size: 13px; line-height: 1.5; margin: 0 0 26px; min-height: 40px; }
        .pr-price-row { display: flex; flex-direction: column; gap: 4px; margin-bottom: 26px; }
        .pr-price-from { font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(255,255,255,0.45); font-weight: 600; }
        .pr-price-amount { display: flex; align-items: baseline; gap: 4px; }
        .pr-price {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 4rem;
          font-weight: 400;
          line-height: 1;
          color: #fff;
          letter-spacing: -0.04em;
        }
        .pr-price-currency { font-size: 1.5rem; color: rgba(255,255,255,0.6); margin-right: 2px; }
        .pr-note {
          max-width: 760px; margin: -2rem auto 4rem; padding: 0 2rem;
          text-align: center; color: rgba(255,255,255,0.5);
          font-size: 13px; line-height: 1.6;
        }
        .pr-features { list-style: none; padding: 0; margin: 0 0 32px; flex: 1; }
        .pr-feat { display: flex; align-items: flex-start; gap: 10px; padding: 9px 0; font-size: 13.5px; line-height: 1.45; }
        .pr-feat-icon { flex-shrink: 0; width: 16px; height: 16px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-top: 2px; font-size: 11px; font-weight: 800; }
        .pr-feat.included .pr-feat-icon { background: rgba(34, 197, 94, 0.15); color: #22c55e; }
        .pr-feat.included { color: rgba(255,255,255,0.9); }
        .pr-feat.included.bold { color: #fff; font-weight: 700; }
        .pr-feat.excluded .pr-feat-icon { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.3); }
        .pr-feat.excluded { color: rgba(255,255,255,0.35); text-decoration: line-through; text-decoration-color: rgba(255,255,255,0.15); }
        .pr-cta {
          display: block;
          padding: 14px 18px;
          text-align: center;
          color: #fff;
          text-decoration: none;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          border-radius: 12px;
          transition: transform 0.25s, box-shadow 0.25s;
        }

        /* FAQ */
        .pr-faq {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem 2rem 6rem;
        }
        .pr-faq h2 {
          font-family: 'Fraunces', Georgia, serif;
          font-style: italic;
          font-size: 2.5rem;
          font-weight: 400;
          text-align: center;
          margin: 0 0 2.5rem;
        }
        .pr-faq-item {
          padding: 22px 24px;
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          margin-bottom: 12px;
        }
        .pr-faq-q { color: #fff; font-size: 16px; font-weight: 600; margin: 0 0 10px; }
        .pr-faq-a { color: rgba(255,255,255,0.65); font-size: 14px; line-height: 1.6; margin: 0; }

        @media (max-width: 900px) {
          .pr-cards { grid-template-columns: 1fr; padding: 2rem 1.5rem 4rem; gap: 24px; }
        }
        @media (max-width: 760px) {
          .pr-nav { padding: 14px 18px; }
          .pr-nav-links { display: none; }
          .pr-burger { display: block; }
          .pr-hero { padding: 4rem 1.4rem 2rem; }
          .pr-faq { padding: 1.5rem 1.4rem 5rem; }
          .pr-faq h2 { font-size: 2rem; }
        }
      `}</style>

      <div className="lp-bg" />
      <div className="lp-relative">
        <nav className="pr-nav">
          <Link href="/" className="pr-logo">
            <span>Lumino</span>
            <span className="pr-logo-dot" />
          </Link>
          <div className="pr-nav-links">
            <Link href="/portfolio" className="pr-nav-link">Portfolio</Link>
            <Link href="/pricing" className="pr-nav-link">Piani</Link>
            <Link href="/login" className="pr-nav-link">Accedi</Link>
            <Link href="/inizia" className="pr-nav-cta">Inizia ora</Link>
          </div>
          <button
            type="button"
            className={`pr-burger ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Chiudi menu' : 'Apri menu'}
            aria-expanded={menuOpen}
          >
            <span /><span /><span />
          </button>
        </nav>

        <div
          className={`pr-drawer ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(false)}
          aria-hidden={!menuOpen}
        >
          <div className="pr-drawer-inner" onClick={(e) => e.stopPropagation()}>
            <Link href="/portfolio" className="pr-drawer-link" onClick={() => setMenuOpen(false)}>Portfolio</Link>
            <Link href="/pricing" className="pr-drawer-link" onClick={() => setMenuOpen(false)}>Piani</Link>
            <Link href="/login" className="pr-drawer-link" onClick={() => setMenuOpen(false)}>Accedi</Link>
            <Link href="/inizia" className="pr-drawer-cta" onClick={() => setMenuOpen(false)}>Inizia ora →</Link>
          </div>
        </div>

        <section className="pr-hero">
          <p className="pr-eyebrow">✦ i nostri piani</p>
          <h1 className="pr-title">Scegli il piano <em>giusto</em><br />per il tuo locale.</h1>
          <p className="pr-sub">Iniziamo con il sito già pronto. Tu scegli quanto vuoi avere il controllo.</p>
        </section>

        <div className="pr-cards">
          {PLANS.map(p => (
            <div key={p.key} className={`pr-card ${p.highlight ? 'highlight' : ''}`}>
              {p.badge && <div className="pr-badge">{p.badge}</div>}
              <h3 className="pr-name">{p.name}</h3>
              <p className="pr-tagline">{p.description}</p>
              <div className="pr-price-row">
                <span className="pr-price-from">a partire da</span>
                <div className="pr-price-amount">
                  <span className="pr-price-currency">€</span>
                  <span className="pr-price">{p.priceFrom}</span>
                </div>
              </div>
              <ul className="pr-features">
                {p.features.map((label, i) => (
                  <li key={`in-${i}`} className={`pr-feat included ${i === 0 && label.startsWith('Tutto del') ? 'bold' : ''}`}>
                    <span className="pr-feat-icon">✓</span>
                    <span>{label}</span>
                  </li>
                ))}
                {p.excluded.map((label, i) => (
                  <li key={`ex-${i}`} className="pr-feat excluded">
                    <span className="pr-feat-icon">—</span>
                    <span>{label}</span>
                  </li>
                ))}
              </ul>
              <Link href="/inizia" className="pr-cta" style={{ background: p.highlight ? '#a78bfa' : p.accent === '#888' ? 'rgba(255,255,255,0.08)' : p.accent, color: p.highlight ? '#0a0a0a' : '#fff' }}>
                {p.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="pr-note">Il prezzo finale dipende dalle funzioni che ti servono. Il pagamento è in due parti: 30% all’avvio del lavoro, 70% alla consegna del sito. Tutti i prezzi sono in euro (EUR).</p>

        {/* FAQ */}
        <section className="pr-faq">
          <h2>Domande frequenti</h2>
          <div className="pr-faq-item">
            <p className="pr-faq-q">Come funziona il pagamento?</p>
            <p className="pr-faq-a">Pagamento unico, senza abbonamento. Il 30% all’avvio del lavoro, il 70% alla consegna del sito.</p>
          </div>
          <div className="pr-faq-item">
            <p className="pr-faq-q">Posso passare a un piano superiore?</p>
            <p className="pr-faq-a">Sì. Quando vuoi salire di piano, paghi solo la differenza tra i due. Le tue cose restano dove sono.</p>
          </div>
          <div className="pr-faq-item">
            <p className="pr-faq-q">Posso usare un mio dominio?</p>
            <p className="pr-faq-a">Coi piani Pro e Premium puoi usare il tuo dominio: lo colleghiamo noi al nuovo sito e il rinnovo annuale resta dove l’hai sempre pagato. Se non hai un dominio o ne vuoi uno nuovo, lo registriamo noi a tuo nome — il primo anno è incluso, dal secondo è a rinnovo annuale. Col Basic il sito è su <code>tuonome.bylumino.com</code>.</p>
          </div>
          <div className="pr-faq-item">
            <p className="pr-faq-q">Quanto ci mette il sito ad essere online?</p>
            <p className="pr-faq-a">Dal primo contatto al sito pronto: pochi giorni. Ci sentiamo per confermare i dettagli, poi pubblichiamo.</p>
          </div>
          <div className="pr-faq-item">
            <p className="pr-faq-q">Ci sono costi nascosti?</p>
            <p className="pr-faq-a">No. Il prezzo include hosting, dominio il primo anno (su Pro e Premium), aggiornamenti e supporto. Dal secondo anno il dominio è a rinnovo annuale, te lo ricordiamo prima della scadenza.</p>
          </div>
        </section>
      </div>
    </div>
  )
}
