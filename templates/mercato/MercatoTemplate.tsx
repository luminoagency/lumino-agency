'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { StickyMobileBar } from '../_shared/StickyMobileBar'
import { AllergenBadges } from '../_shared/AllergenBadges'
import { LeaveReviewForm } from '../_shared/LeaveReviewForm'
import GdprConsent from '../_shared/GdprConsent'
import { TIER_CAPS, type FeatureKey } from '@/lib/plans'
import { POWERED_BY } from '@/lib/company'

interface MercatoProps {
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
  features?: Partial<Record<FeatureKey, boolean>>
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
          el.classList.add('mer-visible')
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

function FadeIn({ children, delay = 0, className = '', from = 'up' }: {
  children: React.ReactNode
  delay?: number
  className?: string
  from?: 'up' | 'left' | 'right'
}) {
  const ref = useFadeIn()
  return (
    <div ref={ref} className={`mer-fade mer-from-${from} ${className}`} style={{ transitionDelay: `${delay}s` }}>
      {children}
    </div>
  )
}

/* Splits text into words and reveals them one by one as they scroll into view */
function WordReveal({ text, className = '', tag = 'p' }: { text: string; className?: string; tag?: 'p' | 'h2' | 'h3' }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('mer-words-visible')
          observer.unobserve(el)
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const words = text.split(' ')
  const Tag = tag as any
  return (
    <Tag ref={ref as any} className={`mer-word-reveal ${className}`}>
      {words.map((w, i) => (
        <span key={i} className="mer-word" style={{ transitionDelay: `${i * 0.025}s` }}>
          {w}{' '}
        </span>
      ))}
    </Tag>
  )
}

function InkButton({ children, onClick, href, accent, variant = 'primary' }: {
  children: React.ReactNode
  onClick?: () => void
  href?: string
  accent: string
  variant?: 'primary' | 'ghost'
}) {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([])
  const idRef = useRef(0)

  const handleClick = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const id = ++idRef.current
    setRipples(prev => [...prev, { x, y, id }])
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 800)
    onClick?.()
  }, [onClick])

  const baseStyle: React.CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    border: variant === 'primary' ? 'none' : `1.5px solid ${accent}`,
    cursor: 'pointer',
    padding: '0.95rem 2.4rem',
    fontSize: '0.95rem',
    fontWeight: 500,
    letterSpacing: '0.05em',
    fontFamily: '"Cormorant Garamond", serif',
    background: variant === 'primary' ? accent : 'transparent',
    color: variant === 'primary' ? '#fdfbf5' : accent,
    transition: 'transform 0.3s, background 0.3s, color 0.3s, box-shadow 0.3s',
    display: 'inline-block',
    textDecoration: 'none',
    textAlign: 'center' as const,
  }

  const content = (
    <>
      <span style={{ position: 'relative', zIndex: 2 }}>{children}</span>
      {ripples.map(r => (
        <span
          key={r.id}
          className="mer-ripple"
          style={{
            left: r.x,
            top: r.y,
            background: variant === 'primary' ? 'rgba(253,251,245,0.5)' : `${accent}55`,
          }}
        />
      ))}
    </>
  )

  if (href) {
    return (
      <a href={href} onClick={handleClick as any} style={baseStyle} className="mer-btn">
        {content}
      </a>
    )
  }
  return (
    <button onClick={handleClick} style={baseStyle} className="mer-btn" type="button">
      {content}
    </button>
  )
}

function ReservationForm({ accent, timeSlots }: { accent: string; timeSlots?: string[] }) {
  const [submitted, setSubmitted] = useState(false)
  const [pickedSlot, setPickedSlot] = useState<string | null>(null)
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.85rem 0',
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid rgba(82, 60, 38, 0.25)',
    color: '#3d2b1c',
    fontSize: '1rem',
    fontFamily: '"Cormorant Garamond", serif',
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.3s',
  }

  if (submitted) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>✦</div>
        <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: '2.2rem', fontWeight: 400, marginBottom: '1rem', color: '#3d2b1c' }}>
          Grazie di cuore
        </h3>
        <p style={{ color: '#7a6754', fontStyle: 'italic' }}>
          Vi contattiamo a breve per confermare la prenotazione.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={e => { e.preventDefault(); setSubmitted(true) }}
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {timeSlots && timeSlots.length > 0 && (
        <div className="mer-slots">
          <div className="mer-slots-title">— Disponibilità per stasera —</div>
          <div className="mer-slots-row">
            {timeSlots.map(slot => (
              <button key={slot} type="button" className={`mer-slot ${pickedSlot === slot ? 'active' : ''}`} onClick={() => setPickedSlot(slot)}>
                {slot}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="mer-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <input required type="text" placeholder="Nome" style={inputStyle} />
        <input required type="text" placeholder="Cognome" style={inputStyle} />
      </div>
      <div className="mer-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <input required type="email" placeholder="Email" style={inputStyle} />
        <input required type="tel" placeholder="Telefono" style={inputStyle} />
      </div>
      <div className="mer-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem' }}>
        <input required type="date" style={inputStyle} />
        <input required type="time" value={pickedSlot || ''} onChange={e => setPickedSlot(e.target.value)} style={inputStyle} />
        <input required type="number" min={1} max={20} placeholder="Persone" style={inputStyle} />
      </div>
      <textarea placeholder="Eventuali richieste speciali..." rows={3} style={{ ...inputStyle, borderBottom: '1px solid rgba(82, 60, 38, 0.25)', resize: 'none', paddingTop: '0.85rem' }} />
      <GdprConsent accent={accent} color="#7a6754" />
      <div style={{ marginTop: '1rem' }}>
        <InkButton accent={accent}>Prenota il tavolo</InkButton>
      </div>
    </form>
  )
}

export function MercatoTemplate(props: MercatoProps) {
  const {
    restaurantName, tagline, description, heroImage, heroImages, aboutImage,
    menuCategories = [], galleryImages = [],
    address, phone, email, hours, mapsUrl, socialLinks,
    accentColor = '#b8451f', logoUrl,
    tier = 'basic', events = [], whatsappNumber, features,
    chef, reviews, faq, timeSlots,
  } = props

  // WhatsApp: attivo se la feature è accesa (fallback al default del piano)
  const whatsappEnabled = features?.whatsappButton ?? TIER_CAPS[tier].whatsappButton

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

  const accent = accentColor
  const paper = '#fdfbf5'
  const ink = '#3d2b1c'
  const muted = '#7a6754'

  const heroImgRef = useRef<HTMLDivElement>(null)
  const heroTextRef = useRef<HTMLDivElement>(null)
  const aboutImgRef = useRef<HTMLDivElement>(null)

  // PARALLAX on hero image + about image
  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      raf = requestAnimationFrame(() => {
        const y = window.scrollY
        if (heroImgRef.current) {
          heroImgRef.current.style.transform = `translate3d(0, ${y * 0.4}px, 0) scale(${1 + y * 0.0003})`
        }
        if (heroTextRef.current) {
          const opacity = Math.max(0, 1 - y * 0.0025)
          heroTextRef.current.style.transform = `translate3d(0, ${y * 0.15}px, 0)`
          heroTextRef.current.style.opacity = String(opacity)
        }
        if (aboutImgRef.current) {
          const rect = aboutImgRef.current.parentElement?.getBoundingClientRect()
          if (rect) {
            const progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height)
            const offset = (progress - 0.5) * -80
            aboutImgRef.current.style.transform = `translate3d(0, ${offset}px, 0) scale(1.15)`
          }
        }
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  // Pick first 4 dishes from all categories as "signature"
  const signatureDishes = menuCategories
    .flatMap(c => c.items.map(it => ({ ...it, category: c.name })))
    .slice(0, 6)

  return (
    <div style={{ background: paper, color: ink, fontFamily: '"Cormorant Garamond", "Georgia", serif', minHeight: '100vh', position: 'relative', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;0,900;1,400;1,500;1,700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400&family=Instrument+Serif:ital@0;1&display=swap');

        body { background: ${paper}; }

        /* Paper texture overlay */
        .mer-paper-texture {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 1;
          opacity: 0.4;
          background-image:
            radial-gradient(circle at 20% 30%, rgba(184, 69, 31, 0.04) 0%, transparent 40%),
            radial-gradient(circle at 80% 70%, rgba(107, 126, 88, 0.04) 0%, transparent 40%);
        }
        .mer-paper-texture::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E");
          mix-blend-mode: multiply;
          opacity: 0.15;
        }

        .mer-content { position: relative; z-index: 10; }

        /* HERO with parallax bg */
        .mer-hero {
          position: relative;
          min-height: 100vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 4rem 2rem;
          text-align: center;
        }
        .mer-hero-img {
          position: absolute;
          inset: -10% 0 -10% 0;
          background-size: cover;
          background-position: center;
          z-index: 0;
          will-change: transform;
        }
        .mer-hero-img::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(253, 251, 245, 0.3) 0%, rgba(253, 251, 245, 0.7) 100%);
        }
        .mer-hero-content {
          position: relative;
          z-index: 2;
          will-change: transform, opacity;
        }

        /* Animated hero text — letter by letter */
        .mer-hero-name {
          font-family: 'Playfair Display', serif;
          font-size: clamp(3.5rem, 11vw, 9rem);
          font-weight: 400;
          font-style: italic;
          line-height: 0.95;
          color: ${ink};
          letter-spacing: -0.02em;
          margin: 1rem 0 1.5rem;
        }
        .mer-hero-name .mer-char {
          display: inline-block;
          opacity: 0;
          transform: translateY(50px) rotate(8deg);
          animation: merCharIn 1s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        @keyframes merCharIn {
          to { opacity: 1; transform: translateY(0) rotate(0); }
        }

        /* Fade animations */
        .mer-fade {
          opacity: 0;
          transition: opacity 1.4s cubic-bezier(0.22, 1, 0.36, 1), transform 1.4s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .mer-from-up { transform: translateY(40px); }
        .mer-from-left { transform: translateX(-40px); }
        .mer-from-right { transform: translateX(40px); }
        .mer-fade.mer-visible { opacity: 1; transform: translate(0, 0); }

        /* WORD REVEAL on scroll */
        .mer-word-reveal { display: block; }
        .mer-word {
          display: inline-block;
          opacity: 0;
          transform: translateY(20px);
          filter: blur(8px);
          transition: opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1),
                      transform 0.8s cubic-bezier(0.22, 1, 0.36, 1),
                      filter 0.8s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .mer-words-visible .mer-word {
          opacity: 1;
          transform: translateY(0);
          filter: blur(0);
        }

        /* MARQUEE - giant scrolling text */
        .mer-marquee {
          overflow: hidden;
          padding: 2.5rem 0;
          background: ${ink};
          color: ${paper};
          position: relative;
          border-top: 1px solid ${accent}40;
          border-bottom: 1px solid ${accent}40;
        }
        .mer-marquee-track {
          display: inline-flex;
          gap: 3rem;
          animation: merMarquee 28s linear infinite;
          white-space: nowrap;
          will-change: transform;
        }
        @keyframes merMarquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .mer-marquee-item {
          font-family: 'Playfair Display', serif;
          font-size: clamp(3rem, 8vw, 6rem);
          font-weight: 400;
          font-style: italic;
          line-height: 1;
          letter-spacing: -0.02em;
          display: inline-flex;
          align-items: center;
          gap: 3rem;
        }
        .mer-marquee-item::after {
          content: '✦';
          color: ${accent};
          font-style: normal;
          font-size: 0.6em;
        }
        .mer-marquee-alt {
          background: ${paper};
          color: ${ink};
          border-top-color: ${accent}30;
          border-bottom-color: ${accent}30;
        }
        .mer-marquee-alt .mer-marquee-track { animation-direction: reverse; animation-duration: 32s; }

        /* Ink ripple */
        .mer-ripple {
          position: absolute;
          border-radius: 50%;
          width: 0;
          height: 0;
          transform: translate(-50%, -50%);
          animation: merRipple 0.8s ease-out forwards;
          pointer-events: none;
          z-index: 1;
        }
        @keyframes merRipple {
          0% { width: 0; height: 0; opacity: 0.6; }
          100% { width: 400px; height: 400px; opacity: 0; }
        }
        .mer-btn:hover { transform: translateY(-2px); }
        .mer-btn[style*="background: ${accent}"]:hover { box-shadow: 0 8px 24px ${accent}40 !important; }
        .mer-btn[style*="background: transparent"]:hover { background: ${accent} !important; color: ${paper} !important; }

        /* Decorative divider */
        .mer-divider {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1.5rem;
          margin: 1.5rem 0;
        }
        .mer-divider::before, .mer-divider::after {
          content: '';
          flex: 0 0 60px;
          height: 1px;
          background: ${ink}40;
        }
        .mer-divider-icon {
          font-size: 1.2rem;
          color: ${accent};
          letter-spacing: 0.4em;
        }

        /* ABOUT with parallax image */
        .mer-about {
          padding: 8rem 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }
        .mer-about-img-frame {
          position: relative;
          overflow: hidden;
          aspect-ratio: 3/4;
          box-shadow: 0 20px 60px rgba(61, 43, 28, 0.2);
        }
        .mer-about-img-frame > div {
          will-change: transform;
        }

        /* SIGNATURE DISHES — horizontal scroll modern */
        .mer-signature-section {
          padding: 6rem 0;
          background: linear-gradient(180deg, ${paper} 0%, #f5efe1 100%);
          overflow: hidden;
        }
        .mer-signature-header {
          padding: 0 2rem;
          max-width: 1300px;
          margin: 0 auto 3rem;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          flex-wrap: wrap;
          gap: 2rem;
        }
        .mer-signature-scroll {
          display: flex;
          gap: 1.5rem;
          overflow-x: auto;
          padding: 1rem 2rem 3rem;
          scroll-snap-type: x mandatory;
          scrollbar-width: none;
        }
        .mer-signature-scroll::-webkit-scrollbar { display: none; }
        .mer-signature-card {
          flex: 0 0 360px;
          scroll-snap-align: start;
          background: ${paper};
          padding: 2rem;
          border: 1px solid ${ink}15;
          position: relative;
          transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.5s, border-color 0.5s;
          cursor: pointer;
          min-height: 280px;
          display: flex;
          flex-direction: column;
        }
        .mer-signature-card:hover {
          transform: translateY(-12px);
          box-shadow: 0 24px 60px rgba(61, 43, 28, 0.18);
          border-color: ${accent};
        }
        .mer-signature-num {
          font-family: 'Playfair Display', serif;
          font-size: 6rem;
          font-weight: 400;
          font-style: italic;
          line-height: 0.8;
          color: ${accent};
          opacity: 0.18;
          position: absolute;
          top: 1rem;
          right: 1.5rem;
        }
        .mer-signature-category {
          font-family: 'Cormorant Garamond', serif;
          font-size: 0.8rem;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: ${accent};
          margin-bottom: 0.75rem;
        }
        .mer-signature-name {
          font-family: 'Playfair Display', serif;
          font-size: 1.7rem;
          font-weight: 400;
          font-style: italic;
          color: ${ink};
          margin-bottom: 1rem;
          line-height: 1.15;
        }
        .mer-signature-desc {
          font-family: 'Cormorant Garamond', serif;
          color: ${muted};
          font-size: 1rem;
          line-height: 1.6;
          flex: 1;
        }
        .mer-signature-price {
          font-family: 'Playfair Display', serif;
          font-size: 1.4rem;
          font-weight: 500;
          color: ${ink};
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 1px dashed ${ink}25;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .mer-signature-price::after {
          content: '→';
          color: ${accent};
          font-size: 1.5rem;
          transition: transform 0.3s;
        }
        .mer-signature-card:hover .mer-signature-price::after { transform: translateX(8px); }

        .mer-scroll-hint {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          color: ${muted};
          font-size: 0.95rem;
          letter-spacing: 0.1em;
        }

        /* MENU - paper style list */
        .mer-menu-item {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 1.5rem;
          padding: 1.5rem 0;
          border-bottom: 1px dashed ${ink}20;
          transition: padding-left 0.3s, background 0.3s;
        }
        .mer-menu-item:hover {
          padding-left: 0.75rem;
          background: linear-gradient(90deg, ${accent}08, transparent);
        }
        .mer-menu-item-info { flex: 1; }
        .mer-menu-item-dots {
          flex: 1;
          border-bottom: 1px dotted ${ink}40;
          margin: 0 0.5rem 0.5rem;
          min-width: 30px;
        }

        /* Polaroid gallery */
        .mer-polaroid {
          background: ${paper};
          padding: 1rem 1rem 2.5rem;
          box-shadow: 0 4px 20px rgba(61, 43, 28, 0.15), 0 1px 3px rgba(61, 43, 28, 0.1);
          transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.4s;
          position: relative;
        }
        .mer-polaroid:nth-child(odd) { transform: rotate(-1.5deg); }
        .mer-polaroid:nth-child(even) { transform: rotate(1.2deg); }
        .mer-polaroid:nth-child(3n) { transform: rotate(-0.5deg); }
        .mer-polaroid:hover {
          transform: rotate(0) translateY(-8px) scale(1.02);
          box-shadow: 0 12px 40px rgba(61, 43, 28, 0.25);
          z-index: 5;
        }
        .mer-polaroid img {
          width: 100%;
          aspect-ratio: 4/5;
          object-fit: cover;
          display: block;
          filter: sepia(0.05);
        }
        .mer-polaroid-caption {
          position: absolute;
          bottom: 0.8rem;
          left: 50%;
          transform: translateX(-50%);
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 0.95rem;
          color: ${ink};
          width: 90%;
          text-align: center;
        }

        /* MANIFESTO section - giant kinetic type */
        .mer-manifesto {
          padding: 8rem 2rem;
          max-width: 1200px;
          margin: 0 auto;
          text-align: center;
        }
        .mer-manifesto h2 {
          font-family: 'Playfair Display', serif;
          font-size: clamp(2.5rem, 7vw, 6rem);
          font-weight: 400;
          line-height: 1.05;
          letter-spacing: -0.03em;
          color: ${ink};
        }
        .mer-manifesto em {
          font-style: italic;
          color: ${accent};
        }
        .mer-manifesto-byline {
          margin-top: 3rem;
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 1.1rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: ${muted};
        }

        /* ── SCRAPBOOK gallery — clean 3-column ── */
        .mer-scrapbook {
          position: relative;
          background:
            radial-gradient(ellipse 60% 50% at 30% 20%, rgba(184, 69, 31, 0.05) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 70% 80%, rgba(107, 126, 88, 0.04) 0%, transparent 60%);
          padding: 5rem 2rem;
        }
        .mer-scrap-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 3rem 2.5rem;
          max-width: 1100px;
          margin: 0 auto;
        }
        .mer-scrap-item {
          position: relative;
          background: ${paper};
          padding: 1rem 1rem 3rem;
          box-shadow: 0 6px 20px rgba(61, 43, 28, 0.18);
          transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.5s;
          cursor: pointer;
        }
        .mer-scrap-item:nth-child(odd) { transform: rotate(-1.5deg); }
        .mer-scrap-item:nth-child(even) { transform: rotate(1.2deg); }
        .mer-scrap-item:nth-child(3n) { transform: rotate(-0.5deg); }
        .mer-scrap-item:hover {
          z-index: 10;
          transform: rotate(0deg) scale(1.04) translateY(-8px) !important;
          box-shadow: 0 20px 50px rgba(61, 43, 28, 0.28);
        }
        .mer-scrap-item img {
          width: 100%;
          aspect-ratio: 4/5;
          object-fit: cover;
          display: block;
          filter: sepia(0.1) saturate(0.92);
        }
        /* Tape strip on top */
        .mer-scrap-item::before {
          content: '';
          position: absolute;
          top: -10px;
          left: 50%;
          transform: translateX(-50%) rotate(-2deg);
          width: 80px;
          height: 22px;
          background: rgba(218, 200, 158, 0.7);
          box-shadow: 0 2px 4px rgba(0,0,0,0.08);
          z-index: 2;
        }
        .mer-scrap-cap {
          position: absolute;
          left: 1rem;
          right: 1rem;
          bottom: 0.8rem;
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 1rem;
          color: ${ink};
          text-align: center;
        }
        /* Ticket stub item — replaces image area */
        .mer-scrap-ticket {
          background: linear-gradient(135deg, ${accent} 0%, color-mix(in oklch, ${accent} 70%, #6b3215) 100%);
          color: ${paper};
          aspect-ratio: 4/5;
          padding: 2rem 1.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 0.5rem;
          position: relative;
        }
        .mer-scrap-ticket::after {
          content: '';
          position: absolute;
          left: 10%;
          right: 10%;
          top: 55%;
          border-top: 1px dashed ${paper}aa;
        }
        .mer-scrap-ticket-top {
          font-family: 'Playfair Display', serif;
          font-size: 0.7rem;
          letter-spacing: 0.35em;
          text-transform: uppercase;
          opacity: 0.9;
          font-weight: 700;
        }
        .mer-scrap-ticket-name {
          font-family: 'Playfair Display', serif;
          font-style: italic;
          font-size: 1.7rem;
          font-weight: 500;
          line-height: 1.05;
          text-align: center;
          margin: 0.5rem 0;
        }
        .mer-scrap-ticket-bottom {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 0.85rem;
          letter-spacing: 0.1em;
          opacity: 0.8;
          margin-top: 1rem;
          text-align: center;
        }
        /* Pin (paper clip) corner */
        .mer-scrap-pin {
          position: absolute;
          top: -8px;
          right: 12px;
          width: 18px;
          height: 32px;
          border: 2px solid ${muted};
          border-radius: 8px 8px 4px 4px;
          background: transparent;
          z-index: 3;
          transform: rotate(8deg);
          box-shadow: -1px 1px 2px rgba(0,0,0,0.1);
        }

        /* ── PRESS / RATINGS ── */
        .mer-press {
          padding: 2.5rem 1.5rem;
          background: linear-gradient(180deg, #f0e8d6 0%, ${paper} 100%);
          border-top: 1px solid ${ink}15;
          border-bottom: 1px solid ${ink}15;
        }
        .mer-press-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          gap: 2.5rem;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
        }
        .mer-press-block { display: flex; align-items: center; gap: 0.85rem; }
        .mer-press-stars { font-size: 1.3rem; color: ${accent}; letter-spacing: 0.15em; }
        .mer-press-score {
          font-family: 'Playfair Display', serif;
          font-style: italic;
          font-size: 2.4rem;
          font-weight: 500;
          line-height: 1;
          color: ${ink};
          letter-spacing: -0.02em;
        }
        .mer-press-meta {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 0.95rem;
          color: ${muted};
        }
        .mer-press-pipe { width: 1px; height: 36px; background: ${ink}25; }

        /* ── CHEF section ── */
        .mer-chef {
          padding: 8rem 2rem;
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1.1fr;
          gap: 5rem;
          align-items: center;
        }
        .mer-chef-photo {
          position: relative;
          aspect-ratio: 3/4;
          overflow: hidden;
          filter: sepia(0.15) contrast(1.05);
          box-shadow: 0 30px 80px rgba(61, 43, 28, 0.2);
        }
        .mer-chef-photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .mer-chef-photo::after {
          content: '';
          position: absolute;
          inset: -10px;
          border: 1px solid ${accent}55;
          z-index: -1;
        }
        .mer-chef-quote {
          font-family: 'Playfair Display', serif;
          font-style: italic;
          font-size: clamp(1.7rem, 2.8vw, 2.4rem);
          font-weight: 400;
          line-height: 1.3;
          letter-spacing: -0.01em;
          color: ${ink};
          margin-bottom: 2.5rem;
          position: relative;
        }
        .mer-chef-quote::before {
          content: '"';
          display: block;
          font-family: 'Playfair Display', serif;
          font-size: 5rem;
          line-height: 0.4;
          color: ${accent};
          opacity: 0.7;
          margin-bottom: 1rem;
        }
        .mer-chef-name {
          font-family: 'Playfair Display', serif;
          font-style: italic;
          font-size: 1.6rem;
          color: ${ink};
          margin-bottom: 0.25rem;
        }
        .mer-chef-role {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 0.95rem;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: ${accent};
        }

        /* ── REVIEWS — newspaper clippings ── */
        .mer-reviews-wrap {
          padding: 8rem 2rem;
          max-width: 1100px;
          margin: 0 auto;
        }
        .mer-reviews-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }
        .mer-clipping {
          position: relative;
          background: linear-gradient(0deg, ${paper} 0%, #fdf6e3 100%);
          padding: 1.5rem 1.75rem 1.75rem;
          box-shadow: 0 6px 22px rgba(61, 43, 28, 0.12);
          transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.5s;
          color: ${ink};
        }
        .mer-clipping:nth-child(odd) { transform: rotate(-0.75deg); }
        .mer-clipping:nth-child(even) { transform: rotate(0.5deg); }
        .mer-clipping:hover {
          transform: rotate(0) translateY(-4px);
          box-shadow: 0 12px 36px rgba(61, 43, 28, 0.2);
        }
        .mer-clipping::before {
          content: '— LA CRITICA —';
          display: block;
          font-family: 'Playfair Display', serif;
          font-size: 0.7rem;
          letter-spacing: 0.3em;
          color: ${accent};
          margin-bottom: 0.5rem;
          font-weight: 700;
        }
        .mer-clipping-stars {
          color: ${accent};
          font-size: 1.05rem;
          letter-spacing: 0.15em;
          margin-bottom: 0.85rem;
        }
        .mer-clipping-text {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 1.05rem;
          line-height: 1.55;
          color: ${ink};
          margin-bottom: 1.25rem;
        }
        .mer-clipping-byline {
          font-family: 'Playfair Display', serif;
          font-size: 0.9rem;
          padding-top: 1rem;
          border-top: 1px dashed ${ink}30;
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .mer-clipping-author { font-weight: 700; }
        .mer-clipping-source {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          color: ${muted};
          font-size: 0.85rem;
          letter-spacing: 0.05em;
        }

        /* ── FAQ ── */
        .mer-faq-list {
          max-width: 850px;
          margin: 0 auto;
        }
        .mer-faq-item { border-bottom: 1px dashed ${ink}30; }
        .mer-faq-q {
          width: 100%;
          background: none;
          border: none;
          padding: 1.75rem 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: ${ink};
          font-family: 'Playfair Display', serif;
          font-style: italic;
          font-size: 1.3rem;
          font-weight: 500;
          letter-spacing: -0.01em;
          cursor: pointer;
          text-align: left;
          gap: 1rem;
          transition: color 0.3s;
        }
        .mer-faq-q:hover { color: ${accent}; }
        .mer-faq-icon {
          font-family: 'Playfair Display', serif;
          font-size: 1.6rem;
          color: ${accent};
          transition: transform 0.4s;
          flex-shrink: 0;
        }
        .mer-faq-item.open .mer-faq-icon { transform: rotate(45deg); }
        .mer-faq-a {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.5s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .mer-faq-item.open .mer-faq-a {
          max-height: 400px;
          padding-bottom: 1.75rem;
        }
        .mer-faq-a p {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.05rem;
          color: ${muted};
          line-height: 1.7;
        }

        /* ── NEWSLETTER (postcard) ── */
        .mer-postcard {
          background: ${paper};
          padding: 3.5rem 3rem;
          box-shadow: 0 8px 32px rgba(61, 43, 28, 0.18);
          border: 1px solid ${ink}15;
          text-align: center;
          position: relative;
          max-width: 700px;
          margin: 0 auto;
        }
        .mer-postcard h2 {
          font-family: 'Playfair Display', serif;
          font-style: italic;
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 400;
          letter-spacing: -0.02em;
          margin-bottom: 1rem;
          color: ${ink};
        }
        .mer-postcard p {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          color: ${muted};
          margin-bottom: 2rem;
          font-size: 1.15rem;
        }
        .mer-postcard-form {
          display: flex;
          gap: 0.75rem;
          max-width: 480px;
          margin: 0 auto;
        }
        .mer-postcard-form input {
          flex: 1;
          padding: 0.95rem 1.2rem;
          background: transparent;
          border: 1px solid ${ink}30;
          color: ${ink};
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 1rem;
          outline: none;
          transition: border-color 0.3s;
        }
        .mer-postcard-form input:focus { border-color: ${accent}; }
        .mer-postcard-form button {
          padding: 0.95rem 1.75rem;
          background: ${ink};
          color: ${paper};
          border: none;
          font-family: 'Cormorant Garamond', serif;
          font-size: 0.85rem;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.3s;
        }
        .mer-postcard-form button:hover { background: ${accent}; }

        /* ── Time slots ── */
        .mer-slots { margin: 0 0 1.5rem; }
        .mer-slots-title {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 0.95rem;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: ${accent};
          margin-bottom: 0.75rem;
          font-weight: 600;
        }
        .mer-slots-row { display: flex; gap: 8px; flex-wrap: wrap; }
        .mer-slot {
          padding: 0.7rem 1.1rem;
          background: transparent;
          color: ${ink};
          border: 1px solid ${ink}25;
          cursor: pointer;
          font-family: 'Cormorant Garamond', serif;
          font-size: 1rem;
          font-style: italic;
          transition: all 0.25s;
        }
        .mer-slot:hover { border-color: ${accent}; color: ${accent}; }
        .mer-slot.active {
          background: ${ink};
          color: ${paper};
          border-color: ${ink};
          font-style: normal;
        }

        @media (max-width: 768px) {
          .mer-chef { grid-template-columns: 1fr; gap: 3rem; padding: 5rem 1.5rem; }
          .mer-reviews-grid { grid-template-columns: 1fr; }
          .mer-press-inner { gap: 1.5rem; }
          .mer-press-pipe { display: none; }
          .mer-postcard { padding: 2.5rem 1.5rem; }
          .mer-postcard-form { flex-direction: column; }
        }

        /* ── PLAYBILL events ── */
        .mer-playbills {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 2.5rem;
          padding-top: 1rem;
        }
        .mer-playbill {
          position: relative;
          background:
            linear-gradient(135deg, ${paper} 0%, color-mix(in oklch, ${paper} 88%, #d8c89a) 100%);
          padding: 3rem 2rem 2.5rem;
          border: 3px double ${ink}80;
          text-align: center;
          transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.5s;
          cursor: pointer;
          box-shadow: 0 6px 24px rgba(61, 43, 28, 0.18);
        }
        .mer-playbill:nth-child(odd) { transform: rotate(-1.5deg); }
        .mer-playbill:nth-child(even) { transform: rotate(1.2deg); }
        .mer-playbill:nth-child(3n) { transform: rotate(-0.5deg); }
        .mer-playbill:hover {
          transform: rotate(0) translateY(-6px) scale(1.02);
          box-shadow: 0 18px 50px rgba(61, 43, 28, 0.3);
          z-index: 5;
        }
        /* Tape strips on playbill (pinned to board) */
        .mer-playbill::before,
        .mer-playbill::after {
          content: '';
          position: absolute;
          top: -12px;
          width: 70px;
          height: 22px;
          background: rgba(218, 200, 158, 0.75);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          z-index: 2;
        }
        .mer-playbill::before { left: 1.5rem; transform: rotate(-4deg); }
        .mer-playbill::after { right: 1.5rem; transform: rotate(5deg); }
        .mer-playbill-topline {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 0.75rem;
          letter-spacing: 0.4em;
          text-transform: uppercase;
          color: ${accent};
          margin-bottom: 0.5rem;
          font-weight: 600;
        }
        .mer-playbill-presents {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 0.95rem;
          color: ${muted};
          margin-bottom: 1.5rem;
        }
        .mer-playbill-day {
          font-family: 'Playfair Display', serif;
          font-size: clamp(4.5rem, 8vw, 6rem);
          font-weight: 900;
          line-height: 0.85;
          color: ${ink};
          letter-spacing: -0.03em;
        }
        .mer-playbill-month {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 1.2rem;
          color: ${accent};
          margin-bottom: 1.5rem;
          margin-top: 0.25rem;
        }
        .mer-playbill-title {
          font-family: 'Playfair Display', serif;
          font-style: italic;
          font-size: clamp(1.6rem, 2.5vw, 2.1rem);
          font-weight: 500;
          line-height: 1.1;
          color: ${ink};
          letter-spacing: -0.01em;
          margin-bottom: 1rem;
          padding: 1rem 0;
          border-top: 1px solid ${ink}30;
          border-bottom: 1px solid ${ink}30;
        }
        .mer-playbill-desc {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1rem;
          line-height: 1.5;
          color: ${muted};
          margin-top: 1rem;
        }
        .mer-playbill-stars {
          font-size: 1.2rem;
          color: ${accent};
          letter-spacing: 0.5em;
          margin-top: 1.25rem;
        }

        /* Events */
        .mer-event-card {
          padding: 2rem;
          background: ${paper};
          border: 1px solid ${ink}20;
          transition: transform 0.4s, box-shadow 0.4s, border-color 0.4s;
          position: relative;
        }
        .mer-event-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px ${ink}15;
          border-color: ${accent};
        }

        /* WhatsApp FAB */
        .mer-fab {
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
          z-index: 1000;
          box-shadow: 0 6px 20px rgba(37, 211, 102, 0.4);
          transition: transform 0.3s;
        }
        .mer-fab:hover { transform: scale(1.1) translateY(-4px); }

        @media (max-width: 900px) {
          .mer-scrap-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 2.5rem 2rem;
          }
        }
        @media (max-width: 540px) {
          .mer-scrap-grid {
            grid-template-columns: 1fr;
            gap: 3rem;
            max-width: 320px;
          }
        }
        @media (max-width: 768px) {
          .mer-form-row { grid-template-columns: 1fr !important; }
          .mer-menu-grid, .mer-about-grid, .mer-contact-grid { grid-template-columns: 1fr !important; }
          .mer-gallery-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .mer-scrapbook { padding: 2rem 1rem; }
          .mer-playbill { padding: 2.5rem 1.5rem 2rem; }
          .mer-playbill-day { font-size: 4rem; }
          .mer-signature-card { flex: 0 0 280px; padding: 1.5rem; min-height: 240px; }
          .mer-signature-num { font-size: 4.5rem; }
          .mer-signature-name { font-size: 1.4rem; }
          .mer-marquee { padding: 1.75rem 0; }
          .mer-marquee-item { font-size: 2.5rem; gap: 1.5rem; }
          .mer-marquee-item::after { font-size: 0.5em; }
          .mer-about { padding: 5rem 1.5rem; }
          .mer-signature-header { flex-direction: column; align-items: flex-start; }
          .mer-manifesto { padding: 5rem 1.5rem; }
        }
        @media (max-width: 480px) {
          .mer-gallery-grid { grid-template-columns: 1fr !important; }
          .mer-signature-card { flex: 0 0 260px; }
        }
      `}</style>

      <div className="mer-paper-texture" />

      <div className="mer-content">
        {/* HERO with parallax */}
        <section className="mer-hero">
          <div ref={heroImgRef} style={{ position: 'absolute', inset: '-10% 0', zIndex: 0, willChange: 'transform' }}>
            {heroSlides.map((src, i) => (
              <div
                key={i}
                className="mer-hero-img"
                style={{
                  backgroundImage: `url(${src})`,
                  opacity: i === heroIdx ? 1 : 0,
                  transition: 'opacity 1.4s cubic-bezier(0.22, 1, 0.36, 1)',
                  position: 'absolute',
                  inset: 0,
                }}
              />
            ))}
          </div>

          <div ref={heroTextRef} className="mer-hero-content">
            {logoUrl && (
              <div style={{ marginBottom: '2rem' }}>
                <img src={logoUrl} alt={restaurantName} style={{ height: 48 }} />
              </div>
            )}

            <p style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontStyle: 'italic',
              fontSize: '1.1rem',
              letterSpacing: '0.4em',
              textTransform: 'uppercase',
              color: accent,
              marginBottom: '1.5rem',
            }}>
              ~ dal 1962 ~
            </p>

            <h1 className="mer-hero-name">
              {restaurantName.split('').map((ch, i) => (
                <span key={i} className="mer-char" style={{ animationDelay: `${0.3 + i * 0.04}s` }}>
                  {ch === ' ' ? ' ' : ch}
                </span>
              ))}
            </h1>

            <FadeIn delay={0.4}>
              <div className="mer-divider" style={{ margin: '1.5rem auto 2rem', maxWidth: 400 }}>
                <span className="mer-divider-icon">✦ ✦ ✦</span>
              </div>
            </FadeIn>

            {tagline && (
              <FadeIn delay={0.5}>
                <p style={{
                  fontFamily: 'Cormorant Garamond, serif',
                  fontSize: 'clamp(1.2rem, 2vw, 1.5rem)',
                  fontStyle: 'italic',
                  color: ink,
                  marginBottom: '3rem',
                  maxWidth: 600,
                  lineHeight: 1.4,
                }}>
                  {tagline}
                </p>
              </FadeIn>
            )}

            <FadeIn delay={0.7}>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <InkButton accent={accent} href="#menu">Il menu della casa</InkButton>
                {tier !== 'basic' && (
                  <InkButton accent={accent} variant="ghost" href="#prenotazioni">Prenota un tavolo</InkButton>
                )}
              </div>
            </FadeIn>
          </div>

          <div style={{
            position: 'absolute',
            bottom: 30,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '0.85rem',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: ink,
            opacity: 0.6,
            fontStyle: 'italic',
            zIndex: 3,
          }}>
            scorri
          </div>
        </section>

        {/* MARQUEE 1 — restaurant name + values */}
        <div className="mer-marquee">
          <div className="mer-marquee-track">
            {[...Array(2)].map((_, n) => (
              <div key={n} className="mer-marquee-item">
                <span>{restaurantName}</span>
                <span>Tradizione</span>
                <span>{restaurantName}</span>
                <span>Famiglia</span>
                <span>{restaurantName}</span>
                <span>Cucina</span>
              </div>
            ))}
          </div>
        </div>

        {/* ABOUT with parallax + word reveal */}
        <section className="mer-about">
          <div className="mer-about-grid" style={{ display: 'grid', gridTemplateColumns: aboutImage ? '0.9fr 1.1fr' : '1fr', gap: '5rem', alignItems: 'center' }}>
            {aboutImage && (
              <FadeIn from="left">
                <div style={{ position: 'relative' }}>
                  <div className="mer-about-img-frame">
                    <div ref={aboutImgRef} style={{ position: 'absolute', inset: 0 }}>
                      <Image src={aboutImage} alt="" fill style={{ objectFit: 'cover', filter: 'sepia(0.1)' }} />
                    </div>
                  </div>
                  <div style={{
                    position: 'absolute',
                    inset: '-12px',
                    border: `1px solid ${accent}40`,
                    pointerEvents: 'none',
                    zIndex: -1,
                  }} />
                </div>
              </FadeIn>
            )}

            <div>
              <FadeIn from="right">
                <p style={{
                  fontFamily: 'Cormorant Garamond, serif',
                  fontStyle: 'italic',
                  fontSize: '0.95rem',
                  letterSpacing: '0.3em',
                  textTransform: 'uppercase',
                  color: accent,
                  marginBottom: '1rem',
                }}>
                  la nostra storia
                </p>
                <h2 style={{
                  fontFamily: '"Playfair Display", serif',
                  fontSize: 'clamp(2.2rem, 4.5vw, 3.5rem)',
                  fontWeight: 400,
                  fontStyle: 'italic',
                  lineHeight: 1.1,
                  marginBottom: '2rem',
                  color: ink,
                  letterSpacing: '-0.01em',
                }}>
                  Tradizione,<br />generazione dopo<br />generazione.
                </h2>
              </FadeIn>
              {description && (
                <WordReveal
                  text={description}
                  className=""
                  tag="p"
                />
              )}
            </div>
          </div>
        </section>

        {/* MANIFESTO - giant kinetic type */}
        <section className="mer-manifesto">
          <FadeIn>
            <h2>
              Ogni piatto è una <em>memoria</em>.<br />
              Ogni tavolo, una <em>famiglia</em>.<br />
              Ogni serata, un <em>capitolo nuovo</em>.
            </h2>
            <p className="mer-manifesto-byline">— la filosofia della casa</p>
          </FadeIn>
        </section>

        {/* SIGNATURE DISHES — modern horizontal scroll */}
        {signatureDishes.length > 0 && (
          <section className="mer-signature-section">
            <div className="mer-signature-header">
              <FadeIn from="left">
                <div>
                  <p style={{
                    fontFamily: 'Cormorant Garamond, serif',
                    fontStyle: 'italic',
                    fontSize: '0.95rem',
                    letterSpacing: '0.3em',
                    textTransform: 'uppercase',
                    color: accent,
                    marginBottom: '0.75rem',
                  }}>
                    i nostri cavalli di battaglia
                  </p>
                  <h2 style={{
                    fontFamily: '"Playfair Display", serif',
                    fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                    fontWeight: 400,
                    fontStyle: 'italic',
                    color: ink,
                    letterSpacing: '-0.02em',
                    lineHeight: 1,
                  }}>
                    Piatti firma
                  </h2>
                </div>
              </FadeIn>
              <FadeIn from="right" delay={0.1}>
                <p className="mer-scroll-hint">← scorri ←</p>
              </FadeIn>
            </div>
            <div className="mer-signature-scroll">
              {signatureDishes.map((dish, i) => (
                <div key={i} className="mer-signature-card">
                  <div className="mer-signature-num">{String(i + 1).padStart(2, '0')}</div>
                  <p className="mer-signature-category">{dish.category}</p>
                  <h3 className="mer-signature-name">{dish.name}</h3>
                  <p className="mer-signature-desc">{dish.description}</p>
                  <div className="mer-signature-price">
                    <span>€{dish.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* MARQUEE 2 — reverse direction */}
        <div className="mer-marquee mer-marquee-alt">
          <div className="mer-marquee-track">
            {[...Array(2)].map((_, n) => (
              <div key={n} className="mer-marquee-item">
                <span>Ingredienti freschi</span>
                <span>Ricette di famiglia</span>
                <span>Atmosfera autentica</span>
                <span>Vino della casa</span>
              </div>
            ))}
          </div>
        </div>

        {/* MENU - full list */}
        <section id="menu" style={{ padding: '6rem 2rem', maxWidth: 1100, margin: '0 auto' }}>
          <FadeIn>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <p style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontStyle: 'italic',
                fontSize: '0.95rem',
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: accent,
                marginBottom: '1rem',
              }}>
                la cucina
              </p>
              <h2 style={{
                fontFamily: '"Playfair Display", serif',
                fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                fontWeight: 400,
                fontStyle: 'italic',
                color: ink,
                letterSpacing: '-0.02em',
              }}>
                Il nostro menu
              </h2>
              <div className="mer-divider" style={{ maxWidth: 300, margin: '1.5rem auto 0' }}>
                <span className="mer-divider-icon">✦</span>
              </div>
            </div>
          </FadeIn>

          {menuCategories.map((cat, ci) => (
            <FadeIn key={ci} delay={ci * 0.05}>
              <div style={{ marginBottom: '4rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <h3 style={{
                    fontFamily: '"Playfair Display", serif',
                    fontSize: '2rem',
                    fontWeight: 400,
                    fontStyle: 'italic',
                    color: accent,
                    marginBottom: '0.5rem',
                  }}>
                    {cat.name}
                  </h3>
                  {cat.description && (
                    <p style={{
                      fontFamily: 'Cormorant Garamond, serif',
                      fontStyle: 'italic',
                      color: muted,
                      fontSize: '1rem',
                    }}>
                      {cat.description}
                    </p>
                  )}
                </div>

                <div>
                  {cat.items.map((item, i) => (
                    <div key={i} className="mer-menu-item">
                      <div className="mer-menu-item-info">
                        <h4 style={{
                          fontFamily: '"Playfair Display", serif',
                          fontSize: '1.3rem',
                          fontWeight: 500,
                          marginBottom: '0.4rem',
                          color: ink,
                        }}>
                          {item.name}
                          <AllergenBadges allergens={item.allergens} variant="minimal" />
                        </h4>
                        {item.description && (
                          <p style={{
                            fontFamily: 'Cormorant Garamond, serif',
                            fontStyle: 'italic',
                            color: muted,
                            fontSize: '1rem',
                            lineHeight: 1.5,
                          }}>
                            {item.description}
                          </p>
                        )}
                      </div>
                      <div className="mer-menu-item-dots" />
                      <span style={{
                        fontFamily: '"Playfair Display", serif',
                        fontSize: '1.3rem',
                        fontWeight: 500,
                        color: accent,
                        whiteSpace: 'nowrap',
                      }}>
                        €{item.price}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          ))}
        </section>

        {/* GALLERY */}
        {galleryImages.length > 0 && (
          <section style={{ padding: '6rem 2rem', maxWidth: 1300, margin: '0 auto' }}>
            <FadeIn>
              <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                <p style={{
                  fontFamily: 'Cormorant Garamond, serif',
                  fontStyle: 'italic',
                  fontSize: '0.95rem',
                  letterSpacing: '0.3em',
                  textTransform: 'uppercase',
                  color: accent,
                  marginBottom: '1rem',
                }}>
                  i nostri ricordi
                </p>
                <h2 style={{
                  fontFamily: '"Playfair Display", serif',
                  fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                  fontWeight: 400,
                  fontStyle: 'italic',
                  color: ink,
                  letterSpacing: '-0.02em',
                }}>
                  Album della casa
                </h2>
              </div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <div className="mer-scrapbook">
                <div className="mer-scrap-grid">
                  {galleryImages.slice(0, 5).map((img, i) => (
                    <div key={i} className="mer-scrap-item">
                      {i === 1 && <div className="mer-scrap-pin" />}
                      <img src={img.url} alt={img.alt} loading="lazy" />
                      {img.caption && (
                        <p className="mer-scrap-cap">{img.caption}</p>
                      )}
                    </div>
                  ))}
                  {/* Ticket stub — decorative piece */}
                  <div className="mer-scrap-item">
                    <div className="mer-scrap-ticket">
                      <span className="mer-scrap-ticket-top">Admit one ✦</span>
                      <span className="mer-scrap-ticket-name">{restaurantName}</span>
                      <span className="mer-scrap-ticket-bottom">— un ricordo —</span>
                    </div>
                    {galleryImages[5]?.caption && (
                      <p className="mer-scrap-cap">{galleryImages[5].caption}</p>
                    )}
                  </div>
                </div>
              </div>
            </FadeIn>
          </section>
        )}

        {/* EVENTS (Pro+) */}
        {tier !== 'basic' && events.length > 0 && (
          <section style={{ padding: '6rem 2rem', maxWidth: 1100, margin: '0 auto' }}>
            <FadeIn>
              <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                <p style={{
                  fontFamily: 'Cormorant Garamond, serif',
                  fontStyle: 'italic',
                  fontSize: '0.95rem',
                  letterSpacing: '0.3em',
                  textTransform: 'uppercase',
                  color: accent,
                  marginBottom: '1rem',
                }}>
                  serate speciali
                </p>
                <h2 style={{
                  fontFamily: '"Playfair Display", serif',
                  fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                  fontWeight: 400,
                  fontStyle: 'italic',
                  color: ink,
                  letterSpacing: '-0.02em',
                }}>
                  Prossimi eventi
                </h2>
              </div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <div className="mer-playbills">
                {events.map((ev, i) => {
                  const d = new Date(ev.date)
                  return (
                    <div key={i} className="mer-playbill">
                      <p className="mer-playbill-topline">★ in scena ★</p>
                      <p className="mer-playbill-presents">{restaurantName} presenta</p>
                      <div className="mer-playbill-day">{d.getDate().toString().padStart(2, '0')}</div>
                      <p className="mer-playbill-month">
                        {d.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
                      </p>
                      <h3 className="mer-playbill-title">{ev.title}</h3>
                      {ev.description && (
                        <p className="mer-playbill-desc">{ev.description}</p>
                      )}
                      <p className="mer-playbill-stars">✦ ✦ ✦</p>
                    </div>
                  )
                })}
              </div>
            </FadeIn>
          </section>
        )}

        {/* RESERVATION (Pro+) */}
        {tier !== 'basic' && (
          <section id="prenotazioni" style={{ padding: '6rem 2rem', maxWidth: 700, margin: '0 auto' }}>
            <FadeIn>
              <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <p style={{
                  fontFamily: 'Cormorant Garamond, serif',
                  fontStyle: 'italic',
                  fontSize: '0.95rem',
                  letterSpacing: '0.3em',
                  textTransform: 'uppercase',
                  color: accent,
                  marginBottom: '1rem',
                }}>
                  prenotazioni
                </p>
                <h2 style={{
                  fontFamily: '"Playfair Display", serif',
                  fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                  fontWeight: 400,
                  fontStyle: 'italic',
                  color: ink,
                  letterSpacing: '-0.02em',
                  marginBottom: '1rem',
                }}>
                  Vi aspettiamo
                </h2>
                <div className="mer-divider" style={{ maxWidth: 200, margin: '1rem auto' }}>
                  <span className="mer-divider-icon">✦</span>
                </div>
              </div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <div style={{
                padding: '3rem',
                background: paper,
                border: `1px solid ${ink}20`,
                boxShadow: '0 4px 30px rgba(61, 43, 28, 0.08)',
              }}>
                <ReservationForm accent={accent} timeSlots={timeSlots} />
              </div>
            </FadeIn>
          </section>
        )}

        {/* PRESS BAR */}
        {reviews && (
          <section className="mer-press">
            <div className="mer-press-inner">
              <div className="mer-press-block">
                <span className="mer-press-stars">★★★★★</span>
                <span className="mer-press-score">{reviews.score.toFixed(1)}</span>
                <span className="mer-press-meta">/ 5 · {reviews.source}</span>
              </div>
              <div className="mer-press-pipe" />
              <div className="mer-press-block">
                <span className="mer-press-meta">{reviews.count}+ recensioni</span>
              </div>
              {chef?.years && (
                <>
                  <div className="mer-press-pipe" />
                  <div className="mer-press-block">
                    <span className="mer-press-meta">✦ {chef.years}+ anni di cucina</span>
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {/* CHEF */}
        {chef && (
          <section className="mer-chef">
            <FadeIn from="left">
              <div className="mer-chef-photo">
                {chef.photo && <img src={chef.photo} alt={chef.name} loading="lazy" />}
              </div>
            </FadeIn>
            <FadeIn from="right">
              <div>
                <p style={{
                  fontFamily: 'Cormorant Garamond, serif',
                  fontStyle: 'italic',
                  fontSize: '0.95rem',
                  letterSpacing: '0.3em',
                  textTransform: 'uppercase',
                  color: accent,
                  marginBottom: '1rem',
                }}>
                  — il maestro
                </p>
                <p className="mer-chef-quote">{chef.quote}</p>
                <p className="mer-chef-name">{chef.name}</p>
                <p className="mer-chef-role">{chef.role}</p>
              </div>
            </FadeIn>
          </section>
        )}

        {/* REVIEWS — newspaper clippings */}
        {reviews && reviews.items.length > 0 && (
          <section className="mer-reviews-wrap">
            <FadeIn>
              <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                <p style={{
                  fontFamily: 'Cormorant Garamond, serif',
                  fontStyle: 'italic',
                  fontSize: '0.95rem',
                  letterSpacing: '0.3em',
                  textTransform: 'uppercase',
                  color: accent,
                  marginBottom: '1rem',
                }}>
                  rassegna stampa
                </p>
                <h2 style={{
                  fontFamily: '"Playfair Display", serif',
                  fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                  fontWeight: 400,
                  fontStyle: 'italic',
                  color: ink,
                  letterSpacing: '-0.02em',
                }}>
                  Hanno scritto di noi
                </h2>
              </div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <div className="mer-reviews-grid">
                {reviews.items.slice(0, 4).map((rev, i) => (
                  <div key={i} className="mer-clipping">
                    <div className="mer-clipping-stars">{'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}</div>
                    <p className="mer-clipping-text">"{rev.text}"</p>
                    <div className="mer-clipping-byline">
                      <span className="mer-clipping-author">— {rev.author}</span>
                      <span className="mer-clipping-source">{rev.source || reviews.source}{rev.date ? ` · ${rev.date}` : ''}</span>
                    </div>
                  </div>
                ))}
              </div>
            </FadeIn>
            <FadeIn delay={0.2}>
              <div style={{ marginTop: '4rem' }}>
                <LeaveReviewForm accent={accent} theme="light" scope="mer-lr" labelFont="Playfair Display" />
              </div>
            </FadeIn>
          </section>
        )}

        {/* FAQ */}
        {faq && faq.length > 0 && (
          <section style={{ padding: '6rem 2rem', maxWidth: 1000, margin: '0 auto' }}>
            <FadeIn>
              <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <p style={{
                  fontFamily: 'Cormorant Garamond, serif',
                  fontStyle: 'italic',
                  fontSize: '0.95rem',
                  letterSpacing: '0.3em',
                  textTransform: 'uppercase',
                  color: accent,
                  marginBottom: '1rem',
                }}>
                  domande
                </p>
                <h2 style={{
                  fontFamily: '"Playfair Display", serif',
                  fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                  fontWeight: 400,
                  fontStyle: 'italic',
                  color: ink,
                  letterSpacing: '-0.02em',
                }}>
                  Le più frequenti
                </h2>
              </div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <div className="mer-faq-list">
                {faq.map((item, i) => (
                  <div key={i} className={`mer-faq-item ${openFaq === i ? 'open' : ''}`}>
                    <button className="mer-faq-q" type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                      <span>{item.q}</span>
                      <span className="mer-faq-icon">+</span>
                    </button>
                    <div className="mer-faq-a">
                      <p>{item.a}</p>
                    </div>
                  </div>
                ))}
              </div>
            </FadeIn>
          </section>
        )}

        {/* NEWSLETTER — postcard */}
        <section style={{ padding: '6rem 2rem' }}>
          <FadeIn>
            <div className="mer-postcard">
              <h2>Lettera mensile</h2>
              <p>Un piccolo bollettino con piatti stagionali, eventi speciali e ricordi. Niente fretta, niente spam.</p>
              <form className="mer-postcard-form" style={{ flexWrap: 'wrap' }} onSubmit={e => { e.preventDefault(); const b = e.currentTarget.querySelector('button')!; b.textContent = '✓ Iscritto'; }}>
                <input type="email" required placeholder="il vostro indirizzo email" />
                <button type="submit">Iscriviti</button>
                <GdprConsent accent={accent} color="#7a6754" />
              </form>
            </div>
          </FadeIn>
        </section>

        {/* CONTACT */}
        <section style={{ padding: '6rem 2rem', maxWidth: 1200, margin: '0 auto' }}>
          <FadeIn>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <p style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontStyle: 'italic',
                fontSize: '0.95rem',
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: accent,
                marginBottom: '1rem',
              }}>
                dove trovarci
              </p>
              <h2 style={{
                fontFamily: '"Playfair Display", serif',
                fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                fontWeight: 400,
                fontStyle: 'italic',
                color: ink,
                letterSpacing: '-0.02em',
              }}>
                Vieni a trovarci
              </h2>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="mer-contact-grid" style={{ display: 'grid', gridTemplateColumns: mapsUrl ? '1fr 1fr' : '1fr', gap: '3rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {address && (
                  <div>
                    <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: '0.85rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: accent, marginBottom: '0.4rem' }}>indirizzo</p>
                    <p style={{ fontSize: '1.15rem', lineHeight: 1.5, color: ink }}>{address}</p>
                  </div>
                )}
                {phone && (
                  <div>
                    <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: '0.85rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: accent, marginBottom: '0.4rem' }}>telefono</p>
                    <a href={`tel:${phone}`} style={{ fontSize: '1.15rem', color: ink, textDecoration: 'none' }}>{phone}</a>
                  </div>
                )}
                {email && (
                  <div>
                    <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: '0.85rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: accent, marginBottom: '0.4rem' }}>email</p>
                    <a href={`mailto:${email}`} style={{ fontSize: '1.15rem', color: ink, textDecoration: 'none' }}>{email}</a>
                  </div>
                )}
                {hours && (
                  <div>
                    <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: '0.85rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: accent, marginBottom: '0.75rem' }}>orari di apertura</p>
                    <div style={{ display: 'grid', gap: '0.4rem' }}>
                      {Object.entries(hours).map(([day, h]) => (
                        <div key={day} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem' }}>
                          <span style={{ color: muted, fontStyle: 'italic' }}>{DAY_NAMES[day]}</span>
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
                          fontFamily: 'Cormorant Garamond, serif',
                          fontStyle: 'italic',
                          color: accent,
                          textDecoration: 'underline',
                          textUnderlineOffset: 4,
                          fontSize: '1rem',
                        }}
                      >
                        {name}
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {mapsUrl && (
                <div style={{ overflow: 'hidden', minHeight: 450, border: `1px solid ${ink}20`, boxShadow: '0 4px 20px rgba(61, 43, 28, 0.1)' }}>
                  <iframe
                    src={mapsUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0, filter: 'sepia(0.15) saturate(0.9)' }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              )}
            </div>
          </FadeIn>
        </section>

        {/* FOOTER */}
        <footer style={{ padding: '3rem 2rem', textAlign: 'center', borderTop: `1px solid ${ink}20` }}>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: '0.95rem', color: muted, letterSpacing: '0.1em' }}>
            © {new Date().getFullYear()} {restaurantName} ~ con amore
          </p>
          <p style={{ marginTop: 10, fontSize: '0.7rem', color: muted, opacity: 0.55 }}>
            <a href={POWERED_BY.url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none', borderBottom: '1px solid currentColor', paddingBottom: 1 }}>
              {POWERED_BY.label}
            </a>
          </p>
        </footer>
      </div>

      {/* WhatsApp FAB (Premium) */}
      {whatsappEnabled && whatsappNumber && (
        <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="mer-fab">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.84 14.18c-.25.7-1.21 1.28-1.99 1.45-.54.11-1.24.21-3.6-.75-3.03-1.26-4.97-4.35-5.12-4.55-.15-.2-1.22-1.62-1.22-3.09 0-1.47.77-2.19 1.04-2.49.27-.3.59-.37.79-.37.2 0 .39.01.57.02.18.01.42-.07.66.5.25.59.84 2.03.91 2.18.07.15.13.32.02.52-.1.2-.15.32-.3.5-.15.18-.32.4-.45.54-.15.15-.31.31-.13.61.18.3.81 1.33 1.74 2.15 1.19 1.06 2.2 1.39 2.5 1.55.3.15.47.13.65-.08.18-.21.75-.87.95-1.17.2-.3.39-.25.66-.15.27.1 1.71.81 2 .96.3.15.49.22.56.35.07.13.07.74-.18 1.43z"/>
          </svg>
        </a>
      )}

      <StickyMobileBar
        phone={phone}
        address={address}
        hasReservation={tier !== 'basic'}
        whatsapp={whatsappEnabled ? whatsappNumber : undefined}
        accent={accent}
        theme="light"
        scope="mer-smb"
      />
    </div>
  )
}
