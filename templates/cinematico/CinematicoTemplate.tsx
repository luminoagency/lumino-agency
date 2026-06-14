'use client'

import { useRef, useEffect, useState } from 'react'
import Image from 'next/image'

interface CinematicoProps {
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

function CinematicoReservationForm({ accent, bg, text, muted }: { accent: string; bg: string; text: string; muted: string }) {
  const [submitted, setSubmitted] = useState(false)

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
      <section style={{ padding: 'clamp(4rem, 10vh, 8rem) 0', borderTop: '1px solid rgba(250,242,232,0.06)' }}>
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
    <section style={{ padding: 'clamp(4rem, 10vh, 8rem) 0', borderTop: '1px solid rgba(250,242,232,0.06)' }}>
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
          <div className="cin-form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <input required type="text" placeholder="Nome" style={inputStyle} />
            <input required type="tel" placeholder="Telefono" style={inputStyle} />
          </div>
          <div className="cin-form-grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem' }}>
            <input required type="date" style={inputStyle} />
            <input required type="time" style={inputStyle} />
            <input required type="number" min={1} max={20} placeholder="Persone" style={inputStyle} />
          </div>
          <textarea
            placeholder="Note (opzionale)"
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
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
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(1.5rem, 5vw, 4rem)' }}>
        <Reveal>
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: accent, marginBottom: '1rem' }}>
            In programma
          </p>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 0.95, marginBottom: 'clamp(2rem, 4vh, 3rem)', color: text }}>
            Eventi
          </h2>
        </Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {events.map((ev, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(250,242,232,0.08)',
                borderRadius: 4,
                overflow: 'hidden',
              }}>
                {ev.imageUrl && (
                  <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden' }}>
                    <img src={ev.imageUrl} alt={ev.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <div style={{ padding: '1.5rem' }}>
                  <p style={{ fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: accent, marginBottom: '0.5rem' }}>
                    {new Date(ev.date).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: text, marginBottom: '0.5rem' }}>{ev.title}</h3>
                  {ev.description && <p style={{ fontSize: '0.85rem', color: muted, lineHeight: 1.6 }}>{ev.description}</p>}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

export function CinematicoTemplate(props: CinematicoProps) {
  const {
    restaurantName, tagline, description, heroImage, aboutImage,
    menuCategories, galleryImages, address, phone, email,
    hours, mapsUrl, socialLinks, accentColor = '#e52d1d', logoUrl,
    tier = 'basic', events, whatsappNumber,
  } = props

  const accent = accentColor
  const bg = '#0a0a08'
  const text = '#FAF2E8'
  const muted = '#8a8078'

  const [activeCategory, setActiveCategory] = useState(0)
  const cinMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (cinMenuRef.current) cinMenuRef.current.scrollTo({ left: 0, behavior: 'smooth' })
  }, [activeCategory])

  return (
    <div style={{ background: bg, color: text, fontFamily: "'Inter', sans-serif" }}>
      <style>{`
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
        <div style={{ position: 'absolute', inset: 0 }}>
          <Image
            src={heroImage}
            alt={restaurantName}
            fill
            priority
            sizes="100vw"
            style={{ objectFit: 'cover', objectPosition: 'center' }}
          />
        </div>
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
            <div style={{ marginBottom: '2rem', opacity: 0.9 }}>
              <Image src={logoUrl} alt="Logo" width={60} height={60} style={{ filter: 'brightness(10)' }} />
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
          <div style={{
            marginTop: '3rem', width: 1, height: 60,
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
      <section style={{ padding: 'clamp(4rem, 10vh, 8rem) 0' }}>
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
              <div key={`${activeCategory}-${i}`} className="cin-menu-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, color: text, lineHeight: 1.3, maxWidth: '70%', margin: 0 }}>{item.name}</h4>
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
        <div className="cin-gallery-strip" style={{ paddingLeft: 'clamp(1.5rem, 5vw, 4rem)' }}>
          {galleryImages.map((img, i) => (
            <div key={i} className="cin-gallery-item">
              <Image
                src={img.url}
                alt={img.alt}
                fill
                sizes="40vw"
                style={{ objectFit: 'cover' }}
              />
              {img.caption && (
                <div className="cin-caption">
                  <p style={{ fontSize: '0.8rem', fontWeight: 500, color: text }}>
                    {img.caption}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── RESERVATION FORM (Pro + Premium) ── */}
      {tier !== 'basic' && <CinematicoReservationForm accent={accent} bg={bg} text={text} muted={muted} />}

      {/* ── EVENTS (Pro + Premium) ── */}
      {tier !== 'basic' && events && events.length > 0 && (
        <CinematicoEvents events={events} accent={accent} bg={bg} text={text} muted={muted} />
      )}

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
    </div>
  )
}
