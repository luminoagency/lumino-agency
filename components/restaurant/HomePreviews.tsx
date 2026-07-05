'use client'

import { pageHref, type SitePages } from '@/lib/sites/pages'
import type { Locale } from '@/lib/sites/i18n'

/**
 * Anteprime sintetiche della Home multi-pagina (Pro/Premium): Menu (3 piatti),
 * Chi siamo (estratto), Eventi (2), Gallery (4 foto), Contatti brevi — ognuna
 * con un link "Vedi tutto →" alla pagina dedicata. Ogni blocco appare SOLO se
 * la pagina è attiva in `pages`.
 *
 * Componente condiviso dai 5 template (l'hero e il resto restano template-
 * specifici); si adatta al tema con `accentColor` + `theme` (dark/light).
 */

type MenuItem = { name: string; description?: string; price?: number }
type MenuCategory = { name: string; items?: MenuItem[] }
type EventItem = { title: string; date?: string; description?: string; image?: string }
type GalleryItem = { url: string; alt?: string } | string

type Props = {
  slug: string
  locale: Locale
  accentColor: string
  theme?: 'dark' | 'light'
  pages: SitePages
  menuCategories?: MenuCategory[]
  aboutTitle?: string
  aboutText?: string
  events?: EventItem[]
  galleryImages?: GalleryItem[]
  address?: string
  hours?: Record<string, { open?: string; close?: string; closed?: boolean }>
}

const L = {
  it: { seeMenu: 'Vedi tutto il menu', seeStory: 'La nostra storia', seeEvents: 'Tutti gli eventi', seeGallery: 'Galleria completa', seeContact: 'Contatti e prenotazioni', menu: 'Menu', about: 'Chi siamo', events: 'Eventi', gallery: 'Gallery', where: 'Dove siamo' },
  en: { seeMenu: 'See the full menu', seeStory: 'Our story', seeEvents: 'All events', seeGallery: 'Full gallery', seeContact: 'Contact & bookings', menu: 'Menu', about: 'About', events: 'Events', gallery: 'Gallery', where: 'Where we are' },
}

function galleryUrl(g: GalleryItem): string {
  return typeof g === 'string' ? g : g.url
}

export default function HomePreviews(props: Props) {
  const { slug, locale, accentColor, theme = 'dark', pages } = props
  const t = L[locale]
  const dark = theme === 'dark'
  const fg = dark ? '#fff' : '#1a1a1a'
  const muted = dark ? 'rgba(255,255,255,0.62)' : 'rgba(0,0,0,0.6)'
  const border = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
  const cardBg = dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'

  const firstCat = props.menuCategories?.find(c => (c.items?.length ?? 0) > 0)
  const menuItems = (firstCat?.items ?? []).slice(0, 3)
  const events = (props.events ?? []).slice(0, 2)
  const gallery = (props.galleryImages ?? []).slice(0, 4)
  const aboutExcerpt = (props.aboutText ?? '').trim().slice(0, 220)

  const link = (label: string, key: Parameters<typeof pageHref>[1]) => (
    <a href={pageHref(slug, key)} style={{ display: 'inline-block', marginTop: 16, fontSize: 13, fontWeight: 600, letterSpacing: '0.04em', color: accentColor, textDecoration: 'none' }}>
      {label} →
    </a>
  )

  const heading = (text: string) => (
    <h2 style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(1.6rem, 4vw, 2.3rem)', margin: '0 0 20px', color: fg, letterSpacing: '-0.01em' }}>{text}</h2>
  )

  const show = {
    menu: pages.menu?.enabled && menuItems.length > 0,
    about: pages.chiSiamo?.enabled && aboutExcerpt.length > 0,
    events: pages.eventi?.enabled && events.length > 0,
    gallery: pages.gallery?.enabled && gallery.length > 0,
    contact: pages.contatti?.enabled && !!props.address,
  }

  const sectionStyle: React.CSSProperties = { maxWidth: 1080, margin: '0 auto', padding: 'clamp(3rem, 8vh, 5.5rem) 22px', borderTop: `1px solid ${border}` }

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: fg }}>
      {/* Menu preview */}
      {show.menu && (
        <section style={sectionStyle} aria-label={pages.menu.label}>
          {heading(pages.menu.label || t.menu)}
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 14 }}>
            {menuItems.map((it, i) => (
              <li key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, paddingBottom: 12, borderBottom: `1px solid ${border}` }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{it.name}</div>
                  {it.description && <div style={{ fontSize: 13, color: muted, marginTop: 3, lineHeight: 1.5 }}>{it.description}</div>}
                </div>
                {typeof it.price === 'number' && <div style={{ fontWeight: 600, fontSize: 15, whiteSpace: 'nowrap' }}>€{it.price}</div>}
              </li>
            ))}
          </ul>
          {link(t.seeMenu, 'menu')}
        </section>
      )}

      {/* Chi siamo preview */}
      {show.about && (
        <section style={sectionStyle} aria-label={pages.chiSiamo.label}>
          {heading(props.aboutTitle || pages.chiSiamo.label || t.about)}
          <p style={{ fontSize: 15.5, lineHeight: 1.75, color: muted, maxWidth: 640, margin: 0 }}>
            {aboutExcerpt}{(props.aboutText ?? '').length > 220 ? '…' : ''}
          </p>
          {link(t.seeStory, 'chiSiamo')}
        </section>
      )}

      {/* Eventi preview */}
      {show.events && (
        <section style={sectionStyle} aria-label={pages.eventi.label}>
          {heading(pages.eventi.label || t.events)}
          <div style={{ display: 'grid', gap: 14 }}>
            {events.map((e, i) => (
              <div key={i} style={{ padding: '14px 16px', background: cardBg, border: `1px solid ${border}`, borderRadius: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{e.title}</div>
                {e.date && <div style={{ fontSize: 12.5, color: accentColor, marginTop: 3 }}>{e.date}</div>}
                {e.description && <div style={{ fontSize: 13, color: muted, marginTop: 5, lineHeight: 1.5 }}>{e.description}</div>}
              </div>
            ))}
          </div>
          {link(t.seeEvents, 'eventi')}
        </section>
      )}

      {/* Gallery preview */}
      {show.gallery && (
        <section style={sectionStyle} aria-label={pages.gallery.label}>
          {heading(pages.gallery.label || t.gallery)}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
            {gallery.map((g, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={galleryUrl(g)} alt={typeof g === 'string' ? '' : (g.alt || '')} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 10, display: 'block' }} />
            ))}
          </div>
          {link(t.seeGallery, 'gallery')}
        </section>
      )}

      {/* Contatti brevi */}
      {show.contact && (
        <section style={sectionStyle} aria-label={pages.contatti.label}>
          {heading(t.where)}
          <p style={{ fontSize: 15, lineHeight: 1.7, color: muted, margin: 0 }}>{props.address}</p>
          {link(t.seeContact, 'contatti')}
        </section>
      )}
    </div>
  )
}
