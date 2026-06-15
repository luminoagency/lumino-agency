'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { StickyMobileBar } from '../_shared/StickyMobileBar'
import { AllergenBadges } from '../_shared/AllergenBadges'
import { LeaveReviewForm } from '../_shared/LeaveReviewForm'

interface AuroraProps {
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

function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('aur-visible')
          observer.unobserve(el)
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return ref
}

function FadeIn({ children, delay = 0, className = '' }: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const ref = useFadeIn()
  return (
    <div ref={ref} className={`aur-fade ${className}`} style={{ transitionDelay: `${delay}s` }}>
      {children}
    </div>
  )
}

interface RippleButtonProps {
  children: React.ReactNode
  onClick?: () => void
  href?: string
  style?: React.CSSProperties
  accent: string
  variant?: 'primary' | 'ghost'
}

function RippleButton({ children, onClick, href, style, accent, variant = 'primary' }: RippleButtonProps) {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([])
  const idRef = useRef(0)

  const handleClick = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const id = ++idRef.current
    setRipples(prev => [...prev, { x, y, id }])
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 900)
    onClick?.()
  }, [onClick])

  const baseStyle: React.CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    border: 'none',
    cursor: 'pointer',
    padding: '1rem 2.5rem',
    borderRadius: 999,
    fontSize: '0.9rem',
    fontWeight: 600,
    letterSpacing: '0.05em',
    fontFamily: 'inherit',
    textTransform: 'uppercase' as const,
    transition: 'transform 0.3s, box-shadow 0.3s',
    background: variant === 'primary' ? accent : 'transparent',
    color: variant === 'primary' ? '#0a0612' : accent,
    boxShadow: variant === 'primary' ? `0 8px 32px ${accent}55, 0 0 0 1px ${accent}33 inset` : `inset 0 0 0 1px ${accent}80`,
    display: 'inline-block',
    textDecoration: 'none',
    textAlign: 'center' as const,
    ...style,
  }

  const content = (
    <>
      <span style={{ position: 'relative', zIndex: 2 }}>{children}</span>
      {ripples.map(r => (
        <span
          key={r.id}
          className="aur-ripple"
          style={{
            left: r.x,
            top: r.y,
            background: variant === 'primary' ? 'rgba(255,255,255,0.6)' : `${accent}88`,
          }}
        />
      ))}
    </>
  )

  if (href) {
    return (
      <a href={href} onClick={handleClick as any} style={baseStyle} className="aur-btn">
        {content}
      </a>
    )
  }
  return (
    <button onClick={handleClick} style={baseStyle} className="aur-btn" type="button">
      {content}
    </button>
  )
}

function GlowCard({ children, accent, style, className = '' }: {
  children: React.ReactNode
  accent: string
  style?: React.CSSProperties
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  const handleMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    el.style.setProperty('--mx', `${x}%`)
    el.style.setProperty('--my', `${y}%`)
  }, [])

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      className={`aur-glow-card ${className}`}
      style={{
        ['--accent' as any]: accent,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function ReservationForm({ accent, timeSlots }: { accent: string; timeSlots?: string[] }) {
  const [submitted, setSubmitted] = useState(false)
  const [pickedSlot, setPickedSlot] = useState<string | null>(null)
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.95rem 1.1rem',
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12, color: '#f4f1ff', fontSize: '0.92rem', fontFamily: 'inherit',
    outline: 'none', boxSizing: 'border-box' as const,
    transition: 'all 0.3s',
    backdropFilter: 'blur(20px)',
  }

  if (submitted) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <div style={{ width: 80, height: 80, margin: '0 auto 2rem', borderRadius: '50%', background: `radial-gradient(circle, ${accent}66, transparent 70%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>✨</div>
        <h3 style={{ fontSize: '2rem', fontWeight: 300, marginBottom: '1rem', color: '#f4f1ff', letterSpacing: '-0.02em' }}>Prenotazione ricevuta</h3>
        <p style={{ color: 'rgba(244,241,255,0.6)' }}>Ti contattiamo a breve per confermare.</p>
      </div>
    )
  }

  return (
    <form onSubmit={e => { e.preventDefault(); setSubmitted(true) }}
      style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {timeSlots && timeSlots.length > 0 && (
        <div className="aur-slots">
          <div className="aur-slots-title">Disponibilità per stasera</div>
          <div className="aur-slots-row">
            {timeSlots.map(slot => (
              <button key={slot} type="button" className={`aur-slot ${pickedSlot === slot ? 'active' : ''}`} onClick={() => setPickedSlot(slot)}>
                {slot}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="aur-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <input required type="text" placeholder="Nome" style={inputStyle} />
        <input required type="text" placeholder="Cognome" style={inputStyle} />
      </div>
      <div className="aur-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <input required type="email" placeholder="Email" style={inputStyle} />
        <input required type="tel" placeholder="Telefono" style={inputStyle} />
      </div>
      <div className="aur-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
        <input required type="date" style={inputStyle} />
        <input required type="time" value={pickedSlot || ''} onChange={e => setPickedSlot(e.target.value)} style={inputStyle} />
        <input required type="number" min={1} max={20} placeholder="Persone" style={inputStyle} />
      </div>
      <textarea placeholder="Note (allergie, occasione speciale...)" rows={3} style={inputStyle} />
      <RippleButton accent={accent} style={{ marginTop: '1rem', alignSelf: 'flex-start' }}>
        Prenota ora
      </RippleButton>
    </form>
  )
}

export function AuroraTemplate(props: AuroraProps) {
  const {
    restaurantName, tagline, description, heroImage, heroImages, aboutImage,
    menuCategories = [], galleryImages = [],
    address, phone, email, hours, mapsUrl, socialLinks,
    accentColor = '#a78bfa', logoUrl,
    tier = 'basic', events = [], whatsappNumber,
    chef, reviews, faq, timeSlots,
  } = props

  const accent = accentColor
  const accent2 = '#f0abfc'  // pink
  const accent3 = '#60a5fa'  // blue
  const bg = '#08060f'
  const text = '#f4f1ff'
  const muted = 'rgba(244,241,255,0.6)'

  const [activeCategory, setActiveCategory] = useState(0)
  const menuScrollRef = useRef<HTMLDivElement>(null)
  const [cursorPos, setCursorPos] = useState({ x: 50, y: 50 })
  const [carouselIdx, setCarouselIdx] = useState(0)

  // Hero rotating images
  const heroSlides = heroImages && heroImages.length > 0 ? heroImages : [heroImage]
  const [heroIdx, setHeroIdx] = useState(0)
  useEffect(() => {
    if (heroSlides.length < 2) return
    const t = setInterval(() => setHeroIdx(i => (i + 1) % heroSlides.length), 5000)
    return () => clearInterval(t)
  }, [heroSlides.length])

  const [reviewIdx, setReviewIdx] = useState(0)
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [pickedSlot, setPickedSlot] = useState<string | null>(null)

  useEffect(() => {
    if (menuScrollRef.current) menuScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' })
  }, [activeCategory])

  // Auto-advance the gallery carousel every 5s
  useEffect(() => {
    if (!galleryImages.length) return
    const interval = setInterval(() => {
      setCarouselIdx(i => (i + 1) % Math.min(galleryImages.length, 6))
    }, 5000)
    return () => clearInterval(interval)
  }, [galleryImages.length])

  // Cursor follower
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handler, { passive: true })
    return () => window.removeEventListener('mousemove', handler)
  }, [])

  return (
    <div style={{ background: bg, color: text, fontFamily: '"Inter", system-ui, sans-serif', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@200;300;400;500;600;700&family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,600;9..144,700&display=swap');

        body { background: #08060f; }

        /* Aurora animated background */
        .aur-aurora {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          overflow: hidden;
        }
        .aur-aurora::before, .aur-aurora::after {
          content: '';
          position: absolute;
          width: 60vw;
          height: 60vw;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.45;
          animation: aurFloat 22s ease-in-out infinite;
        }
        .aur-aurora::before {
          background: radial-gradient(circle, ${accent} 0%, transparent 70%);
          top: -20%;
          left: -10%;
        }
        .aur-aurora::after {
          background: radial-gradient(circle, ${accent2} 0%, transparent 70%);
          bottom: -20%;
          right: -10%;
          animation-delay: -11s;
          animation-duration: 28s;
        }
        .aur-aurora-3 {
          position: absolute;
          width: 50vw;
          height: 50vw;
          top: 30%;
          left: 30%;
          border-radius: 50%;
          background: radial-gradient(circle, ${accent3} 0%, transparent 70%);
          filter: blur(80px);
          opacity: 0.35;
          animation: aurFloat 26s ease-in-out infinite;
          animation-delay: -7s;
        }
        @keyframes aurFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20vw, -10vh) scale(1.1); }
          50% { transform: translate(-15vw, 15vh) scale(0.9); }
          75% { transform: translate(10vw, 20vh) scale(1.05); }
        }

        /* Floating particles */
        .aur-particles {
          position: fixed;
          inset: 0;
          z-index: 1;
          pointer-events: none;
        }
        .aur-particle {
          position: absolute;
          width: 2px;
          height: 2px;
          background: ${text};
          border-radius: 50%;
          opacity: 0;
          animation: aurParticle 12s linear infinite;
          box-shadow: 0 0 6px ${accent2};
        }
        @keyframes aurParticle {
          0% { transform: translateY(100vh) scale(0); opacity: 0; }
          10% { opacity: 0.8; }
          90% { opacity: 0.8; }
          100% { transform: translateY(-10vh) scale(1.5); opacity: 0; }
        }

        /* Cursor glow */
        .aur-cursor-glow {
          position: fixed;
          width: 400px;
          height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, ${accent}25 0%, transparent 60%);
          pointer-events: none;
          z-index: 2;
          transform: translate(-50%, -50%);
          mix-blend-mode: screen;
          transition: transform 0.15s ease-out;
        }

        /* Content above effects */
        .aur-content {
          position: relative;
          z-index: 10;
        }

        /* Fade-in */
        .aur-fade {
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 1s cubic-bezier(0.16, 1, 0.3, 1), transform 1s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .aur-fade.aur-visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* Ripple */
        .aur-ripple {
          position: absolute;
          border-radius: 50%;
          width: 0;
          height: 0;
          transform: translate(-50%, -50%);
          animation: aurRipple 0.9s ease-out forwards;
          pointer-events: none;
          z-index: 1;
        }
        @keyframes aurRipple {
          0% { width: 0; height: 0; opacity: 0.8; }
          100% { width: 500px; height: 500px; opacity: 0; }
        }

        .aur-btn:hover {
          transform: translateY(-2px);
        }
        .aur-btn[style*="background: ${accent}"]:hover {
          box-shadow: 0 12px 40px ${accent}77, 0 0 0 1px ${accent}55 inset !important;
        }

        /* Glow card with cursor-following highlight */
        .aur-glow-card {
          position: relative;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 1.75rem;
          overflow: hidden;
          transition: transform 0.4s, border-color 0.4s, background 0.4s;
          backdrop-filter: blur(20px);
        }
        .aur-glow-card::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 20px;
          background: radial-gradient(400px circle at var(--mx, 50%) var(--my, 50%), var(--accent), transparent 40%);
          opacity: 0;
          transition: opacity 0.4s;
          pointer-events: none;
        }
        .aur-glow-card:hover::before {
          opacity: 0.15;
        }
        .aur-glow-card:hover {
          border-color: rgba(255,255,255,0.18);
          background: rgba(255,255,255,0.05);
          transform: translateY(-4px);
        }

        /* Hero text reveal */
        .aur-hero-name {
          opacity: 0;
          animation: aurReveal 1.6s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards;
        }
        @keyframes aurReveal {
          0% { opacity: 0; letter-spacing: 0.3em; filter: blur(20px); }
          100% { opacity: 1; letter-spacing: -0.04em; filter: blur(0); }
        }
        .aur-hero-tag {
          opacity: 0;
          animation: aurFadeUp 1.2s cubic-bezier(0.16, 1, 0.3, 1) 1.1s forwards;
        }
        @keyframes aurFadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Pulsing accent line */
        .aur-pulse-line {
          width: 60px;
          height: 2px;
          background: ${accent};
          opacity: 0;
          animation: aurPulseLine 2s cubic-bezier(0.16, 1, 0.3, 1) 0.8s forwards;
          box-shadow: 0 0 12px ${accent};
        }
        @keyframes aurPulseLine {
          0% { width: 0; opacity: 0; }
          100% { width: 100px; opacity: 1; }
        }

        /* Menu pills */
        .aur-pill {
          padding: 0.6rem 1.4rem;
          border-radius: 999px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          color: ${muted};
          font-size: 0.85rem;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: all 0.3s;
          white-space: nowrap;
          text-transform: uppercase;
          font-weight: 500;
          backdrop-filter: blur(20px);
        }
        .aur-pill:hover {
          color: ${text};
          border-color: ${accent}80;
          background: rgba(255,255,255,0.06);
        }
        .aur-pill-on {
          background: ${accent};
          color: #0a0612;
          border-color: ${accent};
          box-shadow: 0 0 24px ${accent}77;
        }

        /* Menu scroll */
        .aur-menu-scroll {
          display: flex;
          gap: 1.25rem;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          padding: 1rem 0 2rem;
          scrollbar-width: none;
        }
        .aur-menu-scroll::-webkit-scrollbar { display: none; }

        .aur-menu-item {
          flex: 0 0 320px;
          scroll-snap-align: start;
        }

        /* Gallery */
        .aur-gallery-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-auto-rows: 240px;
          gap: 1rem;
        }
        .aur-gallery-grid > div:nth-child(1) { grid-row: span 2; }
        .aur-gallery-grid > div:nth-child(4) { grid-column: span 2; }
        .aur-gallery-item {
          position: relative;
          overflow: hidden;
          border-radius: 16px;
          cursor: pointer;
          transition: transform 0.5s;
        }
        .aur-gallery-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .aur-gallery-item:hover { transform: scale(1.02); }
        .aur-gallery-item:hover img { transform: scale(1.1); }
        .aur-gallery-item::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, ${accent}66 0%, transparent 50%, ${accent2}66 100%);
          opacity: 0;
          transition: opacity 0.4s;
        }
        .aur-gallery-item:hover::after { opacity: 0.4; }

        /* ── PRESS / RATINGS BAR ── */
        .aur-press {
          padding: 2.5rem 2rem;
          border-top: 1px solid rgba(255,255,255,0.05);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          background: rgba(255,255,255,0.02);
          backdrop-filter: blur(12px);
        }
        .aur-press-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          gap: 2.5rem;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
        }
        .aur-press-block { display: flex; align-items: center; gap: 0.85rem; }
        .aur-press-stars { font-size: 1.3rem; color: ${accent}; letter-spacing: 0.15em; text-shadow: 0 0 18px ${accent}66; }
        .aur-press-score {
          font-family: 'Fraunces', serif;
          font-style: italic;
          font-size: 2.2rem;
          font-weight: 400;
          line-height: 1;
          color: ${text};
          letter-spacing: -0.03em;
        }
        .aur-press-meta {
          font-size: 0.75rem;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: ${muted};
          font-weight: 500;
        }
        .aur-press-pipe { width: 1px; height: 30px; background: rgba(255,255,255,0.15); }

        /* ── CHEF section ── */
        .aur-chef {
          padding: 8rem 2rem;
          max-width: 1300px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1.1fr;
          gap: 5rem;
          align-items: center;
        }
        .aur-chef-photo {
          position: relative;
          aspect-ratio: 4/5;
          overflow: hidden;
          border-radius: 24px;
        }
        .aur-chef-photo::before {
          content: '';
          position: absolute;
          inset: -2px;
          padding: 2px;
          border-radius: 24px;
          background: conic-gradient(from 0deg, ${accent}, ${accent2}, ${accent3}, ${accent});
          z-index: 0;
          animation: aurOrbSpin 8s linear infinite;
        }
        .aur-chef-photo > div {
          position: absolute;
          inset: 2px;
          border-radius: 22px;
          overflow: hidden;
          z-index: 1;
        }
        .aur-chef-photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: 1;
        }
        .aur-chef-badge {
          position: absolute;
          top: 16px;
          left: 16px;
          padding: 6px 12px;
          background: rgba(0,0,0,0.55);
          backdrop-filter: blur(10px);
          color: ${text};
          font-size: 0.7rem;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          font-weight: 500;
          border-radius: 100px;
          border: 1px solid ${accent}55;
          z-index: 5;
        }
        .aur-chef-quote {
          font-family: 'Fraunces', serif;
          font-size: clamp(1.5rem, 2.5vw, 2.2rem);
          font-weight: 300;
          line-height: 1.3;
          letter-spacing: -0.01em;
          color: ${text};
          font-style: italic;
          margin-bottom: 2rem;
          position: relative;
          padding-left: 1.5rem;
        }
        .aur-chef-quote::before {
          content: '“';
          position: absolute;
          left: -0.3rem;
          top: -1rem;
          font-size: 5rem;
          line-height: 1;
          color: ${accent};
          font-family: 'Fraunces', serif;
          opacity: 0.7;
        }
        .aur-chef-name {
          font-family: 'Fraunces', serif;
          font-size: 1.5rem;
          font-weight: 400;
          letter-spacing: -0.02em;
          color: ${text};
        }
        .aur-chef-role {
          font-size: 0.75rem;
          letter-spacing: 0.3em;
          color: ${accent};
          text-transform: uppercase;
          margin-top: 0.4rem;
          font-weight: 500;
        }

        /* ── REVIEWS ── */
        .aur-reviews {
          padding: 8rem 2rem;
          max-width: 900px;
          margin: 0 auto;
          text-align: center;
        }
        .aur-review {
          display: none;
          opacity: 0;
        }
        .aur-review.active {
          display: block;
          animation: aurReviewIn 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        @keyframes aurReviewIn {
          from { opacity: 0; transform: translateY(15px); filter: blur(8px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        .aur-review-stars {
          color: ${accent};
          font-size: 1.3rem;
          letter-spacing: 0.2em;
          margin-bottom: 2rem;
          text-shadow: 0 0 18px ${accent}77;
        }
        .aur-review-text {
          font-family: 'Fraunces', serif;
          font-size: clamp(1.3rem, 2.2vw, 1.9rem);
          font-weight: 300;
          line-height: 1.4;
          color: ${text};
          letter-spacing: -0.01em;
          margin-bottom: 2.5rem;
          font-style: italic;
        }
        .aur-review-byline {
          font-size: 0.95rem;
          color: ${muted};
          letter-spacing: 0.05em;
        }
        .aur-review-author { color: ${text}; font-weight: 500; }
        .aur-review-nav {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-top: 3rem;
        }
        .aur-review-dot {
          width: 30px;
          height: 2px;
          background: rgba(255,255,255,0.15);
          border: none;
          cursor: pointer;
          padding: 0;
          transition: background 0.3s, width 0.3s, box-shadow 0.3s;
        }
        .aur-review-dot.active {
          background: ${accent};
          width: 50px;
          box-shadow: 0 0 18px ${accent}77;
        }

        /* ── FAQ ── */
        .aur-faq-list {
          max-width: 850px;
          margin: 0 auto;
        }
        .aur-faq-item {
          border-radius: 18px;
          margin-bottom: 12px;
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.06);
          backdrop-filter: blur(16px);
          overflow: hidden;
          transition: border-color 0.3s, background 0.3s;
        }
        .aur-faq-item.open {
          border-color: ${accent}55;
          background: rgba(255,255,255,0.04);
        }
        .aur-faq-q {
          width: 100%;
          background: none;
          border: none;
          padding: 1.5rem 1.75rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: ${text};
          font-family: 'Fraunces', serif;
          font-style: italic;
          font-size: 1.2rem;
          font-weight: 400;
          letter-spacing: -0.01em;
          cursor: pointer;
          text-align: left;
          gap: 1rem;
        }
        .aur-faq-q:hover { color: ${accent}; }
        .aur-faq-icon {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: rgba(255,255,255,0.06);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          font-weight: 600;
          color: ${accent};
          transition: transform 0.4s, background 0.3s, box-shadow 0.3s;
          flex-shrink: 0;
        }
        .aur-faq-item.open .aur-faq-icon {
          transform: rotate(45deg);
          background: ${accent};
          color: #0a0612;
          box-shadow: 0 0 18px ${accent}77;
        }
        .aur-faq-a {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.5s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .aur-faq-item.open .aur-faq-a { max-height: 400px; }
        .aur-faq-a p {
          padding: 0 1.75rem 1.5rem;
          color: ${muted};
          line-height: 1.7;
          font-size: 0.95rem;
        }

        /* ── NEWSLETTER ── */
        .aur-newsletter {
          padding: 6rem 2rem;
          text-align: center;
          position: relative;
        }
        .aur-newsletter-inner {
          max-width: 600px;
          margin: 0 auto;
          padding: 3rem 2rem;
          background: rgba(255,255,255,0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 28px;
          position: relative;
          overflow: hidden;
        }
        .aur-newsletter-inner::before {
          content: '';
          position: absolute;
          inset: -50%;
          background:
            radial-gradient(circle at 20% 30%, ${accent}33, transparent 50%),
            radial-gradient(circle at 80% 70%, ${accent2}33, transparent 50%);
          filter: blur(40px);
          z-index: 0;
          animation: aurFloat 12s ease-in-out infinite;
        }
        .aur-newsletter-inner > * { position: relative; z-index: 1; }
        .aur-newsletter h2 {
          font-family: 'Fraunces', serif;
          font-size: clamp(1.8rem, 3vw, 2.6rem);
          font-weight: 300;
          letter-spacing: -0.03em;
          margin-bottom: 1rem;
        }
        .aur-newsletter p {
          color: ${muted};
          margin-bottom: 2rem;
          font-size: 1rem;
        }
        .aur-newsletter-form {
          display: flex;
          gap: 8px;
        }
        .aur-newsletter input {
          flex: 1;
          padding: 1rem 1.25rem;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          color: ${text};
          font-family: inherit;
          font-size: 0.95rem;
          outline: none;
          transition: border-color 0.3s;
        }
        .aur-newsletter input:focus { border-color: ${accent}; }
        .aur-newsletter input::placeholder { color: ${muted}; }
        .aur-newsletter button {
          padding: 1rem 1.75rem;
          background: ${accent};
          color: #0a0612;
          border: none;
          border-radius: 12px;
          font-family: inherit;
          font-size: 0.85rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          transition: transform 0.3s, box-shadow 0.3s;
        }
        .aur-newsletter button:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px ${accent}55;
        }

        /* ── Time slots ── */
        .aur-slots { margin: 0 0 1.5rem; }
        .aur-slots-title {
          font-size: 0.7rem;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: ${accent};
          margin-bottom: 0.75rem;
          font-weight: 500;
        }
        .aur-slots-row { display: flex; gap: 8px; flex-wrap: wrap; }
        .aur-slot {
          padding: 0.7rem 1.1rem;
          background: rgba(255,255,255,0.04);
          color: ${text};
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 100px;
          cursor: pointer;
          font-family: inherit;
          font-size: 0.85rem;
          transition: all 0.25s;
        }
        .aur-slot:hover { border-color: ${accent}; color: ${accent}; box-shadow: 0 0 18px ${accent}33; }
        .aur-slot.active {
          background: ${accent};
          color: #0a0612;
          border-color: ${accent};
          box-shadow: 0 0 24px ${accent}77;
        }

        @media (max-width: 768px) {
          .aur-chef { grid-template-columns: 1fr; gap: 3rem; padding: 5rem 1.5rem; }
          .aur-press-inner { gap: 1.5rem; }
          .aur-press-pipe { display: none; }
          .aur-newsletter-form { flex-direction: column; }
        }

        /* GLOW CAROUSEL gallery */
        .aur-carousel {
          position: relative;
          padding: 2rem 0;
        }
        .aur-carousel-stage {
          position: relative;
          aspect-ratio: 16/9;
          max-width: 900px;
          margin: 0 auto;
          border-radius: 24px;
          overflow: hidden;
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.08) inset,
            0 30px 100px ${accent}40;
        }
        .aur-carousel-stage::before {
          content: '';
          position: absolute;
          inset: -30px;
          background:
            radial-gradient(circle at 30% 30%, ${accent}55, transparent 60%),
            radial-gradient(circle at 70% 70%, ${accent2}55, transparent 60%);
          filter: blur(50px);
          z-index: -1;
          opacity: 0.7;
          animation: aurPulseBg 5s ease-in-out infinite alternate;
        }
        @keyframes aurPulseBg {
          0% { opacity: 0.5; transform: scale(0.95); }
          100% { opacity: 0.9; transform: scale(1.05); }
        }
        .aur-carousel-slide {
          position: absolute;
          inset: 0;
          opacity: 0;
          transition: opacity 0.9s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .aur-carousel-slide.active { opacity: 1; }
        .aur-carousel-slide img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .aur-carousel-cap {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          padding: 3rem 2rem 1.5rem;
          background: linear-gradient(to top, rgba(8,6,15,0.9), transparent);
          font-family: 'Fraunces', serif;
          font-size: 1.3rem;
          font-style: italic;
          color: ${text};
          z-index: 2;
        }
        .aur-carousel-counter {
          position: absolute;
          top: 1.5rem;
          right: 1.5rem;
          z-index: 3;
          font-family: 'Inter', sans-serif;
          font-size: 0.75rem;
          letter-spacing: 0.25em;
          color: ${text};
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(10px);
          padding: 0.4rem 0.8rem;
          border-radius: 100px;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .aur-carousel-thumbs {
          display: flex;
          gap: 0.75rem;
          justify-content: center;
          flex-wrap: wrap;
          margin-top: 2rem;
          max-width: 900px;
          margin-left: auto;
          margin-right: auto;
        }
        .aur-carousel-thumb {
          flex: 0 0 70px;
          aspect-ratio: 1;
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.4s;
          position: relative;
          opacity: 0.45;
          border: 2px solid transparent;
        }
        .aur-carousel-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .aur-carousel-thumb:hover { opacity: 0.75; transform: translateY(-2px); }
        .aur-carousel-thumb.active {
          opacity: 1;
          border-color: ${accent};
          box-shadow: 0 0 24px ${accent}77;
        }

        /* CELESTIAL EVENTS — glowing orbs flowing diagonally */
        .aur-celestial {
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
          max-width: 900px;
          margin: 0 auto;
        }
        .aur-celestial-event {
          display: grid;
          grid-template-columns: 120px 1fr;
          gap: 2rem;
          align-items: center;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          padding: 2rem;
          border-radius: 24px;
          backdrop-filter: blur(20px);
          position: relative;
          overflow: hidden;
          transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.5s;
        }
        .aur-celestial-event:nth-child(odd) { margin-left: 8%; }
        .aur-celestial-event:nth-child(even) { margin-right: 8%; }
        .aur-celestial-event::before {
          content: '';
          position: absolute;
          width: 280px;
          height: 280px;
          border-radius: 50%;
          filter: blur(60px);
          opacity: 0.45;
          pointer-events: none;
          transition: opacity 0.5s;
        }
        .aur-celestial-event:nth-child(1)::before {
          background: ${accent};
          left: -80px;
          top: -80px;
        }
        .aur-celestial-event:nth-child(2)::before {
          background: ${accent2};
          right: -80px;
          top: -80px;
        }
        .aur-celestial-event:nth-child(3)::before {
          background: ${accent3};
          left: -80px;
          bottom: -80px;
        }
        .aur-celestial-event:nth-child(4)::before {
          background: ${accent2};
          right: -80px;
          bottom: -80px;
        }
        .aur-celestial-event:hover {
          transform: translateY(-6px) scale(1.01);
          border-color: rgba(255,255,255,0.2);
        }
        .aur-celestial-event:hover::before {
          opacity: 0.7;
        }
        .aur-celestial-event > * { position: relative; z-index: 1; }
        .aur-celestial-orb {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: ${text};
          background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.15), transparent 60%);
          position: relative;
        }
        .aur-celestial-orb::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: conic-gradient(from 0deg, ${accent}, ${accent2}, ${accent3}, ${accent});
          z-index: -1;
          animation: aurOrbSpin 6s linear infinite;
        }
        .aur-celestial-orb::after {
          content: '';
          position: absolute;
          inset: 2px;
          border-radius: 50%;
          background: #0a0612;
          z-index: -1;
        }
        @keyframes aurOrbSpin {
          to { transform: rotate(360deg); }
        }
        .aur-celestial-orb-day {
          font-family: 'Fraunces', serif;
          font-size: 2.6rem;
          font-weight: 400;
          line-height: 1;
          letter-spacing: -0.03em;
        }
        .aur-celestial-orb-month {
          font-family: 'Inter', sans-serif;
          font-size: 0.65rem;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: ${accent};
          margin-top: 0.3rem;
        }
        .aur-celestial-content { flex: 1; }
        .aur-celestial-tag {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 0.7rem;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: ${accent};
          margin-bottom: 0.85rem;
          font-weight: 500;
        }
        .aur-celestial-tag::before {
          content: '✦';
          font-size: 0.85rem;
        }
        .aur-celestial-title {
          font-family: 'Fraunces', serif;
          font-size: 1.7rem;
          font-weight: 400;
          margin-bottom: 0.5rem;
          letter-spacing: -0.01em;
          line-height: 1.15;
        }
        .aur-celestial-desc {
          color: ${muted};
          font-size: 0.95rem;
          line-height: 1.6;
        }

        @media (max-width: 768px) {
          .aur-celestial-event { grid-template-columns: 1fr; gap: 1.5rem; text-align: center; padding: 1.5rem; }
          .aur-celestial-event:nth-child(odd), .aur-celestial-event:nth-child(even) { margin-left: 0; margin-right: 0; }
          .aur-celestial-orb { width: 100px; height: 100px; margin: 0 auto; }
          .aur-celestial-orb-day { font-size: 2.2rem; }
          .aur-celestial-tag { justify-content: center; }
          .aur-carousel-thumb { flex: 0 0 56px; }
        }

        /* WhatsApp FAB */
        .aur-fab {
          position: fixed;
          bottom: 30px;
          right: 30px;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #25d366, #128c7e);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          text-decoration: none;
          z-index: 1000;
          box-shadow: 0 8px 32px rgba(37, 211, 102, 0.5);
          transition: transform 0.3s;
          animation: aurFloat2 3s ease-in-out infinite;
        }
        .aur-fab:hover { transform: scale(1.1) translateY(-4px); }
        @keyframes aurFloat2 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }

        @media (max-width: 768px) {
          .aur-form-row { grid-template-columns: 1fr !important; }
          .aur-menu-item { flex: 0 0 260px; }
          .aur-gallery-grid { grid-template-columns: repeat(2, 1fr); grid-auto-rows: 180px; }
          .aur-gallery-grid > div:nth-child(1) { grid-row: span 1; }
          .aur-gallery-grid > div:nth-child(4) { grid-column: span 1; }
          .aur-cursor-glow { display: none; }
        }
        @media (max-width: 480px) {
          .aur-gallery-grid { grid-template-columns: 1fr; }
          .aur-menu-item { flex: 0 0 240px; }
        }
      `}</style>

      {/* Animated aurora background */}
      <div className="aur-aurora">
        <div className="aur-aurora-3" />
      </div>

      {/* Floating particles */}
      <div className="aur-particles">
        {Array.from({ length: 30 }).map((_, i) => (
          <span
            key={i}
            className="aur-particle"
            style={{
              left: `${(i * 3.33) % 100}%`,
              animationDelay: `${i * 0.4}s`,
              animationDuration: `${10 + (i % 5) * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Cursor glow */}
      <div
        className="aur-cursor-glow"
        style={{ left: cursorPos.x, top: cursorPos.y }}
      />

      <div className="aur-content">
        {/* HERO */}
        <section style={{
          minHeight: '100vh',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '2rem',
          textAlign: 'center',
        }}>
          {logoUrl && (
            <div style={{ position: 'absolute', top: 40, left: '50%', transform: 'translateX(-50%)', opacity: 0.9 }}>
              <img src={logoUrl} alt={restaurantName} style={{ height: 50, filter: 'brightness(0) invert(1)' }} />
            </div>
          )}

          <div className="aur-pulse-line" />

          <h1 className="aur-hero-name" style={{
            fontFamily: 'Fraunces, serif',
            fontSize: 'clamp(3.5rem, 12vw, 10rem)',
            fontWeight: 300,
            margin: '2rem 0',
            lineHeight: 0.9,
            background: `linear-gradient(135deg, ${text} 0%, ${accent} 50%, ${accent2} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.04em',
          }}>
            {restaurantName}
          </h1>

          {tagline && (
            <p className="aur-hero-tag" style={{
              fontSize: 'clamp(1rem, 2vw, 1.4rem)',
              fontWeight: 300,
              color: muted,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              marginBottom: '3rem',
            }}>
              {tagline}
            </p>
          )}

          <div className="aur-hero-tag" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <RippleButton accent={accent} href="#menu">Esplora il menu</RippleButton>
            {tier !== 'basic' && (
              <RippleButton accent={accent} variant="ghost" href="#prenotazioni">Prenota un tavolo</RippleButton>
            )}
          </div>

          <div style={{
            position: 'absolute',
            bottom: 40,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            opacity: 0.5,
            animation: 'aurFloat2 2.5s ease-in-out infinite',
          }}>
            <div style={{ width: 1, height: 40, background: text }} />
            <span style={{ fontSize: '0.7rem', letterSpacing: '0.3em', textTransform: 'uppercase' }}>scroll</span>
          </div>
        </section>

        {/* ABOUT */}
        <section style={{ padding: '8rem 2rem', maxWidth: 1300, margin: '0 auto' }}>
          <FadeIn>
            <div style={{ display: 'grid', gridTemplateColumns: aboutImage ? '1fr 1fr' : '1fr', gap: '5rem', alignItems: 'center' }} className="aur-about-grid">
              {aboutImage && (
                <div style={{ position: 'relative', borderRadius: 24, overflow: 'hidden', aspectRatio: '4/5' }}>
                  <Image src={aboutImage} alt="" fill style={{ objectFit: 'cover' }} />
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: `linear-gradient(135deg, transparent 40%, ${accent}33 100%)`,
                    pointerEvents: 'none',
                  }} />
                </div>
              )}
              <div>
                <div style={{ width: 60, height: 2, background: accent, marginBottom: '2rem', boxShadow: `0 0 12px ${accent}` }} />
                <p style={{ fontSize: '0.85rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: accent, marginBottom: '1.5rem', fontWeight: 500 }}>
                  La nostra storia
                </p>
                <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 300, marginBottom: '2rem', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                  Un'esperienza<br />che si fa <em style={{ color: accent, fontStyle: 'italic' }}>luce</em>.
                </h2>
                <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: muted }}>
                  {description}
                </p>
              </div>
            </div>
          </FadeIn>
        </section>

        {/* MENU */}
        <section id="menu" style={{ padding: '6rem 2rem', maxWidth: 1400, margin: '0 auto' }}>
          <FadeIn>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <p style={{ fontSize: '0.85rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: accent, marginBottom: '1rem', fontWeight: 500 }}>
                Il menu
              </p>
              <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 300, letterSpacing: '-0.03em' }}>
                Piatti che <em style={{ color: accent, fontStyle: 'italic' }}>brillano</em>
              </h2>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '2rem' }}>
              {menuCategories.map((cat, i) => (
                <button
                  key={i}
                  className={`aur-pill ${i === activeCategory ? 'aur-pill-on' : ''}`}
                  onClick={() => setActiveCategory(i)}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <p style={{ textAlign: 'center', color: muted, fontSize: '0.8rem', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '1rem' }}>
              ← Scorri per vedere tutti i piatti →
            </p>

            <div ref={menuScrollRef} className="aur-menu-scroll">
              {menuCategories[activeCategory]?.items.map((item, i) => (
                <div key={i} className="aur-menu-item">
                  <GlowCard accent={accent} style={{ minHeight: 220 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem', marginBottom: '1rem' }}>
                      <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.4rem', fontWeight: 400, letterSpacing: '-0.01em' }}>
                        {item.name}
                        <AllergenBadges allergens={item.allergens} variant="minimal" />
                      </h3>
                      <span style={{
                        fontSize: '1.2rem',
                        fontWeight: 500,
                        color: accent,
                        whiteSpace: 'nowrap',
                        textShadow: `0 0 12px ${accent}55`,
                      }}>
                        €{item.price}
                      </span>
                    </div>
                    <p style={{ color: muted, fontSize: '0.9rem', lineHeight: 1.6 }}>
                      {item.description}
                    </p>
                  </GlowCard>
                </div>
              ))}
            </div>
          </FadeIn>
        </section>

        {/* GALLERY — glow carousel */}
        {galleryImages.length > 0 && (
          <section style={{ padding: '6rem 2rem', maxWidth: 1300, margin: '0 auto' }}>
            <FadeIn>
              <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                <p style={{ fontSize: '0.85rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: accent, marginBottom: '1rem', fontWeight: 500 }}>
                  Atmosfera
                </p>
                <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 300, letterSpacing: '-0.03em' }}>
                  Momenti che <em style={{ color: accent, fontStyle: 'italic' }}>brillano</em>
                </h2>
              </div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <div className="aur-carousel">
                <div className="aur-carousel-stage">
                  <span className="aur-carousel-counter">
                    {(carouselIdx + 1).toString().padStart(2, '0')} / {Math.min(galleryImages.length, 6).toString().padStart(2, '0')}
                  </span>
                  {galleryImages.slice(0, 6).map((img, i) => (
                    <div key={i} className={`aur-carousel-slide ${i === carouselIdx ? 'active' : ''}`}>
                      <img src={img.url} alt={img.alt} loading={i < 2 ? 'eager' : 'lazy'} />
                      {img.caption && (
                        <div className="aur-carousel-cap">{img.caption}</div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="aur-carousel-thumbs">
                  {galleryImages.slice(0, 6).map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCarouselIdx(i)}
                      className={`aur-carousel-thumb ${i === carouselIdx ? 'active' : ''}`}
                      aria-label={`Mostra immagine ${i + 1}`}
                    >
                      <img src={img.url} alt={img.alt} loading="lazy" />
                    </button>
                  ))}
                </div>
              </div>
            </FadeIn>
          </section>
        )}

        {/* EVENTS — celestial bodies flowing diagonally */}
        {tier !== 'basic' && events.length > 0 && (
          <section style={{ padding: '6rem 2rem', maxWidth: 1300, margin: '0 auto' }}>
            <FadeIn>
              <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                <p style={{ fontSize: '0.85rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: accent, marginBottom: '1rem', fontWeight: 500 }}>
                  ✦ Costellazione
                </p>
                <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 300, letterSpacing: '-0.03em' }}>
                  Eventi in <em style={{ color: accent, fontStyle: 'italic' }}>orbita</em>
                </h2>
              </div>
            </FadeIn>
            <div className="aur-celestial">
              {events.map((ev, i) => {
                const d = new Date(ev.date)
                const tags = ['Serata speciale', 'Live music', 'Evento del mese', 'Esperienza']
                return (
                  <FadeIn key={i} delay={i * 0.1}>
                    <div className="aur-celestial-event">
                      <div className="aur-celestial-orb">
                        <span className="aur-celestial-orb-day">
                          {d.getDate().toString().padStart(2, '0')}
                        </span>
                        <span className="aur-celestial-orb-month">
                          {d.toLocaleDateString('it-IT', { month: 'short' })}
                        </span>
                      </div>
                      <div className="aur-celestial-content">
                        <div className="aur-celestial-tag">{tags[i % tags.length]}</div>
                        <h3 className="aur-celestial-title">{ev.title}</h3>
                        <p className="aur-celestial-desc">{ev.description}</p>
                      </div>
                    </div>
                  </FadeIn>
                )
              })}
            </div>
          </section>
        )}

        {/* RESERVATION (Pro+) */}
        {tier !== 'basic' && (
          <section id="prenotazioni" style={{ padding: '6rem 2rem', maxWidth: 800, margin: '0 auto' }}>
            <FadeIn>
              <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <p style={{ fontSize: '0.85rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: accent, marginBottom: '1rem', fontWeight: 500 }}>
                  Prenotazioni
                </p>
                <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 300, letterSpacing: '-0.03em' }}>
                  Riserva il tuo<br />posto al tavolo
                </h2>
              </div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <GlowCard accent={accent} style={{ padding: '2.5rem' }}>
                <ReservationForm accent={accent} timeSlots={timeSlots} />
              </GlowCard>
            </FadeIn>
          </section>
        )}

        {/* PRESS BAR */}
        {reviews && (
          <section className="aur-press">
            <div className="aur-press-inner">
              <div className="aur-press-block">
                <span className="aur-press-stars">★★★★★</span>
                <span className="aur-press-score">{reviews.score.toFixed(1)}</span>
                <span className="aur-press-meta">/ 5 · {reviews.source}</span>
              </div>
              <div className="aur-press-pipe" />
              <div className="aur-press-block">
                <span className="aur-press-meta">{reviews.count}+ recensioni</span>
              </div>
              {chef?.years && (
                <>
                  <div className="aur-press-pipe" />
                  <div className="aur-press-block">
                    <span className="aur-press-meta">✦ {chef.years}+ anni di cucina</span>
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {/* CHEF */}
        {chef && (
          <section className="aur-chef">
            <FadeIn>
              <div className="aur-chef-photo">
                <span className="aur-chef-badge">✦ lo chef</span>
                <div>
                  {chef.photo && <img src={chef.photo} alt={chef.name} loading="lazy" />}
                </div>
              </div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <div>
                <p style={{ fontSize: '0.85rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: accent, marginBottom: '1.5rem', fontWeight: 500 }}>
                  ✦ il volto
                </p>
                <p className="aur-chef-quote">{chef.quote}</p>
                <p className="aur-chef-name">{chef.name}</p>
                <p className="aur-chef-role">— {chef.role}{chef.years ? ` · ${chef.years} anni` : ''}</p>
              </div>
            </FadeIn>
          </section>
        )}

        {/* REVIEWS */}
        {reviews && reviews.items.length > 0 && (
          <section className="aur-reviews">
            <FadeIn>
              <div style={{ marginBottom: '3rem' }}>
                <p style={{ fontSize: '0.85rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: accent, marginBottom: '1rem', fontWeight: 500 }}>
                  ✦ testimonianze
                </p>
                <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 'clamp(2.2rem, 5vw, 3.8rem)', fontWeight: 300, letterSpacing: '-0.03em' }}>
                  Le voci che <em style={{ color: accent, fontStyle: 'italic' }}>brillano</em>
                </h2>
              </div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <div>
                {reviews.items.map((rev, i) => (
                  <div key={i} className={`aur-review ${i === reviewIdx ? 'active' : ''}`}>
                    <div className="aur-review-stars">{'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}</div>
                    <p className="aur-review-text">"{rev.text}"</p>
                    <p className="aur-review-byline">
                      <span className="aur-review-author">{rev.author}</span> · {rev.source || reviews.source}{rev.date ? ` · ${rev.date}` : ''}
                    </p>
                  </div>
                ))}
                <div className="aur-review-nav">
                  {reviews.items.map((_, i) => (
                    <button key={i} type="button" className={`aur-review-dot ${i === reviewIdx ? 'active' : ''}`} onClick={() => setReviewIdx(i)} aria-label={`Recensione ${i + 1}`} />
                  ))}
                </div>
              </div>
            </FadeIn>
            <FadeIn delay={0.2}>
              <div style={{ marginTop: '4rem' }}>
                <LeaveReviewForm accent={accent} theme="dark" scope="aur-lr" labelFont="Fraunces" />
              </div>
            </FadeIn>
          </section>
        )}

        {/* FAQ */}
        {faq && faq.length > 0 && (
          <section style={{ padding: '6rem 2rem', maxWidth: 900, margin: '0 auto' }}>
            <FadeIn>
              <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <p style={{ fontSize: '0.85rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: accent, marginBottom: '1rem', fontWeight: 500 }}>
                  ✦ domande
                </p>
                <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', fontWeight: 300, letterSpacing: '-0.03em' }}>
                  Domande frequenti
                </h2>
              </div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <div className="aur-faq-list">
                {faq.map((item, i) => (
                  <div key={i} className={`aur-faq-item ${openFaq === i ? 'open' : ''}`}>
                    <button className="aur-faq-q" type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                      <span>{item.q}</span>
                      <span className="aur-faq-icon">+</span>
                    </button>
                    <div className="aur-faq-a">
                      <p>{item.a}</p>
                    </div>
                  </div>
                ))}
              </div>
            </FadeIn>
          </section>
        )}

        {/* NEWSLETTER */}
        <section className="aur-newsletter">
          <div className="aur-newsletter-inner">
            <p style={{ fontSize: '0.85rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: accent, marginBottom: '1rem', fontWeight: 500 }}>
              ✦ in orbita
            </p>
            <h2>Resta nel <em style={{ color: accent, fontStyle: 'italic' }}>flusso</em>.</h2>
            <p>Nuovi piatti, eventi privati, momenti unici. Iscriviti per non perdere niente.</p>
            <form className="aur-newsletter-form" onSubmit={e => { e.preventDefault(); const b = e.currentTarget.querySelector('button')!; b.textContent = '✓ Iscritto'; }}>
              <input type="email" required placeholder="tuo@email.it" />
              <button type="submit">Iscriviti</button>
            </form>
          </div>
        </section>

        {/* CONTACT */}
        <section style={{ padding: '6rem 2rem', maxWidth: 1300, margin: '0 auto' }}>
          <FadeIn>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <p style={{ fontSize: '0.85rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: accent, marginBottom: '1rem', fontWeight: 500 }}>
                Contatti
              </p>
              <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 300, letterSpacing: '-0.03em' }}>
                Vieni a trovarci
              </h2>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div style={{ display: 'grid', gridTemplateColumns: mapsUrl ? '1fr 1fr' : '1fr', gap: '2rem' }} className="aur-contact-grid">
              <GlowCard accent={accent} style={{ padding: '2.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  {address && (
                    <div>
                      <p style={{ fontSize: '0.75rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: accent, marginBottom: '0.5rem' }}>Indirizzo</p>
                      <p style={{ fontSize: '1.05rem', lineHeight: 1.5 }}>{address}</p>
                    </div>
                  )}
                  {phone && (
                    <div>
                      <p style={{ fontSize: '0.75rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: accent, marginBottom: '0.5rem' }}>Telefono</p>
                      <a href={`tel:${phone}`} style={{ fontSize: '1.05rem', color: text, textDecoration: 'none' }}>{phone}</a>
                    </div>
                  )}
                  {email && (
                    <div>
                      <p style={{ fontSize: '0.75rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: accent, marginBottom: '0.5rem' }}>Email</p>
                      <a href={`mailto:${email}`} style={{ fontSize: '1.05rem', color: text, textDecoration: 'none' }}>{email}</a>
                    </div>
                  )}
                  {hours && (
                    <div>
                      <p style={{ fontSize: '0.75rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: accent, marginBottom: '0.75rem' }}>Orari</p>
                      <div style={{ display: 'grid', gap: '0.4rem' }}>
                        {Object.entries(hours).map(([day, h]) => (
                          <div key={day} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                            <span style={{ color: muted }}>{DAY_NAMES[day]}</span>
                            <span>{h.closed ? 'Chiuso' : `${h.open} – ${h.close}`}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {socialLinks && (
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                      {Object.entries(socialLinks).map(([name, url]) => (
                        <a key={name} href={url} target="_blank" rel="noopener noreferrer"
                          style={{
                            padding: '0.6rem 1.2rem',
                            borderRadius: 999,
                            border: `1px solid ${accent}55`,
                            color: text,
                            textDecoration: 'none',
                            fontSize: '0.8rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            transition: 'all 0.3s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = accent; e.currentTarget.style.color = '#0a0612' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = text }}
                        >
                          {name}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </GlowCard>

              {mapsUrl && (
                <div style={{ borderRadius: 20, overflow: 'hidden', minHeight: 450, border: '1px solid rgba(255,255,255,0.08)' }}>
                  <iframe
                    src={mapsUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0, filter: 'invert(0.92) hue-rotate(180deg)' }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              )}
            </div>
          </FadeIn>
        </section>

        {/* FOOTER */}
        <footer style={{ padding: '3rem 2rem', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ fontSize: '0.8rem', color: muted, letterSpacing: '0.1em' }}>
            © {new Date().getFullYear()} {restaurantName}
          </p>
        </footer>
      </div>

      {/* WhatsApp FAB (Premium) */}
      {tier === 'premium' && whatsappNumber && (
        <a
          href={`https://wa.me/${whatsappNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="aur-fab"
        >
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
        theme="dark"
        scope="aur-smb"
      />
    </div>
  )
}
