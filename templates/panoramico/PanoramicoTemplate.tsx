'use client'

import { useRef, useEffect, useState } from 'react'
import Image from 'next/image'

interface PanoramicoProps {
  restaurantName: string
  tagline?: string
  description?: string
  heroImage: string
  aboutImage?: string
  menuCategories: Array<{
    name: string
    description?: string
    items: Array<{ name: string; description?: string; price: number }>
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
}

const DAY_NAMES: Record<string, string> = {
  mon: 'Lunedì', tue: 'Martedì', wed: 'Mercoledì', thu: 'Giovedì',
  fri: 'Venerdì', sat: 'Sabato', sun: 'Domenica',
}

function useSlideIn() {
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
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return ref
}

function SlideIn({ children, from = 'left', delay = 0, className = '' }: {
  children: React.ReactNode
  from?: 'left' | 'right' | 'bottom' | 'top'
  delay?: number
  className?: string
}) {
  const ref = useSlideIn()
  const dir = {
    left: 'pan-from-left',
    right: 'pan-from-right',
    bottom: 'pan-from-bottom',
    top: 'pan-from-top',
  }[from]
  return (
    <div ref={ref} className={`pan-slide ${dir} ${className}`} style={{ transitionDelay: `${delay}s` }}>
      {children}
    </div>
  )
}

function ReservationForm({ accent, text, muted }: { accent: string; text: string; muted: string }) {
  const [submitted, setSubmitted] = useState(false)
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.85rem 1rem',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8, color: text, fontSize: '0.9rem', fontFamily: 'inherit',
    outline: 'none', boxSizing: 'border-box' as const,
    transition: 'border-color 0.3s, background 0.3s',
  }

  if (submitted) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <div style={{ width: 60, height: 3, background: accent, margin: '0 auto 2rem', borderRadius: 2 }} />
        <h3 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '1rem', color: text }}>Prenotazione ricevuta!</h3>
        <p style={{ color: muted }}>Ti contatteremo a breve per confermare.</p>
      </div>
    )
  }

  return (
    <form onSubmit={e => { e.preventDefault(); setSubmitted(true) }}
      style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="pan-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <input required type="text" placeholder="Nome" style={inputStyle} />
        <input required type="tel" placeholder="Telefono" style={inputStyle} />
      </div>
      <div className="pan-form-row-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
        <input required type="date" style={inputStyle} />
        <input required type="time" style={inputStyle} />
        <input required type="number" min={1} max={20} placeholder="Persone" style={inputStyle} />
      </div>
      <textarea placeholder="Note (opzionale)" rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
      <button type="submit" style={{
        padding: '1rem 2.5rem', background: accent, color: '#fff', border: 'none',
        borderRadius: 8, fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.08em',
        textTransform: 'uppercase' as const, cursor: 'pointer', fontFamily: 'inherit',
        transition: 'transform 0.3s, opacity 0.3s', alignSelf: 'flex-start',
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.opacity = '0.9' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.opacity = '1' }}
      >Prenota ora</button>
    </form>
  )
}

export function PanoramicoTemplate(props: PanoramicoProps) {
  const {
    restaurantName, tagline, description, heroImage, aboutImage,
    menuCategories, galleryImages, address, phone, email,
    hours, mapsUrl, socialLinks, accentColor = '#c9a84c', logoUrl,
    tier = 'basic', events, whatsappNumber,
  } = props

  const accent = accentColor
  const bg = '#0b0b09'
  const bgCard = '#141411'
  const text = '#f2ede5'
  const muted = '#918b7f'

  const [activeCategory, setActiveCategory] = useState(0)
  const menuStripRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (menuStripRef.current) {
      menuStripRef.current.scrollTo({ left: 0, behavior: 'smooth' })
    }
  }, [activeCategory])

  return (
    <div style={{ background: bg, color: text, fontFamily: "'Inter', system-ui, sans-serif", overflowX: 'hidden' }}>
      <style>{`
        /* ── SLIDE ANIMATIONS ── */
        .pan-slide {
          opacity: 0;
          transition: opacity 0.9s cubic-bezier(0.22, 1, 0.36, 1),
                      transform 0.9s cubic-bezier(0.22, 1, 0.36, 1);
          will-change: opacity, transform;
        }
        .pan-from-left { transform: translateX(-100px); }
        .pan-from-right { transform: translateX(100px); }
        .pan-from-bottom { transform: translateY(70px); }
        .pan-from-top { transform: translateY(-50px); }
        .pan-visible {
          opacity: 1 !important;
          transform: translate(0, 0) !important;
        }

        /* ── HERO ── */
        .pan-hero-name {
          font-size: clamp(3.2rem, 11vw, 9rem);
          font-weight: 900;
          letter-spacing: -0.05em;
          line-height: 0.88;
          animation: panNameReveal 1.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          opacity: 0;
          clip-path: inset(0 100% 0 0);
        }
        @keyframes panNameReveal {
          0% { opacity: 0; clip-path: inset(0 100% 0 0); }
          30% { opacity: 1; }
          100% { opacity: 1; clip-path: inset(0 0% 0 0); }
        }
        .pan-hero-tag {
          animation: panSlideUp 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.6s forwards;
          opacity: 0;
        }
        @keyframes panSlideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .pan-hero-accent-line {
          animation: panGrowRight 1s cubic-bezier(0.22, 1, 0.36, 1) 0.3s forwards;
          transform-origin: left;
          transform: scaleX(0);
        }
        @keyframes panGrowRight {
          to { transform: scaleX(1); }
        }
        .pan-hero-scroll-cue {
          animation: panBounce 2.5s ease-in-out 2s infinite;
          opacity: 0;
          animation-fill-mode: forwards;
        }
        @keyframes panBounce {
          0%, 100% { opacity: 0.6; transform: translateY(0); }
          50% { opacity: 0.2; transform: translateY(10px); }
        }

        /* ── MENU STRIP ── */
        .pan-menu-scroll {
          display: flex;
          gap: 1.25rem;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          padding: 1rem 0 2rem;
          scroll-behavior: smooth;
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .pan-menu-scroll::-webkit-scrollbar { display: none; }
        .pan-menu-item {
          flex: 0 0 300px;
          scroll-snap-align: start;
          background: ${bgCard};
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 14px;
          padding: 1.75rem;
          transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1),
                      border-color 0.3s, box-shadow 0.3s;
        }
        .pan-menu-item:hover {
          transform: translateY(-8px) scale(1.02);
          border-color: ${accent}44;
          box-shadow: 0 12px 40px rgba(0,0,0,0.3);
        }

        /* ── CATEGORY PILLS ── */
        .pan-pill {
          padding: 0.55rem 1.4rem;
          border-radius: 50px;
          border: 1px solid rgba(255,255,255,0.12);
          background: transparent;
          color: ${muted};
          font-size: 0.78rem;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .pan-pill:hover { border-color: ${accent}66; color: ${text}; }
        .pan-pill-on {
          background: ${accent} !important;
          border-color: ${accent} !important;
          color: #fff !important;
          transform: scale(1.05);
        }

        /* ── GALLERY MOSAIC ── */
        .pan-gallery-mosaic {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-auto-rows: 220px;
          gap: 6px;
        }
        .pan-gallery-mosaic > :nth-child(1) { grid-row: span 2; }
        .pan-gallery-mosaic > :nth-child(4) { grid-column: span 2; }
        .pan-gal-cell {
          position: relative;
          overflow: hidden;
          border-radius: 8px;
        }
        .pan-gal-cell img {
          transition: transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .pan-gal-cell:hover img {
          transform: scale(1.1) rotate(0.5deg);
        }
        .pan-gal-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 50%);
          opacity: 0;
          transition: opacity 0.35s;
          display: flex; align-items: flex-end; padding: 1.25rem;
        }
        .pan-gal-cell:hover .pan-gal-overlay { opacity: 1; }

        /* ── EVENT CARDS ── */
        .pan-ev-card {
          background: ${bgCard};
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 14px;
          overflow: hidden;
          transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.3s;
        }
        .pan-ev-card:hover {
          transform: translateY(-6px);
          border-color: ${accent}33;
        }

        /* ── MOBILE ── */
        @media (max-width: 768px) {
          .pan-about-grid { grid-template-columns: 1fr !important; }
          .pan-contact-grid { grid-template-columns: 1fr !important; }
          .pan-gallery-mosaic {
            grid-template-columns: 1fr 1fr !important;
            grid-auto-rows: 180px !important;
          }
          .pan-gallery-mosaic > :nth-child(1) { grid-row: span 1; }
          .pan-gallery-mosaic > :nth-child(4) { grid-column: span 1; }
          .pan-menu-item { flex: 0 0 260px; }
          .pan-form-row, .pan-form-row-3 { grid-template-columns: 1fr !important; }
          .pan-events-grid { grid-template-columns: 1fr !important; }
          .pan-from-left { transform: translateX(-60px); }
          .pan-from-right { transform: translateX(60px); }
        }
        @media (max-width: 480px) {
          .pan-gallery-mosaic {
            grid-template-columns: 1fr !important;
            grid-auto-rows: 200px !important;
          }
          .pan-menu-item { flex: 0 0 240px; }
        }
      `}</style>

      {/* ════════════ HERO ════════════ */}
      <section style={{ position: 'relative', height: '100svh', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <Image src={heroImage} alt={restaurantName} fill priority sizes="100vw"
            style={{ objectFit: 'cover', objectPosition: 'center' }} />
        </div>
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(160deg, ${bg}f0 0%, ${bg}99 50%, ${bg}dd 100%)`,
        }} />

        <div style={{
          position: 'relative', zIndex: 10, height: '100%',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: '0 clamp(2rem, 8vw, 8rem)',
        }}>
          <div className="pan-hero-accent-line" style={{
            width: 90, height: 3, background: accent, marginBottom: '2rem', borderRadius: 2,
          }} />
          <h1 className="pan-hero-name" style={{ color: text, marginBottom: '1.5rem' }}>
            {restaurantName}
          </h1>
          {tagline && (
            <p className="pan-hero-tag" style={{
              fontSize: 'clamp(0.9rem, 2vw, 1.3rem)',
              color: muted, fontWeight: 400, maxWidth: '32rem', lineHeight: 1.7,
            }}>
              {tagline}
            </p>
          )}
        </div>

        <div className="pan-hero-scroll-cue" style={{
          position: 'absolute', bottom: '2rem', left: '50%',
          transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: '0.4rem',
        }}>
          <span style={{ fontSize: '0.55rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: muted }}>
            Scopri
          </span>
          <div style={{ width: 1, height: 35, background: `linear-gradient(to bottom, ${accent}, transparent)` }} />
        </div>
      </section>

      {/* ════════════ ABOUT ════════════ */}
      <section style={{ padding: 'clamp(5rem, 12vh, 10rem) 0' }}>
        <div className="pan-about-grid" style={{
          maxWidth: 1200, margin: '0 auto', padding: '0 clamp(1.5rem, 5vw, 4rem)',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(2rem, 5vw, 5rem)',
          alignItems: 'center',
        }}>
          {aboutImage && (
            <SlideIn from="left">
              <div style={{
                position: 'relative', aspectRatio: '4/5', overflow: 'hidden', borderRadius: 10,
              }}>
                <Image src={aboutImage} alt="About" fill sizes="(max-width:768px) 100vw, 50vw"
                  style={{ objectFit: 'cover' }} />
              </div>
            </SlideIn>
          )}
          <SlideIn from="right" delay={0.15}>
            <div style={{ width: 50, height: 3, background: accent, marginBottom: '1.5rem', borderRadius: 2 }} />
            <h2 style={{
              fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 800,
              letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: '1.5rem',
            }}>
              La nostra<br /><span style={{ color: accent }}>storia</span>
            </h2>
            {description && (
              <p style={{ fontSize: 'clamp(0.85rem, 1.1vw, 1rem)', lineHeight: 1.9, color: muted }}>
                {description}
              </p>
            )}
          </SlideIn>
        </div>
      </section>

      {/* ════════════ MENU — lateral scroll ════════════ */}
      <section style={{ padding: 'clamp(4rem, 10vh, 8rem) 0', background: bgCard }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(1.5rem, 5vw, 4rem)' }}>
          <SlideIn from="left">
            <p style={{ fontSize: '0.62rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: accent, marginBottom: '0.75rem' }}>
              Selezione
            </p>
            <h2 style={{
              fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 800,
              letterSpacing: '-0.04em', marginBottom: '1.5rem',
            }}>
              Il Menu
            </h2>
          </SlideIn>

          <SlideIn from="right" delay={0.1}>
            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              {menuCategories.map((cat, i) => (
                <button key={i}
                  className={`pan-pill ${activeCategory === i ? 'pan-pill-on' : ''}`}
                  onClick={() => setActiveCategory(i)}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </SlideIn>

          <div ref={menuStripRef} className="pan-menu-scroll">
            {menuCategories[activeCategory]?.items.map((item, i) => (
              <div key={`${activeCategory}-${i}`} className="pan-menu-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: text, lineHeight: 1.3, maxWidth: '70%' }}>{item.name}</h4>
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: accent, whiteSpace: 'nowrap' }}>
                    {item.price.toFixed(2)} €
                  </span>
                </div>
                {item.description && (
                  <p style={{ fontSize: '0.8rem', color: muted, lineHeight: 1.6 }}>{item.description}</p>
                )}
                <div style={{ width: 30, height: 2, background: `${accent}33`, marginTop: '1.25rem', borderRadius: 1 }} />
              </div>
            ))}
          </div>

          <p style={{ fontSize: '0.7rem', color: `${muted}88`, marginTop: '0.5rem' }}>
            ← Scorri per vedere tutti i piatti →
          </p>
        </div>
      </section>

      {/* ════════════ GALLERY — mosaic ════════════ */}
      <section style={{ padding: 'clamp(4rem, 10vh, 8rem) 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(1.5rem, 5vw, 4rem)' }}>
          <SlideIn from="right">
            <p style={{ fontSize: '0.62rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: accent, marginBottom: '0.75rem' }}>
              Atmosfera
            </p>
            <h2 style={{
              fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 800,
              letterSpacing: '-0.04em', marginBottom: '2rem',
            }}>
              Galleria
            </h2>
          </SlideIn>

          <div className="pan-gallery-mosaic">
            {galleryImages.slice(0, 6).map((img, i) => (
              <SlideIn key={i} from={i % 2 === 0 ? 'left' : 'right'} delay={i * 0.07} className="pan-gal-cell">
                <Image src={img.url} alt={img.alt} fill sizes="(max-width:480px) 100vw, (max-width:768px) 50vw, 33vw"
                  style={{ objectFit: 'cover' }} />
                {img.caption && (
                  <div className="pan-gal-overlay">
                    <p style={{ fontSize: '0.78rem', fontWeight: 500, color: '#fff' }}>{img.caption}</p>
                  </div>
                )}
              </SlideIn>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ RESERVATION (Pro+) ════════════ */}
      {tier !== 'basic' && (
        <section style={{ padding: 'clamp(4rem, 10vh, 8rem) 0', background: bgCard }}>
          <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 clamp(1.5rem, 5vw, 4rem)' }}>
            <SlideIn from="left">
              <p style={{ fontSize: '0.62rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: accent, marginBottom: '0.75rem' }}>
                Tavolo
              </p>
              <h2 style={{
                fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 800,
                letterSpacing: '-0.04em', marginBottom: '2rem',
              }}>
                Prenota
              </h2>
            </SlideIn>
            <SlideIn from="bottom" delay={0.15}>
              <ReservationForm accent={accent} text={text} muted={muted} />
            </SlideIn>
          </div>
        </section>
      )}

      {/* ════════════ EVENTS (Pro+) ════════════ */}
      {tier !== 'basic' && events && events.length > 0 && (
        <section style={{ padding: 'clamp(4rem, 10vh, 8rem) 0' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(1.5rem, 5vw, 4rem)' }}>
            <SlideIn from="left">
              <p style={{ fontSize: '0.62rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: accent, marginBottom: '0.75rem' }}>
                In programma
              </p>
              <h2 style={{
                fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 800,
                letterSpacing: '-0.04em', marginBottom: '2rem',
              }}>
                Eventi
              </h2>
            </SlideIn>
            <div className="pan-events-grid" style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem',
            }}>
              {events.map((ev, i) => (
                <SlideIn key={i} from={i % 2 === 0 ? 'left' : 'right'} delay={i * 0.1}>
                  <div className="pan-ev-card">
                    {ev.imageUrl && (
                      <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden' }}>
                        <img src={ev.imageUrl} alt={ev.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
                          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                        />
                      </div>
                    )}
                    <div style={{ padding: '1.5rem' }}>
                      <p style={{ fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: accent, marginBottom: '0.5rem' }}>
                        {new Date(ev.date).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </p>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>{ev.title}</h3>
                      {ev.description && (
                        <p style={{ fontSize: '0.8rem', color: muted, lineHeight: 1.6 }}>{ev.description}</p>
                      )}
                    </div>
                  </div>
                </SlideIn>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ════════════ CONTACT ════════════ */}
      <section style={{ padding: 'clamp(4rem, 10vh, 8rem) 0', background: bgCard }}>
        <div className="pan-contact-grid" style={{
          maxWidth: 1200, margin: '0 auto', padding: '0 clamp(1.5rem, 5vw, 4rem)',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(2rem, 5vw, 5rem)',
        }}>
          <SlideIn from="left">
            <p style={{ fontSize: '0.62rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: accent, marginBottom: '0.75rem' }}>
              Vieni a trovarci
            </p>
            <h2 style={{
              fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 800,
              letterSpacing: '-0.04em', marginBottom: '2.5rem',
            }}>
              Contatti
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {Object.entries(hours).map(([day, h]) => (
                      <div key={day} style={{ display: 'flex', justifyContent: 'space-between', maxWidth: 280 }}>
                        <span style={{ fontSize: '0.83rem', color: muted }}>{DAY_NAMES[day] || day}</span>
                        <span style={{ fontSize: '0.83rem' }}>{h.closed ? 'Chiuso' : `${h.open} – ${h.close}`}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {socialLinks && Object.keys(socialLinks).length > 0 && (
                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
                  {Object.entries(socialLinks).map(([platform, url]) => (
                    <a key={platform} href={url} target="_blank" rel="noopener noreferrer"
                      style={{
                        fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase',
                        color: accent, textDecoration: 'none', transition: 'opacity 0.3s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '0.6')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                    >{platform}</a>
                  ))}
                </div>
              )}
            </div>
          </SlideIn>

          <SlideIn from="right" delay={0.2}>
            {mapsUrl ? (
              <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', borderRadius: 10, overflow: 'hidden' }}>
                <iframe src={mapsUrl} width="100%" height="100%"
                  style={{ border: 0, filter: 'invert(0.92) hue-rotate(180deg) saturate(0.25)' }}
                  allowFullScreen loading="lazy" title="Mappa" />
              </div>
            ) : (
              <div style={{
                width: '100%', aspectRatio: '1/1', borderRadius: 10,
                background: 'rgba(255,255,255,0.03)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: muted, fontSize: '0.8rem',
              }}>Mappa</div>
            )}
          </SlideIn>
        </div>
      </section>

      {/* ════════════ FOOTER ════════════ */}
      <footer style={{ padding: '2.5rem 0', textAlign: 'center', borderTop: `1px solid rgba(255,255,255,0.05)` }}>
        <p style={{ fontSize: '0.72rem', color: muted, letterSpacing: '0.1em' }}>
          {restaurantName} &copy; {new Date().getFullYear()}
        </p>
      </footer>

      {/* ════════════ WHATSAPP FAB (Premium) ════════════ */}
      {tier === 'premium' && whatsappNumber && (
        <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer"
          style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 9998,
            width: 56, height: 56, borderRadius: '50%', background: '#25D366',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(37,211,102,0.4)',
            transition: 'transform 0.3s', textDecoration: 'none',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.12)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </a>
      )}
    </div>
  )
}
