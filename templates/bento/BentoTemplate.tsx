'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import { InteractiveEffects } from '../_shared/InteractiveEffects'
import { StickyMobileBar } from '../_shared/StickyMobileBar'
import { AllergenBadges } from '../_shared/AllergenBadges'
import { LeaveReviewForm } from '../_shared/LeaveReviewForm'
import GdprConsent from '../_shared/GdprConsent'

gsap.registerPlugin(ScrollTrigger)

/* ─────────────────────────── TYPES ─────────────────────────── */

interface MenuItemData {
  name: string
  description?: string
  price: number
  photo_url?: string
  allergens?: string[]
}

interface MenuCategoryData {
  name: string
  description?: string
  items: MenuItemData[]
}

interface GalleryImageData {
  url: string
  alt: string
  caption?: string
}

export interface BentoProps {
  restaurantName: string
  tagline?: string
  description?: string
  heroImage: string
  aboutImage?: string
  aboutImage2?: string
  menuCategories: MenuCategoryData[]
  galleryImages: GalleryImageData[]
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
  heroImages?: string[]
  chef?: { name: string; role: string; quote: string; photo?: string; years?: number }
  reviews?: { score: number; count: number; source: string; items: Array<{ author: string; rating: number; text: string; source?: string; date?: string }> }
  faq?: Array<{ q: string; a: string }>
  timeSlots?: string[]
}

/* ─────────────────────────── HELPERS ─────────────────────────── */

const DEFAULT_ACCENT = '#FF6B35'

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const c = hex.replace('#', '')
  return {
    r: parseInt(c.substring(0, 2), 16),
    g: parseInt(c.substring(2, 4), 16),
    b: parseInt(c.substring(4, 6), 16),
  }
}

function accentBg(accent: string, alpha: number): string {
  const { r, g, b } = hexToRgb(accent)
  return `rgba(${r},${g},${b},${alpha})`
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(price)
}

const DAY_LABELS: Record<string, string> = {
  mon: 'Lunedì',
  tue: 'Martedì',
  wed: 'Mercoledì',
  thu: 'Giovedì',
  fri: 'Venerdì',
  sat: 'Sabato',
  sun: 'Domenica',
}

const SOCIAL_ICONS: Record<string, string> = {
  instagram: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z',
  facebook: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
  tripadvisor: 'M12.006 4.295c-3.029 0-5.82 1.015-8.07 2.738H0l1.67 2.544a6.97 6.97 0 00-.63 2.88c0 3.867 3.135 7.002 7.003 7.002a6.97 6.97 0 004.963-2.063 6.97 6.97 0 004.963 2.063c3.868 0 7.003-3.135 7.003-7.002a6.97 6.97 0 00-.63-2.88L26 7.033h-3.936c-2.25-1.723-5.042-2.738-8.07-2.738h.012z',
  google: 'M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z',
  whatsapp: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z',
}

/* ─────────────────────────── COMPONENT ─────────────────────────── */

export function BentoTemplate(props: BentoProps) {
  const {
    restaurantName,
    tagline,
    description,
    heroImage,
    aboutImage,
    aboutImage2,
    menuCategories,
    galleryImages,
    address,
    phone,
    email,
    hours,
    mapsUrl,
    socialLinks,
    accentColor = DEFAULT_ACCENT,
    logoUrl,
    tier = 'basic',
    events,
    whatsappNumber,
    heroImages,
    chef,
    reviews,
    faq,
    timeSlots,
  } = props

  const [reservationSubmitted, setReservationSubmitted] = useState(false)

  // Hero carousel
  const heroSlides = heroImages && heroImages.length > 0 ? heroImages : [heroImage]
  const [heroIdx, setHeroIdx] = useState(0)
  useEffect(() => {
    if (heroSlides.length < 2) return
    const t = setInterval(() => setHeroIdx(i => (i + 1) % heroSlides.length), 4500)
    return () => clearInterval(t)
  }, [heroSlides.length])

  // Reviews + FAQ + slot state
  const [reviewIdx, setReviewIdx] = useState(0)
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [pickedSlot, setPickedSlot] = useState<string | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const [activeCategory, setActiveCategory] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const menuGridRef = useRef<HTMLDivElement>(null)

  /* ── GSAP animations ── */
  useEffect(() => {
    const ctx = gsap.context(() => {
      /* Hero */
      gsap.from('[data-bento-hero-title]', {
        y: 60,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        delay: 0.2,
      })
      gsap.from('[data-bento-hero-strip] > *', {
        scale: 0.8,
        opacity: 0,
        duration: 0.7,
        stagger: 0.12,
        ease: 'back.out(1.4)',
        delay: 0.6,
      })
      gsap.from('[data-bento-hero-tagline]', {
        y: 20,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
        delay: 0.9,
      })
      gsap.from('[data-bento-hero-cta]', {
        scale: 0.9,
        opacity: 0,
        duration: 0.6,
        ease: 'back.out(1.7)',
        delay: 1.1,
      })

      /* Bento cards stagger */
      gsap.utils.toArray<HTMLElement>('[data-bento-card]').forEach((card, i) => {
        gsap.from(card, {
          scrollTrigger: {
            trigger: card,
            start: 'top 88%',
            toggleActions: 'play none none none',
          },
          y: 40,
          opacity: 0,
          duration: 0.7,
          delay: i * 0.08,
          ease: 'power2.out',
        })
      })

      /* Section titles */
      gsap.utils.toArray<HTMLElement>('[data-bento-section-title]').forEach((el) => {
        gsap.from(el, {
          scrollTrigger: {
            trigger: el,
            start: 'top 90%',
            toggleActions: 'play none none none',
          },
          y: 30,
          opacity: 0,
          duration: 0.8,
          ease: 'power2.out',
        })
      })

      /* Menu cards */
      gsap.utils.toArray<HTMLElement>('[data-bento-menu-card]').forEach((card, i) => {
        gsap.from(card, {
          scrollTrigger: {
            trigger: card,
            start: 'top 92%',
            toggleActions: 'play none none none',
          },
          y: 30,
          opacity: 0,
          duration: 0.5,
          delay: i * 0.06,
          ease: 'power2.out',
        })
      })

      /* Gallery items */
      gsap.utils.toArray<HTMLElement>('[data-bento-gallery-item]').forEach((item, i) => {
        gsap.from(item, {
          scrollTrigger: {
            trigger: item,
            start: 'top 92%',
            toggleActions: 'play none none none',
          },
          y: 30,
          opacity: 0,
          scale: 0.96,
          duration: 0.6,
          delay: i * 0.07,
          ease: 'power2.out',
        })
      })

      /* Contact cards */
      gsap.utils.toArray<HTMLElement>('[data-bento-contact-card]').forEach((card, i) => {
        gsap.from(card, {
          scrollTrigger: {
            trigger: card,
            start: 'top 90%',
            toggleActions: 'play none none none',
          },
          y: 30,
          opacity: 0,
          duration: 0.6,
          delay: i * 0.1,
          ease: 'power2.out',
        })
      })
    }, containerRef)

    return () => ctx.revert()
  }, [])

  /* ── Category change animation ── */
  const handleCategoryChange = useCallback((index: number) => {
    if (index === activeCategory) return
    setActiveCategory(index)
    if (menuGridRef.current) {
      menuGridRef.current.scrollTo({ left: 0, behavior: 'smooth' })
    }
  }, [activeCategory])

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }, [])

  const currentItems = menuCategories[activeCategory]?.items ?? []
  const heroPreviewImages = galleryImages.slice(0, 3)

  /* ── Inline CSS vars ── */
  const cssVars = {
    '--bento-accent': accentColor,
    '--bento-accent-light': accentBg(accentColor, 0.08),
    '--bento-accent-medium': accentBg(accentColor, 0.15),
    '--bento-bg': '#FAFAF8',
    '--bento-surface': '#FFFFFF',
    '--bento-text': '#1a1a18',
    '--bento-muted': '#6b6b68',
    '--bento-shadow': '0 2px 20px rgba(0,0,0,0.06)',
    '--bento-radius': '20px',
  } as React.CSSProperties

  return (
    <div
      ref={containerRef}
      style={{
        ...cssVars,
        fontFamily: 'var(--font-inter, "Inter", system-ui, -apple-system, sans-serif)',
        background: 'var(--bento-bg)',
        color: 'var(--bento-text)',
        minHeight: '100vh',
        overflowX: 'hidden',
      }}
    >
      <InteractiveEffects accent={accentColor} scope="ben" />
      <style jsx global>{`
        :root { --ripple-color: ${accentColor}55; }
        [data-bento-menu-card] { position: relative; overflow: hidden; }
        [data-bento-menu-card]::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(280px circle at var(--gx, 50%) var(--gy, 50%), ${accentColor}22, transparent 50%);
          opacity: 0;
          transition: opacity 0.4s;
          pointer-events: none;
          z-index: 0;
        }
        [data-bento-menu-card]:hover::before { opacity: 1; }
        [data-bento-menu-card] > * { position: relative; z-index: 1; }
        button { transition: transform 0.25s, box-shadow 0.3s, background 0.3s, color 0.3s !important; }
        button:hover { transform: translateY(-2px); }
      `}</style>
      {/* ═══════════════════════ HERO — true bento grid ═══════════════════════ */}
      <section className="bento-hero-section">
        <div className="bento-hero-grid">

          {/* Main feature card with hero image + title overlay */}
          <div className="bento-hero-feature" data-bento-card>
            {heroSlides.map((src, i) => (
              <div
                key={i}
                className="bento-hero-bg"
                style={{
                  backgroundImage: `url(${src})`,
                  opacity: i === heroIdx ? 1 : 0,
                }}
              />
            ))}
            <div className="bento-hero-overlay" />
            <div className="bento-hero-content">
              {logoUrl && (
                <img src={logoUrl} alt="Logo" className="bento-hero-logo" />
              )}
              <h1 className="bento-hero-title">{restaurantName}</h1>
              {tagline && <p className="bento-hero-tagline">{tagline}</p>}
              <div className="bento-hero-actions">
                <a href="#menu" className="bento-hero-cta bento-hero-cta-primary">Scopri il menu →</a>
                {tier !== 'basic' && (
                  <a href="#prenotazioni" className="bento-hero-cta bento-hero-cta-ghost">Prenota</a>
                )}
              </div>
            </div>
          </div>

          {/* Top-right: dish 1 */}
          <div className="bento-hero-dish bento-hero-dish-1" data-bento-card>
            {galleryImages[0] && (
              <img src={galleryImages[0].url} alt={galleryImages[0].alt} loading="eager" />
            )}
            <div className="bento-hero-dish-tag">★ Signature</div>
          </div>

          {/* Stat tile */}
          <div className="bento-hero-stat" data-bento-card>
            {reviews ? (
              <>
                <div className="bento-hero-stat-stars">★★★★★</div>
                <div className="bento-hero-stat-score">{reviews.score.toFixed(1)}<span>/5</span></div>
                <div className="bento-hero-stat-meta">{reviews.count}+ recensioni · {reviews.source}</div>
              </>
            ) : (
              <>
                <div className="bento-hero-stat-score">Dal<span style={{ display: 'block' }}>1962</span></div>
                <div className="bento-hero-stat-meta">tradizione di famiglia</div>
              </>
            )}
          </div>

          {/* Mid-right: dish 2 */}
          <div className="bento-hero-dish bento-hero-dish-2" data-bento-card>
            {galleryImages[1] && (
              <img src={galleryImages[1].url} alt={galleryImages[1].alt} loading="eager" />
            )}
            <div className="bento-hero-dish-tag">Bowl del giorno</div>
          </div>

          {/* Hours / open now */}
          <div className="bento-hero-info" data-bento-card>
            <div className="bento-hero-info-status">
              <span className="bento-hero-dot" /> Aperto ora
            </div>
            <div className="bento-hero-info-line">{address?.split(',')[0]}</div>
            <div className="bento-hero-info-action">
              <a href={`tel:${phone}`}>{phone}</a>
            </div>
          </div>

          {/* Bottom-right: dish 3 */}
          <div className="bento-hero-dish bento-hero-dish-3" data-bento-card>
            {galleryImages[2] && (
              <img src={galleryImages[2].url} alt={galleryImages[2].alt} loading="eager" />
            )}
            <div className="bento-hero-dish-tag">Dolce del weekend</div>
          </div>

        </div>
      </section>
      <style>{`
        .bento-hero-section {
          padding: 1.5rem;
          max-width: 1300px;
          margin: 0 auto;
        }
        .bento-hero-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          grid-template-rows: 1fr 1fr 1fr;
          gap: 16px;
          height: min(80vh, 720px);
          min-height: 560px;
        }
        .bento-hero-feature {
          grid-column: 1;
          grid-row: 1 / span 3;
          position: relative;
          overflow: hidden;
          border-radius: var(--bento-radius);
          box-shadow: var(--bento-shadow);
        }
        .bento-hero-bg {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          transition: opacity 1.5s cubic-bezier(0.22, 1, 0.36, 1);
          animation: bentoKenBurns 8s ease-out infinite alternate;
        }
        @keyframes bentoKenBurns {
          from { transform: scale(1.02); }
          to { transform: scale(1.12); }
        }
        .bento-hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.55) 65%, rgba(0,0,0,0.85) 100%);
        }
        .bento-hero-content {
          position: absolute;
          inset: 0;
          padding: 2.5rem 2.25rem;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          color: #fff;
        }
        .bento-hero-logo {
          height: 48px;
          width: auto;
          margin-bottom: auto;
          filter: brightness(0) invert(1);
          opacity: 0.95;
          align-self: flex-start;
        }
        .bento-hero-title {
          font-size: clamp(2.8rem, 7vw, 5.5rem);
          font-weight: 900;
          letter-spacing: -0.04em;
          line-height: 0.95;
          margin: 0 0 0.85rem;
          color: #fff;
        }
        .bento-hero-tagline {
          font-size: clamp(1rem, 1.6vw, 1.25rem);
          font-weight: 400;
          color: rgba(255,255,255,0.85);
          letter-spacing: 0.01em;
          margin-bottom: 1.5rem;
          max-width: 500px;
          line-height: 1.5;
        }
        .bento-hero-actions {
          display: flex;
          gap: 0.6rem;
          flex-wrap: wrap;
        }
        .bento-hero-cta {
          padding: 14px 28px;
          font-weight: 700;
          font-size: 0.95rem;
          border-radius: 100px;
          text-decoration: none;
          transition: transform 0.25s, box-shadow 0.25s, background 0.25s, color 0.25s;
        }
        .bento-hero-cta:hover { transform: translateY(-2px); }
        .bento-hero-cta-primary {
          background: var(--bento-accent, ${accentColor});
          color: white;
          box-shadow: 0 6px 22px rgba(0,0,0,0.25);
        }
        .bento-hero-cta-ghost {
          background: rgba(255,255,255,0.95);
          color: #1a1a1a;
        }
        /* Dish tiles */
        .bento-hero-dish {
          position: relative;
          overflow: hidden;
          border-radius: var(--bento-radius);
          box-shadow: var(--bento-shadow);
          transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.4s;
          cursor: pointer;
        }
        .bento-hero-dish:hover {
          transform: translateY(-4px);
          box-shadow: 0 18px 40px rgba(0,0,0,0.16);
        }
        .bento-hero-dish img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .bento-hero-dish:hover img { transform: scale(1.08); }
        .bento-hero-dish-tag {
          position: absolute;
          bottom: 12px;
          left: 12px;
          padding: 6px 12px;
          background: rgba(255,255,255,0.96);
          color: #1a1a1a;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          border-radius: 100px;
          backdrop-filter: blur(8px);
          z-index: 2;
        }
        .bento-hero-dish-1 { grid-column: 2; grid-row: 1; }
        .bento-hero-dish-2 { grid-column: 2; grid-row: 2; }
        .bento-hero-dish-3 { grid-column: 3; grid-row: 3; }

        /* Stat tile */
        .bento-hero-stat {
          grid-column: 3;
          grid-row: 1;
          background: var(--bento-accent, ${accentColor});
          color: white;
          padding: 1.5rem 1.25rem;
          border-radius: var(--bento-radius);
          box-shadow: 0 8px 24px ${accentBg(accentColor, 0.3)};
          display: flex;
          flex-direction: column;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }
        .bento-hero-stat::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 50%),
            radial-gradient(circle at 20% 90%, rgba(0,0,0,0.12) 0%, transparent 60%);
          pointer-events: none;
        }
        .bento-hero-stat > * { position: relative; z-index: 1; }
        .bento-hero-stat-stars {
          font-size: 1rem;
          letter-spacing: 0.15em;
          margin-bottom: 0.4rem;
          opacity: 0.95;
        }
        .bento-hero-stat-score {
          font-size: clamp(2.2rem, 3.8vw, 3.2rem);
          font-weight: 900;
          line-height: 0.95;
          letter-spacing: -0.04em;
        }
        .bento-hero-stat-score span {
          font-size: 0.55em;
          font-weight: 600;
          opacity: 0.7;
        }
        .bento-hero-stat-meta {
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-top: 0.5rem;
          opacity: 0.9;
        }

        /* Info tile */
        .bento-hero-info {
          grid-column: 2;
          grid-row: 3;
          background: var(--bento-surface);
          padding: 1.5rem 1.25rem;
          border-radius: var(--bento-radius);
          box-shadow: var(--bento-shadow);
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          justify-content: center;
        }
        .bento-hero-info-status {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          font-weight: 700;
          color: #5e8a3a;
        }
        .bento-hero-dot {
          display: inline-block;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #5e8a3a;
          box-shadow: 0 0 0 4px rgba(94, 138, 58, 0.2);
          animation: bentoDotPulse 2s ease-in-out infinite;
        }
        @keyframes bentoDotPulse {
          0%, 100% { box-shadow: 0 0 0 4px rgba(94, 138, 58, 0.2); }
          50% { box-shadow: 0 0 0 8px rgba(94, 138, 58, 0); }
        }
        .bento-hero-info-line {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--bento-text);
          line-height: 1.3;
        }
        .bento-hero-info-action a {
          color: var(--bento-accent, ${accentColor});
          font-weight: 700;
          text-decoration: none;
          font-size: 0.95rem;
        }
        .bento-hero-info-action a:hover { text-decoration: underline; }

        @media (max-width: 900px) {
          .bento-hero-grid {
            grid-template-columns: 1fr 1fr;
            grid-template-rows: 60vh 180px 180px 130px;
            height: auto;
            min-height: 0;
          }
          .bento-hero-feature { grid-column: 1 / span 2; grid-row: 1; }
          .bento-hero-dish-1 { grid-column: 1; grid-row: 2; }
          .bento-hero-stat { grid-column: 2; grid-row: 2; }
          .bento-hero-dish-2 { grid-column: 1; grid-row: 3; }
          .bento-hero-dish-3 { grid-column: 2; grid-row: 3; }
          .bento-hero-info { grid-column: 1 / span 2; grid-row: 4; }
        }
        @media (max-width: 540px) {
          .bento-hero-grid {
            grid-template-rows: 65vh 160px 160px 130px;
            gap: 10px;
          }
          .bento-hero-content { padding: 1.5rem 1.25rem; }
          .bento-hero-title { font-size: clamp(2.2rem, 9vw, 3.5rem); }
          .bento-hero-tagline { font-size: 0.95rem; margin-bottom: 1rem; }
          .bento-hero-cta { padding: 11px 22px; font-size: 0.85rem; }
          .bento-hero-stat-score { font-size: 2rem; }
          .bento-hero-dish-tag { font-size: 0.62rem; padding: 5px 10px; }
        }
      `}</style>

      {/* ═══════════════════════ BENTO ABOUT ═══════════════════════ */}
      <section style={{ padding: '3rem 1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
        <h2
          data-bento-section-title
          style={{
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: 800,
            marginBottom: '1.5rem',
            letterSpacing: '-0.02em',
          }}
        >
          Chi siamo
        </h2>
        <div className="bento-about-grid">
          {/* Top-left: wide description (2x1) */}
          <div
            data-bento-card
            className="bento-about-span2"
            style={{
              gridColumn: 'span 2',
              background: 'var(--bento-surface)',
              borderRadius: 'var(--bento-radius)',
              padding: '2.5rem 2rem',
              boxShadow: 'var(--bento-shadow)',
              transition: 'transform 0.3s, box-shadow 0.3s',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'var(--bento-shadow)'
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: '-10px',
                left: '16px',
                fontSize: '6rem',
                fontWeight: 900,
                color: accentBg(accentColor, 0.1),
                lineHeight: 1,
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            >
              &ldquo;
            </span>
            <p
              style={{
                fontSize: 'clamp(1rem, 2vw, 1.2rem)',
                lineHeight: 1.7,
                color: 'var(--bento-text)',
                position: 'relative',
                zIndex: 1,
                margin: 0,
              }}
            >
              {description || 'Un luogo dove la tradizione incontra l\'innovazione, creando esperienze culinarie indimenticabili.'}
            </p>
          </div>

          {/* Top-right: image (1x1) */}
          <div
            data-bento-card
            className="bento-about-img-cell"
            style={{
              borderRadius: 'var(--bento-radius)',
              overflow: 'hidden',
              position: 'relative',
              aspectRatio: '1',
              boxShadow: 'var(--bento-shadow)',
              transition: 'transform 0.3s, box-shadow 0.3s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'var(--bento-shadow)'
            }}
          >
            <Image
              src={aboutImage || heroImage}
              alt={`${restaurantName} - ambiance`}
              fill
              style={{ objectFit: 'cover' }}
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          </div>

          {/* Bottom-left: stats (1x1) */}
          <div
            data-bento-card
            style={{
              background: accentBg(accentColor, 0.08),
              borderRadius: 'var(--bento-radius)',
              padding: '2rem 1.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: '1rem',
              transition: 'transform 0.3s, box-shadow 0.3s',
              boxShadow: 'var(--bento-shadow)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'var(--bento-shadow)'
            }}
          >
            {[
              { label: 'Tradizione', value: '100% Italiano' },
              { label: 'Qualità', value: 'Fatto in casa' },
              { label: 'Esperienza', value: 'Dal 2024' },
            ].map((stat) => (
              <div key={stat.label}>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: accentColor }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--bento-muted)', fontWeight: 500 }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom-center + right: second image (2x1) */}
          <div
            data-bento-card
            className="bento-about-span2"
            style={{
              gridColumn: 'span 2',
              borderRadius: 'var(--bento-radius)',
              overflow: 'hidden',
              position: 'relative',
              minHeight: '220px',
              boxShadow: 'var(--bento-shadow)',
              transition: 'transform 0.3s, box-shadow 0.3s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'var(--bento-shadow)'
            }}
          >
            <Image
              src={aboutImage2 || heroImage}
              alt={`${restaurantName} - cucina`}
              fill
              style={{ objectFit: 'cover' }}
              sizes="(max-width: 768px) 100vw, 66vw"
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════ MENU PHOTO GRID ═══════════════════════ */}
      <section
        id="menu"
        style={{ padding: '4rem 1.5rem', maxWidth: '1100px', margin: '0 auto' }}
      >
        <h2
          data-bento-section-title
          style={{
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: 800,
            marginBottom: '1.5rem',
            letterSpacing: '-0.02em',
          }}
        >
          Il Menu
        </h2>

        {/* Category pills */}
        {menuCategories.length > 1 && (
          <div
            className="bento-pills-scroll"
            style={{
              display: 'flex',
              gap: '10px',
              overflowX: 'auto',
              paddingBottom: '1rem',
              marginBottom: '1.5rem',
              scrollbarWidth: 'none',
            }}
          >
            {menuCategories.map((cat, i) => (
              <button
                key={cat.name}
                onClick={() => handleCategoryChange(i)}
                style={{
                  padding: '10px 22px',
                  borderRadius: '999px',
                  border: 'none',
                  background: i === activeCategory ? accentColor : 'var(--bento-surface)',
                  color: i === activeCategory ? '#fff' : 'var(--bento-text)',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: i === activeCategory
                    ? `0 4px 16px ${accentBg(accentColor, 0.3)}`
                    : 'var(--bento-shadow)',
                  transition: 'all 0.25s ease',
                  fontFamily: 'inherit',
                  flexShrink: 0,
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Menu items — horizontal scroll */}
        <div
          ref={menuGridRef}
          className="bento-menu-scroll"
          style={{
            display: 'flex',
            gap: '16px',
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            padding: '0.5rem 0 1.5rem',
            scrollbarWidth: 'none',
          }}
        >
          {currentItems.map((item, i) => (
            <div
              key={`${activeCategory}-${item.name}-${i}`}
              data-bento-menu-card
              onMouseMove={e => {
                const r = e.currentTarget.getBoundingClientRect()
                e.currentTarget.style.setProperty('--gx', `${((e.clientX-r.left)/r.width)*100}%`)
                e.currentTarget.style.setProperty('--gy', `${((e.clientY-r.top)/r.height)*100}%`)
              }}
              style={{
                flex: '0 0 300px',
                scrollSnapAlign: 'start',
                background: 'var(--bento-surface)',
                borderRadius: 'var(--bento-radius)',
                overflow: 'hidden',
                boxShadow: 'var(--bento-shadow)',
                transition: 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.3s',
                cursor: 'default',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)'
                e.currentTarget.style.boxShadow = '0 12px 35px rgba(0,0,0,0.12)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)'
                e.currentTarget.style.boxShadow = 'var(--bento-shadow)'
              }}
            >
              {/* Image area */}
              <div style={{ position: 'relative', aspectRatio: '16/10', overflow: 'hidden' }}>
                {item.photo_url ? (
                  <Image
                    src={item.photo_url}
                    alt={item.name}
                    fill
                    style={{ objectFit: 'cover' }}
                    sizes="300px"
                  />
                ) : (
                  <div style={{
                    width: '100%', height: '100%',
                    background: `linear-gradient(135deg, ${accentBg(accentColor, 0.15)}, ${accentBg(accentColor, 0.06)})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
                  }}>
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: accentBg(accentColor, 0.5), textAlign: 'center' }}>
                      {item.name}
                    </span>
                  </div>
                )}
                <span style={{
                  position: 'absolute', top: 10, right: 10,
                  background: accentColor, color: '#fff', fontWeight: 700,
                  fontSize: '0.82rem', padding: '4px 11px', borderRadius: '999px',
                  boxShadow: `0 2px 10px ${accentBg(accentColor, 0.4)}`,
                }}>
                  {formatPrice(item.price)}
                </span>
              </div>
              {/* Text */}
              <div style={{ padding: '1rem 1.25rem 1.25rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                  {item.name}
                  <AllergenBadges allergens={item.allergens} variant="icon" />
                </h3>
                {item.description && (
                  <p style={{
                    fontSize: '0.82rem', color: 'var(--bento-muted)', marginTop: '0.35rem',
                    lineHeight: 1.5, display: '-webkit-box',
                    WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--bento-muted)', opacity: 0.6, marginTop: '0.25rem' }}>
          ← Scorri per vedere tutti i piatti →
        </p>
      </section>

      {/* ═══════════════════════ GALLERY MASONRY ═══════════════════════ */}
      {galleryImages.length > 0 && (
        <section style={{ padding: '4rem 1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
          <h2
            data-bento-section-title
            style={{
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              fontWeight: 800,
              marginBottom: '1.5rem',
              letterSpacing: '-0.02em',
            }}
          >
            Galleria
          </h2>
          <div className="bento-gallery-grid">
            {galleryImages.map((img, i) => {
              // Bento layout pattern: 1st=large, 2nd=wide, 3rd=tall, 4th=wide, rest=normal
              const layoutClass =
                i === 0 ? 'bento-gallery-cell-large' :
                i === 1 ? 'bento-gallery-cell-wide' :
                i === 4 ? 'bento-gallery-cell-tall' : ''
              const tags = ['Signature', 'Atmosfera', 'Dolci', 'Cucina', 'Sala', 'Bevande']
              return (
                <div
                  key={i}
                  data-bento-gallery-item
                  className={`bento-gallery-cell ${layoutClass}`}
                  onClick={() => openLightbox(i)}
                >
                  <span className="bento-gallery-badge">{tags[i % tags.length]}</span>
                  <Image
                    src={img.url}
                    alt={img.alt}
                    width={800}
                    height={600}
                    sizes="(max-width: 768px) 100vw, 50vw"
                    style={{ objectFit: 'cover' }}
                  />
                  <div className="bento-gallery-overlay" />
                  {img.caption && (
                    <div className="bento-gallery-caption">{img.caption}</div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Lightbox */}
          <Lightbox
            open={lightboxOpen}
            close={() => setLightboxOpen(false)}
            index={lightboxIndex}
            slides={galleryImages.map((img) => ({ src: img.url, alt: img.alt }))}
          />
        </section>
      )}

      {/* ═══════════════════════ RESERVATION FORM (Pro + Premium) ═══════════════════════ */}
      {tier !== 'basic' && (
        <section id="prenotazioni" style={{ padding: '4rem 1.5rem', maxWidth: '1100px', margin: '0 auto', scrollMarginTop: '2rem' }}>
          <h2
            data-bento-section-title
            style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, marginBottom: '1.5rem', letterSpacing: '-0.02em' }}
          >
            Prenota un tavolo
          </h2>
          {reservationSubmitted ? (
            <div
              style={{
                background: accentBg(accentColor, 0.08),
                borderRadius: 'var(--bento-radius)',
                padding: '3rem 2rem',
                textAlign: 'center',
              }}
            >
              <p style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Prenotazione ricevuta!</p>
              <p style={{ color: 'var(--bento-muted)' }}>Ti contatteremo a breve per confermare.</p>
            </div>
          ) : (
            <form
              onSubmit={e => { e.preventDefault(); setReservationSubmitted(true) }}
              style={{
                background: 'var(--bento-surface)',
                borderRadius: 'var(--bento-radius)',
                padding: '2.5rem 2rem',
                boxShadow: 'var(--bento-shadow)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
              }}
            >
              {timeSlots && timeSlots.length > 0 && (
                <div className="bento-slots">
                  <div className="bento-slots-title">Disponibilità per stasera</div>
                  <div className="bento-slots-row">
                    {timeSlots.map(slot => (
                      <button key={slot} type="button" className={`bento-slot ${pickedSlot === slot ? 'active' : ''}`} onClick={() => setPickedSlot(slot)}>
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="bento-form-grid-2">
                <input required type="text" placeholder="Nome" style={{ padding: '0.85rem 1rem', background: '#fff', border: '1px solid #e0e0e0', borderRadius: 12, color: 'var(--bento-text)', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box' as const }} />
                <input required type="tel" placeholder="Telefono" style={{ padding: '0.85rem 1rem', background: '#fff', border: '1px solid #e0e0e0', borderRadius: 12, color: 'var(--bento-text)', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box' as const }} />
              </div>
              <div className="bento-form-grid-3">
                <input required type="date" style={{ padding: '0.85rem 1rem', background: '#fff', border: '1px solid #e0e0e0', borderRadius: 12, color: 'var(--bento-text)', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box' as const }} />
                <input required type="time" style={{ padding: '0.85rem 1rem', background: '#fff', border: '1px solid #e0e0e0', borderRadius: 12, color: 'var(--bento-text)', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box' as const }} />
                <input required type="number" min={1} max={20} placeholder="Persone" style={{ padding: '0.85rem 1rem', background: '#fff', border: '1px solid #e0e0e0', borderRadius: 12, color: 'var(--bento-text)', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box' as const }} />
              </div>
              <textarea
                placeholder="Note (opzionale)"
                rows={3}
                style={{ padding: '0.85rem 1rem', background: '#fff', border: '1px solid #e0e0e0', borderRadius: 12, color: 'var(--bento-text)', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box' as const, resize: 'vertical' }}
              />
              <GdprConsent accent={accentColor} color="rgba(0,0,0,0.55)" />
              <div>
                <button
                  type="submit"
                  style={{
                    padding: '1rem 2.5rem',
                    background: accentColor,
                    color: '#fff',
                    border: 'none',
                    borderRadius: '999px',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    boxShadow: `0 4px 16px ${accentBg(accentColor, 0.3)}`,
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                  Prenota ora
                </button>
              </div>
            </form>
          )}
        </section>
      )}

      {/* ═══════════════════════ EVENTS (Pro + Premium) ═══════════════════════ */}
      {tier !== 'basic' && events && events.length > 0 && (
        <section style={{ padding: '4rem 1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
          <h2
            data-bento-section-title
            style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, marginBottom: '1.5rem', letterSpacing: '-0.02em' }}
          >
            Eventi
          </h2>
          <div className="bento-events-grid">
            {events.map((ev, i) => {
              const d = new Date(ev.date)
              // featured = first, wide = 3rd if exists
              const layoutClass =
                i === 0 ? 'bento-event-featured' :
                i === 2 && events.length > 3 ? 'bento-event-wide' : ''
              const badges = ['SPECIALE', 'LIVE', 'BRUNCH', 'DEGUSTAZIONE', 'WORKSHOP']
              return (
                <div key={i} data-bento-card className={`bento-event-tile ${layoutClass}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                    <div className="bento-event-badge">{badges[i % badges.length]}</div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="bento-event-day">{d.getDate().toString().padStart(2, '0')}</div>
                      <div className="bento-event-month">
                        {d.toLocaleDateString('it-IT', { month: 'short' })}
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="bento-event-title">{ev.title}</h3>
                    {ev.description && <p className="bento-event-desc">{ev.description}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ═══════════════════════ PRESS BAR ═══════════════════════ */}
      {reviews && (
        <section style={{ padding: '0 1.5rem' }}>
          <div className="bento-press">
            <div className="bento-press-block">
              <span className="bento-press-stars">★★★★★</span>
              <span className="bento-press-score">{reviews.score.toFixed(1)}</span>
              <span className="bento-press-meta">/ 5 · {reviews.source}</span>
            </div>
            <div className="bento-press-pipe" />
            <div className="bento-press-block">
              <span className="bento-press-meta">{reviews.count}+ recensioni</span>
            </div>
            {chef?.years && (
              <>
                <div className="bento-press-pipe" />
                <div className="bento-press-block">
                  <span className="bento-press-meta">{chef.years}+ anni di cucina</span>
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* ═══════════════════════ CHEF ═══════════════════════ */}
      {chef && (
        <section className="bento-chef">
          <div className="bento-chef-card bento-chef-photo">
            <span className="bento-chef-badge">Il volto del locale</span>
            {chef.photo && <img src={chef.photo} alt={chef.name} loading="lazy" />}
          </div>
          <div className="bento-chef-card bento-chef-content">
            <div>
              <p className="bento-chef-eyebrow">Lo chef</p>
              <p className="bento-chef-quote">"{chef.quote}"</p>
            </div>
            <div className="bento-chef-sign">
              <div className="bento-chef-name">{chef.name}</div>
              <div className="bento-chef-role">{chef.role}{chef.years ? ` · ${chef.years} anni di esperienza` : ''}</div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════ REVIEWS ═══════════════════════ */}
      {reviews && reviews.items.length > 0 && (
        <section className="bento-reviews">
          <h2 data-bento-section-title style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
            Le voci dei nostri ospiti
          </h2>
          <div className="bento-reviews-grid">
            {reviews.items.slice(0, 3).map((rev, i) => (
              <div key={i} className="bento-review">
                <div className="bento-review-stars">{'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}</div>
                <p className="bento-review-text">"{rev.text}"</p>
                <div className="bento-review-byline">
                  <span className="bento-review-author">{rev.author}</span>
                  <span className="bento-review-source">{rev.source}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '3rem' }}>
            <LeaveReviewForm accent={accentColor} theme="light" scope="ben-lr" labelFont="Inter" />
          </div>
        </section>
      )}

      {/* ═══════════════════════ FAQ ═══════════════════════ */}
      {faq && faq.length > 0 && (
        <section className="bento-faq">
          <h2 data-bento-section-title style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, marginBottom: '1.5rem', letterSpacing: '-0.02em', textAlign: 'center' }}>
            Domande frequenti
          </h2>
          {faq.map((item, i) => (
            <div key={i} className={`bento-faq-item ${openFaq === i ? 'open' : ''}`}>
              <button className="bento-faq-q" type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <span>{item.q}</span>
                <span className="bento-faq-icon">+</span>
              </button>
              <div className="bento-faq-a">
                <p>{item.a}</p>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* ═══════════════════════ NEWSLETTER ═══════════════════════ */}
      <section style={{ padding: '0 1.5rem' }}>
        <div className="bento-newsletter">
          <h2>Resta aggiornato</h2>
          <p>Novità del menu, eventi e offerte. Una mail al mese, niente spam.</p>
          <form className="bento-newsletter-form" style={{ flexWrap: 'wrap' }} onSubmit={e => { e.preventDefault(); const b = e.currentTarget.querySelector('button')!; b.textContent = '✓ Iscritto'; }}>
            <input type="email" required placeholder="tu@email.it" />
            <button type="submit">Iscriviti</button>
            <GdprConsent accent={accentColor} color="rgba(0,0,0,0.55)" />
          </form>
        </div>
      </section>

      {/* ═══════════════════════ CONTACT CARDS ═══════════════════════ */}
      <section style={{ padding: '4rem 1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
        <h2
          data-bento-section-title
          style={{
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: 800,
            marginBottom: '1.5rem',
            letterSpacing: '-0.02em',
          }}
        >
          Contatti
        </h2>
        <div className="bento-contact-grid">
          {/* Map card (2x1 wide) */}
          {mapsUrl && (
            <div
              data-bento-contact-card
              className="bento-map-cell"
              style={{
                gridColumn: 'span 2',
                gridRow: 'span 2',
                borderRadius: 'var(--bento-radius)',
                overflow: 'hidden',
                boxShadow: 'var(--bento-shadow)',
                minHeight: '320px',
                position: 'relative',
              }}
            >
              <iframe
                src={mapsUrl}
                width="100%"
                height="100%"
                style={{ border: 0, position: 'absolute', inset: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Mappa"
              />
            </div>
          )}

          {/* Address card */}
          {address && (
            <div
              data-bento-contact-card
              style={{
                background: 'var(--bento-surface)',
                borderRadius: 'var(--bento-radius)',
                padding: '1.75rem 1.5rem',
                boxShadow: 'var(--bento-shadow)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                transition: 'transform 0.3s, box-shadow 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'var(--bento-shadow)'
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--bento-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>Indirizzo</div>
                <div style={{ fontSize: '0.95rem', lineHeight: 1.5 }}>{address}</div>
              </div>
            </div>
          )}

          {/* Phone / WhatsApp card */}
          {phone && (
            <div
              data-bento-contact-card
              style={{
                background: accentBg(accentColor, 0.08),
                borderRadius: 'var(--bento-radius)',
                padding: '1.75rem 1.5rem',
                boxShadow: 'var(--bento-shadow)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '0.75rem',
                transition: 'transform 0.3s, box-shadow 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'var(--bento-shadow)'
              }}
            >
              <div>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                </svg>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--bento-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '0.5rem', marginBottom: '0.3rem' }}>Telefono</div>
                <a href={`tel:${phone}`} style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--bento-text)', textDecoration: 'none' }}>{phone}</a>
              </div>
              {socialLinks?.whatsapp && (
                <a
                  href={socialLinks.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 18px',
                    background: '#25D366',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    borderRadius: '999px',
                    textDecoration: 'none',
                    width: 'fit-content',
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9' }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d={SOCIAL_ICONS.whatsapp} />
                  </svg>
                  WhatsApp
                </a>
              )}
            </div>
          )}

          {/* Hours card */}
          {hours && Object.keys(hours).length > 0 && (
            <div
              data-bento-contact-card
              style={{
                background: 'var(--bento-surface)',
                borderRadius: 'var(--bento-radius)',
                padding: '1.75rem 1.5rem',
                boxShadow: 'var(--bento-shadow)',
                gridColumn: !mapsUrl ? 'span 2' : undefined,
                transition: 'transform 0.3s, box-shadow 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'var(--bento-shadow)'
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--bento-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '0.5rem', marginBottom: '0.6rem' }}>Orari</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {Object.entries(hours).map(([day, h]) => (
                  <div
                    key={day}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.85rem',
                      lineHeight: 1.6,
                    }}
                  >
                    <span style={{ fontWeight: 500, color: 'var(--bento-text)' }}>
                      {DAY_LABELS[day] || day}
                    </span>
                    <span style={{ color: h.closed ? accentColor : 'var(--bento-muted)', fontWeight: h.closed ? 600 : 400 }}>
                      {h.closed ? 'Chiuso' : `${h.open} – ${h.close}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Email card */}
          {email && (
            <div
              data-bento-contact-card
              style={{
                background: 'var(--bento-surface)',
                borderRadius: 'var(--bento-radius)',
                padding: '1.75rem 1.5rem',
                boxShadow: 'var(--bento-shadow)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                transition: 'transform 0.3s, box-shadow 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'var(--bento-shadow)'
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M22 7l-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7" />
              </svg>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--bento-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>Email</div>
                <a href={`mailto:${email}`} style={{ fontSize: '0.95rem', color: accentColor, fontWeight: 600, textDecoration: 'none' }}>{email}</a>
              </div>
            </div>
          )}

          {/* Social card */}
          {socialLinks && Object.keys(socialLinks).filter(k => k !== 'whatsapp').length > 0 && (
            <div
              data-bento-contact-card
              style={{
                background: accentBg(accentColor, 0.06),
                borderRadius: 'var(--bento-radius)',
                padding: '1.75rem 1.5rem',
                boxShadow: 'var(--bento-shadow)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                transition: 'transform 0.3s, box-shadow 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'var(--bento-shadow)'
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--bento-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Social</div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {Object.entries(socialLinks)
                  .filter(([key]) => key !== 'whatsapp' && SOCIAL_ICONS[key])
                  .map(([key, url]) => (
                    <a
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        background: 'var(--bento-surface)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: 'var(--bento-shadow)',
                        transition: 'transform 0.2s, background 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1)'
                        e.currentTarget.style.background = accentBg(accentColor, 0.12)
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)'
                        e.currentTarget.style.background = 'var(--bento-surface)'
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill={accentColor}>
                        <path d={SOCIAL_ICONS[key]} />
                      </svg>
                    </a>
                  ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════ FOOTER ═══════════════════════ */}
      <footer
        style={{
          padding: '3rem 1.5rem 2rem',
          maxWidth: '1100px',
          margin: '0 auto',
        }}
      >
        <div
          style={{
            height: '2px',
            background: `linear-gradient(to right, transparent, ${accentBg(accentColor, 0.3)}, transparent)`,
            marginBottom: '2rem',
          }}
        />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            textAlign: 'center',
          }}
        >
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={restaurantName}
              width={48}
              height={48}
              style={{ objectFit: 'contain' }}
            />
          ) : (
            <span style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              {restaurantName}
            </span>
          )}

          {/* Footer social links */}
          {socialLinks && Object.keys(socialLinks).length > 0 && (
            <div style={{ display: 'flex', gap: '16px' }}>
              {Object.entries(socialLinks)
                .filter(([key]) => SOCIAL_ICONS[key])
                .map(([key, url]) => (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--bento-muted)', transition: 'color 0.2s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = accentColor }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--bento-muted)' }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d={SOCIAL_ICONS[key]} />
                    </svg>
                  </a>
                ))}
            </div>
          )}

          <p style={{ fontSize: '0.8rem', color: 'var(--bento-muted)', margin: 0 }}>
            &copy; {new Date().getFullYear()} {restaurantName}. Tutti i diritti riservati.
          </p>
        </div>
      </footer>

      {/* ═══════════════════════ WHATSAPP BUTTON (Premium only) ═══════════════════════ */}
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

      <StickyMobileBar
        phone={phone}
        address={address}
        hasReservation={tier !== 'basic'}
        whatsapp={tier === 'premium' ? whatsappNumber : undefined}
        accent={accentColor}
        theme="light"
        scope="ben-smb"
      />

      {/* ═══════════════════════ RESPONSIVE STYLES ═══════════════════════ */}
      <style>{`
        /* Hide scrollbar on category pills and menu scroll */
        .bento-pills-scroll::-webkit-scrollbar { display: none; }
        .bento-menu-scroll::-webkit-scrollbar { display: none; }
        @media (max-width: 768px) {
          .bento-menu-scroll [data-bento-menu-card] { flex: 0 0 260px !important; }
        }
        @media (max-width: 480px) {
          .bento-menu-scroll [data-bento-menu-card] { flex: 0 0 240px !important; }
        }

        /* ── About bento grid ── */
        .bento-about-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-template-rows: auto auto;
          gap: 16px;
        }
        .bento-about-span2 { grid-column: span 2; }
        .bento-about-img-cell {
          border-radius: var(--bento-radius);
          overflow: hidden;
          position: relative;
          aspect-ratio: 1;
          box-shadow: var(--bento-shadow);
        }

        /* ── Contact bento grid ── */
        .bento-contact-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-template-rows: auto auto;
          gap: 16px;
        }
        .bento-map-cell {
          grid-column: span 2;
          grid-row: span 2;
        }

        /* ── CHEF section (bento-style) ── */
        .bento-chef {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          padding: 4rem 1.5rem;
          max-width: 1100px;
          margin: 0 auto;
        }
        .bento-chef-card {
          background: var(--bento-surface);
          border-radius: var(--bento-radius);
          box-shadow: var(--bento-shadow);
          overflow: hidden;
          position: relative;
          transition: transform 0.4s, box-shadow 0.4s;
        }
        .bento-chef-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 50px rgba(0,0,0,0.12);
        }
        .bento-chef-photo {
          aspect-ratio: 3/4;
          overflow: hidden;
          position: relative;
        }
        .bento-chef-photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .bento-chef-badge {
          position: absolute;
          top: 16px;
          left: 16px;
          padding: 6px 12px;
          background: var(--bento-accent, ${accentColor});
          color: white;
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          border-radius: 100px;
          z-index: 2;
        }
        .bento-chef-content {
          padding: 2rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .bento-chef-eyebrow {
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: var(--bento-accent, ${accentColor});
          margin-bottom: 0.75rem;
        }
        .bento-chef-quote {
          font-size: clamp(1.2rem, 1.8vw, 1.6rem);
          font-weight: 500;
          line-height: 1.4;
          color: var(--bento-text);
          letter-spacing: -0.01em;
          margin-bottom: 2rem;
        }
        .bento-chef-sign {
          padding-top: 1.5rem;
          border-top: 1px solid var(--bento-muted, #999)15;
        }
        .bento-chef-name {
          font-size: 1.2rem;
          font-weight: 800;
          letter-spacing: -0.01em;
        }
        .bento-chef-role {
          font-size: 0.85rem;
          color: var(--bento-muted);
          margin-top: 0.25rem;
        }

        /* ── REVIEWS bento ── */
        .bento-press {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          flex-wrap: wrap;
          justify-content: center;
          padding: 1.75rem 1.5rem;
          margin: 2rem auto;
          max-width: 1100px;
          background: var(--bento-surface);
          border-radius: var(--bento-radius);
          box-shadow: var(--bento-shadow);
        }
        .bento-press-block {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .bento-press-stars { font-size: 1.3rem; color: var(--bento-accent, ${accentColor}); letter-spacing: 0.15em; }
        .bento-press-score { font-size: 1.8rem; font-weight: 800; letter-spacing: -0.02em; }
        .bento-press-meta { font-size: 0.8rem; color: var(--bento-muted); font-weight: 600; }
        .bento-press-pipe { width: 1px; height: 32px; background: var(--bento-muted, #999)33; }

        .bento-reviews {
          padding: 4rem 1.5rem;
          max-width: 1100px;
          margin: 0 auto;
        }
        .bento-reviews-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        .bento-review {
          background: var(--bento-surface);
          border-radius: var(--bento-radius);
          padding: 1.75rem;
          box-shadow: var(--bento-shadow);
          transition: transform 0.4s, box-shadow 0.4s;
        }
        .bento-review:hover {
          transform: translateY(-4px);
          box-shadow: 0 15px 40px rgba(0,0,0,0.1);
        }
        .bento-review:first-child {
          grid-column: span 2;
          background: linear-gradient(135deg, var(--bento-accent, ${accentColor}) 0%, color-mix(in oklch, var(--bento-accent, ${accentColor}) 60%, #000) 100%);
          color: white;
        }
        .bento-review-stars { color: var(--bento-accent, ${accentColor}); font-size: 1rem; letter-spacing: 0.15em; margin-bottom: 1rem; }
        .bento-review:first-child .bento-review-stars { color: white; opacity: 0.95; }
        .bento-review-text {
          font-size: 0.95rem;
          line-height: 1.6;
          font-weight: 500;
          margin-bottom: 1.25rem;
        }
        .bento-review:first-child .bento-review-text { font-size: 1.15rem; font-weight: 600; }
        .bento-review-byline {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(0,0,0,0.08);
        }
        .bento-review:first-child .bento-review-byline { border-color: rgba(255,255,255,0.2); }
        .bento-review-author { font-weight: 700; }
        .bento-review-source { opacity: 0.65; letter-spacing: 0.1em; text-transform: uppercase; font-size: 0.65rem; }

        /* ── FAQ ── */
        .bento-faq {
          padding: 4rem 1.5rem;
          max-width: 850px;
          margin: 0 auto;
        }
        .bento-faq-item {
          background: var(--bento-surface);
          border-radius: var(--bento-radius);
          margin-bottom: 12px;
          box-shadow: var(--bento-shadow);
          overflow: hidden;
          transition: box-shadow 0.3s;
        }
        .bento-faq-item.open {
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .bento-faq-q {
          width: 100%;
          background: none;
          border: none;
          padding: 1.4rem 1.75rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: var(--bento-text);
          font-family: inherit;
          font-size: 1.05rem;
          font-weight: 700;
          letter-spacing: -0.01em;
          cursor: pointer;
          text-align: left;
          gap: 1rem;
          transition: color 0.3s;
        }
        .bento-faq-q:hover { color: var(--bento-accent, ${accentColor}); }
        .bento-faq-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--bento-bg);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          font-weight: 800;
          color: var(--bento-accent, ${accentColor});
          transition: transform 0.4s;
          flex-shrink: 0;
        }
        .bento-faq-item.open .bento-faq-icon { transform: rotate(45deg); }
        .bento-faq-a {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.5s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .bento-faq-item.open .bento-faq-a { max-height: 400px; }
        .bento-faq-a p {
          padding: 0 1.75rem 1.5rem;
          color: var(--bento-muted);
          line-height: 1.7;
          font-size: 0.95rem;
        }

        /* ── NEWSLETTER ── */
        .bento-newsletter {
          max-width: 1100px;
          margin: 4rem auto;
          padding: 3rem;
          background: linear-gradient(135deg, var(--bento-accent, ${accentColor}) 0%, color-mix(in oklch, var(--bento-accent, ${accentColor}) 65%, #000) 100%);
          border-radius: var(--bento-radius);
          color: white;
          text-align: center;
          box-shadow: 0 20px 50px rgba(0,0,0,0.15);
        }
        .bento-newsletter h2 {
          font-size: clamp(1.7rem, 3vw, 2.5rem);
          font-weight: 800;
          letter-spacing: -0.03em;
          margin-bottom: 0.75rem;
        }
        .bento-newsletter p {
          opacity: 0.9;
          margin-bottom: 1.75rem;
          font-size: 1rem;
        }
        .bento-newsletter-form {
          display: flex;
          gap: 0.5rem;
          max-width: 500px;
          margin: 0 auto;
        }
        .bento-newsletter input {
          flex: 1;
          padding: 0.95rem 1.25rem;
          border: none;
          border-radius: 100px;
          background: rgba(255,255,255,0.95);
          font-family: inherit;
          font-size: 0.95rem;
          color: #1a1a1a;
          outline: none;
        }
        .bento-newsletter button {
          padding: 0.95rem 1.75rem;
          border: none;
          border-radius: 100px;
          background: #1a1a1a;
          color: white;
          font-family: inherit;
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          transition: transform 0.25s;
        }
        .bento-newsletter button:hover { transform: translateY(-2px); }

        /* Time slots */
        .bento-slots {
          margin: 0.5rem 0 1.5rem;
        }
        .bento-slots-title {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--bento-accent, ${accentColor});
          margin-bottom: 0.75rem;
        }
        .bento-slots-row { display: flex; gap: 8px; flex-wrap: wrap; }
        .bento-slot {
          padding: 0.7rem 1.1rem;
          background: var(--bento-bg);
          color: var(--bento-text);
          border: 1.5px solid var(--bento-muted, #999)30;
          border-radius: 12px;
          font-family: inherit;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s;
        }
        .bento-slot:hover { border-color: var(--bento-accent, ${accentColor}); transform: translateY(-2px); }
        .bento-slot.active {
          background: var(--bento-accent, ${accentColor});
          color: white;
          border-color: var(--bento-accent, ${accentColor});
        }

        /* ── BENTO GALLERY GRID — true asymmetric ── */
        .bento-gallery-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          grid-auto-rows: 200px;
          gap: 14px;
        }
        .bento-gallery-cell {
          position: relative;
          overflow: hidden;
          border-radius: var(--bento-radius);
          cursor: pointer;
          box-shadow: var(--bento-shadow);
          transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.4s;
        }
        .bento-gallery-cell:hover {
          transform: translateY(-6px) scale(1.015);
          box-shadow: 0 16px 40px rgba(0,0,0,0.18);
        }
        .bento-gallery-cell img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .bento-gallery-cell:hover img { transform: scale(1.08); }
        .bento-gallery-cell-large {
          grid-column: span 2;
          grid-row: span 2;
        }
        .bento-gallery-cell-wide {
          grid-column: span 2;
        }
        .bento-gallery-cell-tall {
          grid-row: span 2;
        }
        .bento-gallery-badge {
          position: absolute;
          top: 14px;
          left: 14px;
          z-index: 3;
          padding: 6px 12px;
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          background: rgba(255,255,255,0.95);
          color: var(--bento-bg, #1a1a1a);
          border-radius: 100px;
          backdrop-filter: blur(8px);
        }
        .bento-gallery-cell-large .bento-gallery-badge {
          font-size: 0.75rem;
          padding: 8px 16px;
        }
        .bento-gallery-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.55) 100%);
          opacity: 0;
          transition: opacity 0.4s;
          z-index: 2;
        }
        .bento-gallery-cell:hover .bento-gallery-overlay { opacity: 1; }
        .bento-gallery-caption {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          padding: 1.5rem;
          z-index: 3;
          color: white;
          font-size: 0.95rem;
          font-weight: 500;
          opacity: 0;
          transform: translateY(12px);
          transition: opacity 0.4s, transform 0.4s;
        }
        .bento-gallery-cell:hover .bento-gallery-caption {
          opacity: 1;
          transform: translateY(0);
        }

        /* ── BENTO EVENTS GRID — asymmetric ── */
        .bento-events-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        .bento-event-tile {
          position: relative;
          background: var(--bento-surface);
          border-radius: var(--bento-radius);
          padding: 1.75rem;
          box-shadow: var(--bento-shadow);
          transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.35s;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 220px;
        }
        .bento-event-tile:hover {
          transform: translateY(-6px);
          box-shadow: 0 18px 45px rgba(0,0,0,0.15);
        }
        .bento-event-featured {
          grid-column: span 2;
          grid-row: span 2;
          min-height: 460px;
          background: linear-gradient(135deg, var(--bento-accent, #FF6B35) 0%, color-mix(in oklch, var(--bento-accent, #FF6B35) 60%, #c14a1f) 100%);
          color: white;
        }
        .bento-event-featured::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 50%),
            radial-gradient(circle at 20% 90%, rgba(0,0,0,0.15) 0%, transparent 60%);
          pointer-events: none;
        }
        .bento-event-featured > * { position: relative; z-index: 2; }
        .bento-event-wide {
          grid-column: span 2;
        }
        .bento-event-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          background: rgba(255,255,255,0.15);
          border-radius: 100px;
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          backdrop-filter: blur(8px);
          width: max-content;
        }
        .bento-event-badge::before {
          content: '●';
          font-size: 0.5rem;
          animation: bentoDot 2s ease-in-out infinite;
        }
        @keyframes bentoDot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .bento-event-tile:not(.bento-event-featured) .bento-event-badge {
          background: color-mix(in oklch, var(--bento-accent, #FF6B35) 15%, transparent);
          color: var(--bento-accent, #FF6B35);
        }
        .bento-event-day {
          font-size: clamp(3rem, 5vw, 4.5rem);
          font-weight: 900;
          letter-spacing: -0.04em;
          line-height: 0.85;
        }
        .bento-event-featured .bento-event-day {
          font-size: clamp(5rem, 9vw, 8rem);
        }
        .bento-event-month {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          opacity: 0.85;
          margin-top: 0.3rem;
        }
        .bento-event-title {
          font-size: 1.2rem;
          font-weight: 700;
          letter-spacing: -0.01em;
          line-height: 1.15;
          margin-bottom: 0.5rem;
        }
        .bento-event-featured .bento-event-title {
          font-size: clamp(1.6rem, 2.5vw, 2.2rem);
          margin-bottom: 0.75rem;
        }
        .bento-event-desc {
          font-size: 0.9rem;
          line-height: 1.5;
          opacity: 0.85;
        }
        .bento-event-featured .bento-event-desc { font-size: 1.05rem; }

        /* ── Reservation form grids ── */
        .bento-form-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
        }
        .bento-form-grid-3 {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 1.25rem;
        }

        @media (max-width: 768px) {
          /* About bento grid: collapse to 1 col */
          .bento-about-grid {
            grid-template-columns: 1fr !important;
          }
          .bento-about-span2 {
            grid-column: span 1 !important;
          }
          .bento-about-img-cell {
            aspect-ratio: 4/3 !important;
          }

          /* Contact bento grid: collapse to 1 col */
          .bento-contact-grid {
            grid-template-columns: 1fr !important;
          }
          .bento-map-cell {
            grid-column: span 1 !important;
            grid-row: span 1 !important;
            min-height: 280px !important;
          }

          /* Gallery masonry to 2 columns */
          .bento-gallery-masonry {
            column-count: 2 !important;
          }
        }

        @media (max-width: 640px) {
          /* Reservation form: stack to 1 col */
          .bento-form-grid-2 {
            grid-template-columns: 1fr !important;
          }
          .bento-form-grid-3 {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 480px) {
          /* Gallery: 1 column */
          .bento-gallery-masonry {
            column-count: 1 !important;
          }
        }

        /* Gallery + Events bento responsive */
        @media (max-width: 1024px) {
          .bento-gallery-grid { grid-template-columns: repeat(3, 1fr); grid-auto-rows: 180px; }
          .bento-events-grid { grid-template-columns: repeat(3, 1fr); }
          .bento-event-featured { min-height: 380px; }
        }
        @media (max-width: 768px) {
          .bento-gallery-grid { grid-template-columns: repeat(2, 1fr); grid-auto-rows: 160px; }
          .bento-gallery-cell-large { grid-column: span 2; grid-row: span 2; }
          .bento-gallery-cell-wide { grid-column: span 2; }
          .bento-gallery-cell-tall { grid-row: span 1; }
          .bento-events-grid { grid-template-columns: 1fr 1fr; }
          .bento-event-featured { grid-column: span 2; grid-row: span 1; min-height: 320px; }
          .bento-event-wide { grid-column: span 2; }
        }
        @media (max-width: 480px) {
          .bento-gallery-grid { grid-template-columns: 1fr; }
          .bento-gallery-cell-large,
          .bento-gallery-cell-wide,
          .bento-gallery-cell-tall { grid-column: span 1; grid-row: span 1; }
          .bento-events-grid { grid-template-columns: 1fr; }
          .bento-event-featured,
          .bento-event-wide { grid-column: span 1; }
        }
        @media (max-width: 768px) {
          .bento-chef { grid-template-columns: 1fr; }
          .bento-reviews-grid { grid-template-columns: 1fr; }
          .bento-review:first-child { grid-column: span 1; }
          .bento-newsletter-form { flex-direction: column; }
          .bento-press { flex-direction: column; gap: 0.75rem; }
          .bento-press-pipe { width: 60%; height: 1px; }
        }
      `}</style>
    </div>
  )
}
