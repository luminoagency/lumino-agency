'use client'

import { useRef, useEffect, useState } from 'react'
import Image from 'next/image'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import { getThemeTokens } from '@/templates/styles'
import type { SiteStyle, GalleryImage } from '@/templates/shared/types/restaurant'

gsap.registerPlugin(ScrollTrigger)

interface GallerySectionProps {
  images: GalleryImage[]
  style: SiteStyle
}

export function GallerySection({ images, style }: GallerySectionProps) {
  const t = getThemeTokens(style)
  const sectionRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [lightboxIndex, setLightboxIndex] = useState(-1)

  useEffect(() => {
    if (!trackRef.current || !sectionRef.current) return

    const ctx = gsap.context(() => {
      const track = trackRef.current!
      const totalScroll = track.scrollWidth - window.innerWidth

      // Title reveal
      gsap.fromTo('[data-gallery-title]', {
        y: 40,
        opacity: 0,
      }, {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      })

      // Horizontal scroll pinned
      gsap.to(track, {
        x: -totalScroll,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: () => `+=${totalScroll}`,
          scrub: 1,
          pin: true,
          anticipatePin: 1,
        },
      })

      // Each image scales up slightly as it enters viewport
      const items = track.querySelectorAll('[data-gallery-item]')
      items.forEach((item) => {
        gsap.fromTo(item, {
          scale: 0.85,
          opacity: 0.4,
        }, {
          scale: 1,
          opacity: 1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: item,
            containerAnimation: gsap.getById?.('gallery-scroll') ?? undefined,
            start: 'left 80%',
            end: 'left 30%',
            scrub: true,
            horizontal: true,
          },
        })
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [style, images.length])

  if (images.length === 0) return null

  return (
    <section
      ref={sectionRef}
      id="gallery"
      style={{
        background: t.colors.bgAlt,
        overflow: 'hidden',
      }}
    >
      {/* Title — visible before pin */}
      <div
        style={{
          padding: 'clamp(5rem, 10vh, 8rem) clamp(1.5rem, 6vw, 7rem) 2rem',
        }}
      >
        <div data-gallery-title style={{ opacity: 0, transform: 'translateY(40px)' }}>
          {style !== 'modern' && (
            <div style={{ width: 40, height: 1, background: 'var(--color-accent)', marginBottom: '1.5rem' }} />
          )}
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: style === 'modern' ? 'clamp(2.5rem, 5vw, 4rem)' : 'clamp(2rem, 4vw, 3.5rem)',
              fontWeight: style === 'modern' ? '900' : '300',
              color: t.colors.fg,
              letterSpacing: style === 'modern' ? t.letterSpacing.tight : t.letterSpacing.wide,
              textTransform: style === 'luxury' ? 'uppercase' : 'none',
            }}
          >
            Galleria
          </h2>
        </div>
      </div>

      {/* Horizontal track */}
      <div
        ref={trackRef}
        style={{
          display: 'flex',
          gap: style === 'modern' ? '16px' : '6px',
          paddingLeft: 'clamp(1.5rem, 6vw, 7rem)',
          paddingRight: '30vw',
          height: '70vh',
          alignItems: 'center',
          willChange: 'transform',
        }}
      >
        {images.map((img, i) => (
          <div
            key={i}
            data-gallery-item
            onClick={() => setLightboxIndex(i)}
            style={{
              flex: '0 0 auto',
              width: i === 0 ? '55vw' : '38vw',
              height: i === 0 ? '65vh' : '50vh',
              position: 'relative',
              borderRadius: style === 'modern' ? '16px' : '4px',
              overflow: 'hidden',
              cursor: 'pointer',
            }}
          >
            <Image
              src={img.url}
              alt={img.alt}
              fill
              className="object-cover"
              sizes={i === 0 ? '55vw' : '38vw'}
              style={{
                transition: 'transform 0.8s cubic-bezier(0.25,0.1,0.25,1)',
              }}
              onMouseEnter={(e) => { (e.target as HTMLElement).style.transform = 'scale(1.05)' }}
              onMouseLeave={(e) => { (e.target as HTMLElement).style.transform = 'scale(1)' }}
            />
            {/* Caption overlay on hover */}
            {img.caption && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: '2rem 1.5rem 1.5rem',
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                  opacity: 0,
                  transition: 'opacity 0.4s',
                  pointerEvents: 'none',
                }}
                className="gallery-caption"
              >
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.75rem',
                  color: '#ffffff',
                  letterSpacing: '0.06em',
                }}>
                  {img.caption}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Counter */}
      <div style={{
        position: 'absolute',
        bottom: '2rem',
        right: 'clamp(1.5rem, 6vw, 7rem)',
        fontFamily: 'var(--font-body)',
        fontSize: '0.6rem',
        letterSpacing: '0.2em',
        color: t.colors.fgMuted,
        zIndex: 5,
      }}>
        {images.length} foto
      </div>

      {/* Lightbox */}
      <Lightbox
        open={lightboxIndex >= 0}
        close={() => setLightboxIndex(-1)}
        index={lightboxIndex}
        slides={images.map((img) => ({ src: img.url, alt: img.alt }))}
        styles={{ container: { backgroundColor: 'rgba(0,0,0,0.96)' } }}
      />

      <style>{`
        [data-gallery-item]:hover .gallery-caption { opacity: 1 !important; }
      `}</style>
    </section>
  )
}
