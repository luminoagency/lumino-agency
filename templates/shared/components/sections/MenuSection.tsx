'use client'

import { useRef, useEffect } from 'react'
import Image from 'next/image'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { getThemeTokens } from '@/templates/styles'
import type { SiteStyle, MenuCategory } from '@/templates/shared/types/restaurant'

gsap.registerPlugin(ScrollTrigger)

interface MenuSectionProps {
  categories: MenuCategory[]
  style: SiteStyle
}

export function MenuSection({ categories, style }: MenuSectionProps) {
  const t = getThemeTokens(style)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Section title — split chars wipe up
      gsap.fromTo('[data-menu-char]', {
        y: '110%',
        opacity: 0,
      }, {
        y: '0%',
        opacity: 1,
        stagger: 0.03,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '[data-menu-title]',
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      })

      // Category blocks stagger in
      gsap.fromTo('[data-menu-category]', {
        y: 60,
        opacity: 0,
      }, {
        y: 0,
        opacity: 1,
        stagger: 0.15,
        duration: 0.9,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '[data-menu-categories]',
          start: 'top 75%',
          toggleActions: 'play none none none',
        },
      })

      // Individual menu items slide in one by one per category
      const cats = sectionRef.current?.querySelectorAll('[data-menu-category]')
      cats?.forEach((cat) => {
        const items = cat.querySelectorAll('[data-menu-item]')
        gsap.fromTo(items, {
          x: -20,
          opacity: 0,
        }, {
          x: 0,
          opacity: 1,
          stagger: 0.06,
          duration: 0.5,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: cat,
            start: 'top 70%',
            toggleActions: 'play none none none',
          },
        })
      })

      // Divider lines grow
      gsap.fromTo('[data-menu-divider]', {
        scaleX: 0,
      }, {
        scaleX: 1,
        stagger: 0.1,
        duration: 0.8,
        ease: 'power3.inOut',
        scrollTrigger: {
          trigger: '[data-menu-categories]',
          start: 'top 70%',
          toggleActions: 'play none none none',
        },
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [style])

  const menuTitle = style === 'luxury' ? 'Il Menu' : style === 'exotic' ? 'Menu' : 'Il nostro menu'

  return (
    <section
      ref={sectionRef}
      id="menu"
      style={{
        background: t.colors.bg,
        padding: 'clamp(6rem, 14vh, 12rem) clamp(1.5rem, 6vw, 7rem)',
      }}
    >
      <div style={{ maxWidth: 850, margin: '0 auto' }}>
        {/* Section title with char split */}
        <div data-menu-title style={{ textAlign: 'center', marginBottom: 'clamp(4rem, 8vh, 7rem)' }}>
          {style !== 'modern' && (
            <div style={{ width: 40, height: 1, background: 'var(--color-accent)', margin: '0 auto 1.5rem' }} />
          )}
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: style === 'modern' ? 'clamp(2.8rem, 6vw, 5rem)' : 'clamp(2.2rem, 5vw, 4rem)',
              fontWeight: style === 'modern' ? '900' : '300',
              color: t.colors.fg,
              letterSpacing: style === 'modern' ? t.letterSpacing.tight : t.letterSpacing.wide,
              textTransform: style === 'luxury' ? 'uppercase' : 'none',
              lineHeight: 1.05,
            }}
          >
            {menuTitle.split('').map((char, i) => (
              <span key={i} style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom' }}>
                <span data-menu-char style={{ display: 'inline-block', transform: 'translateY(110%)', opacity: 0 }}>
                  {char === ' ' ? ' ' : char}
                </span>
              </span>
            ))}
          </h2>
        </div>

        {/* Categories */}
        <div data-menu-categories style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(3rem, 6vh, 5rem)' }}>
          {categories.map((cat) => (
            <div
              key={cat.id}
              data-menu-category
              style={{ opacity: 0, transform: 'translateY(60px)' }}
            >
              {/* Category header */}
              <div style={{ marginBottom: '2rem' }}>
                <h3
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: style === 'modern' ? 'clamp(1.6rem, 3vw, 2.2rem)' : 'clamp(1.4rem, 2.5vw, 1.8rem)',
                    fontWeight: style === 'modern' ? '800' : '300',
                    color: t.colors.fg,
                    letterSpacing: style === 'modern' ? t.letterSpacing.tight : t.letterSpacing.wide,
                    textTransform: style === 'luxury' ? 'uppercase' : 'none',
                    marginBottom: cat.description ? '0.5rem' : '0',
                  }}
                >
                  {cat.name}
                </h3>
                {cat.description && (
                  <p style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.78rem',
                    color: t.colors.fgMuted,
                    letterSpacing: '0.02em',
                  }}>
                    {cat.description}
                  </p>
                )}
              </div>

              {/* Items */}
              {cat.items.filter(i => i.available).map((item, idx) => (
                <div key={item.id}>
                  <div
                    data-menu-item
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '1.25rem',
                      padding: '1.2rem 0',
                      opacity: 0,
                      transform: 'translateX(-20px)',
                    }}
                  >
                    {item.photo_url && (
                      <div style={{
                        width: 72,
                        height: 72,
                        borderRadius: style === 'modern' ? '12px' : '4px',
                        overflow: 'hidden',
                        position: 'relative',
                        flexShrink: 0,
                      }}>
                        <Image src={item.photo_url} alt={item.name} fill className="object-cover" sizes="72px" />
                      </div>
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem' }}>
                        <h4 style={{
                          fontFamily: 'var(--font-heading)',
                          fontSize: '0.95rem',
                          fontWeight: style === 'modern' ? '700' : '400',
                          color: t.colors.fg,
                          letterSpacing: style === 'luxury' ? '0.08em' : '0.01em',
                        }}>
                          {item.name}
                        </h4>
                        {/* Dotted line between name and price */}
                        <div style={{
                          flex: 1,
                          borderBottom: `1px dotted ${style === 'modern' ? 'rgba(250,242,232,0.15)' : 'rgba(255,255,255,0.12)'}`,
                          minWidth: '2rem',
                          alignSelf: 'center',
                          marginBottom: '0.2rem',
                        }} />
                        <span style={{
                          fontFamily: 'var(--font-heading)',
                          fontSize: '1rem',
                          fontWeight: style === 'modern' ? '700' : '300',
                          color: 'var(--color-accent)',
                          whiteSpace: 'nowrap',
                        }}>
                          €{item.price % 1 === 0 ? item.price : item.price.toFixed(2)}
                        </span>
                      </div>
                      {item.description && (
                        <p style={{
                          fontFamily: 'var(--font-body)',
                          fontSize: '0.72rem',
                          color: t.colors.fgMuted,
                          lineHeight: 1.7,
                          marginTop: '0.3rem',
                        }}>
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Divider between items */}
                  {idx < cat.items.filter(i => i.available).length - 1 && (
                    <div
                      data-menu-divider
                      style={{
                        height: '1px',
                        background: style === 'modern' ? 'rgba(250,242,232,0.08)' : 'rgba(255,255,255,0.06)',
                        transformOrigin: 'left',
                        transform: 'scaleX(0)',
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
