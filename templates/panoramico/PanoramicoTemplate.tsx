'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { StickyMobileBar } from '../_shared/StickyMobileBar'
import { AllergenBadges } from '../_shared/AllergenBadges'
import { LeaveReviewForm } from '../_shared/LeaveReviewForm'
import GdprConsent from '../_shared/GdprConsent'

interface PanoramicoProps {
  restaurantName: string
  tagline?: string
  description?: string
  heroImage: string
  heroImages?: string[]
  aboutImage?: string
  menuCategories: Array<{
    name: string
    description?: string
    items: Array<{ name: string; description?: string; price: number; allergens?: string[] }>
  }>
  galleryImages: Array<{ url: string; alt: string; caption?: string }>
  address?: string
  phone?: string
  email?: string
  hours?: Record<string, { open: string; close: string; closed?: boolean }>
  mapsUrl?: string
  socialLinks?: Record<string, string>
  accentColor?: string
  logoUrl?: string
  tier?: 'basic' | 'pro' | 'premium'
  events?: Array<{ title: string; description?: string; date: string; imageUrl?: string }>
  whatsappNumber?: string
  chef?: { name: string; role: string; quote: string; photo?: string; years?: number }
  reviews?: { score: number; count: number; source: string; items: Array<{ author: string; rating: number; text: string; source?: string; date?: string }> }
  faq?: Array<{ q: string; a: string }>
  timeSlots?: string[]
}

const DAY_NAMES: Record<string, string> = {
  mon: 'Lunedì', tue: 'Martedì', wed: 'Mercoledì', thu: 'Giovedì',
  fri: 'Venerdì', sat: 'Sabato', sun: 'Domenica',
}

function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('pan-visible')
          observer.unobserve(el)
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return ref
}

function Reveal({ children, delay = 0, className = '' }: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const ref = useReveal()
  return (
    <div ref={ref} className={`pan-reveal ${className}`} style={{ transitionDelay: `${delay}s` }}>
      {children}
    </div>
  )
}

function ReservationForm({ accent, ink, paper, muted, timeSlots }: { accent: string; ink: string; paper: string; muted: string; timeSlots?: string[] }) {
  const [submitted, setSubmitted] = useState(false)
  const [pickedSlot, setPickedSlot] = useState<string | null>(null)
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.9rem 0',
    background: 'transparent',
    border: 'none',
    borderBottom: `1px solid ${ink}30`,
    color: ink,
    fontSize: '0.95rem',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.3s',
  }

  if (submitted) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <div style={{ fontSize: '2rem', color: accent, marginBottom: '1.5rem' }}>—</div>
        <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 400, marginBottom: '0.75rem', color: ink, letterSpacing: '-0.01em' }}>
          Prenotazione ricevuta
        </h3>
        <p style={{ color: muted, fontSize: '0.95rem' }}>Vi contatteremo a breve per confermare.</p>
      </div>
    )
  }

  return (
    <form onSubmit={e => { e.preventDefault(); setSubmitted(true) }}
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {timeSlots && timeSlots.length > 0 && (
        <div className="pan-slots">
          <div className="pan-slots-title">Disponibilità per stasera</div>
          <div className="pan-slots-row">
            {timeSlots.map(slot => (
              <button key={slot} type="button" className={`pan-slot ${pickedSlot === slot ? 'active' : ''}`} onClick={() => setPickedSlot(slot)}>
                {slot}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="pan-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <input required type="text" placeholder="Nome" style={inputStyle} />
        <input required type="text" placeholder="Cognome" style={inputStyle} />
      </div>
      <div className="pan-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <input required type="email" placeholder="Email" style={inputStyle} />
        <input required type="tel" placeholder="Telefono" style={inputStyle} />
      </div>
      <div className="pan-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem' }}>
        <input required type="date" style={inputStyle} />
        <input required type="time" value={pickedSlot || ''} onChange={e => setPickedSlot(e.target.value)} style={inputStyle} />
        <input required type="number" min={1} max={20} placeholder="Persone" style={inputStyle} />
      </div>
      <textarea placeholder="Note (allergie, occasione speciale...)" rows={3} style={{ ...inputStyle, resize: 'none', paddingTop: '0.9rem' }} />
      <GdprConsent accent={accent} color={muted} />
      <button type="submit" style={{
        marginTop: '1rem',
        padding: '1.1rem 2.5rem',
        background: ink,
        color: paper,
        border: 'none',
        cursor: 'pointer',
        fontSize: '0.85rem',
        fontWeight: 500,
        letterSpacing: '0.25em',
        textTransform: 'uppercase',
        fontFamily: 'inherit',
        alignSelf: 'flex-start',
        transition: 'background 0.3s, transform 0.3s',
      }}
        onMouseEnter={e => { e.currentTarget.style.background = accent }}
        onMouseLeave={e => { e.currentTarget.style.background = ink }}
      >
        Conferma prenotazione
      </button>
    </form>
  )
}

export function PanoramicoTemplate(props: PanoramicoProps) {
  const {
    restaurantName, tagline, description, heroImage, aboutImage,
    menuCategories, galleryImages, address, phone, email,
    hours, mapsUrl, socialLinks, accentColor = '#b58a2f', logoUrl,
    tier = 'basic', events, whatsappNumber,
    heroImages, chef, reviews, faq, timeSlots,
  } = props

  // Hero carousel
  const heroSlides = heroImages && heroImages.length > 0 ? heroImages : [props.heroImage]
  const [heroIdx, setHeroIdx] = useState(0)
  useEffect(() => {
    if (heroSlides.length < 2) return
    const t = setInterval(() => setHeroIdx(i => (i + 1) % heroSlides.length), 4500)
    return () => clearInterval(t)
  }, [heroSlides.length])

  const [reviewIdx, setReviewIdx] = useState(0)
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [pickedSlot, setPickedSlot] = useState<string | null>(null)

  // LIGHT palette - cream / sand / warm
  const accent = accentColor
  const paper = '#f7f1e6'        // soft cream
  const paperWarm = '#f0e8d6'    // warmer cream
  const ink = '#2a2520'          // dark warm brown
  const muted = '#7a6f5f'
  const line = '#d4c7ad'

  const [activeCategory, setActiveCategory] = useState(0)
  const menuStripRef = useRef<HTMLDivElement>(null)
  const panoramaRef = useRef<HTMLDivElement>(null)
  const panoramaTrackRef = useRef<HTMLDivElement>(null)
  const [panoramaProgress, setPanoramaProgress] = useState(0)

  useEffect(() => {
    if (menuStripRef.current) menuStripRef.current.scrollTo({ left: 0, behavior: 'smooth' })
  }, [activeCategory])

  // HORIZONTAL PANORAMA — desktop only. Drives sideways translate based on scroll position.
  useEffect(() => {
    const wrap = panoramaRef.current
    const track = panoramaTrackRef.current
    if (!wrap || !track) return

    let raf = 0
    const compute = () => {
      raf = requestAnimationFrame(() => {
        // Only kick in on viewports wide enough; below 900px we let it stack vertically via CSS.
        if (window.innerWidth < 900) {
          track.style.transform = 'translate3d(0, 0, 0)'
          return
        }
        const rect = wrap.getBoundingClientRect()
        const total = wrap.offsetHeight - window.innerHeight
        const scrolled = -rect.top
        const progress = Math.min(1, Math.max(0, scrolled / total))
        setPanoramaProgress(progress)
        const trackWidth = track.scrollWidth
        const distance = trackWidth - window.innerWidth
        track.style.transform = `translate3d(${-distance * progress}px, 0, 0)`
      })
    }
    window.addEventListener('scroll', compute, { passive: true })
    window.addEventListener('resize', compute, { passive: true })
    compute()
    return () => {
      window.removeEventListener('scroll', compute)
      window.removeEventListener('resize', compute)
      cancelAnimationFrame(raf)
    }
  }, [])

  // PARALLAX on hero image
  const heroImgRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      raf = requestAnimationFrame(() => {
        if (heroImgRef.current) {
          const y = window.scrollY
          if (y < window.innerHeight) {
            heroImgRef.current.style.transform = `translate3d(0, ${y * 0.4}px, 0) scale(${1 + y * 0.0004})`
          }
        }
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  // Build panorama sections: about + manifesto + values + dish highlight
  const panoramaSections = [
    {
      kind: 'about' as const,
      eyebrow: 'la nostra storia',
      title: tagline || 'Dove la tradizione incontra il presente',
    },
    {
      kind: 'manifesto' as const,
      lines: ['Materie prime', 'del territorio.', 'Ricette di famiglia.', 'Servizio sincero.'],
    },
    {
      kind: 'gallery' as const,
    },
    {
      kind: 'closing' as const,
      eyebrow: 'l\'esperienza',
      title: 'Un pranzo. Un\'ora. Un\'altra cosa.',
    },
  ]

  return (
    <div style={{ background: paper, color: ink, fontFamily: '"Inter", system-ui, sans-serif', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400;1,500&display=swap');

        body { background: ${paper}; }

        /* ── REVEAL animation ── */
        .pan-reveal {
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 1.1s cubic-bezier(0.22, 1, 0.36, 1), transform 1.1s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .pan-visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* ── STICKY TOP BAR ── */
        .pan-topbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 50;
          padding: 1rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: ${paper}cc;
          backdrop-filter: blur(20px);
          border-bottom: 1px solid ${line}80;
          font-size: 0.75rem;
          letter-spacing: 0.3em;
          text-transform: uppercase;
        }
        .pan-topbar a { color: ${ink}; text-decoration: none; transition: color 0.3s; }
        .pan-topbar a:hover { color: ${accent}; }
        .pan-topbar-name { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 1.1rem; letter-spacing: 0.02em; text-transform: none; font-weight: 500; }
        .pan-topbar-nav { display: flex; gap: 2.5rem; }
        .pan-progress {
          position: absolute;
          left: 0; right: 0; bottom: -1px;
          height: 1px;
          background: ${accent};
          transform-origin: left center;
        }

        /* ── HERO with parallax ── */
        .pan-hero {
          position: relative;
          min-height: 100vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 5rem 2rem 3rem;
        }
        .pan-hero-img {
          position: absolute;
          inset: -10% 0;
          background-size: cover;
          background-position: center;
          z-index: 0;
          will-change: transform;
          filter: brightness(0.95) saturate(0.85);
        }
        .pan-hero-img::after {
          content: '';
          position: absolute;
          inset: 0;
          background:
            linear-gradient(180deg, ${paper}99 0%, transparent 25%, transparent 60%, ${paper}f0 100%);
        }
        .pan-hero-inner {
          position: relative;
          z-index: 2;
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3rem;
          align-items: end;
        }
        .pan-hero-eyebrow {
          font-size: 0.75rem;
          letter-spacing: 0.35em;
          text-transform: uppercase;
          color: ${accent};
          margin-bottom: 1.5rem;
          font-weight: 500;
        }
        .pan-hero-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(4rem, 11vw, 11rem);
          font-weight: 400;
          font-style: italic;
          line-height: 0.88;
          letter-spacing: -0.04em;
          color: ${ink};
          margin: 0;
        }
        .pan-hero-name .pan-h-word {
          display: inline-block;
          opacity: 0;
          transform: translateY(80px);
          animation: panHeroIn 1.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        @keyframes panHeroIn {
          to { opacity: 1; transform: translateY(0); }
        }
        .pan-hero-tag {
          font-size: 1.1rem;
          line-height: 1.6;
          color: ${ink};
          opacity: 0.85;
          margin-bottom: 2rem;
          max-width: 380px;
        }
        .pan-hero-cta {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        /* PANORAMA scroll section */
        .pan-panorama-wrap {
          position: relative;
          height: 400vh;  /* 4 sections × 100vh of vertical scroll drives horizontal motion */
          background: ${paperWarm};
        }
        .pan-panorama-sticky {
          position: sticky;
          top: 0;
          height: 100vh;
          overflow: hidden;
          display: flex;
          align-items: center;
        }
        .pan-panorama-track {
          display: flex;
          height: 100%;
          align-items: center;
          will-change: transform;
        }
        .pan-pano-section {
          flex: 0 0 100vw;
          height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 6rem 6vw;
          position: relative;
          box-sizing: border-box;
        }
        .pan-pano-eyebrow {
          font-size: 0.75rem;
          letter-spacing: 0.4em;
          text-transform: uppercase;
          color: ${accent};
          margin-bottom: 2rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .pan-pano-eyebrow::before {
          content: '';
          width: 50px;
          height: 1px;
          background: ${accent};
        }
        .pan-pano-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(3rem, 7vw, 6.5rem);
          font-weight: 400;
          font-style: italic;
          line-height: 1;
          letter-spacing: -0.03em;
          color: ${ink};
          max-width: 1000px;
        }
        .pan-pano-body {
          font-size: 1.15rem;
          line-height: 1.7;
          color: ${ink};
          opacity: 0.85;
          max-width: 600px;
          margin-top: 2.5rem;
        }
        .pan-pano-num {
          position: absolute;
          top: 5rem;
          right: 6vw;
          font-family: 'Cormorant Garamond', serif;
          font-size: 1rem;
          letter-spacing: 0.2em;
          color: ${muted};
        }
        /* Manifesto: stacked giant lines */
        .pan-pano-manifesto {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(3rem, 8vw, 7.5rem);
          font-weight: 400;
          font-style: italic;
          line-height: 1;
          letter-spacing: -0.03em;
          color: ${ink};
        }
        .pan-pano-manifesto > div { padding: 0.3rem 0; }
        .pan-pano-manifesto > div:nth-child(2n) { color: ${accent}; }
        /* Gallery panorama */
        .pan-pano-gallery {
          display: flex;
          gap: 2rem;
          height: 60vh;
          align-items: center;
        }
        .pan-pano-gallery-img {
          position: relative;
          flex: 0 0 auto;
          overflow: hidden;
          box-shadow: 0 10px 40px ${ink}20;
        }
        .pan-pano-gallery-img:nth-child(1) { width: 28vw; height: 50vh; }
        .pan-pano-gallery-img:nth-child(2) { width: 22vw; height: 60vh; margin-top: -3vh; }
        .pan-pano-gallery-img:nth-child(3) { width: 26vw; height: 45vh; margin-top: 5vh; }
        .pan-pano-gallery-img:nth-child(4) { width: 20vw; height: 55vh; }
        .pan-pano-gallery-img img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* Section after panorama */
        .pan-section {
          padding: 8rem 2rem;
          max-width: 1300px;
          margin: 0 auto;
        }
        .pan-section-eyebrow {
          font-size: 0.75rem;
          letter-spacing: 0.35em;
          text-transform: uppercase;
          color: ${accent};
          margin-bottom: 1.5rem;
          font-weight: 500;
        }
        .pan-section-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(2.5rem, 5vw, 4.5rem);
          font-weight: 400;
          font-style: italic;
          line-height: 1.05;
          letter-spacing: -0.02em;
          color: ${ink};
          margin-bottom: 1.5rem;
        }

        /* ABOUT */
        .pan-about {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 5rem;
          align-items: center;
        }
        .pan-about-img {
          position: relative;
          aspect-ratio: 4/5;
          overflow: hidden;
          box-shadow: 0 20px 60px ${ink}25;
        }

        /* MENU */
        .pan-menu {
          background: ${paperWarm};
        }
        .pan-pill {
          padding: 0.65rem 1.6rem;
          background: transparent;
          border: 1px solid ${ink}30;
          color: ${ink};
          font-size: 0.78rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s;
          font-family: inherit;
          font-weight: 500;
        }
        .pan-pill:hover { border-color: ${accent}; color: ${accent}; }
        .pan-pill-on {
          background: ${ink};
          color: ${paper};
          border-color: ${ink};
        }
        .pan-menu-scroll {
          display: flex;
          gap: 1.5rem;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          padding: 1rem 0 2rem;
          scrollbar-width: none;
        }
        .pan-menu-scroll::-webkit-scrollbar { display: none; }
        .pan-menu-item {
          flex: 0 0 320px;
          scroll-snap-align: start;
          background: ${paper};
          padding: 2rem 1.75rem;
          border: 1px solid ${line};
          position: relative;
          transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.4s, border-color 0.4s;
          min-height: 220px;
          display: flex;
          flex-direction: column;
        }
        .pan-menu-item:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 50px ${ink}20;
          border-color: ${accent};
        }
        .pan-menu-item-head {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        .pan-menu-item-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.45rem;
          font-weight: 500;
          color: ${ink};
          letter-spacing: -0.01em;
          line-height: 1.2;
        }
        .pan-menu-item-price {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.4rem;
          font-weight: 500;
          color: ${accent};
          white-space: nowrap;
        }
        .pan-menu-item-desc {
          font-size: 0.95rem;
          line-height: 1.6;
          color: ${muted};
          flex: 1;
        }

        /* GALLERY */
        .pan-gallery {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          grid-auto-rows: 220px;
        }
        .pan-gallery > div:nth-child(1) { grid-column: span 2; grid-row: span 2; }
        .pan-gallery > div:nth-child(2) { grid-row: span 1; }
        .pan-gallery > div:nth-child(3) { grid-row: span 1; }
        .pan-gallery > div:nth-child(4) { grid-column: span 2; }
        .pan-gallery-item {
          position: relative;
          overflow: hidden;
          cursor: pointer;
        }
        .pan-gallery-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .pan-gallery-item:hover img { transform: scale(1.06); }
        .pan-gallery-item::after {
          content: '';
          position: absolute;
          inset: 0;
          background: ${ink}40;
          opacity: 0;
          transition: opacity 0.4s;
        }
        .pan-gallery-item:hover::after { opacity: 1; }
        .pan-gallery-cap {
          position: absolute;
          bottom: 1rem;
          left: 1rem;
          right: 1rem;
          z-index: 2;
          color: ${paper};
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 1rem;
          opacity: 0;
          transform: translateY(15px);
          transition: opacity 0.4s, transform 0.4s;
        }
        .pan-gallery-item:hover .pan-gallery-cap {
          opacity: 1;
          transform: translateY(0);
        }

        /* EDITORIAL GALLERY — magazine spread */
        .pan-editorial {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 3rem;
          align-items: start;
        }
        .pan-editorial-hero {
          position: relative;
          aspect-ratio: 4/5;
          overflow: hidden;
          box-shadow: 0 20px 60px ${ink}25;
        }
        .pan-editorial-hero img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .pan-editorial-hero:hover img { transform: scale(1.04); }
        .pan-editorial-hero-meta {
          position: absolute;
          top: 1.5rem;
          left: 1.5rem;
          z-index: 2;
          padding: 0.5rem 1rem;
          background: ${paper}f0;
          backdrop-filter: blur(10px);
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 0.85rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: ${ink};
        }
        .pan-editorial-hero-cap {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 3rem 1.5rem 1.5rem;
          background: linear-gradient(to top, ${ink}cc, transparent);
          color: ${paper};
          z-index: 2;
        }
        .pan-editorial-hero-cap h3 {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(1.4rem, 2.5vw, 2rem);
          font-weight: 400;
          font-style: italic;
          line-height: 1.1;
          letter-spacing: -0.01em;
        }
        .pan-editorial-side {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        .pan-editorial-vol {
          font-family: 'Cormorant Garamond', serif;
          font-size: 0.85rem;
          font-style: italic;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: ${accent};
          padding-bottom: 1rem;
          border-bottom: 1px solid ${accent}55;
          display: flex;
          justify-content: space-between;
        }
        .pan-editorial-clip {
          display: flex;
          gap: 1.25rem;
          padding-bottom: 1.25rem;
          border-bottom: 1px dashed ${line};
          align-items: flex-start;
          cursor: pointer;
          transition: padding-left 0.4s;
        }
        .pan-editorial-clip:hover {
          padding-left: 0.5rem;
        }
        .pan-editorial-clip:last-child { border-bottom: none; }
        .pan-editorial-clip-img {
          flex: 0 0 110px;
          aspect-ratio: 4/5;
          overflow: hidden;
        }
        .pan-editorial-clip-img img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s;
        }
        .pan-editorial-clip:hover .pan-editorial-clip-img img { transform: scale(1.08); }
        .pan-editorial-clip-info { flex: 1; padding-top: 0.25rem; }
        .pan-editorial-clip-num {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 0.8rem;
          letter-spacing: 0.2em;
          color: ${accent};
          margin-bottom: 0.4rem;
        }
        .pan-editorial-clip-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.2rem;
          font-weight: 500;
          color: ${ink};
          letter-spacing: -0.01em;
          line-height: 1.2;
          margin-bottom: 0.3rem;
        }
        .pan-editorial-clip-cap {
          font-size: 0.85rem;
          color: ${muted};
          line-height: 1.5;
        }

        /* ── PRESS / RATINGS bar ── */
        .pan-press {
          padding: 2.5rem 2rem;
          background: ${paperWarm};
          border-top: 1px solid ${line};
          border-bottom: 1px solid ${line};
        }
        .pan-press-inner {
          max-width: 1300px;
          margin: 0 auto;
          display: flex;
          gap: 3rem;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
        }
        .pan-press-block {
          display: flex;
          align-items: center;
          gap: 0.9rem;
        }
        .pan-press-stars { font-size: 1.4rem; color: ${accent}; letter-spacing: 0.15em; }
        .pan-press-score {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 2.4rem;
          font-weight: 500;
          line-height: 1;
          color: ${ink};
        }
        .pan-press-meta { font-size: 0.75rem; letter-spacing: 0.25em; text-transform: uppercase; color: ${muted}; font-weight: 500; }
        .pan-press-pipe { width: 1px; height: 36px; background: ${line}; }

        /* ── CHEF section ── */
        .pan-chef {
          padding: 8rem 2rem;
          max-width: 1300px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1.1fr 1fr;
          gap: 5rem;
          align-items: center;
        }
        .pan-chef-photo {
          position: relative;
          aspect-ratio: 4/5;
          overflow: hidden;
          box-shadow: 0 30px 80px ${ink}30;
        }
        .pan-chef-photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .pan-chef-photo::after {
          content: '';
          position: absolute;
          inset: -12px;
          border: 1px solid ${accent}55;
          z-index: -1;
        }
        .pan-chef-quote {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: clamp(1.7rem, 2.6vw, 2.3rem);
          font-weight: 400;
          line-height: 1.3;
          letter-spacing: -0.01em;
          color: ${ink};
          position: relative;
          padding-left: 0;
          margin-bottom: 2.5rem;
        }
        .pan-chef-quote::before {
          content: '';
          display: block;
          width: 60px;
          height: 1px;
          background: ${accent};
          margin-bottom: 1.5rem;
        }
        .pan-chef-name {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 1.4rem;
          font-weight: 500;
          color: ${ink};
          margin-bottom: 0.25rem;
        }
        .pan-chef-role {
          font-size: 0.7rem;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: ${accent};
          font-weight: 500;
        }

        /* ── REVIEWS ── */
        .pan-reviews {
          padding: 8rem 2rem;
          max-width: 900px;
          margin: 0 auto;
          text-align: center;
        }
        .pan-review {
          display: none;
          opacity: 0;
        }
        .pan-review.active {
          display: block;
          animation: panReviewIn 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        @keyframes panReviewIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .pan-review-stars { font-size: 1.3rem; color: ${accent}; letter-spacing: 0.2em; margin-bottom: 2rem; }
        .pan-review-text {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: clamp(1.3rem, 2.2vw, 1.9rem);
          line-height: 1.4;
          color: ${ink};
          letter-spacing: -0.01em;
          margin-bottom: 2.5rem;
          position: relative;
        }
        .pan-review-text::before {
          content: '“';
          font-family: 'Cormorant Garamond', serif;
          position: absolute;
          left: 50%;
          top: -4rem;
          font-size: 6rem;
          line-height: 1;
          color: ${accent};
          opacity: 0.4;
          transform: translateX(-50%);
        }
        .pan-review-byline {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          color: ${muted};
          font-size: 1rem;
          letter-spacing: 0.05em;
        }
        .pan-review-author { color: ${ink}; }
        .pan-review-nav {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-top: 3rem;
        }
        .pan-review-dot {
          width: 30px;
          height: 1px;
          background: ${ink}30;
          border: none;
          cursor: pointer;
          padding: 0;
          transition: background 0.3s, width 0.3s;
        }
        .pan-review-dot.active { background: ${accent}; width: 50px; }

        /* ── FAQ ── */
        .pan-faq {
          padding: 6rem 2rem;
          max-width: 850px;
          margin: 0 auto;
        }
        .pan-faq-item {
          border-bottom: 1px solid ${line};
        }
        .pan-faq-q {
          width: 100%;
          background: none;
          border: none;
          padding: 1.75rem 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: ${ink};
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.3rem;
          font-weight: 500;
          font-style: italic;
          letter-spacing: -0.01em;
          cursor: pointer;
          text-align: left;
          gap: 1rem;
          transition: color 0.3s;
        }
        .pan-faq-q:hover { color: ${accent}; }
        .pan-faq-icon {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 1.5rem;
          color: ${accent};
          transition: transform 0.4s;
          flex-shrink: 0;
        }
        .pan-faq-item.open .pan-faq-icon { transform: rotate(45deg); }
        .pan-faq-a {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.5s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .pan-faq-item.open .pan-faq-a {
          max-height: 400px;
          padding-bottom: 1.75rem;
        }
        .pan-faq-a p {
          color: ${muted};
          line-height: 1.7;
          font-size: 1rem;
        }

        /* ── NEWSLETTER ── */
        .pan-newsletter {
          padding: 5rem 2rem;
          background: ${ink};
          color: ${paper};
          text-align: center;
        }
        .pan-newsletter h2 {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 400;
          font-style: italic;
          margin-bottom: 1rem;
          letter-spacing: -0.02em;
        }
        .pan-newsletter p {
          color: ${paper}aa;
          margin-bottom: 2rem;
          font-size: 1.05rem;
          max-width: 500px;
          margin-left: auto;
          margin-right: auto;
        }
        .pan-newsletter-form {
          display: flex;
          gap: 8px;
          max-width: 500px;
          margin: 0 auto;
        }
        .pan-newsletter input {
          flex: 1;
          padding: 1rem 1.25rem;
          background: transparent;
          border: 1px solid ${paper}50;
          color: ${paper};
          font-family: inherit;
          font-size: 0.95rem;
          outline: none;
          transition: border-color 0.3s;
        }
        .pan-newsletter input:focus { border-color: ${accent}; }
        .pan-newsletter input::placeholder { color: ${paper}80; }
        .pan-newsletter button {
          padding: 1rem 2rem;
          background: ${accent};
          color: ${ink};
          border: none;
          font-family: inherit;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          cursor: pointer;
          transition: opacity 0.3s;
        }
        .pan-newsletter button:hover { opacity: 0.85; }

        /* ── Time slots ── */
        .pan-slots { margin: 0 0 1.5rem; }
        .pan-slots-title {
          font-size: 0.7rem;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: ${accent};
          margin-bottom: 0.75rem;
          font-weight: 500;
        }
        .pan-slots-row { display: flex; gap: 8px; flex-wrap: wrap; }
        .pan-slot {
          padding: 0.7rem 1.1rem;
          background: transparent;
          color: ${ink};
          border: 1px solid ${ink}25;
          cursor: pointer;
          font-family: inherit;
          font-size: 0.9rem;
          transition: all 0.25s;
        }
        .pan-slot:hover { border-color: ${accent}; color: ${accent}; }
        .pan-slot.active {
          background: ${ink};
          color: ${paper};
          border-color: ${ink};
        }

        @media (max-width: 768px) {
          .pan-chef { grid-template-columns: 1fr; gap: 3rem; padding: 5rem 1.5rem; }
          .pan-press-inner { gap: 1.5rem; }
          .pan-press-pipe { display: none; }
          .pan-newsletter-form { flex-direction: column; }
        }

        /* TIMELINE EVENTS */
        .pan-timeline {
          position: relative;
          padding: 4rem 0 2rem;
        }
        .pan-timeline-line {
          position: absolute;
          top: 6rem;
          left: 5%;
          right: 5%;
          height: 1px;
          background: linear-gradient(90deg, transparent 0%, ${accent} 8%, ${accent} 92%, transparent 100%);
        }
        .pan-timeline-track {
          display: grid;
          grid-template-columns: repeat(${''}auto-fit, minmax(220px, 1fr));
          gap: 2rem;
          position: relative;
          padding: 0 5%;
        }
        .pan-timeline-event {
          position: relative;
          padding-top: 2.5rem;
        }
        .pan-timeline-event::before {
          content: '';
          position: absolute;
          top: 1.4rem;
          left: 50%;
          transform: translateX(-50%);
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: ${paperWarm};
          border: 2px solid ${accent};
          z-index: 2;
          transition: all 0.3s;
        }
        .pan-timeline-event:hover::before {
          background: ${accent};
          transform: translateX(-50%) scale(1.4);
          box-shadow: 0 0 0 6px ${accent}33;
        }
        .pan-timeline-event::after {
          content: '';
          position: absolute;
          top: 2rem;
          left: 50%;
          width: 1px;
          height: 1.5rem;
          background: ${accent}77;
          transform: translateX(-50%);
        }
        .pan-timeline-card {
          background: ${paper};
          padding: 1.5rem 1.5rem 1.75rem;
          border: 1px solid ${line};
          text-align: center;
          transition: transform 0.4s, box-shadow 0.4s, border-color 0.4s;
          cursor: pointer;
        }
        .pan-timeline-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 16px 40px ${ink}15;
          border-color: ${accent};
        }
        .pan-timeline-day {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 3.2rem;
          line-height: 1;
          color: ${accent};
          font-weight: 400;
          letter-spacing: -0.02em;
        }
        .pan-timeline-month {
          font-size: 0.7rem;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: ${muted};
          margin-bottom: 1.25rem;
          margin-top: 0.25rem;
        }
        .pan-timeline-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.25rem;
          font-weight: 500;
          color: ${ink};
          letter-spacing: -0.01em;
          line-height: 1.2;
          margin-bottom: 0.5rem;
        }
        .pan-timeline-desc {
          font-size: 0.88rem;
          color: ${muted};
          line-height: 1.5;
        }

        /* CONTACT */
        .pan-contact {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
        }

        /* WHATSAPP FAB */
        .pan-fab {
          position: fixed;
          bottom: 30px;
          right: 30px;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: #25d366;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          text-decoration: none;
          z-index: 100;
          box-shadow: 0 6px 20px rgba(37, 211, 102, 0.4);
          transition: transform 0.3s;
        }
        .pan-fab:hover { transform: scale(1.1) translateY(-4px); }

        /* ── MOBILE: kill horizontal scroll, stack vertically ── */
        @media (max-width: 899px) {
          .pan-panorama-wrap {
            height: auto;
          }
          .pan-panorama-sticky {
            position: relative;
            top: auto;
            height: auto;
            overflow: visible;
          }
          .pan-panorama-track {
            flex-direction: column;
            transform: none !important;
          }
          .pan-pano-section {
            flex: 0 0 auto;
            height: auto;
            min-height: 80vh;
            padding: 6rem 1.5rem;
            border-bottom: 1px solid ${line};
          }
          .pan-pano-num {
            position: static;
            margin-bottom: 1.5rem;
          }
          .pan-pano-gallery {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
            height: auto;
          }
          .pan-pano-gallery-img,
          .pan-pano-gallery-img:nth-child(n) {
            width: 100% !important;
            height: 50vw !important;
            margin: 0 !important;
          }
        }
        @media (max-width: 900px) {
          .pan-editorial { grid-template-columns: 1fr; gap: 2rem; }
          .pan-timeline-line { display: none; }
          .pan-timeline-event::before, .pan-timeline-event::after { display: none; }
          .pan-timeline-event { padding-top: 0; }
        }
        @media (max-width: 768px) {
          .pan-topbar { padding: 0.8rem 1.2rem; }
          .pan-topbar-nav { display: none; }
          .pan-hero-inner { grid-template-columns: 1fr; gap: 2rem; }
          .pan-hero { padding: 5rem 1.5rem 3rem; }
          .pan-section { padding: 5rem 1.5rem; }
          .pan-about { grid-template-columns: 1fr; gap: 2.5rem; }
          .pan-contact { grid-template-columns: 1fr; gap: 2.5rem; }
          .pan-form-row { grid-template-columns: 1fr !important; }
          .pan-menu-item { flex: 0 0 280px; }
          .pan-gallery { grid-template-columns: repeat(2, 1fr); grid-auto-rows: 180px; }
          .pan-gallery > div:nth-child(1) { grid-column: span 2; grid-row: span 1; }
          .pan-gallery > div:nth-child(4) { grid-column: span 2; }
          .pan-editorial-clip-img { flex: 0 0 90px; }
          .pan-timeline-day { font-size: 2.5rem; }
        }
        @media (max-width: 480px) {
          .pan-menu-item { flex: 0 0 250px; }
          .pan-gallery { grid-template-columns: 1fr; }
          .pan-gallery > div:nth-child(1),
          .pan-gallery > div:nth-child(4) { grid-column: span 1; }
        }
      `}</style>

      {/* TOP BAR */}
      <header className="pan-topbar">
        <a href="#" className="pan-topbar-name">{restaurantName}</a>
        <nav className="pan-topbar-nav">
          <a href="#storia">Storia</a>
          <a href="#menu">Menu</a>
          {tier !== 'basic' && <a href="#prenotazioni">Prenota</a>}
          <a href="#contatti">Contatti</a>
        </nav>
        <div className="pan-progress" style={{ transform: `scaleX(${panoramaProgress})` }} />
      </header>

      {/* HERO */}
      <section className="pan-hero">
        <div ref={heroImgRef} style={{ position: 'absolute', inset: '-10% 0', zIndex: 0, willChange: 'transform' }}>
          {heroSlides.map((src, i) => (
            <div
              key={i}
              className="pan-hero-img"
              style={{
                backgroundImage: `url(${src})`,
                opacity: i === heroIdx ? 1 : 0,
                transition: 'opacity 1.2s cubic-bezier(0.22, 1, 0.36, 1)',
                position: 'absolute',
                inset: 0,
              }}
            />
          ))}
        </div>
        <div className="pan-hero-inner">
          <div>
            <p className="pan-hero-eyebrow">— dal 1962</p>
            <h1 className="pan-hero-name">
              {restaurantName.split(' ').map((w, i) => (
                <span key={i} className="pan-h-word" style={{ animationDelay: `${0.2 + i * 0.12}s` }}>
                  {w}&nbsp;
                </span>
              ))}
            </h1>
          </div>
          <div>
            {tagline && <p className="pan-hero-tag">{tagline}</p>}
            <div className="pan-hero-cta">
              <a href="#menu" style={{
                padding: '1rem 2.2rem',
                background: ink,
                color: paper,
                textDecoration: 'none',
                fontSize: '0.78rem',
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                fontWeight: 500,
                transition: 'background 0.3s',
              }} onMouseEnter={e => e.currentTarget.style.background = accent} onMouseLeave={e => e.currentTarget.style.background = ink}>
                Esplora il menu
              </a>
              {tier !== 'basic' && (
                <a href="#prenotazioni" style={{
                  padding: '1rem 2.2rem',
                  background: 'transparent',
                  color: ink,
                  border: `1px solid ${ink}`,
                  textDecoration: 'none',
                  fontSize: '0.78rem',
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  fontWeight: 500,
                  transition: 'all 0.3s',
                }} onMouseEnter={e => { e.currentTarget.style.background = ink; e.currentTarget.style.color = paper }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = ink }}>
                  Prenota
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* PANORAMA — sticky horizontal scroll */}
      <div ref={panoramaRef} className="pan-panorama-wrap" id="storia">
        <div className="pan-panorama-sticky">
          <div ref={panoramaTrackRef} className="pan-panorama-track">

            {/* About slide */}
            <div className="pan-pano-section">
              <span className="pan-pano-num">01 / 04</span>
              <div className="pan-pano-eyebrow">la nostra storia</div>
              <h2 className="pan-pano-title">
                Una <em style={{ color: accent, fontStyle: 'italic' }}>panoramica</em> sulla cucina che amiamo.
              </h2>
              <p className="pan-pano-body">{description}</p>
            </div>

            {/* Manifesto slide */}
            <div className="pan-pano-section" style={{ background: paper }}>
              <span className="pan-pano-num">02 / 04</span>
              <div className="pan-pano-eyebrow">il nostro manifesto</div>
              <div className="pan-pano-manifesto">
                <div>Materie prime</div>
                <div>del territorio.</div>
                <div>Ricette di famiglia.</div>
                <div>Servizio sincero.</div>
              </div>
            </div>

            {/* Gallery slide */}
            <div className="pan-pano-section">
              <span className="pan-pano-num">03 / 04</span>
              <div className="pan-pano-eyebrow">atmosfera</div>
              <h2 className="pan-pano-title" style={{ marginBottom: '3rem' }}>
                Lasciatevi guidare.
              </h2>
              <div className="pan-pano-gallery">
                {galleryImages.slice(0, 4).map((img, i) => (
                  <div key={i} className="pan-pano-gallery-img">
                    <img src={img.url} alt={img.alt} loading="lazy" />
                  </div>
                ))}
              </div>
            </div>

            {/* Closing slide */}
            <div className="pan-pano-section" style={{ background: paper }}>
              <span className="pan-pano-num">04 / 04</span>
              <div className="pan-pano-eyebrow">l'esperienza</div>
              <h2 className="pan-pano-title">
                Un pranzo.<br />
                Un'ora.<br />
                <em style={{ color: accent, fontStyle: 'italic' }}>Un'altra cosa.</em>
              </h2>
              {tier !== 'basic' && (
                <a href="#prenotazioni" style={{
                  marginTop: '3rem',
                  padding: '1.1rem 2.5rem',
                  background: ink,
                  color: paper,
                  textDecoration: 'none',
                  fontSize: '0.8rem',
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  fontWeight: 500,
                  alignSelf: 'flex-start',
                  display: 'inline-block',
                  width: 'max-content',
                  transition: 'background 0.3s',
                }} onMouseEnter={e => e.currentTarget.style.background = accent} onMouseLeave={e => e.currentTarget.style.background = ink}>
                  Prenota un tavolo
                </a>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* ABOUT IMAGE SECTION (after panorama for visual rhythm) */}
      {aboutImage && (
        <section className="pan-section">
          <div className="pan-about">
            <Reveal>
              <div className="pan-about-img">
                <Image src={aboutImage} alt="" fill style={{ objectFit: 'cover' }} />
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="pan-section-eyebrow">la cucina</p>
              <h2 className="pan-section-title">
                Una <em style={{ color: accent, fontStyle: 'italic' }}>tavola</em> con vista.
              </h2>
              <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: ink, opacity: 0.85 }}>
                Ogni piatto nasce da una scelta: ingredienti che hanno una storia, persone che li lavorano con cura, un servizio che mette l'ospite prima di tutto. Senza fretta, senza forzature.
              </p>
            </Reveal>
          </div>
        </section>
      )}

      {/* MENU */}
      <section id="menu" className="pan-menu" style={{ padding: '8rem 0' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 2rem' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <p className="pan-section-eyebrow">il menu</p>
              <h2 className="pan-section-title">La carta della casa</h2>
            </div>
          </Reveal>

          <Reveal delay={0.05}>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '2rem' }}>
              {menuCategories.map((cat, i) => (
                <button
                  key={i}
                  className={`pan-pill ${i === activeCategory ? 'pan-pill-on' : ''}`}
                  onClick={() => setActiveCategory(i)}
                >
                  {cat.name}
                </button>
              ))}
            </div>
            <p style={{ textAlign: 'center', color: muted, fontSize: '0.75rem', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '2rem' }}>
              ← scorri per vedere tutti i piatti →
            </p>

            <div ref={menuStripRef} className="pan-menu-scroll">
              {menuCategories[activeCategory]?.items.map((item, i) => (
                <div key={`${activeCategory}-${i}`} className="pan-menu-item">
                  <div className="pan-menu-item-head">
                    <h3 className="pan-menu-item-name">{item.name}<AllergenBadges allergens={item.allergens} variant="minimal" /></h3>
                    <span className="pan-menu-item-price">€{item.price}</span>
                  </div>
                  <p className="pan-menu-item-desc">{item.description}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* GALLERY — editorial magazine spread */}
      {galleryImages.length > 0 && (
        <section className="pan-section">
          <Reveal>
            <div style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <p className="pan-section-eyebrow">VOL. 01 — galleria</p>
                <h2 className="pan-section-title">L'occhio<br />si abitua.</h2>
              </div>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', color: muted, letterSpacing: '0.15em' }}>
                edizione speciale · {new Date().getFullYear()}
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="pan-editorial">
              {/* Big editorial cover */}
              {galleryImages[0] && (
                <div className="pan-editorial-hero">
                  <span className="pan-editorial-hero-meta">— il piatto del giorno</span>
                  <img src={galleryImages[0].url} alt={galleryImages[0].alt} loading="lazy" />
                  {galleryImages[0].caption && (
                    <div className="pan-editorial-hero-cap">
                      <h3>{galleryImages[0].caption}</h3>
                    </div>
                  )}
                </div>
              )}
              {/* Side column with smaller clips */}
              <div className="pan-editorial-side">
                <div className="pan-editorial-vol">
                  <span>capitoli</span>
                  <span>{Math.min(galleryImages.length - 1, 5).toString().padStart(2, '0')}</span>
                </div>
                {galleryImages.slice(1, 6).map((img, i) => (
                  <div key={i} className="pan-editorial-clip">
                    <div className="pan-editorial-clip-img">
                      <img src={img.url} alt={img.alt} loading="lazy" />
                    </div>
                    <div className="pan-editorial-clip-info">
                      <p className="pan-editorial-clip-num">— cap. {(i + 2).toString().padStart(2, '0')}</p>
                      <h4 className="pan-editorial-clip-title">{img.caption || img.alt}</h4>
                      <p className="pan-editorial-clip-cap">
                        {img.alt}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </section>
      )}

      {/* EVENTS — horizontal timeline */}
      {tier !== 'basic' && events && events.length > 0 && (
        <section className="pan-section" style={{ background: paperWarm, maxWidth: 'none', padding: '6rem 0' }}>
          <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 2rem' }}>
            <Reveal>
              <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
                <p className="pan-section-eyebrow" style={{ justifyContent: 'center' }}>cronologia</p>
                <h2 className="pan-section-title">Date<br />da <em style={{ color: accent, fontStyle: 'italic' }}>segnare</em>.</h2>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="pan-timeline">
                <div className="pan-timeline-line" />
                <div className="pan-timeline-track">
                  {events.map((ev, i) => {
                    const d = new Date(ev.date)
                    return (
                      <div key={i} className="pan-timeline-event">
                        <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                          <div className="pan-timeline-day">{d.getDate().toString().padStart(2, '0')}</div>
                          <div className="pan-timeline-month">
                            {d.toLocaleDateString('it-IT', { month: 'long' })}
                          </div>
                        </div>
                        <div className="pan-timeline-card">
                          <h3 className="pan-timeline-title">{ev.title}</h3>
                          {ev.description && (
                            <p className="pan-timeline-desc">{ev.description}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* RESERVATION (Pro+) */}
      {tier !== 'basic' && (
        <section id="prenotazioni" className="pan-section" style={{ maxWidth: 800 }}>
          <Reveal>
            <div style={{ marginBottom: '2.5rem' }}>
              <p className="pan-section-eyebrow">prenotazioni</p>
              <h2 className="pan-section-title">Vi aspettiamo.</h2>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <ReservationForm accent={accent} ink={ink} paper={paper} muted={muted} timeSlots={timeSlots} />
          </Reveal>
        </section>
      )}

      {/* PRESS BAR */}
      {reviews && (
        <section className="pan-press">
          <div className="pan-press-inner">
            <div className="pan-press-block">
              <span className="pan-press-stars">★★★★★</span>
              <span className="pan-press-score">{reviews.score.toFixed(1)}</span>
              <span className="pan-press-meta">/ 5 · {reviews.source}</span>
            </div>
            <div className="pan-press-pipe" />
            <div className="pan-press-block">
              <span className="pan-press-meta">{reviews.count}+ recensioni</span>
            </div>
            {chef?.years && (
              <>
                <div className="pan-press-pipe" />
                <div className="pan-press-block">
                  <span className="pan-press-meta">{chef.years}+ anni di cucina</span>
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* CHEF */}
      {chef && (
        <section className="pan-chef">
          <Reveal>
            <div className="pan-chef-photo">
              {chef.photo && <img src={chef.photo} alt={chef.name} loading="lazy" />}
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div>
              <p className="pan-section-eyebrow">lo chef</p>
              <p className="pan-chef-quote">"{chef.quote}"</p>
              <p className="pan-chef-name">{chef.name}</p>
              <p className="pan-chef-role">— {chef.role}</p>
            </div>
          </Reveal>
        </section>
      )}

      {/* REVIEWS */}
      {reviews && reviews.items.length > 0 && (
        <section className="pan-reviews" style={{ background: paperWarm, maxWidth: 'none', padding: '8rem 2rem' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <Reveal>
              <div style={{ marginBottom: '4rem' }}>
                <p className="pan-section-eyebrow" style={{ textAlign: 'center', justifyContent: 'center' }}>recensioni</p>
                <h2 className="pan-section-title" style={{ textAlign: 'center' }}>Le voci dei nostri ospiti.</h2>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div style={{ position: 'relative' }}>
                {reviews.items.map((rev, i) => (
                  <div key={i} className={`pan-review ${i === reviewIdx ? 'active' : ''}`}>
                    <div className="pan-review-stars">{'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}</div>
                    <p className="pan-review-text">{rev.text}</p>
                    <p className="pan-review-byline">
                      <span className="pan-review-author">{rev.author}</span> · {rev.source || reviews.source}{rev.date ? ` · ${rev.date}` : ''}
                    </p>
                  </div>
                ))}
                <div className="pan-review-nav">
                  {reviews.items.map((_, i) => (
                    <button key={i} type="button" className={`pan-review-dot ${i === reviewIdx ? 'active' : ''}`} onClick={() => setReviewIdx(i)} aria-label={`Recensione ${i + 1}`} />
                  ))}
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.15}>
              <div style={{ marginTop: '4rem' }}>
                <LeaveReviewForm accent={accent} theme="light" scope="pan-lr" labelFont="Cormorant Garamond" />
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* FAQ */}
      {faq && faq.length > 0 && (
        <section className="pan-faq">
          <Reveal>
            <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
              <p className="pan-section-eyebrow" style={{ justifyContent: 'center' }}>domande</p>
              <h2 className="pan-section-title">Le domande più frequenti.</h2>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div>
              {faq.map((item, i) => (
                <div key={i} className={`pan-faq-item ${openFaq === i ? 'open' : ''}`}>
                  <button className="pan-faq-q" type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    <span>{item.q}</span>
                    <span className="pan-faq-icon">+</span>
                  </button>
                  <div className="pan-faq-a">
                    <p>{item.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </section>
      )}

      {/* NEWSLETTER */}
      <section className="pan-newsletter">
        <h2>Restate in <em style={{ color: accent, fontStyle: 'italic' }}>contatto</em>.</h2>
        <p>Iscrivetevi per scoprire piatti stagionali, eventi e serate speciali. Una mail al mese, niente più.</p>
        <form className="pan-newsletter-form" style={{ flexWrap: 'wrap' }} onSubmit={e => { e.preventDefault(); const b = e.currentTarget.querySelector('button')!; b.textContent = '✓ Iscritto'; }}>
          <input type="email" required placeholder="il vostro indirizzo email" />
          <button type="submit">Iscriviti</button>
          <GdprConsent accent={accent} color={muted} />
        </form>
      </section>

      {/* CONTACT */}
      <section id="contatti" className="pan-section">
        <Reveal>
          <div style={{ marginBottom: '3rem' }}>
            <p className="pan-section-eyebrow">contatti</p>
            <h2 className="pan-section-title">Veniteci a trovare.</h2>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="pan-contact">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {address && (
                <div>
                  <p style={{ fontSize: '0.7rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: accent, marginBottom: '0.4rem', fontWeight: 500 }}>indirizzo</p>
                  <p style={{ fontSize: '1.05rem', lineHeight: 1.5, color: ink }}>{address}</p>
                </div>
              )}
              {phone && (
                <div>
                  <p style={{ fontSize: '0.7rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: accent, marginBottom: '0.4rem', fontWeight: 500 }}>telefono</p>
                  <a href={`tel:${phone}`} style={{ fontSize: '1.05rem', color: ink, textDecoration: 'none' }}>{phone}</a>
                </div>
              )}
              {email && (
                <div>
                  <p style={{ fontSize: '0.7rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: accent, marginBottom: '0.4rem', fontWeight: 500 }}>email</p>
                  <a href={`mailto:${email}`} style={{ fontSize: '1.05rem', color: ink, textDecoration: 'none' }}>{email}</a>
                </div>
              )}
              {hours && (
                <div>
                  <p style={{ fontSize: '0.7rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: accent, marginBottom: '0.75rem', fontWeight: 500 }}>orari</p>
                  <div style={{ display: 'grid', gap: '0.35rem' }}>
                    {Object.entries(hours).map(([day, h]) => (
                      <div key={day} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                        <span style={{ color: muted }}>{DAY_NAMES[day]}</span>
                        <span style={{ color: ink }}>{h.closed ? 'Chiuso' : `${h.open} – ${h.close}`}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {socialLinks && (
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  {Object.entries(socialLinks).map(([name, url]) => (
                    <a key={name} href={url} target="_blank" rel="noopener noreferrer"
                      style={{
                        padding: '0.5rem 1.1rem',
                        border: `1px solid ${ink}`,
                        color: ink,
                        textDecoration: 'none',
                        fontSize: '0.7rem',
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        transition: 'all 0.3s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = ink; e.currentTarget.style.color = paper }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = ink }}
                    >
                      {name}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {mapsUrl && (
              <div style={{ overflow: 'hidden', minHeight: 420, border: `1px solid ${line}` }}>
                <iframe src={mapsUrl} width="100%" height="100%" style={{ border: 0 }} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              </div>
            )}
          </div>
        </Reveal>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: '3rem 2rem', textAlign: 'center', borderTop: `1px solid ${line}`, background: paperWarm }}>
        <p style={{ fontSize: '0.75rem', color: muted, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          © {new Date().getFullYear()} {restaurantName}
        </p>
      </footer>

      {/* WhatsApp FAB (Premium) */}
      {tier === 'premium' && whatsappNumber && (
        <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="pan-fab">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.84 14.18c-.25.7-1.21 1.28-1.99 1.45-.54.11-1.24.21-3.6-.75-3.03-1.26-4.97-4.35-5.12-4.55-.15-.2-1.22-1.62-1.22-3.09 0-1.47.77-2.19 1.04-2.49.27-.3.59-.37.79-.37.2 0 .39.01.57.02.18.01.42-.07.66.5.25.59.84 2.03.91 2.18.07.15.13.32.02.52-.1.2-.15.32-.3.5-.15.18-.32.4-.45.54-.15.15-.31.31-.13.61.18.3.81 1.33 1.74 2.15 1.19 1.06 2.2 1.39 2.5 1.55.3.15.47.13.65-.08.18-.21.75-.87.95-1.17.2-.3.39-.25.66-.15.27.1 1.71.81 2 .96.3.15.49.22.56.35.07.13.07.74-.18 1.43z"/>
          </svg>
        </a>
      )}

      <StickyMobileBar
        phone={phone}
        address={address}
        hasReservation={tier !== 'basic'}
        whatsapp={tier === 'premium' ? whatsappNumber : undefined}
        accent={accent}
        theme="light"
        scope="pan-smb"
      />
    </div>
  )
}
