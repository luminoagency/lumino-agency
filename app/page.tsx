'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { DEMO_RESTAURANTS } from '@/templates/_shared/demoData'
import { PLANS, SALES_TERMS } from '@/lib/plans'
import { COMPANY } from '@/lib/company'

/* IntersectionObserver hook for scroll-triggered reveal */
function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add('lm-in'); obs.unobserve(el) } },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return ref
}

function Reveal({ children, dir = 'up', delay = 0, as = 'div' }: { children: React.ReactNode; dir?: 'up' | 'left' | 'right' | 'scale'; delay?: number; as?: any }) {
  const ref = useReveal<HTMLDivElement>()
  const Tag = as
  return (
    <Tag ref={ref} className={`lm-reveal lm-r-${dir}`} style={{ transitionDelay: `${delay}s` }}>
      {children}
    </Tag>
  )
}

export default function HomePage() {
  const [cursor, setCursor] = useState({ x: -1000, y: -1000 })
  const [scrollY, setScrollY] = useState(0)
  const [winSize, setWinSize] = useState({ w: 1280, h: 800 })
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (menuOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  useEffect(() => {
    const onMove = (e: MouseEvent) => setCursor({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      raf = requestAnimationFrame(() => setScrollY(window.scrollY))
    }
    const onResize = () => setWinSize({ w: window.innerWidth, h: window.innerHeight })
    onResize()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(raf)
    }
  }, [])

  const showcase = DEMO_RESTAURANTS.slice(0, 4)
  const tiltX = (cursor.x - winSize.w / 2) * 0.012
  const tiltY = (cursor.y - winSize.h / 2) * 0.012

  // Giant "Lumino" mark scroll progress (appears around 80vh, fixed in middle)
  const markProgress = Math.max(0, Math.min(1, (scrollY - winSize.h * 0.6) / (winSize.h * 1.0)))
  const markVisible = markProgress > 0.15 && markProgress < 0.85
  const markScale = 0.6 + Math.min(1, markProgress * 1.5) * 0.7

  return (
    <div className="lm-home">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500&family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; background: #050505; color: #fff; font-family: 'Inter', system-ui, sans-serif; overflow-x: hidden; }
        ::selection { background: rgba(229, 45, 29, 0.35); }

        .lm-home { position: relative; min-height: 100vh; overflow-x: hidden; }

        /* ─── Multi-layer animated aurora background ─────────────────────── */
        .lm-aurora { position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }
        .lm-aurora-blob { position: absolute; border-radius: 50%; filter: blur(120px); opacity: 0.55; will-change: transform; }
        .lm-blob-1 { width: 700px; height: 700px; background: radial-gradient(circle, #e52d1d 0%, transparent 70%); top: -200px; left: -150px; animation: lmFloat1 24s ease-in-out infinite alternate; }
        .lm-blob-2 { width: 600px; height: 600px; background: radial-gradient(circle, #a78bfa 0%, transparent 70%); bottom: -180px; right: -120px; animation: lmFloat2 30s ease-in-out infinite alternate; }
        .lm-blob-3 { width: 500px; height: 500px; background: radial-gradient(circle, #60a5fa 0%, transparent 70%); top: 40%; left: 50%; transform: translate(-50%, -50%); opacity: 0.35; animation: lmFloat3 26s ease-in-out infinite alternate; }
        @keyframes lmFloat1 { 0% { transform: translate(0,0) scale(1); } 100% { transform: translate(15vw, 10vh) scale(1.2); } }
        @keyframes lmFloat2 { 0% { transform: translate(0,0) scale(1); } 100% { transform: translate(-12vw, -8vh) scale(0.9); } }
        @keyframes lmFloat3 { 0% { transform: translate(-50%, -50%) scale(1); } 100% { transform: translate(-30%, -70%) scale(1.15); } }

        /* Floating particles */
        .lm-particles { position: fixed; inset: 0; z-index: 1; pointer-events: none; }
        .lm-particle { position: absolute; width: 2px; height: 2px; background: rgba(255,255,255,0.7); border-radius: 50%; box-shadow: 0 0 8px rgba(255,255,255,0.5); animation: lmRise 16s linear infinite; }
        @keyframes lmRise { 0% { transform: translateY(100vh) scale(0); opacity: 0; } 10% { opacity: 0.9; } 90% { opacity: 0.9; } 100% { transform: translateY(-10vh) scale(1.4); opacity: 0; } }

        /* Cursor light */
        .lm-cursor-light { position: fixed; width: 600px; height: 600px; border-radius: 50%; background: radial-gradient(circle, rgba(229, 45, 29, 0.2) 0%, transparent 60%); pointer-events: none; z-index: 2; transform: translate(-50%, -50%); mix-blend-mode: screen; will-change: transform; }
        @media (max-width: 768px) { .lm-cursor-light { display: none; } }

        /* Giant Lumino mark that appears in middle while scrolling */
        .lm-giant-mark {
          position: fixed;
          inset: 0;
          z-index: 3;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .lm-giant-mark.show { opacity: 1; }
        .lm-giant-mark-text {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(8rem, 24vw, 22rem);
          font-weight: 400;
          letter-spacing: -0.05em;
          line-height: 0.85;
          background: linear-gradient(135deg, rgba(229,45,29,0.18), rgba(167,139,250,0.18) 50%, rgba(96,165,250,0.18));
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          text-align: center;
          will-change: transform;
        }
        .lm-giant-mark-dot {
          color: rgba(229,45,29,0.4);
          font-size: 0.45em;
          margin-left: 0.1em;
          vertical-align: bottom;
        }

        .lm-content { position: relative; z-index: 10; }

        /* ─── NAV ──────────────────────────────────────────────────────── */
        .lm-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          padding: 18px 32px;
          display: flex; align-items: center; justify-content: space-between;
          background: rgba(5, 5, 5, 0.55);
          backdrop-filter: blur(24px);
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .lm-logo {
          display: inline-flex; align-items: baseline; gap: 4px;
          color: #fff; text-decoration: none;
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 28px; font-weight: 500; letter-spacing: -0.01em; line-height: 1;
        }
        .lm-logo-dot {
          width: 6px; height: 6px; border-radius: 50%; background: #e52d1d;
          box-shadow: 0 0 14px #e52d1d;
          margin-left: 4px; align-self: flex-end; margin-bottom: 6px;
          animation: lmPulse 2.5s ease-in-out infinite;
        }
        @keyframes lmPulse { 0%, 100% { box-shadow: 0 0 14px #e52d1d, 0 0 0 0 rgba(229,45,29,0.5); } 50% { box-shadow: 0 0 22px #e52d1d, 0 0 0 8px rgba(229,45,29,0); } }
        .lm-nav-links { display: flex; gap: 28px; align-items: center; }
        .lm-nav-link { color: rgba(255,255,255,0.7); text-decoration: none; font-size: 13px; font-weight: 500; transition: color 0.2s; position: relative; }
        .lm-nav-link::after { content: ''; position: absolute; bottom: -4px; left: 0; right: 0; height: 1px; background: #fff; transform: scaleX(0); transform-origin: center; transition: transform 0.3s; }
        .lm-nav-link:hover { color: #fff; }
        .lm-nav-link:hover::after { transform: scaleX(1); }
        .lm-nav-cta {
          padding: 10px 22px; background: #fff; color: #050505;
          text-decoration: none; font-size: 12px; font-weight: 700;
          letter-spacing: 0.08em; text-transform: uppercase;
          border-radius: 100px; transition: transform 0.25s, box-shadow 0.25s;
          position: relative; overflow: hidden;
        }
        .lm-nav-cta::before { content: ''; position: absolute; inset: 0; background: linear-gradient(120deg, transparent, rgba(229,45,29,0.4), transparent); transform: translateX(-100%); transition: transform 0.5s; }
        .lm-nav-cta:hover { transform: translateY(-2px); box-shadow: 0 14px 40px rgba(255,255,255,0.2); }
        .lm-nav-cta:hover::before { transform: translateX(100%); }

        /* Hamburger */
        .lm-burger {
          display: none;
          background: transparent; border: 0; padding: 8px;
          width: 40px; height: 40px;
          cursor: pointer; position: relative; z-index: 130;
        }
        .lm-burger span {
          display: block; width: 22px; height: 2px;
          background: #fff; margin: 5px auto;
          transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.25s;
          border-radius: 2px;
        }
        .lm-burger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
        .lm-burger.open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
        .lm-burger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

        /* Mobile drawer */
        .lm-drawer {
          position: fixed; inset: 0; z-index: 120;
          background: rgba(5, 5, 5, 0.85);
          backdrop-filter: blur(28px);
          opacity: 0; pointer-events: none;
          transition: opacity 0.35s cubic-bezier(0.22, 1, 0.36, 1);
          display: flex; align-items: center; justify-content: center;
        }
        .lm-drawer.open { opacity: 1; pointer-events: auto; }
        .lm-drawer-inner {
          display: flex; flex-direction: column; gap: 6px;
          width: 100%; max-width: 420px; padding: 32px;
          transform: translateY(20px); opacity: 0;
          transition: opacity 0.4s 0.05s, transform 0.4s 0.05s;
        }
        .lm-drawer.open .lm-drawer-inner { transform: translateY(0); opacity: 1; }
        .lm-drawer-link {
          padding: 18px 22px;
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 28px; font-style: italic; font-weight: 400;
          color: #fff; text-decoration: none;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          letter-spacing: -0.01em;
        }
        .lm-drawer-cta {
          margin-top: 22px; padding: 18px 24px;
          background: linear-gradient(135deg, #e52d1d, #c9241a);
          color: #fff; text-decoration: none;
          font-size: 13px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
          border-radius: 100px; text-align: center;
          box-shadow: 0 14px 40px rgba(229,45,29,0.4);
        }

        /* How it works */
        .lm-howit {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; margin-top: 50px;
        }
        .lm-howit-card {
          padding: 32px 26px;
          background: rgba(20,20,22,0.5);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 18px;
          backdrop-filter: blur(20px);
          height: 100%; box-sizing: border-box;
        }
        .lm-howit-n {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-style: italic; font-size: 3.6rem;
          background: linear-gradient(135deg, #e52d1d, #a78bfa);
          -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
          line-height: 1; margin-bottom: 18px;
        }
        .lm-howit-t {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 1.5rem; font-style: italic; color: #fff;
          margin: 0 0 10px; font-weight: 400;
        }
        .lm-howit-p { color: rgba(255,255,255,0.6); font-size: 13.5px; line-height: 1.6; margin: 0; }

        /* ─── REVEAL animations ────────────────────────────────────────── */
        .lm-reveal {
          opacity: 1;
          transform: translate(0, 0) scale(1);
          transition: opacity 1.0s cubic-bezier(0.22, 1, 0.36, 1), transform 1.0s cubic-bezier(0.22, 1, 0.36, 1);
          will-change: opacity, transform;
        }
        .lm-reveal.lm-in { opacity: 1; transform: translate(0, 0) scale(1); }

        /* ─── HERO ─────────────────────────────────────────────────────── */
        .lm-hero {
          padding: 11rem 2rem 5rem;
          max-width: 1300px; margin: 0 auto; text-align: center;
          position: relative; perspective: 1200px;
        }
        .lm-hero-eyebrow {
          display: inline-flex; align-items: center; gap: 10px;
          padding: 8px 18px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 100px;
          color: rgba(255,255,255,0.85);
          font-size: 11px; letter-spacing: 0.25em; text-transform: uppercase; font-weight: 600;
          margin-bottom: 32px; backdrop-filter: blur(20px);
          animation: lmEyebrowIn 1.2s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both;
        }
        @keyframes lmEyebrowIn { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: translateY(0); } }
        .lm-hero-eyebrow-dot { width: 7px; height: 7px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 12px #22c55e; animation: lmPulseGreen 2s ease-in-out infinite; }
        @keyframes lmPulseGreen { 0%, 100% { box-shadow: 0 0 12px #22c55e, 0 0 0 0 rgba(34,197,94,0.5); } 50% { box-shadow: 0 0 18px #22c55e, 0 0 0 8px rgba(34,197,94,0); } }

        .lm-hero-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(3.5rem, 11vw, 9rem);
          font-weight: 400; letter-spacing: -0.04em; line-height: 0.95;
          margin: 0 0 20px; color: #fff;
          transform-style: preserve-3d;
          animation: lmTitleIn 1.6s cubic-bezier(0.22, 1, 0.36, 1) 0.25s both;
        }
        @keyframes lmTitleIn { from { opacity: 0; transform: translateY(40px) rotateX(-10deg); } to { opacity: 1; transform: translateY(0) rotateX(0); } }
        .lm-hero-title em {
          font-style: italic;
          background: linear-gradient(120deg, #e52d1d 0%, #a78bfa 50%, #60a5fa 100%);
          background-size: 200% auto;
          -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
          animation: lmGradient 6s ease infinite;
        }
        @keyframes lmGradient { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        .lm-hero-sub {
          color: rgba(255,255,255,0.7);
          font-size: clamp(1.05rem, 1.7vw, 1.35rem);
          line-height: 1.5; max-width: 680px; margin: 0 auto 36px;
          font-weight: 300;
          animation: lmFadeUp 1.4s cubic-bezier(0.22, 1, 0.36, 1) 0.55s both;
        }
        @keyframes lmFadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

        .lm-hero-cta-row { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; animation: lmFadeUp 1.4s cubic-bezier(0.22, 1, 0.36, 1) 0.75s both; }
        .lm-cta {
          position: relative; padding: 18px 36px; text-decoration: none;
          font-size: 13px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
          border-radius: 100px; overflow: hidden;
          transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.3s;
          z-index: 1; display: inline-flex; align-items: center; gap: 10px; backdrop-filter: blur(8px); will-change: transform;
        }
        .lm-cta-primary {
          background: linear-gradient(135deg, #e52d1d 0%, #c9241a 100%);
          color: #fff;
          box-shadow: 0 14px 40px rgba(229,45,29,0.45), inset 0 1px 0 rgba(255,255,255,0.2);
        }
        .lm-cta-primary::before { content: ''; position: absolute; inset: 0; background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.3), transparent 70%); transform: translateX(-100%); transition: transform 0.6s; }
        .lm-cta-primary:hover { transform: translateY(-4px) scale(1.02); box-shadow: 0 24px 50px rgba(229,45,29,0.55); }
        .lm-cta-primary:hover::before { transform: translateX(100%); }
        .lm-cta-secondary { background: rgba(255,255,255,0.04); color: #fff; border: 1px solid rgba(255,255,255,0.18); }
        .lm-cta-secondary:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.4); transform: translateY(-3px); }

        /* ─── SCROLL SECTIONS ──────────────────────────────────────────── */
        .lm-section {
          padding: 7rem 2rem;
          max-width: 1300px;
          margin: 0 auto;
          position: relative;
        }
        .lm-section-eyebrow { font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase; color: #e52d1d; font-weight: 600; margin: 0 0 18px; }
        .lm-section-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(2.4rem, 5.5vw, 4.5rem);
          font-weight: 400; letter-spacing: -0.035em; line-height: 1.04;
          margin: 0 0 20px; color: #fff;
        }
        .lm-section-title em { font-style: italic; background: linear-gradient(135deg, #e52d1d, #a78bfa); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
        .lm-section-sub { color: rgba(255,255,255,0.65); font-size: clamp(1rem, 1.5vw, 1.18rem); line-height: 1.6; max-width: 660px; font-weight: 300; }

        /* ─── BIG SPLIT (alternating left/right) ───────────────────────── */
        .lm-split { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; margin-top: 40px; }
        .lm-split.flip { direction: rtl; }
        .lm-split.flip > * { direction: ltr; }
        .lm-split-text h3 {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(2rem, 3.6vw, 3.2rem); font-weight: 400; font-style: italic;
          line-height: 1.05; letter-spacing: -0.025em; color: #fff; margin: 0 0 18px;
        }
        .lm-split-text h3 em { background: linear-gradient(135deg, #e52d1d, #a78bfa); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
        .lm-split-text p { color: rgba(255,255,255,0.65); font-size: 16px; line-height: 1.7; margin: 0 0 12px; }
        .lm-split-text ul { padding: 0; margin: 16px 0 0; list-style: none; }
        .lm-split-text li { padding: 8px 0 8px 28px; position: relative; color: rgba(255,255,255,0.85); font-size: 14.5px; line-height: 1.5; }
        .lm-split-text li::before { content: '✦'; position: absolute; left: 0; color: #e52d1d; font-size: 14px; top: 9px; }

        .lm-split-visual {
          position: relative;
          border-radius: 24px;
          overflow: hidden;
          aspect-ratio: 4/5;
          box-shadow: 0 30px 60px rgba(0,0,0,0.4);
          background: #111;
          transform-style: preserve-3d;
          transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .lm-split-visual:hover { transform: rotateY(-4deg) rotateX(2deg) translateY(-6px); }
        .lm-split-visual img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.8s; }
        .lm-split-visual:hover img { transform: scale(1.06); }
        .lm-split-visual::after { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.6)); }
        .lm-split-visual-tag {
          position: absolute; top: 20px; left: 20px;
          padding: 6px 14px; background: rgba(0,0,0,0.6); backdrop-filter: blur(12px);
          font-size: 10px; letter-spacing: 0.25em; text-transform: uppercase; color: #fff; font-weight: 700;
          border-radius: 100px; border: 1px solid rgba(255,255,255,0.15); z-index: 2;
        }

        /* ─── PRICING TEASER ──────────────────────────────────────────── */
        .lm-pricing {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;
          margin-top: 40px; perspective: 1500px;
        }
        .lm-pcard {
          display: flex; flex-direction: column;
          padding: 32px 28px;
          background: rgba(20, 20, 22, 0.7);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 22px;
          backdrop-filter: blur(20px);
          position: relative;
          transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.4s, box-shadow 0.5s;
          text-decoration: none; color: inherit;
        }
        .lm-pcard:hover { transform: translateY(-8px) rotateX(2deg); }
        .lm-pcard.highlight {
          border-color: rgba(167,139,250,0.4);
          background: linear-gradient(180deg, rgba(167,139,250,0.08), rgba(20,20,22,0.7) 60%);
          box-shadow: 0 20px 50px rgba(167,139,250,0.15);
        }
        .lm-pcard-badge {
          position: absolute; top: -12px; left: 50%; transform: translateX(-50%);
          white-space: nowrap;
          padding: 5px 14px; background: #a78bfa; color: #050505;
          font-size: 10px; font-weight: 800; letter-spacing: 0.18em; text-transform: uppercase;
          border-radius: 100px;
          box-shadow: 0 6px 18px rgba(167,139,250,0.35);
        }
        .lm-pcard-name {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-style: italic; font-size: 2.2rem; font-weight: 400;
          color: #fff; letter-spacing: -0.02em; margin: 0 0 8px;
        }
        .lm-pcard-tag { color: rgba(255,255,255,0.55); font-size: 13px; line-height: 1.5; margin: 0 0 20px; min-height: 40px; }
        .lm-pcard-price-row { display: flex; flex-direction: column; gap: 4px; margin-bottom: 22px; }
        .lm-pcard-period-top { font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(255,255,255,0.45); font-weight: 700; }
        .lm-pcard-price-amount { display: flex; align-items: baseline; gap: 4px; }
        .lm-pcard-currency { font-size: 1.2rem; color: rgba(255,255,255,0.55); }
        .lm-pcard-price {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 3rem; font-weight: 400; line-height: 1; color: #fff; letter-spacing: -0.04em;
        }
        .lm-pcard-badge { white-space: nowrap; }
        .lm-pricing-note {
          max-width: 720px; margin: 36px auto 0;
          text-align: center; color: rgba(255,255,255,0.45);
          font-size: 12.5px; line-height: 1.6;
        }
        .lm-pcard-features { list-style: none; padding: 0; margin: 0 0 22px; }
        .lm-pcard-feat { padding: 7px 0; font-size: 13.5px; color: rgba(255,255,255,0.85); display: flex; gap: 8px; }
        .lm-pcard-feat::before { content: '✓'; color: #22c55e; font-weight: 700; flex-shrink: 0; }
        .lm-pcard-link { display: block; margin-top: auto; text-align: center; color: rgba(255,255,255,0.7); font-size: 12px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; padding: 12px; border: 1px solid rgba(255,255,255,0.15); border-radius: 12px; transition: all 0.25s; }
        .lm-pcard.highlight .lm-pcard-link { background: #a78bfa; color: #050505; border-color: #a78bfa; }
        .lm-pcard-link:hover { background: #fff; color: #050505; border-color: #fff; }

        /* ─── PORTFOLIO showcase ──────────────────────────────────────── */
        .lm-portfolio {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;
          margin-top: 50px; perspective: 1500px;
        }
        .lm-portfolio-card {
          position: relative; aspect-ratio: 4/5;
          border-radius: 20px; overflow: hidden;
          text-decoration: none; color: #fff; background: #111;
          box-shadow: 0 12px 32px rgba(0,0,0,0.4);
          transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.5s;
          transform-style: preserve-3d;
        }
        .lm-portfolio-card:hover { transform: translateY(-12px) rotateX(3deg) rotateY(-2deg); box-shadow: 0 30px 70px rgba(229,45,29,0.3); }
        .lm-portfolio-card img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.8s cubic-bezier(0.22, 1, 0.36, 1); }
        .lm-portfolio-card:hover img { transform: scale(1.1); }
        .lm-portfolio-card::after { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.92) 100%); }
        .lm-portfolio-info { position: absolute; bottom: 22px; left: 22px; right: 22px; z-index: 2; }
        .lm-portfolio-cuisine { font-size: 9.5px; letter-spacing: 0.3em; text-transform: uppercase; color: rgba(255,255,255,0.8); margin: 0 0 6px; font-weight: 600; }
        .lm-portfolio-name { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 1.5rem; font-weight: 400; margin: 0; color: #fff; letter-spacing: -0.01em; font-style: italic; }
        .lm-portfolio-all { text-align: center; margin-top: 44px; }
        .lm-portfolio-all a { color: rgba(255,255,255,0.75); text-decoration: none; font-size: 13px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; padding: 14px 28px; border: 1px solid rgba(255,255,255,0.18); border-radius: 100px; transition: all 0.3s; }
        .lm-portfolio-all a:hover { color: #fff; border-color: #fff; background: rgba(255,255,255,0.05); transform: translateY(-2px); }

        /* ─── FINAL CTA ────────────────────────────────────────────────── */
        .lm-final { padding: 9rem 2rem; text-align: center; max-width: 900px; margin: 0 auto; position: relative; }
        .lm-final::before {
          content: ''; position: absolute; top: 0; left: -10%; right: -10%; bottom: 0;
          background: radial-gradient(circle at 50% 50%, rgba(229,45,29,0.18), transparent 60%), radial-gradient(circle at 30% 70%, rgba(167,139,250,0.12), transparent 50%);
          z-index: -1; pointer-events: none;
        }
        .lm-final h2 { font-family: 'Cormorant Garamond', Georgia, serif; font-size: clamp(2.8rem, 7vw, 5.5rem); font-weight: 400; letter-spacing: -0.04em; line-height: 1.0; margin: 0 0 26px; }
        .lm-final h2 em { font-style: italic; background: linear-gradient(135deg, #e52d1d, #a78bfa); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
        .lm-final p { color: rgba(255,255,255,0.7); font-size: clamp(1.05rem, 1.6vw, 1.25rem); line-height: 1.5; margin: 0 0 40px; font-weight: 300; }

        /* ─── FOOTER ───────────────────────────────────────────────────── */
        .lm-footer {
          border-top: 1px solid rgba(255,255,255,0.06);
          padding: 3rem 2rem; max-width: 1300px; margin: 0 auto;
          display: flex; justify-content: space-between; flex-wrap: wrap; gap: 24px;
          color: rgba(255,255,255,0.45); font-size: 12px; align-items: center;
        }
        .lm-footer-logo { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 22px; color: rgba(255,255,255,0.85); font-weight: 500; }
        .lm-footer-links { display: flex; gap: 24px; }
        .lm-footer-link { color: rgba(255,255,255,0.55); text-decoration: none; transition: color 0.2s; }
        .lm-footer-link:hover { color: #fff; }

        @media (max-width: 1000px) {
          .lm-portfolio { grid-template-columns: repeat(2, 1fr); }
          .lm-howit { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 900px) {
          .lm-pricing { grid-template-columns: 1fr; gap: 14px; }
          .lm-split { grid-template-columns: 1fr; gap: 32px; }
          .lm-split.flip { direction: ltr; }
          .lm-split-visual { aspect-ratio: 16/10; max-height: 56vh; }
        }
        @media (max-width: 760px) {
          .lm-nav { padding: 14px 20px; }
          .lm-nav-links { display: none; }
          .lm-burger { display: block; }
          .lm-logo { font-size: 24px; }
          .lm-hero { padding: 7rem 1.4rem 3rem; }
          .lm-hero-eyebrow { margin-bottom: 22px; font-size: 10px; padding: 7px 14px; letter-spacing: 0.22em; }
          .lm-hero-sub { font-size: 1rem; margin-bottom: 28px; }
          .lm-hero-cta-row { gap: 10px; }
          .lm-cta { padding: 15px 26px; font-size: 12px; }
          .lm-section { padding: 4.5rem 1.4rem; }
          .lm-section-title { font-size: clamp(2rem, 9vw, 3rem) !important; }
          .lm-split-visual { aspect-ratio: 4/3; max-height: 50vh; }
          .lm-howit-card { padding: 24px 22px; }
          .lm-howit-n { font-size: 3rem; margin-bottom: 12px; }
        }
        @media (max-width: 540px) {
          .lm-howit { grid-template-columns: 1fr; }
          .lm-portfolio { grid-template-columns: 1fr; }
          .lm-final { padding: 5rem 1.4rem; }
          .lm-footer { flex-direction: column; text-align: center; }
          .lm-footer-links { justify-content: center; }
          .lm-hero { padding: 6.5rem 1.2rem 2.5rem; }
          .lm-section { padding: 4rem 1.2rem; }
        }
      ` }} />

      {/* Multi-layer background */}
      <div className="lm-aurora">
        <div className="lm-aurora-blob lm-blob-1" />
        <div className="lm-aurora-blob lm-blob-2" />
        <div className="lm-aurora-blob lm-blob-3" />
      </div>

      {/* Floating particles */}
      <div className="lm-particles">
        {Array.from({ length: 25 }).map((_, i) => (
          <span key={i} className="lm-particle" style={{ left: `${(i * 4) % 100}%`, animationDelay: `${i * 0.6}s`, animationDuration: `${14 + (i % 4) * 2}s` }} />
        ))}
      </div>

      {/* Cursor light */}
      <div className="lm-cursor-light" style={{ left: cursor.x, top: cursor.y }} />

      {/* GIANT LUMINO MARK in middle on scroll */}
      <div className={`lm-giant-mark ${markVisible ? 'show' : ''}`}>
        <span
          className="lm-giant-mark-text"
          style={{ transform: `scale(${markScale}) rotate(${(markProgress - 0.5) * 4}deg)` }}
        >
          Lumino<span className="lm-giant-mark-dot">.</span>
        </span>
      </div>

      <div className="lm-content">
        {/* NAV */}
        <nav className="lm-nav">
          <Link href="/" className="lm-logo">
            <span>Lumino</span>
            <span className="lm-logo-dot" />
          </Link>
          <div className="lm-nav-links">
            <Link href="/come-funziona" className="lm-nav-link">Come funziona</Link>
            <Link href="/portfolio" className="lm-nav-link">Portfolio</Link>
            <Link href="/pricing" className="lm-nav-link">Piani</Link>
            <Link href="/contatti" className="lm-nav-link">Contatti</Link>
            <Link href="/login" className="lm-nav-link">Accedi</Link>
            <Link href="/inizia" className="lm-nav-cta">Inizia ora</Link>
          </div>
          <button
            type="button"
            className={`lm-burger ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Chiudi menu' : 'Apri menu'}
            aria-expanded={menuOpen}
          >
            <span /><span /><span />
          </button>
        </nav>

        {/* MOBILE DRAWER */}
        <div
          className={`lm-drawer ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(false)}
          aria-hidden={!menuOpen}
        >
          <div className="lm-drawer-inner" onClick={(e) => e.stopPropagation()}>
            <Link href="/come-funziona" className="lm-drawer-link" onClick={() => setMenuOpen(false)}>Come funziona</Link>
            <Link href="/portfolio" className="lm-drawer-link" onClick={() => setMenuOpen(false)}>Portfolio</Link>
            <Link href="/pricing" className="lm-drawer-link" onClick={() => setMenuOpen(false)}>Piani</Link>
            <Link href="/contatti" className="lm-drawer-link" onClick={() => setMenuOpen(false)}>Contatti</Link>
            <Link href="/login" className="lm-drawer-link" onClick={() => setMenuOpen(false)}>Accedi</Link>
            <Link href="/inizia" className="lm-drawer-cta" onClick={() => setMenuOpen(false)}>Inizia ora →</Link>
          </div>
        </div>

        {/* HERO */}
        <section
          className="lm-hero"
          style={{ transform: `rotateX(${-tiltY * 0.3}deg) rotateY(${tiltX * 0.3}deg)` }}
        >
          <div className="lm-hero-eyebrow">
            <span className="lm-hero-eyebrow-dot" />
            siti web per ristoranti
          </div>
          <h1 className="lm-hero-title">
            Il sito che il tuo<br />ristorante <em>merita</em>.
          </h1>
          <p className="lm-hero-sub">
            Curiamo ogni dettaglio — testi, foto, menu, prenotazioni. Tu pensi alla cucina, al sito pensiamo noi.
          </p>
          <div className="lm-hero-cta-row">
            <Link href="/inizia" className="lm-cta lm-cta-primary">Inizia ora →</Link>
            <Link href="/portfolio" className="lm-cta lm-cta-secondary">Guarda i nostri lavori</Link>
          </div>
        </section>

        {/* SPLIT 1 — image left, text right */}
        <section className="lm-section">
          <div className="lm-split">
            <Reveal dir="left">
              <div className="lm-split-visual">
                <span className="lm-split-visual-tag">SUSHI · MILANO</span>
                <img src={showcase[0]?.data.heroImage} alt="" loading="lazy" />
              </div>
            </Reveal>
            <Reveal dir="right" delay={0.1}>
              <div className="lm-split-text">
                <p className="lm-section-eyebrow">✦ il design</p>
                <h3>Un sito che <em>fa venire fame</em>.</h3>
                <p>Layout pensati per ristoranti, non per agenzie. Foto a tutto schermo, menu eleganti, dettagli che fanno la differenza.</p>
                <ul>
                  <li>Hero immersivo con foto in alta risoluzione</li>
                  <li>Menu navigabile con filtri allergeni</li>
                  <li>Pensato prima di tutto per il telefono — l'80% dei tuoi clienti è da mobile</li>
                  <li>Caricamento sotto i 2 secondi</li>
                </ul>
              </div>
            </Reveal>
          </div>
        </section>

        {/* SPLIT 2 — text left, image right (flipped) */}
        <section className="lm-section">
          <div className="lm-split flip">
            <Reveal dir="right">
              <div className="lm-split-visual">
                <span className="lm-split-visual-tag">PIZZA · NAPOLI</span>
                <img src={showcase[3]?.data.heroImage} alt="" loading="lazy" />
              </div>
            </Reveal>
            <Reveal dir="left" delay={0.1}>
              <div className="lm-split-text">
                <p className="lm-section-eyebrow">✦ su misura</p>
                <h3>Niente template <em>generici</em>.</h3>
                <p>Studiamo il tuo locale — la cucina, la posizione, il tuo stile — e costruiamo tutto su misura. Testi che raccontano la tua cucina, non frasi vuote.</p>
                <ul>
                  <li>Testi scritti per il tuo ristorante</li>
                  <li>Foto del menu organizzate per categoria</li>
                  <li>Colori e font scelti per il tuo brand</li>
                  <li>Ottimizzato per Google e mappe locali</li>
                </ul>
              </div>
            </Reveal>
          </div>
        </section>

        {/* HOW IT WORKS — horizontal flow */}
        <section className="lm-section">
          <Reveal dir="up">
            <p className="lm-section-eyebrow">✦ come funziona</p>
            <h2 className="lm-section-title">Come <em>lavoriamo</em>.<br />Semplice.</h2>
          </Reveal>
          <div className="lm-howit">
            {[
              { n: '01', t: 'Ci racconti del tuo locale', p: 'Ci parli del ristorante, della cucina, di cosa ti serve.' },
              { n: '02', t: 'Costruiamo il sito', p: 'Curiamo testi, foto e menu su misura per te.' },
              { n: '03', t: 'Lo guardi e approvi', p: 'Ti mostriamo il sito. Se vuoi cambiare qualcosa, lo facciamo.' },
              { n: '04', t: 'Vai online', p: 'Pubblichiamo. Gestisci tutto dal tuo pannello.' },
            ].map((s, i) => (
              <Reveal key={s.n} dir="up" delay={i * 0.08}>
                <div className="lm-howit-card">
                  <div className="lm-howit-n">{s.n}</div>
                  <h3 className="lm-howit-t">{s.t}</h3>
                  <p className="lm-howit-p">{s.p}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* PORTFOLIO */}
        <section className="lm-section">
          <Reveal dir="up">
            <p className="lm-section-eyebrow">✦ portfolio</p>
            <h2 className="lm-section-title">Guarda cosa <em>realizziamo</em>.</h2>
            <p className="lm-section-sub">Pizza, sushi, ramen, trattoria, steakhouse — ognuno con la sua personalità. Clicca per vedere il sito completo.</p>
          </Reveal>
          <div className="lm-portfolio">
            {showcase.map((r, i) => (
              <Reveal key={r.slug} dir={i % 2 === 0 ? 'left' : 'right'} delay={i * 0.06}>
                <Link href={`/demo/${r.slug}`} className="lm-portfolio-card">
                  <img src={r.data.heroImage} alt={r.data.restaurantName} loading="lazy" />
                  <div className="lm-portfolio-info">
                    <p className="lm-portfolio-cuisine">{r.cuisine}</p>
                    <p className="lm-portfolio-name">{r.data.restaurantName}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
          <Reveal dir="up" delay={0.2}>
            <div className="lm-portfolio-all">
              <Link href="/portfolio">Vedi tutti gli esempi →</Link>
            </div>
          </Reveal>
        </section>

        {/* PRICING TEASER */}
        <section className="lm-section" id="pricing">
          <Reveal dir="up">
            <p className="lm-section-eyebrow">✦ scegli il tuo piano</p>
            <h2 className="lm-section-title">Trasparente.<br /><em>Senza sorprese</em>.</h2>
            <p className="lm-section-sub">Un pagamento unico. Niente abbonamenti.</p>
          </Reveal>
          <div className="lm-pricing">
            {PLANS.map((p, i) => {
              const dir = i === 0 ? 'left' : i === 1 ? 'up' : 'right'
              const delay = 0.05 + i * 0.05
              const teaser = p.features.slice(0, 6)
              return (
                <Reveal key={p.key} dir={dir as any} delay={delay}>
                  <Link href="/pricing" className={`lm-pcard ${p.highlight ? 'highlight' : ''}`}>
                    {p.badge && <span className="lm-pcard-badge">{p.badge}</span>}
                    <h3 className="lm-pcard-name">{p.name}</h3>
                    <p className="lm-pcard-tag">{p.description}</p>
                    <div className="lm-pcard-price-row">
                      <span className="lm-pcard-period-top">a partire da</span>
                      <div className="lm-pcard-price-amount">
                        <span className="lm-pcard-currency">€</span>
                        <span className="lm-pcard-price">{p.priceFrom}</span>
                      </div>
                    </div>
                    <ul className="lm-pcard-features">
                      {teaser.map((f, j) => (
                        <li key={j} className="lm-pcard-feat">{f}</li>
                      ))}
                    </ul>
                    <span className="lm-pcard-link">Scopri →</span>
                  </Link>
                </Reveal>
              )
            })}
          </div>
          <p className="lm-pricing-note">{SALES_TERMS.publicNote}</p>
        </section>

        {/* FINAL CTA */}
        <section className="lm-final">
          <Reveal dir="scale">
            <h2>Il tuo nuovo sito è <em>più vicino</em><br />di quanto pensi.</h2>
            <p>Raccontaci del tuo locale, ti ricontattiamo noi.</p>
            <Link href="/inizia" className="lm-cta lm-cta-primary">Inizia ora →</Link>
          </Reveal>
        </section>

        {/* FOOTER */}
        <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', position: 'relative', zIndex: 10 }}>
          <div style={{ maxWidth: 1300, margin: '0 auto', padding: '3.5rem 2rem 2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 40 }}>
            <div>
              <div className="lm-footer-logo">Lumino<span style={{ color: '#e52d1d' }}>.</span></div>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.6, margin: '14px 0 0', maxWidth: 260 }}>
                Siti professionali su misura per ristoranti e attività locali, pronti in pochi giorni.
              </p>
            </div>
            <div>
              <h4 style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 700, margin: '0 0 14px' }}>Azienda</h4>
              <Link href="/chi-siamo" className="lm-footer-link" style={{ display: 'block', padding: '5px 0' }}>Chi siamo</Link>
              <Link href="/come-funziona" className="lm-footer-link" style={{ display: 'block', padding: '5px 0' }}>Come funziona</Link>
              <Link href="/portfolio" className="lm-footer-link" style={{ display: 'block', padding: '5px 0' }}>Portfolio</Link>
              <Link href="/pricing" className="lm-footer-link" style={{ display: 'block', padding: '5px 0' }}>Piani e prezzi</Link>
              <Link href="/faq" className="lm-footer-link" style={{ display: 'block', padding: '5px 0' }}>Domande frequenti</Link>
              <Link href="/contatti" className="lm-footer-link" style={{ display: 'block', padding: '5px 0' }}>Contatti</Link>
            </div>
            <div>
              <h4 style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 700, margin: '0 0 14px' }}>Legale</h4>
              <Link href="/privacy-policy" className="lm-footer-link" style={{ display: 'block', padding: '5px 0' }}>Privacy Policy</Link>
              <Link href="/cookie-policy" className="lm-footer-link" style={{ display: 'block', padding: '5px 0' }}>Cookie Policy</Link>
              <Link href="/termini-condizioni" className="lm-footer-link" style={{ display: 'block', padding: '5px 0' }}>Termini e Condizioni</Link>
              <Link href="/gdpr" className="lm-footer-link" style={{ display: 'block', padding: '5px 0' }}>Informativa GDPR</Link>
              <Link href="/resi-rimborsi" className="lm-footer-link" style={{ display: 'block', padding: '5px 0' }}>Resi e Rimborsi</Link>
              <Link href="/disclaimer" className="lm-footer-link" style={{ display: 'block', padding: '5px 0' }}>Disclaimer</Link>
            </div>
            <div>
              <h4 style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 700, margin: '0 0 14px' }}>Contatti</h4>
              <a href={`mailto:${COMPANY.email}`} className="lm-footer-link" style={{ display: 'block', padding: '5px 0' }}>{COMPANY.email}</a>
              <Link href="/login" className="lm-footer-link" style={{ display: 'block', padding: '5px 0' }}>Accedi</Link>
              <Link href="/inizia" className="lm-footer-link" style={{ display: 'block', padding: '5px 0' }}>Crea il tuo sito</Link>
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ maxWidth: 1300, margin: '0 auto', padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
              <div>© {new Date().getFullYear()} Lumino — un brand di {COMPANY.legalName}</div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
