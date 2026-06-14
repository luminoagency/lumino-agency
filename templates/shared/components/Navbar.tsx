'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { getThemeTokens } from '@/templates/styles'
import type { SiteStyle } from '@/templates/shared/types/restaurant'

interface NavbarProps {
  restaurantName: string
  style: SiteStyle
  links?: { label: string; href: string }[]
  logoUrl?: string
}

const DEFAULT_LINKS = [
  { label: 'Menu', href: '#menu' },
  { label: 'Chi siamo', href: '#about' },
  { label: 'Galleria', href: '#gallery' },
  { label: 'Contatti', href: '#contact' },
]

export function Navbar({ restaurantName, style, links = DEFAULT_LINKS, logoUrl }: NavbarProps) {
  const t = getThemeTokens(style)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const textColor = '#FAF2E8'

  const bgSolid =
    style === 'modern'
      ? 'rgba(26,18,16,0.85)'
      : style === 'exotic'
        ? 'rgba(13,8,22,0.8)'
        : 'rgba(10,10,10,0.8)'

  return (
    <nav
      style={{
        position: 'fixed',
        top: scrolled ? 12 : 0,
        left: scrolled ? 20 : 0,
        right: scrolled ? 20 : 0,
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `0 ${scrolled ? 'clamp(1.2rem, 3vw, 2.5rem)' : 'clamp(1.5rem, 5vw, 4rem)'}`,
        height: scrolled ? 54 : 72,
        background: scrolled ? bgSolid : 'transparent',
        backdropFilter: scrolled ? 'blur(16px) saturate(1.6)' : 'none',
        borderRadius: scrolled ? (style === 'modern' ? '16px' : '4px') : '0',
        border: scrolled
          ? `1px solid rgba(255,255,255,0.06)`
          : 'none',
        transition: 'all 0.5s cubic-bezier(0.25,0.1,0.25,1)',
      }}
    >
      <a
        href="#"
        style={{
          display: 'flex',
          alignItems: 'center',
          textDecoration: 'none',
          transition: 'opacity 0.3s',
        }}
      >
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={restaurantName}
            width={scrolled ? 100 : 120}
            height={scrolled ? 32 : 40}
            style={{ objectFit: 'contain', transition: 'all 0.5s' }}
          />
        ) : (
          <span style={{
            fontFamily: 'var(--font-heading)',
            fontSize: style === 'modern' ? '1rem' : '1.15rem',
            fontWeight: style === 'modern' ? '800' : '300',
            letterSpacing: style === 'modern' ? t.letterSpacing.tight : t.letterSpacing.wide,
            color: textColor,
            textTransform: style === 'luxury' ? 'uppercase' : 'none',
          }}>
            {restaurantName}
          </span>
        )}
      </a>

      <div style={{ display: 'flex', alignItems: 'center', gap: style === 'modern' ? '1.8rem' : '2.2rem' }}>
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.62rem',
              fontWeight: style === 'modern' ? '600' : '400',
              letterSpacing: style === 'modern' ? '0.06em' : '0.18em',
              textTransform: 'uppercase',
              color: textColor,
              opacity: 0.7,
              textDecoration: 'none',
              transition: 'all 0.3s',
              position: 'relative',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1'
              e.currentTarget.style.color = 'var(--color-accent)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.7'
              e.currentTarget.style.color = textColor
            }}
          >
            {link.label}
          </a>
        ))}
      </div>
    </nav>
  )
}
