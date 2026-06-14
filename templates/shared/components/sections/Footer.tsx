'use client'

import Image from 'next/image'
import { getThemeTokens } from '@/templates/styles'
import type { SiteContentRow, SiteStyle } from '@/templates/shared/types/restaurant'

interface FooterProps {
  content: SiteContentRow
  style: SiteStyle
  logoUrl?: string
}

export function Footer({ content, style, logoUrl }: FooterProps) {
  const t = getThemeTokens(style)

  const bg = style === 'modern' ? '#120e0c' : style === 'exotic' ? '#080412' : '#050505'
  const fg = 'rgba(255,255,255,0.5)'

  const socials = content.social_links
  const socialEntries = Object.entries(socials).filter(([, url]) => url)

  return (
    <footer
      style={{
        background: bg,
        padding: 'clamp(3rem, 6vh, 5rem) clamp(1.5rem, 6vw, 7rem)',
        borderTop: `1px solid rgba(255,255,255,0.06)`,
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Top row: name + socials */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={content.restaurant_name}
              width={100}
              height={32}
              style={{ objectFit: 'contain' }}
            />
          ) : (
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: style === 'modern' ? '1rem' : '1.1rem',
                fontWeight: style === 'modern' ? '800' : '300',
                color: '#ffffff',
                letterSpacing: style === 'luxury' ? '0.15em' : style === 'exotic' ? '0.1em' : '-0.02em',
                textTransform: style === 'luxury' ? 'uppercase' : 'none',
              }}
            >
              {content.restaurant_name}
            </span>
          )}

          {socialEntries.length > 0 && (
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              {socialEntries.map(([platform, url]) => (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.6rem',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: fg,
                    textDecoration: 'none',
                    transition: 'color 0.3s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-accent)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = fg }}
                >
                  {platform}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: '1.5rem' }} />

        {/* Bottom row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.6rem', color: fg }}>
            {content.address}
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)' }}>
            © {new Date().getFullYear()} {content.restaurant_name}
          </p>
        </div>
      </div>
    </footer>
  )
}
