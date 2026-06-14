'use client'

import { useRef, useEffect } from 'react'
import Image from 'next/image'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { getThemeTokens } from '@/templates/styles'
import type { SiteContentRow, SiteStyle } from '@/templates/shared/types/restaurant'

gsap.registerPlugin(ScrollTrigger)

const OVERLAY: Record<SiteStyle, string> = {
  luxury: 'linear-gradient(to bottom, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.22) 45%, rgba(0,0,0,0.82) 72%, rgba(0,0,0,0.94) 100%)',
  exotic: 'linear-gradient(to bottom, rgba(13,8,22,0.08) 0%, rgba(13,8,22,0.26) 45%, rgba(13,8,22,0.86) 72%, rgba(13,8,22,0.97) 100%)',
  modern: 'linear-gradient(to bottom, rgba(26,18,16,0.06) 0%, rgba(26,18,16,0.32) 50%, rgba(26,18,16,0.92) 100%)',
}

function SplitChars({ text }: { text: string }) {
  return (
    <>
      {text.split('').map((char, i) => (
        <span key={i} style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom' }}>
          <span
            data-hero-char
            style={{ display: 'inline-block', transform: 'translateY(110%)', opacity: 0 }}
          >
            {char === ' ' ? ' ' : char}
          </span>
        </span>
      ))}
    </>
  )
}

interface HeroSectionProps {
  content: SiteContentRow
  style: SiteStyle
  ctaLabel?: string
  onCtaClick?: () => void
}

export function HeroSection({ content, style, ctaLabel = 'Scopri il menu', onCtaClick }: HeroSectionProps) {
  const t = getThemeTokens(style)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const charDuration = { luxury: 0.9, exotic: 0.7, modern: 0.5 }[style]
      const charStagger = { luxury: 0.032, exotic: 0.022, modern: 0.013 }[style]
      const initDelay = { luxury: 0.25, exotic: 0.15, modern: 0.08 }[style]

      // Entrance timeline
      const tl = gsap.timeline({ delay: initDelay })

      tl.to('[data-hero-image]', { opacity: 1, duration: 2.2, ease: 'power2.inOut' })
      tl.to('[data-hero-overlay]', { opacity: 1, duration: 1.4, ease: 'power2.out' }, '-=1.8')
      tl.to('[data-hero-accent]', { scaleX: 1, opacity: 1, duration: 0.65, ease: 'power3.out' }, '-=0.4')
      tl.to('[data-hero-overline]', { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, '-=0.1')
      tl.to('[data-hero-char]', {
        y: 0, opacity: 1, duration: charDuration, stagger: charStagger, ease: 'power3.out',
      }, '-=0.15')
      tl.to('[data-hero-sub]', { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, '-=0.2')
      tl.to('[data-hero-cta]', { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out' }, '+=0.05')
      tl.to('[data-hero-scroll]', { opacity: 0.45, duration: 0.6 }, '-=0.3')

      // Scroll: image zooms OUT (starts scaled up, scrolls to normal)
      gsap.fromTo('[data-hero-image]', {
        scale: 1.15,
      }, {
        scale: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      })

      // Scroll: text moves up faster (parallax)
      gsap.to('[data-hero-content]', {
        y: -100,
        opacity: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '60% top',
          scrub: true,
        },
      })

      // Scroll: overlay darkens
      gsap.to('[data-hero-overlay]', {
        opacity: 1.5,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [style])

  const headline = content.hero_headline ?? content.restaurant_name
  const titleSize =
    style === 'luxury'
      ? 'clamp(3.8rem, 8vw, 9rem)'
      : style === 'exotic'
        ? 'clamp(3rem, 7vw, 7rem)'
        : 'clamp(2.8rem, 6.5vw, 6rem)'

  return (
    <section
      ref={sectionRef}
      className="relative"
      style={{ height: '100vh', background: '#000', overflow: 'hidden', isolation: 'isolate' }}
    >
      {/* Image — starts zoomed in, zooms out on scroll */}
      {content.hero_image_url && (
        <div
          data-hero-image
          style={{
            position: 'absolute',
            inset: '-5%',
            width: '110%',
            height: '110%',
            opacity: 0,
            transform: 'scale(1.15)',
            willChange: 'transform',
          }}
        >
          <Image
            src={content.hero_image_url}
            alt={content.restaurant_name}
            fill
            priority
            className="object-cover object-center"
            sizes="110vw"
            style={{ filter: 'brightness(0.7)' }}
          />
        </div>
      )}

      {/* Gradient overlay */}
      <div
        data-hero-overlay
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0,
          background: OVERLAY[style],
          zIndex: 2,
        }}
      />

      {/* Text content — parallax on scroll */}
      <div
        data-hero-content
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          paddingLeft: 'clamp(1.5rem, 6vw, 7rem)',
          paddingRight: 'clamp(1.5rem, 6vw, 7rem)',
          paddingBottom: 'clamp(4rem, 9vh, 8rem)',
          willChange: 'transform',
        }}
      >
        {/* Luxury gold line */}
        {style === 'luxury' && (
          <div
            data-hero-accent
            style={{
              width: 60, height: 1,
              background: 'var(--color-accent)',
              marginBottom: '1.5rem',
              transform: 'scaleX(0)', transformOrigin: 'left', opacity: 0,
            }}
          />
        )}

        {/* Exotic triple bar */}
        {style === 'exotic' && (
          <div
            data-hero-accent
            className="flex gap-1.5"
            style={{ marginBottom: '1.25rem', transform: 'scaleX(0)', transformOrigin: 'left', opacity: 0 }}
          >
            {[8, 24, 8].map((w, i) => (
              <div key={i} style={{ width: w, height: 2, background: 'var(--color-accent)', borderRadius: 1 }} />
            ))}
          </div>
        )}

        {/* Tagline */}
        {content.tagline && style !== 'modern' && (
          <p
            data-hero-overline
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.62rem',
              letterSpacing: 'var(--letter-spacing-wider)',
              color: 'var(--color-accent)',
              textTransform: 'uppercase',
              marginBottom: '1rem',
              opacity: 0, transform: 'translateY(10px)',
            }}
          >
            {content.tagline}
          </p>
        )}

        {/* Headline */}
        <h1 style={{
          fontFamily: 'var(--font-heading)',
          fontWeight: style === 'modern' ? '900' : '300',
          color: '#ffffff',
          letterSpacing: style === 'modern' ? 'var(--letter-spacing-tight)' : 'var(--letter-spacing-wide)',
          lineHeight: style === 'luxury' ? 1.0 : 1.05,
          fontSize: titleSize,
          marginBottom: '1.5rem',
        }}>
          <SplitChars text={headline} />
        </h1>

        {/* Subheadline */}
        {(content.hero_subheadline ?? (style === 'modern' ? content.tagline : null)) && (
          <p
            data-hero-sub
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'clamp(0.8rem, 1.4vw, 0.95rem)',
              color: 'rgba(255,255,255,0.62)',
              lineHeight: 1.85,
              letterSpacing: style === 'luxury' ? '0.04em' : 'normal',
              maxWidth: '30rem',
              marginBottom: '2.5rem',
              opacity: 0, transform: 'translateY(14px)',
            }}
          >
            {content.hero_subheadline ?? content.tagline}
          </p>
        )}

        {/* CTA */}
        <div data-hero-cta style={{ opacity: 0, transform: 'translateY(12px)' }}>
          <button
            data-magnetic
            onClick={onCtaClick}
            style={{
              display: 'inline-block',
              padding: '15px 52px',
              fontSize: '0.62rem',
              textTransform: 'uppercase',
              letterSpacing: '0.18em',
              fontFamily: 'var(--font-body)',
              fontWeight: style === 'modern' ? '700' : '400',
              cursor: 'pointer',
              transition: `all ${t.duration.fast}s`,
              ...(style !== 'modern'
                ? {
                    border: '1px solid var(--color-accent)',
                    color: 'var(--color-accent)',
                    background: 'transparent',
                    borderRadius: 'var(--radius-sm)',
                  }
                : {
                    border: 'none',
                    color: '#ffffff',
                    background: 'var(--color-accent)',
                    borderRadius: 'var(--radius-full)',
                  }),
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget
              if (style !== 'modern') { el.style.background = 'var(--color-accent)'; el.style.color = '#0a0a0a' }
              else { el.style.filter = 'brightness(1.14)'; el.style.transform = 'scale(1.05)' }
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget
              if (style !== 'modern') { el.style.background = 'transparent'; el.style.color = 'var(--color-accent)' }
              else { el.style.filter = 'none'; el.style.transform = 'scale(1)' }
            }}
          >
            {ctaLabel}
          </button>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        data-hero-scroll
        style={{
          position: 'absolute',
          bottom: '2rem',
          right: 'clamp(1.5rem, 5vw, 3rem)',
          zIndex: 10,
          opacity: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <span style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.5rem',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.35)',
          writingMode: 'vertical-rl',
        }}>
          Scroll
        </span>
        <div style={{
          width: 1,
          height: 44,
          background: 'linear-gradient(to bottom, var(--color-accent), transparent)',
          animation: 'scrollPulse 2s ease-in-out infinite',
        }} />
        <style>{`
          @keyframes scrollPulse {
            0%, 100% { opacity: 0.4; transform: scaleY(1); }
            50% { opacity: 0.8; transform: scaleY(1.2); }
          }
        `}</style>
      </div>
    </section>
  )
}
