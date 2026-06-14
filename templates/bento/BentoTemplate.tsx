'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'

gsap.registerPlugin(ScrollTrigger)

/* ─────────────────────────── TYPES ─────────────────────────── */

interface MenuItemData {
  name: string
  description?: string
  price: number
  photo_url?: string
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
  } = props

  const [reservationSubmitted, setReservationSubmitted] = useState(false)

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
      {/* ═══════════════════════ HERO ═══════════════════════ */}
      <section
        style={{
          position: 'relative',
          height: '70vh',
          minHeight: '500px',
          maxHeight: '800px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1.5rem',
          overflow: 'hidden',
        }}
      >
        {/* Background gradient mesh */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `
              radial-gradient(ellipse 80% 60% at 20% 30%, ${accentBg(accentColor, 0.08)}, transparent),
              radial-gradient(ellipse 60% 50% at 80% 70%, ${accentBg(accentColor, 0.06)}, transparent),
              radial-gradient(ellipse 50% 40% at 50% 50%, rgba(200,200,255,0.05), transparent)
            `,
            zIndex: 0,
          }}
        />
        {/* Floating dots decoration */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.4 }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: `${6 + (i % 4) * 4}px`,
                height: `${6 + (i % 4) * 4}px`,
                borderRadius: '50%',
                background: i % 3 === 0 ? accentBg(accentColor, 0.3) : 'rgba(0,0,0,0.06)',
                left: `${8 + (i * 7.3) % 84}%`,
                top: `${10 + (i * 11.7) % 75}%`,
              }}
            />
          ))}
        </div>

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '900px' }}>
          <h1
            data-bento-hero-title
            style={{
              fontSize: 'clamp(3rem, 10vw, 7rem)',
              fontWeight: 900,
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
              margin: 0,
              color: 'var(--bento-text)',
            }}
          >
            {restaurantName}
          </h1>

          {/* Preview image strip */}
          {heroPreviewImages.length > 0 && (
            <div
              data-bento-hero-strip
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'center',
                marginTop: '1.5rem',
              }}
            >
              {heroPreviewImages.map((img, i) => (
                <div
                  key={i}
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: 'var(--bento-shadow)',
                    position: 'relative',
                    flexShrink: 0,
                  }}
                >
                  <Image
                    src={img.url}
                    alt={img.alt}
                    fill
                    style={{ objectFit: 'cover' }}
                    sizes="80px"
                  />
                </div>
              ))}
            </div>
          )}

          {tagline && (
            <p
              data-bento-hero-tagline
              style={{
                fontSize: 'clamp(1rem, 2.5vw, 1.35rem)',
                color: 'var(--bento-muted)',
                marginTop: '1.25rem',
                fontWeight: 400,
                letterSpacing: '0.01em',
              }}
            >
              {tagline}
            </p>
          )}

          <a
            href="#menu"
            data-bento-hero-cta
            style={{
              display: 'inline-block',
              marginTop: '1.75rem',
              padding: '14px 36px',
              background: accentColor,
              color: '#fff',
              fontWeight: 600,
              fontSize: '1rem',
              borderRadius: '999px',
              textDecoration: 'none',
              boxShadow: `0 4px 20px ${accentBg(accentColor, 0.35)}`,
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = `0 6px 28px ${accentBg(accentColor, 0.45)}`
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = `0 4px 20px ${accentBg(accentColor, 0.35)}`
            }}
          >
            Scopri il menu
          </a>
        </div>
      </section>

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
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>{item.name}</h3>
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
          <div
            className="bento-gallery-masonry"
            style={{
              columns: 'clamp(1, calc((100% - 200px) / 300 + 1), 3)',
              columnCount: 3,
              columnGap: '16px',
            }}
          >
            {galleryImages.map((img, i) => (
              <div
                key={i}
                data-bento-gallery-item
                onClick={() => openLightbox(i)}
                style={{
                  breakInside: 'avoid',
                  marginBottom: '16px',
                  borderRadius: 'var(--bento-radius)',
                  overflow: 'hidden',
                  position: 'relative',
                  cursor: 'pointer',
                  boxShadow: 'var(--bento-shadow)',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.03)'
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.12)'
                  const cap = e.currentTarget.querySelector('[data-gallery-caption]') as HTMLElement
                  if (cap) cap.style.transform = 'translateY(0)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.boxShadow = 'var(--bento-shadow)'
                  const cap = e.currentTarget.querySelector('[data-gallery-caption]') as HTMLElement
                  if (cap) cap.style.transform = 'translateY(100%)'
                }}
              >
                <Image
                  src={img.url}
                  alt={img.alt}
                  width={600}
                  height={i % 3 === 0 ? 800 : i % 3 === 1 ? 600 : 450}
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                  }}
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                {img.caption && (
                  <div
                    data-gallery-caption
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: '2rem 1rem 1rem',
                      background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
                      color: '#fff',
                      fontSize: '0.9rem',
                      fontWeight: 500,
                      transform: 'translateY(100%)',
                      transition: 'transform 0.3s ease',
                    }}
                  >
                    {img.caption}
                  </div>
                )}
              </div>
            ))}
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
        <section style={{ padding: '4rem 1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {events.map((ev, i) => (
              <div
                key={i}
                data-bento-card
                style={{
                  background: 'var(--bento-surface)',
                  borderRadius: 'var(--bento-radius)',
                  overflow: 'hidden',
                  boxShadow: 'var(--bento-shadow)',
                  transition: 'transform 0.25s, box-shadow 0.25s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.1)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--bento-shadow)' }}
              >
                {ev.imageUrl && (
                  <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden' }}>
                    <img src={ev.imageUrl} alt={ev.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <div style={{ padding: '1.5rem' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 600, color: accentColor, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {new Date(ev.date).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.4rem' }}>{ev.title}</h3>
                  {ev.description && <p style={{ fontSize: '0.85rem', color: 'var(--bento-muted)', lineHeight: 1.5 }}>{ev.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

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
      `}</style>
    </div>
  )
}
