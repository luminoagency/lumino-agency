'use client'

import { useRef, useEffect } from 'react'
import Image from 'next/image'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { getThemeTokens } from '@/templates/styles'
import type { SiteContentRow, SiteStyle } from '@/templates/shared/types/restaurant'

gsap.registerPlugin(ScrollTrigger)

interface AboutSectionProps {
  content: SiteContentRow
  style: SiteStyle
}

export function AboutSection({ content, style }: AboutSectionProps) {
  const t = getThemeTokens(style)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Parallax on the about image — moves slower than scroll
      gsap.to('[data-about-image]', {
        yPercent: -15,
        ease: 'none',
        scrollTrigger: {
          trigger: '[data-about-image]',
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      })

      // Image reveal — clip from left
      gsap.fromTo('[data-about-image-reveal]', {
        clipPath: 'inset(0 100% 0 0)',
      }, {
        clipPath: 'inset(0 0% 0 0)',
        duration: 1.4,
        ease: 'power3.inOut',
        scrollTrigger: {
          trigger: '[data-about-image-reveal]',
          start: 'top 75%',
          toggleActions: 'play none none none',
        },
      })

      // Accent line grows
      gsap.fromTo('[data-about-accent]', {
        scaleX: 0,
      }, {
        scaleX: 1,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '[data-about-text]',
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      })

      // Title chars split reveal
      gsap.fromTo('[data-about-title] [data-split-char]', {
        y: '110%',
        opacity: 0,
      }, {
        y: '0%',
        opacity: 1,
        stagger: 0.025,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '[data-about-title]',
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      })

      // Paragraph lines fade up
      gsap.fromTo('[data-about-line]', {
        y: 30,
        opacity: 0,
      }, {
        y: 0,
        opacity: 1,
        stagger: 0.12,
        duration: 0.7,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '[data-about-text]',
          start: 'top 70%',
          toggleActions: 'play none none none',
        },
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [style])

  const bg = style === 'modern' ? t.colors.bgAlt : t.colors.bg
  const title = content.about_title ?? 'La nostra storia'
  const text = content.about_text ?? content.description ?? ''
  const sentences = text.split(/(?<=\.)\s+/).filter(Boolean)

  return (
    <section
      ref={sectionRef}
      id="about"
      style={{
        background: bg,
        padding: 'clamp(6rem, 14vh, 12rem) clamp(1.5rem, 6vw, 7rem)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: content.about_image_url ? '1.1fr 1fr' : '1fr',
          gap: 'clamp(3rem, 7vw, 7rem)',
          alignItems: 'center',
        }}
      >
        {/* Image with parallax + clip reveal */}
        {content.about_image_url && (
          <div
            data-about-image-reveal
            style={{
              position: 'relative',
              aspectRatio: '3 / 4',
              borderRadius: style === 'modern' ? '16px' : '2px',
              overflow: 'hidden',
              clipPath: 'inset(0 100% 0 0)',
            }}
          >
            <div
              data-about-image
              style={{
                position: 'absolute',
                inset: '-15% 0',
                height: '130%',
              }}
            >
              <Image
                src={content.about_image_url}
                alt={title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 55vw"
              />
            </div>
            {/* Subtle grain overlay */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: style !== 'modern'
                ? 'linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.3) 100%)'
                : 'none',
              pointerEvents: 'none',
            }} />
          </div>
        )}

        {/* Text content */}
        <div data-about-text>
          {/* Accent line */}
          {style !== 'modern' && (
            <div
              data-about-accent
              style={{
                width: style === 'luxury' ? 60 : 30,
                height: style === 'luxury' ? 1 : 2,
                background: 'var(--color-accent)',
                marginBottom: '2rem',
                transformOrigin: 'left',
                transform: 'scaleX(0)',
              }}
            />
          )}

          {/* Title with split chars */}
          <h2
            data-about-title
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: style === 'modern' ? 'clamp(2.5rem, 5vw, 4rem)' : 'clamp(2rem, 4vw, 3.5rem)',
              fontWeight: style === 'modern' ? '900' : '300',
              color: t.colors.fg,
              letterSpacing: style === 'modern' ? t.letterSpacing.tight : t.letterSpacing.wide,
              lineHeight: 1.05,
              marginBottom: '2.5rem',
            }}
          >
            {title.split('').map((char, i) => (
              <span key={i} style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom' }}>
                <span data-split-char style={{ display: 'inline-block', transform: 'translateY(110%)', opacity: 0 }}>
                  {char === ' ' ? ' ' : char}
                </span>
              </span>
            ))}
          </h2>

          {/* Text — sentence by sentence reveal */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {sentences.map((sentence, i) => (
              <p
                key={i}
                data-about-line
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'clamp(0.88rem, 1.2vw, 1rem)',
                  color: t.colors.fgMuted,
                  lineHeight: 1.9,
                  maxWidth: '34rem',
                  opacity: 0,
                  transform: 'translateY(30px)',
                }}
              >
                {sentence}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
