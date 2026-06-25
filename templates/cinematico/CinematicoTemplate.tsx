'use client'

import { useRef, useEffect, useState } from 'react'
import Image from 'next/image'
import { InteractiveEffects } from '../_shared/InteractiveEffects'
import { StickyMobileBar } from '../_shared/StickyMobileBar'
import { AllergenBadges } from '../_shared/AllergenBadges'
import { LeaveReviewForm } from '../_shared/LeaveReviewForm'
import GdprConsent from '../_shared/GdprConsent'

interface CinematicoProps {
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
          el.classList.add('cin-visible')
          observer.unobserve(el)
        }
      },
      { threshold: 0.15 }
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
    <div
      ref={ref}
      className={`cin-reveal ${className}`}
      style={{ transitionDelay: `${delay}s` }}
    >
      {children}
    </div>
  )
}

function CinematicoReservationForm({ accent, bg, text, muted, timeSlots }: { accent: string; bg: string; text: string; muted: string; timeSlots?: string[] }) {
  const [submitted, setSubmitted] = useState(false)
  const [pickedSlot, setPickedSlot] = useState<string | null>(null)

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.85rem 1rem',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(250,242,232,0.1)',
    borderRadius: 4,
    color: text,
    fontSize: '0.9rem',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
  }

  if (submitted) {
    return (
      <section id="prenotazioni" style={{ padding: 'clamp(4rem, 10vh, 8rem) 0', borderTop: '1px solid rgba(250,242,232,0.06)', scrollMarginTop: '2rem' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 clamp(1.5rem, 5vw, 4rem)', textAlign: 'center' }}>
          <div style={{ width: 50, height: 2, background: accent, margin: '0 auto 2rem' }} />
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', fontWeight: 300, marginBottom: '1rem', color: text }}>
            Prenotazione ricevuta!
          </h2>
          <p style={{ color: muted, fontSize: '1rem' }}>Ti contatteremo a breve per confermare.</p>
        </div>
      </section>
    )
  }

  return (
    <section id="prenotazioni" style={{ padding: 'clamp(4rem, 10vh, 8rem) 0', borderTop: '1px solid rgba(250,242,232,0.06)', scrollMarginTop: '2rem' }}>
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 clamp(1.5rem, 5vw, 4rem)' }}>
        <Reveal>
          <div style={{ width: 50, height: 2, background: accent, marginBottom: '2rem' }} />
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: accent, marginBottom: '1rem' }}>
            Tavolo
          </p>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 0.95, marginBottom: 'clamp(2rem, 4vh, 3rem)', color: text }}>
            Prenota
          </h2>
        </Reveal>
        <form
          onSubmit={e => { e.preventDefault(); setSubmitted(true) }}
          style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
        >
          {timeSlots && timeSlots.length > 0 && (
            <div className="cin-slots">
              <div className="cin-slots-title">▸ Disponibilità per stasera</div>
              <div className="cin-slots-row">
                {timeSlots.map(slot => (
                  <button
                    key={slot}
                    type="button"
                    className={`cin-slot ${pickedSlot === slot ? 'active' : ''}`}
                    onClick={() => setPickedSlot(slot)}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="cin-form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <input required type="text" placeholder="Nome" style={inputStyle} />
            <input required type="tel" placeholder="Telefono" style={inputStyle} />
          </div>
          <div className="cin-form-grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem' }}>
            <input required type="date" style={inputStyle} />
            <input required type="time" value={pickedSlot || ''} onChange={e => setPickedSlot(e.target.value)} style={inputStyle} />
            <input required type="number" min={1} max={20} placeholder="Persone" style={inputStyle} />
          </div>
          <textarea
            placeholder="Note (opzionale)"
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
          <GdprConsent accent={accent} color={muted} />
          <div>
            <button
              type="submit"
              style={{
                padding: '1rem 2.5rem',
                background: accent,
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                fontSize: '0.85rem',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'opacity 0.3s',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              Prenota ora
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}

function CinematicoEvents({
  events,
  accent,
  bg,
  text,
  muted,
}: {
  events: Array<{ title: string; description?: string; date: string; imageUrl?: string }>
  accent: string
  bg: string
  text: string
  muted: string
}) {
  return (
    <section style={{ padding: 'clamp(4rem, 10vh, 8rem) 0', borderTop: '1px solid rgba(250,242,232,0.06)' }}>
      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '0 clamp(1.5rem, 5vw, 4rem)' }}>
        <Reveal>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: 'clamp(2rem, 4vh, 3rem)' }}>
            <div>
              <p style={{ fontFamily: '"JetBrains Mono", "Courier New", monospace', fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: accent, marginBottom: '1rem', fontWeight: 600 }}>
                ▶ NOW SHOWING
              </p>
              <h2 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 0.95, color: text }}>
                Eventi
              </h2>
            </div>
            <p style={{ fontFamily: '"JetBrains Mono", "Courier New", monospace', fontSize: '0.7rem', color: muted, letterSpacing: '0.15em' }}>
              {events.length.toString().padStart(2, '0')} EVENTS · PROGRAMMATI
            </p>
          </div>
        </Reveal>
        <div className="cin-billboard">
          {events.map((ev, i) => {
            const d = new Date(ev.date)
            return (
              <Reveal key={i} delay={i * 0.1}>
                <div className="cin-poster">
                  <div className="cin-poster-tag">In programma</div>
                  <div>
                    <div className="cin-poster-date">{d.getDate().toString().padStart(2, '0')}</div>
                    <span className="cin-poster-date-month">
                      {d.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="cin-poster-content">
                    <h3 className="cin-poster-title">{ev.title}</h3>
                    {ev.description && <p className="cin-poster-desc">{ev.description}</p>}
                    <div className="cin-poster-cta">
                      <span>Save the date</span>
                    </div>
                  </div>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export function CinematicoTemplate(props: CinematicoProps) {
  const {
    restaurantName, tagline, description, heroImage, heroImages, aboutImage,
    menuCategories, galleryImages, address, phone, email,
    hours, mapsUrl, socialLinks, accentColor = '#e52d1d', logoUrl,
    tier = 'basic', events, whatsappNumber,
    chef, reviews, faq, timeSlots,
  } = props

  const accent = accentColor
  const bg = '#0a0a08'
  const text = '#FAF2E8'
  const muted = '#8a8078'

  const [activeCategory, setActiveCategory] = useState(0)
  const cinMenuRef = useRef<HTMLDivElement>(null)

  // Hero carousel: rotate through heroImages (or just heroImage)
  const heroSlides = heroImages && heroImages.length > 0 ? heroImages : [heroImage]
  const [heroIdx, setHeroIdx] = useState(0)
  useEffect(() => {
    if (heroSlides.length < 2) return
    const t = setInterval(() => setHeroIdx(i => (i + 1) % heroSlides.length), 4500)
    return () => clearInterval(t)
  }, [heroSlides.length])

  // Reviews carousel index
  const [reviewIdx, setReviewIdx] = useState(0)

  // FAQ open index
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  useEffect(() => {
    if (cinMenuRef.current) cinMenuRef.current.scrollTo({ left: 0, behavior: 'smooth' })
  }, [activeCategory])

  return (
    <div style={{ background: bg, color: text, fontFamily: "'Inter', sans-serif" }}>
      <InteractiveEffects accent={accent} scope="cin" />
      <style>{`
        :where(div) { --ripple-color: rgba(229, 45, 29, 0.55); }
        .cin-menu-card { position: relative; overflow: hidden; }
        .cin-menu-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(280px circle at var(--gx, 50%) var(--gy, 50%), rgba(229,45,29,0.18), transparent 50%);
          opacity: 0;
          transition: opacity 0.4s;
          pointer-events: none;
          z-index: 0;
        }
        .cin-menu-card:hover::before { opacity: 1; }
        .cin-menu-card > * { position: relative; z-index: 1; }
        button, .cin-btn { transition: transform 0.25s, box-shadow 0.3s, background 0.3s, color 0.3s !important; }
        button:hover:not(.cin-cat-pill):not(.cin-cat-pill-active) {
          transform: translateY(-2px);
        }
        .cin-reveal {
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1),
                      transform 0.9s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .cin-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .cin-img-zoom:hover img {
          transform: scale(1.05);
        }
        .cin-menu-item:hover {
          background: rgba(250, 242, 232, 0.03);
        }
        .cin-menu-scroll {
          display: flex;
          gap: 1.25rem;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          padding: 0.5rem 0 2rem;
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .cin-menu-scroll::-webkit-scrollbar { display: none; }
        .cin-menu-card {
          flex: 0 0 290px;
          scroll-snap-align: start;
          background: rgba(250, 242, 232, 0.03);
          border: 1px solid rgba(250, 242, 232, 0.06);
          border-radius: 10px;
          padding: 1.5rem;
          transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1),
                      border-color 0.3s, background 0.3s;
        }
        .cin-menu-card:hover {
          transform: translateY(-6px);
          border-color: rgba(250, 242, 232, 0.12);
          background: rgba(250, 242, 232, 0.05);
        }
        .cin-cat-pill {
          padding: 0.55rem 1.3rem;
          border-radius: 50px;
          border: 1px solid rgba(250, 242, 232, 0.12);
          background: transparent;
          color: #8a8078;
          font-size: 0.78rem;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.3s;
        }
        .cin-cat-pill:hover { border-color: rgba(250, 242, 232, 0.25); color: #FAF2E8; }
        .cin-cat-pill-active {
          background: var(--cin-accent, #e52d1d) !important;
          border-color: var(--cin-accent, #e52d1d) !important;
          color: #fff !important;
        }
        .cin-gallery-strip {
          display: flex;
          gap: 2px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .cin-gallery-strip::-webkit-scrollbar { display: none; }
        .cin-gallery-item {
          flex: 0 0 40vw;
          scroll-snap-align: start;
          position: relative;
          aspect-ratio: 3/4;
          overflow: hidden;
          cursor: pointer;
        }
        .cin-gallery-item img {
          transition: transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .cin-gallery-item:hover img {
          transform: scale(1.08);
        }
        .cin-gallery-item .cin-caption {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          padding: 3rem 1.5rem 1.5rem;
          background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);
          opacity: 0;
          transform: translateY(10px);
          transition: all 0.4s ease;
        }
        .cin-gallery-item:hover .cin-caption {
          opacity: 1;
          transform: translateY(0);
        }
        @media (max-width: 768px) {
          .cin-gallery-item { flex: 0 0 75vw; }
        }

        /* ── FILMSTRIP gallery ── */
        .cin-filmstrip-wrap {
          position: relative;
          background: #000;
          padding: 22px 0;
          margin: 0;
          overflow: hidden;
        }
        .cin-filmstrip-wrap::before,
        .cin-filmstrip-wrap::after {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          height: 22px;
          background-image:
            linear-gradient(90deg, transparent 8px, ${bg} 8px, ${bg} 22px, transparent 22px);
          background-size: 36px 100%;
          background-repeat: repeat-x;
          z-index: 3;
        }
        .cin-filmstrip-wrap::before { top: 0; }
        .cin-filmstrip-wrap::after { bottom: 0; }
        .cin-filmstrip {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          scrollbar-width: none;
          padding: 0 clamp(1.5rem, 5vw, 4rem);
        }
        .cin-filmstrip::-webkit-scrollbar { display: none; }
        .cin-frame {
          flex: 0 0 clamp(280px, 32vw, 480px);
          scroll-snap-align: start;
          position: relative;
          aspect-ratio: 16/9;
          overflow: hidden;
          background: #111;
          cursor: pointer;
          filter: saturate(0.6) contrast(1.05);
          transition: filter 0.5s, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .cin-frame:hover {
          filter: saturate(1.1) contrast(1);
          transform: scale(1.015);
          z-index: 2;
        }
        .cin-frame img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .cin-frame:hover img { transform: scale(1.06); }
        .cin-frame-tag {
          position: absolute;
          top: 12px;
          left: 12px;
          font-family: 'JetBrains Mono', 'Courier New', monospace;
          font-size: 0.65rem;
          letter-spacing: 0.15em;
          color: ${accent};
          background: rgba(0,0,0,0.7);
          padding: 4px 8px;
          z-index: 2;
          font-weight: 600;
        }
        .cin-frame-cap {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 2rem 1rem 1rem;
          background: linear-gradient(to top, rgba(0,0,0,0.85), transparent);
          opacity: 0;
          transform: translateY(15px);
          transition: opacity 0.4s, transform 0.4s;
          color: ${text};
          font-size: 0.85rem;
          font-weight: 500;
          z-index: 2;
        }
        .cin-frame:hover .cin-frame-cap { opacity: 1; transform: translateY(0); }

        /* ── EVENTS as cinema posters ── */
        .cin-billboard {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 2rem;
        }
        .cin-poster {
          position: relative;
          aspect-ratio: 2/3;
          background: linear-gradient(160deg, #1a0e0c 0%, #0a0606 100%);
          border: 1px solid ${accent}33;
          overflow: hidden;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          cursor: pointer;
          transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s, border-color 0.5s;
        }
        .cin-poster::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 30% 0%, ${accent}22 0%, transparent 50%),
            repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(255,255,255,0.012) 3px, rgba(255,255,255,0.012) 4px);
          pointer-events: none;
        }
        .cin-poster:hover {
          transform: translateY(-12px) rotate(-1deg);
          box-shadow: 0 30px 60px ${accent}40, 0 0 0 1px ${accent}77 inset;
          border-color: ${accent};
        }
        .cin-poster-tag {
          position: relative;
          z-index: 2;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: 'JetBrains Mono', 'Courier New', monospace;
          font-size: 0.65rem;
          letter-spacing: 0.25em;
          color: ${accent};
          text-transform: uppercase;
          font-weight: 600;
        }
        .cin-poster-tag::before {
          content: '●';
          color: ${accent};
          animation: cinBlink 2s ease-in-out infinite;
        }
        @keyframes cinBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes cinKenBurns {
          from { transform: scale(1.02); }
          to { transform: scale(1.12); }
        }

        /* ── CHEF section ── */
        .cin-chef {
          padding: clamp(4rem, 10vh, 8rem) 0;
          border-top: 1px solid rgba(250, 242, 232, 0.06);
          position: relative;
        }
        .cin-chef-grid {
          display: grid;
          grid-template-columns: 1fr 1.1fr;
          gap: clamp(2rem, 5vw, 5rem);
          align-items: center;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 clamp(1.5rem, 5vw, 4rem);
        }
        .cin-chef-photo {
          position: relative;
          aspect-ratio: 4/5;
          overflow: hidden;
          filter: grayscale(0.4) contrast(1.05);
          transition: filter 0.6s;
        }
        .cin-chef-photo:hover { filter: grayscale(0); }
        .cin-chef-photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .cin-chef-photo-meta {
          position: absolute;
          top: 16px;
          left: 16px;
          font-family: 'JetBrains Mono', 'Courier New', monospace;
          font-size: 0.65rem;
          letter-spacing: 0.25em;
          color: ${accent};
          background: rgba(0,0,0,0.7);
          padding: 4px 10px;
          z-index: 2;
        }
        .cin-chef-photo-years {
          position: absolute;
          bottom: 24px;
          right: 24px;
          font-family: 'Inter', sans-serif;
          font-size: clamp(3rem, 5vw, 4.5rem);
          font-weight: 900;
          line-height: 0.85;
          color: ${text};
          letter-spacing: -0.04em;
          z-index: 2;
        }
        .cin-chef-photo-years small {
          font-size: 0.65rem;
          font-weight: 500;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: ${accent};
          display: block;
          margin-top: 0.25rem;
        }
        .cin-chef-content { position: relative; }
        .cin-chef-quote {
          font-size: clamp(1.5rem, 2.5vw, 2.2rem);
          font-weight: 300;
          line-height: 1.3;
          color: ${text};
          letter-spacing: -0.01em;
          font-style: italic;
          margin-bottom: 2rem;
          position: relative;
          padding-left: 1.5rem;
        }
        .cin-chef-quote::before {
          content: '“';
          position: absolute;
          left: -0.25rem;
          top: -0.5rem;
          font-size: 5rem;
          line-height: 1;
          color: ${accent};
          font-family: Georgia, serif;
        }
        .cin-chef-sign {
          font-family: 'JetBrains Mono', 'Courier New', monospace;
          font-size: 0.7rem;
          letter-spacing: 0.25em;
          color: ${accent};
          text-transform: uppercase;
          margin-bottom: 0.4rem;
        }
        .cin-chef-name {
          font-size: 1.5rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: ${text};
          margin-bottom: 0.25rem;
        }
        .cin-chef-role {
          font-size: 0.85rem;
          color: ${muted};
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        /* ── PRESS / REVIEWS ── */
        .cin-press-bar {
          border-top: 1px solid rgba(250, 242, 232, 0.06);
          border-bottom: 1px solid rgba(250, 242, 232, 0.06);
          padding: 2rem 0;
          background: rgba(255,255,255,0.015);
        }
        .cin-press-bar-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 clamp(1.5rem, 5vw, 4rem);
          display: flex;
          align-items: center;
          gap: 3rem;
          flex-wrap: wrap;
          justify-content: center;
        }
        .cin-press-stat {
          display: flex;
          align-items: center;
          gap: 0.9rem;
        }
        .cin-press-stars {
          font-size: 1.4rem;
          color: ${accent};
          letter-spacing: 0.15em;
        }
        .cin-press-score {
          font-size: 1.8rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: ${text};
        }
        .cin-press-meta {
          font-family: 'JetBrains Mono', 'Courier New', monospace;
          font-size: 0.7rem;
          letter-spacing: 0.2em;
          color: ${muted};
          text-transform: uppercase;
        }
        .cin-press-divider {
          width: 1px;
          height: 30px;
          background: ${muted}55;
        }

        .cin-reviews {
          padding: clamp(4rem, 10vh, 8rem) 0;
          border-top: 1px solid rgba(250, 242, 232, 0.06);
        }
        .cin-reviews-stage {
          max-width: 900px;
          margin: 0 auto;
          padding: 0 clamp(1.5rem, 5vw, 4rem);
          position: relative;
        }
        .cin-review-card {
          opacity: 0;
          display: none;
          padding: 2.5rem 2rem;
          border: 1px solid rgba(250, 242, 232, 0.1);
          background: rgba(255, 255, 255, 0.02);
          transition: opacity 0.6s;
          position: relative;
        }
        .cin-review-card.active {
          display: block;
          animation: cinReviewIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        @keyframes cinReviewIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .cin-review-stars {
          color: ${accent};
          font-size: 1.1rem;
          letter-spacing: 0.15em;
          margin-bottom: 1.5rem;
        }
        .cin-review-text {
          font-size: clamp(1.1rem, 1.6vw, 1.5rem);
          line-height: 1.5;
          font-weight: 300;
          color: ${text};
          margin-bottom: 2rem;
          font-style: italic;
        }
        .cin-review-byline {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(250, 242, 232, 0.08);
        }
        .cin-review-author {
          font-weight: 700;
          font-size: 1rem;
          letter-spacing: 0.05em;
          color: ${text};
        }
        .cin-review-source {
          font-family: 'JetBrains Mono', 'Courier New', monospace;
          font-size: 0.7rem;
          letter-spacing: 0.2em;
          color: ${accent};
          text-transform: uppercase;
        }
        .cin-review-nav {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-top: 2rem;
        }
        .cin-review-dot {
          width: 26px;
          height: 2px;
          background: rgba(250, 242, 232, 0.2);
          border: none;
          cursor: pointer;
          padding: 0;
          transition: background 0.3s, width 0.3s;
        }
        .cin-review-dot.active {
          background: ${accent};
          width: 40px;
        }

        /* ── FAQ accordion ── */
        .cin-faq {
          padding: clamp(4rem, 10vh, 8rem) 0;
          border-top: 1px solid rgba(250, 242, 232, 0.06);
        }
        .cin-faq-list {
          max-width: 800px;
          margin: 0 auto;
          padding: 0 clamp(1.5rem, 5vw, 4rem);
        }
        .cin-faq-item {
          border-bottom: 1px solid rgba(250, 242, 232, 0.08);
        }
        .cin-faq-q {
          width: 100%;
          background: none;
          border: none;
          padding: 1.5rem 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: ${text};
          font-family: 'Inter', sans-serif;
          font-size: clamp(1rem, 1.6vw, 1.2rem);
          font-weight: 500;
          letter-spacing: -0.01em;
          cursor: pointer;
          text-align: left;
          gap: 1rem;
          transition: color 0.3s;
        }
        .cin-faq-q:hover { color: ${accent}; }
        .cin-faq-icon {
          width: 28px;
          height: 28px;
          border: 1px solid rgba(250, 242, 232, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 0.4s, border-color 0.3s;
          font-size: 0.9rem;
        }
        .cin-faq-item.open .cin-faq-icon {
          transform: rotate(45deg);
          border-color: ${accent};
          color: ${accent};
        }
        .cin-faq-a {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.5s cubic-bezier(0.22, 1, 0.36, 1), padding 0.4s;
        }
        .cin-faq-item.open .cin-faq-a {
          max-height: 400px;
          padding-bottom: 1.5rem;
        }
        .cin-faq-a p {
          color: ${muted};
          line-height: 1.7;
          font-size: 1rem;
        }

        /* ── NEWSLETTER ── */
        .cin-newsletter {
          padding: clamp(4rem, 8vh, 6rem) 0;
          border-top: 1px solid rgba(250, 242, 232, 0.06);
          background: linear-gradient(180deg, rgba(229, 45, 29, 0.04) 0%, transparent 100%);
        }
        .cin-newsletter-inner {
          max-width: 700px;
          margin: 0 auto;
          padding: 0 clamp(1.5rem, 5vw, 4rem);
          text-align: center;
        }
        .cin-newsletter h2 {
          font-size: clamp(1.8rem, 3vw, 2.5rem);
          font-weight: 800;
          letter-spacing: -0.03em;
          margin-bottom: 1rem;
        }
        .cin-newsletter p {
          color: ${muted};
          margin-bottom: 2rem;
          font-size: 1rem;
        }
        .cin-newsletter-form {
          display: flex;
          gap: 0.5rem;
          max-width: 500px;
          margin: 0 auto;
        }
        .cin-newsletter-input {
          flex: 1;
          padding: 1rem 1.2rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(250, 242, 232, 0.15);
          color: ${text};
          font-family: inherit;
          font-size: 0.95rem;
          outline: none;
          transition: border-color 0.3s;
        }
        .cin-newsletter-input:focus { border-color: ${accent}; }
        .cin-newsletter-btn {
          padding: 1rem 2rem;
          background: ${accent};
          color: #fff;
          border: none;
          font-family: inherit;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.3s;
        }
        .cin-newsletter-btn:hover { background: #b81f12; }

        /* ── Time slots in reservation ── */
        .cin-slots {
          margin: 1rem 0 1.25rem;
        }
        .cin-slots-title {
          font-size: 0.7rem;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: ${accent};
          margin-bottom: 0.75rem;
          font-weight: 600;
        }
        .cin-slots-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .cin-slot {
          padding: 0.7rem 1.1rem;
          background: transparent;
          color: ${text};
          border: 1px solid rgba(250, 242, 232, 0.2);
          cursor: pointer;
          font-family: inherit;
          font-size: 0.85rem;
          font-weight: 500;
          letter-spacing: 0.05em;
          transition: all 0.25s;
        }
        .cin-slot:hover { border-color: ${accent}; color: ${accent}; }
        .cin-slot.active {
          background: ${accent};
          color: #fff;
          border-color: ${accent};
        }

        @media (max-width: 768px) {
          .cin-chef-grid { grid-template-columns: 1fr; }
          .cin-press-bar-inner { gap: 1.5rem; }
          .cin-newsletter-form { flex-direction: column; }
          .cin-press-divider { display: none; }
        }
        .cin-poster-date {
          position: relative;
          z-index: 2;
          font-family: 'Inter', sans-serif;
          font-size: clamp(4rem, 8vw, 6.5rem);
          font-weight: 900;
          letter-spacing: -0.04em;
          line-height: 0.85;
          color: ${text};
        }
        .cin-poster-date-month {
          font-size: 0.85rem;
          font-weight: 600;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: ${accent};
          margin-top: 0.5rem;
          display: block;
        }
        .cin-poster-content {
          position: relative;
          z-index: 2;
        }
        .cin-poster-title {
          font-size: clamp(1.4rem, 2.2vw, 1.9rem);
          font-weight: 800;
          letter-spacing: -0.02em;
          line-height: 1.05;
          color: ${text};
          margin-bottom: 0.6rem;
        }
        .cin-poster-desc {
          font-size: 0.85rem;
          line-height: 1.5;
          color: ${muted};
          margin-bottom: 1.2rem;
        }
        .cin-poster-cta {
          font-family: 'JetBrains Mono', 'Courier New', monospace;
          font-size: 0.65rem;
          letter-spacing: 0.25em;
          color: ${accent};
          text-transform: uppercase;
          font-weight: 600;
          padding-top: 1rem;
          border-top: 1px solid ${accent}33;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .cin-poster-cta::after {
          content: '→';
          font-family: 'Inter', sans-serif;
          font-size: 1.1rem;
          transition: transform 0.3s;
        }
        .cin-poster:hover .cin-poster-cta::after { transform: translateX(6px); }

        @media (max-width: 768px) {
          .cin-frame { flex: 0 0 80vw; }
          .cin-billboard { grid-template-columns: 1fr 1fr; gap: 1rem; }
          .cin-poster { padding: 1rem; }
          .cin-poster-date { font-size: 3.2rem; }
        }
        @media (max-width: 480px) {
          .cin-billboard { grid-template-columns: 1fr; }
        }

        /* ── Responsive: About split grid ── */
        @media (max-width: 768px) {
          .cin-about-grid {
            grid-template-columns: 1fr !important;
          }
          .cin-about-grid .cin-img-zoom {
            aspect-ratio: 4/3 !important;
          }
        }

        /* ── Responsive: Contact grid ── */
        @media (max-width: 768px) {
          .cin-contact-grid {
            grid-template-columns: 1fr !important;
          }
        }

        /* ── Responsive: Reservation form grids ── */
        @media (max-width: 640px) {
          .cin-form-grid-2 {
            grid-template-columns: 1fr !important;
          }
          .cin-form-grid-3 {
            grid-template-columns: 1fr !important;
          }
        }

        /* ── Responsive: Menu items readable on mobile ── */
        @media (max-width: 768px) {
          .cin-menu-card { flex: 0 0 250px; }
        }
        @media (max-width: 480px) {
          .cin-menu-item {
            padding: 0.85rem 0 !important;
          }
          .cin-menu-card { flex: 0 0 230px; }
        }
      `}</style>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
        {heroSlides.map((src, i) => (
          <div
            key={i}
            className="cin-hero-slide"
            style={{
              position: 'absolute',
              inset: 0,
              opacity: i === heroIdx ? 1 : 0,
              transition: 'opacity 1.2s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            <Image
              src={src}
              alt={restaurantName}
              fill
              priority={i === 0}
              sizes="100vw"
              style={{
                objectFit: 'cover',
                objectPosition: 'center',
                animation: i === heroIdx ? 'cinKenBurns 6s ease-out forwards' : 'none',
              }}
            />
          </div>
        ))}
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(to bottom, ${bg}33 0%, ${bg}99 50%, ${bg} 100%)`,
        }} />
        <div style={{
          position: 'relative', zIndex: 10,
          height: '100%', display: 'flex', flexDirection: 'column',
          justifyContent: 'flex-end', alignItems: 'center',
          paddingBottom: 'clamp(4rem, 10vh, 8rem)', textAlign: 'center',
          padding: '0 1.5rem clamp(4rem, 10vh, 8rem)',
        }}>
          {logoUrl && (
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img
                src={logoUrl}
                alt={restaurantName}
                height={80}
                style={{ height: 80, width: 'auto', maxWidth: 260, filter: 'brightness(0) invert(1)', opacity: 0.95, objectFit: 'contain' }}
              />
            </div>
          )}
          <h1 style={{
            fontSize: 'clamp(3.5rem, 10vw, 9rem)',
            fontWeight: 800,
            letterSpacing: '-0.04em',
            lineHeight: 0.9,
            marginBottom: '1.5rem',
            color: text,
          }}>
            {restaurantName}
          </h1>
          {tagline && (
            <p style={{
              fontSize: 'clamp(0.75rem, 1.5vw, 1rem)',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: muted,
            }}>
              {tagline}
            </p>
          )}
          <div style={{ marginTop: '2.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <a href="#menu" style={{
              padding: '14px 28px',
              background: accent,
              color: '#fff',
              fontFamily: 'inherit',
              fontSize: '0.8rem',
              fontWeight: 700,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              border: 'none',
              cursor: 'pointer',
              transition: 'transform 0.25s, box-shadow 0.3s',
              boxShadow: `0 8px 24px ${accent}55`,
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
            >
              Esplora il menu
            </a>
            {tier !== 'basic' && (
              <a href="#prenotazioni" style={{
                padding: '14px 28px',
                background: 'transparent',
                color: text,
                fontFamily: 'inherit',
                fontSize: '0.8rem',
                fontWeight: 600,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                border: `1px solid ${text}55`,
                cursor: 'pointer',
                transition: 'all 0.25s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.color = accent }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = `${text}55`; e.currentTarget.style.color = text }}
              >
                Prenota tavolo
              </a>
            )}
          </div>
          <div style={{
            marginTop: '2.5rem', width: 1, height: 50,
            background: `linear-gradient(to bottom, ${accent}, transparent)`,
          }} />
        </div>
      </section>

      {/* ── ABOUT: split layout ── */}
      <section style={{ padding: 'clamp(4rem, 10vh, 8rem) 0' }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto', padding: '0 clamp(1.5rem, 5vw, 4rem)',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(2rem, 5vw, 5rem)',
          alignItems: 'center',
        }}
        className="cin-about-grid">
          {/* Left: text */}
          <Reveal>
            <div style={{ width: 50, height: 2, background: accent, marginBottom: '2rem' }} />
            <h2 style={{
              fontSize: 'clamp(2rem, 4vw, 3.5rem)',
              fontWeight: 300,
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              marginBottom: '2rem',
            }}>
              La nostra<br />
              <span style={{ fontWeight: 700 }}>storia</span>
            </h2>
            {description && (
              <p style={{
                fontSize: 'clamp(0.85rem, 1.2vw, 1rem)',
                lineHeight: 1.9,
                color: muted,
                maxWidth: '28rem',
              }}>
                {description}
              </p>
            )}
          </Reveal>

          {/* Right: image */}
          {aboutImage && (
            <Reveal delay={0.2}>
              <div className="cin-img-zoom" style={{
                position: 'relative', aspectRatio: '4/5',
                overflow: 'hidden', borderRadius: 4,
              }}>
                <Image
                  src={aboutImage}
                  alt="About"
                  fill
                  sizes="50vw"
                  style={{ objectFit: 'cover', transition: 'transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)' }}
                />
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {/* ── FULL-BLEED IMAGE DIVIDER ── */}
      {galleryImages[0] && (
        <section style={{ position: 'relative', height: '50vh', overflow: 'hidden' }}>
          <Image
            src={galleryImages[0].url}
            alt={galleryImages[0].alt}
            fill
            sizes="100vw"
            style={{ objectFit: 'cover' }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(to bottom, ${bg}, transparent 30%, transparent 70%, ${bg})`,
          }} />
        </section>
      )}

      {/* ── MENU ── */}
      <section id="menu" style={{ padding: 'clamp(4rem, 10vh, 8rem) 0', scrollMarginTop: '2rem' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 clamp(1.5rem, 5vw, 4rem)' }}>
          <Reveal>
            <p style={{
              fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase',
              color: accent, marginBottom: '1rem',
            }}>
              Selezione
            </p>
            <h2 style={{
              fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
              fontWeight: 800,
              letterSpacing: '-0.04em',
              lineHeight: 0.95,
              marginBottom: 'clamp(3rem, 6vh, 5rem)',
            }}>
              Il Menu
            </h2>
          </Reveal>

          {/* Category pills */}
          <Reveal delay={0.1}>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              {menuCategories.map((cat, i) => (
                <button key={i}
                  className={`cin-cat-pill ${activeCategory === i ? 'cin-cat-pill-active' : ''}`}
                  style={{ '--cin-accent': accent } as React.CSSProperties}
                  onClick={() => setActiveCategory(i)}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </Reveal>

          {/* Horizontal scroll cards */}
          <div ref={cinMenuRef} className="cin-menu-scroll">
            {menuCategories[activeCategory]?.items.map((item, i) => (
              <div key={`${activeCategory}-${i}`} className="cin-menu-card glow-card"
                onMouseMove={e => {
                  const r = e.currentTarget.getBoundingClientRect()
                  e.currentTarget.style.setProperty('--gx', `${((e.clientX-r.left)/r.width)*100}%`)
                  e.currentTarget.style.setProperty('--gy', `${((e.clientY-r.top)/r.height)*100}%`)
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, color: text, lineHeight: 1.3, maxWidth: '70%', margin: 0 }}>
                    {item.name}
                    <AllergenBadges allergens={item.allergens} variant="minimal" />
                  </h4>
                  <span style={{ fontSize: '0.95rem', fontWeight: 700, color: accent, whiteSpace: 'nowrap' }}>
                    {item.price.toFixed(2)} €
                  </span>
                </div>
                {item.description && (
                  <p style={{ fontSize: '0.78rem', color: muted, lineHeight: 1.6, margin: 0 }}>{item.description}</p>
                )}
                <div style={{ width: 30, height: 2, background: `${accent}33`, marginTop: '1.25rem', borderRadius: 1 }} />
              </div>
            ))}
          </div>
          <p style={{ fontSize: '0.7rem', color: `${muted}77`, marginTop: '0.5rem' }}>
            ← Scorri per vedere tutti i piatti →
          </p>
        </div>
      </section>

      {/* ── GALLERY: horizontal film strip ── */}
      <section style={{ padding: 'clamp(2rem, 5vh, 4rem) 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(1.5rem, 5vw, 4rem)', marginBottom: '2rem' }}>
          <Reveal>
            <p style={{
              fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase',
              color: accent, marginBottom: '1rem',
            }}>
              Atmosfera
            </p>
            <h2 style={{
              fontSize: 'clamp(2rem, 4vw, 3.5rem)',
              fontWeight: 800,
              letterSpacing: '-0.04em',
            }}>
              Galleria
            </h2>
          </Reveal>
        </div>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(1.5rem, 5vw, 4rem)', marginBottom: '1.5rem' }}>
          <p style={{ fontFamily: '"JetBrains Mono", "Courier New", monospace', fontSize: '0.65rem', letterSpacing: '0.2em', color: muted, textTransform: 'uppercase' }}>
            REEL 01 · {galleryImages.length.toString().padStart(2, '0')} TAKES · 35MM
          </p>
        </div>
        <div className="cin-filmstrip-wrap">
          <div className="cin-filmstrip">
            {galleryImages.map((img, i) => (
              <div key={i} className="cin-frame">
                <span className="cin-frame-tag">TAKE {(i + 1).toString().padStart(3, '0')}</span>
                <img src={img.url} alt={img.alt} loading="lazy" />
                {img.caption && (
                  <div className="cin-frame-cap">{img.caption}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRESS BAR (social proof bar) ── */}
      {reviews && (
        <section className="cin-press-bar">
          <div className="cin-press-bar-inner">
            <div className="cin-press-stat">
              <span className="cin-press-stars">★★★★★</span>
              <span className="cin-press-score">{reviews.score.toFixed(1)}</span>
              <span className="cin-press-meta">/ 5 · {reviews.source}</span>
            </div>
            <div className="cin-press-divider" />
            <div className="cin-press-stat">
              <span className="cin-press-meta">{reviews.count}+ recensioni</span>
            </div>
            {chef?.years && (
              <>
                <div className="cin-press-divider" />
                <div className="cin-press-stat">
                  <span className="cin-press-meta">{chef.years}+ anni di cucina</span>
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* ── CHEF section ── */}
      {chef && (
        <section className="cin-chef">
          <div className="cin-chef-grid">
            <Reveal>
              <div className="cin-chef-photo">
                <span className="cin-chef-photo-meta">DIRECTOR · CHEF</span>
                {chef.photo && (
                  <img src={chef.photo} alt={chef.name} loading="lazy" />
                )}
                {chef.years && (
                  <div className="cin-chef-photo-years">
                    {chef.years}<small>anni · in cucina</small>
                  </div>
                )}
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="cin-chef-content">
                <p className="cin-chef-sign">▸ NEL CAST</p>
                <p className="cin-chef-quote">{chef.quote}</p>
                <div className="cin-chef-name">{chef.name}</div>
                <div className="cin-chef-role">— {chef.role}</div>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* ── REVIEWS carousel ── */}
      {reviews && reviews.items.length > 0 && (
        <section className="cin-reviews">
          <div className="cin-reviews-stage">
            <Reveal>
              <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: accent, marginBottom: '1rem', fontWeight: 600 }}>
                  ▶ TESTIMONIANZE
                </p>
                <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 0.95 }}>
                  La critica
                </h2>
              </div>
            </Reveal>
            {reviews.items.map((rev, i) => (
              <div key={i} className={`cin-review-card ${i === reviewIdx ? 'active' : ''}`}>
                <div className="cin-review-stars">{'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}</div>
                <p className="cin-review-text">"{rev.text}"</p>
                <div className="cin-review-byline">
                  <span className="cin-review-author">— {rev.author}</span>
                  <span className="cin-review-source">{rev.source || reviews.source} · {rev.date || ''}</span>
                </div>
              </div>
            ))}
            <div className="cin-review-nav">
              {reviews.items.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`cin-review-dot ${i === reviewIdx ? 'active' : ''}`}
                  onClick={() => setReviewIdx(i)}
                  aria-label={`Recensione ${i + 1}`}
                />
              ))}
            </div>

            {/* Leave a review */}
            <div style={{ marginTop: '4rem' }}>
              <LeaveReviewForm accent={accent} theme="dark" scope="cin-lr" labelFont="Inter" />
            </div>
          </div>
        </section>
      )}

      {/* ── RESERVATION FORM (Pro + Premium) ── */}
      {tier !== 'basic' && <CinematicoReservationForm accent={accent} bg={bg} text={text} muted={muted} timeSlots={timeSlots} />}

      {/* ── EVENTS (Pro + Premium) ── */}
      {tier !== 'basic' && events && events.length > 0 && (
        <CinematicoEvents events={events} accent={accent} bg={bg} text={text} muted={muted} />
      )}

      {/* ── FAQ accordion ── */}
      {faq && faq.length > 0 && (
        <section className="cin-faq">
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: accent, marginBottom: '1rem', fontWeight: 600 }}>
                Q & A
              </p>
              <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 0.95 }}>
                Domande frequenti
              </h2>
            </div>
          </Reveal>
          <div className="cin-faq-list">
            {faq.map((item, i) => (
              <div key={i} className={`cin-faq-item ${openFaq === i ? 'open' : ''}`}>
                <button
                  className="cin-faq-q"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  type="button"
                >
                  <span>{item.q}</span>
                  <span className="cin-faq-icon">+</span>
                </button>
                <div className="cin-faq-a">
                  <p>{item.a}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── NEWSLETTER ── */}
      <section className="cin-newsletter">
        <div className="cin-newsletter-inner">
          <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: accent, marginBottom: '1rem', fontWeight: 600 }}>
            ◉ RESTA AGGIORNATO
          </p>
          <h2>In arrivo</h2>
          <p>Le nostre serate speciali, i nuovi piatti, le sneak peek. Una mail al mese, niente spam.</p>
          <form className="cin-newsletter-form" style={{ flexWrap: 'wrap' }} onSubmit={e => { e.preventDefault(); const t = e.currentTarget; const btn = t.querySelector('.cin-newsletter-btn') as HTMLButtonElement; if (btn) btn.textContent = '✓ Iscritto'; }}>
            <input className="cin-newsletter-input" type="email" required placeholder="tu@email.it" />
            <button type="submit" className="cin-newsletter-btn">Iscriviti</button>
            <GdprConsent accent={accent} color={muted} />
          </form>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section style={{
        padding: 'clamp(4rem, 10vh, 8rem) 0',
        borderTop: `1px solid rgba(250,242,232,0.06)`,
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto', padding: '0 clamp(1.5rem, 5vw, 4rem)',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(2rem, 5vw, 5rem)',
        }}
        className="cin-contact-grid">
          {/* Left: info */}
          <Reveal>
            <p style={{
              fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase',
              color: accent, marginBottom: '1rem',
            }}>
              Vieni a trovarci
            </p>
            <h2 style={{
              fontSize: 'clamp(2rem, 4vw, 3.5rem)',
              fontWeight: 800,
              letterSpacing: '-0.04em',
              marginBottom: '2.5rem',
            }}>
              Contatti
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {address && (
                <div>
                  <p style={{ fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: muted, marginBottom: '0.4rem' }}>Indirizzo</p>
                  <p style={{ fontSize: '0.95rem' }}>{address}</p>
                </div>
              )}
              {phone && (
                <div>
                  <p style={{ fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: muted, marginBottom: '0.4rem' }}>Telefono</p>
                  <a href={`tel:${phone}`} style={{ fontSize: '0.95rem', color: text, textDecoration: 'none' }}>{phone}</a>
                </div>
              )}
              {email && (
                <div>
                  <p style={{ fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: muted, marginBottom: '0.4rem' }}>Email</p>
                  <a href={`mailto:${email}`} style={{ fontSize: '0.95rem', color: text, textDecoration: 'none' }}>{email}</a>
                </div>
              )}

              {hours && (
                <div>
                  <p style={{ fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: muted, marginBottom: '0.75rem' }}>Orari</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {Object.entries(hours).map(([day, h]) => (
                      <div key={day} style={{ display: 'flex', justifyContent: 'space-between', maxWidth: 280 }}>
                        <span style={{ fontSize: '0.85rem', color: muted }}>{DAY_NAMES[day] || day}</span>
                        <span style={{ fontSize: '0.85rem' }}>
                          {h.closed ? 'Chiuso' : `${h.open} – ${h.close}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {socialLinks && Object.keys(socialLinks).length > 0 && (
                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
                  {Object.entries(socialLinks).map(([platform, url]) => (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase',
                        color: accent, textDecoration: 'none', transition: 'opacity 0.3s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '0.6')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                    >
                      {platform}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </Reveal>

          {/* Right: map */}
          <Reveal delay={0.2}>
            {mapsUrl ? (
              <div style={{
                position: 'relative', width: '100%', aspectRatio: '1/1',
                borderRadius: 4, overflow: 'hidden',
              }}>
                <iframe
                  src={mapsUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0, filter: 'invert(0.9) hue-rotate(180deg) saturate(0.3)' }}
                  allowFullScreen
                  loading="lazy"
                  title="Mappa"
                />
              </div>
            ) : (
              <div style={{
                width: '100%', aspectRatio: '1/1', borderRadius: 4,
                background: 'rgba(250,242,232,0.03)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: muted, fontSize: '0.8rem',
              }}>
                Mappa
              </div>
            )}
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        padding: '2rem 0',
        borderTop: `1px solid rgba(250,242,232,0.06)`,
        textAlign: 'center',
      }}>
        <p style={{ fontSize: '0.75rem', color: muted, letterSpacing: '0.1em' }}>
          {restaurantName} &copy; {new Date().getFullYear()}
        </p>
      </footer>

      {/* ── WHATSAPP BUTTON (Premium only) ── */}
      {tier === 'premium' && whatsappNumber && (
        <a
          href={`https://wa.me/${whatsappNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 9998,
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: '#25D366',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(37,211,102,0.4)',
            transition: 'transform 0.2s',
            textDecoration: 'none',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          aria-label="Scrivici su WhatsApp"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </a>
      )}

      {/* Sticky mobile bottom bar */}
      <StickyMobileBar
        phone={phone}
        address={address}
        hasReservation={tier !== 'basic'}
        whatsapp={tier === 'premium' ? whatsappNumber : undefined}
        accent={accent}
        theme="dark"
        scope="cin-smb"
      />
    </div>
  )
}
