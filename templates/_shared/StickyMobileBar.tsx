'use client'

/**
 * Sticky bottom bar that appears on mobile (<768px) once the user has scrolled past the hero.
 * Three actions: Call, Reserve (anchor scroll), Map (Google Maps).
 *
 * Themeable via `theme` prop:
 * - 'dark' = white text on accent, used in Cinematico/Aurora/Panoramico
 * - 'light' = ink text on paper, used in Mercato/Bento
 *
 * Optionally accepts a `whatsapp` number to add a 4th button (replaces nothing — adds).
 */

import { useEffect, useState } from 'react'

interface StickyMobileBarProps {
  phone?: string
  address?: string
  hasReservation?: boolean
  whatsapp?: string
  accent: string
  theme?: 'dark' | 'light'
  scope?: string  // unique scope to avoid CSS class collisions across templates
}

export function StickyMobileBar({
  phone,
  address,
  hasReservation = false,
  whatsapp,
  accent,
  theme = 'dark',
  scope = 'smb',
}: StickyMobileBarProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      raf = requestAnimationFrame(() => {
        // Show once user is past 60% of viewport height (clear of hero)
        setVisible(window.scrollY > window.innerHeight * 0.6)
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  const bg = theme === 'dark' ? '#0b0b0b' : '#ffffff'
  const fg = theme === 'dark' ? '#ffffff' : '#1a1a1a'
  const border = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const mapsUrl = address ? `https://maps.google.com/?q=${encodeURIComponent(address)}` : null

  return (
    <>
      <div
        className={`${scope}-mobile-bar ${visible ? `${scope}-visible` : ''}`}
        role="navigation"
        aria-label="Azioni rapide"
      >
        {phone && (
          <a href={`tel:${phone}`} className={`${scope}-mb-btn`} aria-label="Chiama">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            <span>Chiama</span>
          </a>
        )}
        {hasReservation && (
          <a href="#prenotazioni" className={`${scope}-mb-btn ${scope}-mb-primary`} aria-label="Prenota">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
              <circle cx="12" cy="15" r="2" fill="currentColor"/>
            </svg>
            <span>Prenota</span>
          </a>
        )}
        {mapsUrl && (
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={`${scope}-mb-btn`} aria-label="Indicazioni">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <span>Naviga</span>
          </a>
        )}
        {whatsapp && (
          <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className={`${scope}-mb-btn ${scope}-mb-wa`} aria-label="WhatsApp">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2z"/>
            </svg>
            <span>WhatsApp</span>
          </a>
        )}
      </div>
      <style>{`
        .${scope}-mobile-bar {
          position: fixed;
          left: 12px;
          right: 12px;
          bottom: 12px;
          z-index: 999;
          display: none;
          gap: 6px;
          padding: 6px;
          background: ${bg};
          border: 1px solid ${border};
          border-radius: 999px;
          box-shadow: 0 8px 28px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.08);
          backdrop-filter: blur(16px);
          opacity: 0;
          transform: translateY(120%);
          transition: opacity 0.5s cubic-bezier(0.22, 1, 0.36, 1), transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .${scope}-mobile-bar.${scope}-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .${scope}-mb-btn {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          padding: 9px 6px;
          border-radius: 999px;
          color: ${fg};
          text-decoration: none;
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.02em;
          transition: background 0.25s, color 0.25s, transform 0.25s;
          min-width: 0;
        }
        .${scope}-mb-btn:active {
          transform: scale(0.95);
        }
        .${scope}-mb-btn span {
          font-size: 0.65rem;
          opacity: 0.85;
        }
        .${scope}-mb-primary {
          background: ${accent};
          color: ${theme === 'dark' ? '#0a0a0a' : '#ffffff'};
        }
        .${scope}-mb-primary span { opacity: 1; }
        .${scope}-mb-wa {
          background: #25d366;
          color: #ffffff;
        }
        @media (max-width: 768px) {
          .${scope}-mobile-bar { display: flex; }
          /* Add bottom padding to page so content doesn't get trapped under the bar */
          body { padding-bottom: 84px; }
        }
        @media (max-width: 380px) {
          .${scope}-mb-btn { font-size: 0.65rem; padding: 7px 4px; }
          .${scope}-mb-btn span { font-size: 0.6rem; }
        }
      `}</style>
    </>
  )
}
