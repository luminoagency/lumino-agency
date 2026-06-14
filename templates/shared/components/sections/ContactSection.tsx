'use client'

import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { getThemeTokens } from '@/templates/styles'
import type { SiteContentRow, SiteStyle, DayKey } from '@/templates/shared/types/restaurant'

gsap.registerPlugin(ScrollTrigger)

interface ContactSectionProps {
  content: SiteContentRow
  style: SiteStyle
}

const DAY_LABELS: Record<DayKey, string> = {
  mon: 'Lunedì', tue: 'Martedì', wed: 'Mercoledì', thu: 'Giovedì',
  fri: 'Venerdì', sat: 'Sabato', sun: 'Domenica',
}
const DAYS: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

export function ContactSection({ content, style }: ContactSectionProps) {
  const t = getThemeTokens(style)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('[data-contact-char]', {
        y: '110%', opacity: 0,
      }, {
        y: '0%', opacity: 1,
        stagger: 0.03, duration: 0.7, ease: 'power3.out',
        scrollTrigger: { trigger: '[data-contact-title]', start: 'top 80%', toggleActions: 'play none none none' },
      })

      gsap.fromTo('[data-contact-map]', {
        clipPath: 'inset(0 0 100% 0)', opacity: 0,
      }, {
        clipPath: 'inset(0 0 0% 0)', opacity: 1,
        duration: 1.2, ease: 'power3.inOut',
        scrollTrigger: { trigger: '[data-contact-map]', start: 'top 75%', toggleActions: 'play none none none' },
      })

      gsap.fromTo('[data-contact-info] > div', {
        y: 30, opacity: 0,
      }, {
        y: 0, opacity: 1,
        stagger: 0.1, duration: 0.6, ease: 'power2.out',
        scrollTrigger: { trigger: '[data-contact-info]', start: 'top 75%', toggleActions: 'play none none none' },
      })

      gsap.fromTo('[data-hours-row]', {
        x: -20, opacity: 0,
      }, {
        x: 0, opacity: 1,
        stagger: 0.05, duration: 0.4, ease: 'power2.out',
        scrollTrigger: { trigger: '[data-hours-list]', start: 'top 75%', toggleActions: 'play none none none' },
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [style])

  const bg = style === 'modern' ? t.colors.bg : t.colors.bgAlt
  const fg = t.colors.fg
  const muted = t.colors.fgMuted
  const contactTitle = style === 'luxury' ? 'Trovateci' : 'Contatti'

  return (
    <section
      ref={sectionRef}
      id="contact"
      style={{
        background: bg,
        padding: 'clamp(6rem, 14vh, 12rem) clamp(1.5rem, 6vw, 7rem)',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Title */}
        <div data-contact-title style={{ textAlign: 'center', marginBottom: 'clamp(4rem, 8vh, 6rem)' }}>
          {style !== 'modern' && (
            <div style={{ width: 40, height: 1, background: 'var(--color-accent)', margin: '0 auto 1.5rem' }} />
          )}
          <h2 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: style === 'modern' ? 'clamp(2.8rem, 6vw, 5rem)' : 'clamp(2.2rem, 5vw, 4rem)',
            fontWeight: style === 'modern' ? '900' : '300',
            color: fg,
            letterSpacing: style === 'modern' ? t.letterSpacing.tight : t.letterSpacing.wide,
            textTransform: style === 'luxury' ? 'uppercase' : 'none',
            lineHeight: 1.05,
          }}>
            {contactTitle.split('').map((char, i) => (
              <span key={i} style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom' }}>
                <span data-contact-char style={{ display: 'inline-block', transform: 'translateY(110%)', opacity: 0 }}>
                  {char === ' ' ? ' ' : char}
                </span>
              </span>
            ))}
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: content.google_maps_embed_url ? '1.2fr 1fr' : '1fr',
          gap: 'clamp(3rem, 6vw, 6rem)',
          alignItems: 'start',
        }}>
          {/* Map with clip reveal */}
          {content.google_maps_embed_url && (
            <div
              data-contact-map
              style={{
                borderRadius: style === 'modern' ? '16px' : '4px',
                overflow: 'hidden',
                aspectRatio: '4 / 3',
                opacity: 0,
                clipPath: 'inset(0 0 100% 0)',
              }}
            >
              <iframe
                src={content.google_maps_embed_url}
                width="100%" height="100%"
                style={{
                  border: 0,
                  display: 'block',
                  filter: 'grayscale(0.85) brightness(0.65) contrast(1.1)',
                }}
                allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          )}

          {/* Info blocks */}
          <div data-contact-info style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            {content.address && (
              <div style={{ opacity: 0, transform: 'translateY(30px)' }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.58rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--color-accent)', marginBottom: '0.75rem' }}>
                  Indirizzo
                </p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.92rem', color: fg, lineHeight: 1.7 }}>
                  {content.address}
                </p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap', opacity: 0, transform: 'translateY(30px)' }}>
              {content.phone && (
                <div>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.58rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--color-accent)', marginBottom: '0.4rem' }}>Telefono</p>
                  <a href={`tel:${content.phone}`} style={{ fontFamily: 'var(--font-body)', fontSize: '0.92rem', color: fg, textDecoration: 'none' }}>{content.phone}</a>
                </div>
              )}
              {content.email && (
                <div>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.58rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--color-accent)', marginBottom: '0.4rem' }}>Email</p>
                  <a href={`mailto:${content.email}`} style={{ fontFamily: 'var(--font-body)', fontSize: '0.92rem', color: fg, textDecoration: 'none' }}>{content.email}</a>
                </div>
              )}
              {content.whatsapp && (
                <div>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.58rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--color-accent)', marginBottom: '0.4rem' }}>WhatsApp</p>
                  <a href={`https://wa.me/${content.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                    style={{ fontFamily: 'var(--font-body)', fontSize: '0.92rem', color: fg, textDecoration: 'none' }}>{content.whatsapp}</a>
                </div>
              )}
            </div>

            {/* Hours */}
            <div style={{ opacity: 0, transform: 'translateY(30px)' }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.58rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--color-accent)', marginBottom: '1.2rem' }}>
                Orari
              </p>
              <div data-hours-list style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {DAYS.map((day) => {
                  const hours = content.opening_hours[day]
                  if (!hours) return null
                  return (
                    <div
                      key={day}
                      data-hours-row
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        paddingBottom: '0.45rem',
                        borderBottom: `1px solid ${style === 'modern' ? 'rgba(250,242,232,0.08)' : 'rgba(255,255,255,0.04)'}`,
                        opacity: 0,
                        transform: 'translateX(-20px)',
                      }}
                    >
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', color: fg }}>{DAY_LABELS[day]}</span>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', color: hours.closed ? 'var(--color-accent)' : muted }}>
                        {hours.closed ? 'Chiuso' : `${hours.open} — ${hours.close}`}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
