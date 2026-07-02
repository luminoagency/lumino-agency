'use client';

import React from 'react';
import { BookMarked, ExternalLink, Phone, Mail } from 'lucide-react';

/**
 * BookingLinks — CTA verso portali di prenotazione esterni (Booking, Expedia, ...).
 * Alternativa a booking/calendar quando l'hotel non gestisce prenotazioni dirette.
 * Props: title?, description?, platforms (required), phone?, email?, layout?, size?, tone?, palette?.
 */

type Palette = { bg: string; ink: string; accent: string; muted: string };
type PlatformName = 'booking' | 'expedia' | 'trivago' | 'hotels' | 'airbnb' | 'tripadvisor' | 'direct' | 'custom';
type Platform = { name: PlatformName; url: string; label?: string; badge?: string; highlight?: boolean };

export interface BookingLinksProps {
  title?: string;
  description?: string;
  platforms: Platform[];
  phone?: string;
  email?: string;
  layout?: 'grid' | 'horizontal' | 'stacked' | 'featured';
  size?: 'compact' | 'normal' | 'spacious';
  tone?: 'modern' | 'classic' | 'editorial' | 'playful';
  palette?: Palette;
  className?: string;
}

const cx = (...a: Array<string | false | undefined>) => a.filter(Boolean).join(' ');
function paletteVars(p?: Palette): React.CSSProperties {
  return p ? ({ '--lumino-bg': p.bg, '--lumino-ink': p.ink, '--lumino-accent': p.accent, '--lumino-muted': p.muted } as React.CSSProperties) : {};
}

const DEFAULT_LABELS: Record<PlatformName, string> = {
  booking: 'Prenota su Booking.com',
  expedia: 'Prenota su Expedia',
  trivago: 'Confronta su Trivago',
  hotels: 'Prenota su Hotels.com',
  airbnb: 'Prenota su Airbnb',
  tripadvisor: 'Vedi su Tripadvisor',
  direct: 'Prenota sul nostro sito',
  custom: 'Prenota ora',
};

function PlatformButton({ p, big }: { p: Platform; big?: boolean }) {
  const label = p.label || DEFAULT_LABELS[p.name];
  const highlight = p.highlight || big;
  return (
    <a
      href={p.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cx(
        'group relative flex items-center justify-between gap-3 rounded-xl border transition-transform hover:-translate-y-0.5',
        big ? 'p-6 text-lg' : 'p-4 text-sm',
      )}
      style={{
        background: highlight ? 'var(--lumino-accent, #8b5cf6)' : 'var(--lumino-bg, #ffffff)',
        color: highlight ? '#ffffff' : 'var(--lumino-ink, #1a1a1a)',
        borderColor: highlight ? 'transparent' : 'var(--lumino-muted, #e5e5e5)',
      }}
    >
      <span className="flex items-center gap-2 font-semibold">
        <BookMarked className={big ? 'h-6 w-6' : 'h-4 w-4'} />
        {label}
      </span>
      <ExternalLink className={cx('shrink-0 opacity-70', big ? 'h-5 w-5' : 'h-4 w-4')} />
      {p.badge && (
        <span
          className="absolute -top-2 left-4 rounded-full px-2 py-0.5 text-[10px] font-semibold"
          style={{ background: highlight ? '#ffffff' : 'var(--lumino-accent, #8b5cf6)', color: highlight ? 'var(--lumino-accent, #8b5cf6)' : '#ffffff' }}
        >
          {p.badge}
        </span>
      )}
    </a>
  );
}

export function BookingLinks({
  title = 'Prenota il tuo soggiorno',
  description,
  platforms,
  phone,
  email,
  layout = 'grid',
  size = 'normal',
  tone = 'modern',
  palette,
  className,
}: BookingLinksProps) {
  const list = platforms || [];
  const serif = tone === 'classic' || tone === 'editorial';
  const pad = size === 'compact' ? 'py-10' : size === 'spacious' ? 'py-24' : 'py-16';
  const rootStyle: React.CSSProperties = { ...paletteVars(palette), background: 'var(--lumino-bg, #ffffff)', color: 'var(--lumino-ink, #1a1a1a)' };

  const featured = list.find(p => p.highlight) || list[0];
  const rest = layout === 'featured' ? list.filter(p => p !== featured) : list;

  const gridCls =
    layout === 'horizontal' ? 'flex flex-wrap justify-center gap-4'
    : layout === 'stacked' ? 'mx-auto flex max-w-xl flex-col gap-3'
    : 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <section className={cx('w-full px-4 sm:px-6', pad, className)} style={rootStyle}>
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <h2 className={cx('text-3xl md:text-4xl font-bold tracking-tight', serif && 'font-serif')}>{title}</h2>
          {description && <p className="mx-auto mt-3 max-w-2xl text-base" style={{ opacity: 0.7 }}>{description}</p>}
        </div>

        {layout === 'featured' && featured ? (
          <div className="space-y-4">
            <PlatformButton p={featured} big />
            {rest.length > 0 && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{rest.map((p, i) => <PlatformButton key={i} p={p} />)}</div>}
          </div>
        ) : (
          <div className={gridCls}>
            {list.map((p, i) => <PlatformButton key={i} p={p} />)}
          </div>
        )}

        {(phone || email) && (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm">
            {phone && (
              <a href={`tel:${phone.replace(/\s/g, '')}`} className="flex items-center gap-2 rounded-full border px-4 py-2 transition-colors hover:bg-[var(--lumino-muted,#f5f5f5)]" style={{ borderColor: 'var(--lumino-muted, #e5e5e5)' }}>
                <Phone className="h-4 w-4" /> {phone}
              </a>
            )}
            {email && (
              <a href={`mailto:${email}`} className="flex items-center gap-2 rounded-full border px-4 py-2 transition-colors hover:bg-[var(--lumino-muted,#f5f5f5)]" style={{ borderColor: 'var(--lumino-muted, #e5e5e5)' }}>
                <Mail className="h-4 w-4" /> {email}
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default BookingLinks;
