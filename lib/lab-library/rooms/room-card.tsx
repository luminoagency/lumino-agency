'use client';

import React from 'react';
import * as Icons from 'lucide-react';
import { Users, Maximize, ExternalLink, Check } from 'lucide-react';

/**
 * RoomCard — card per UNA camera d'hotel (COLLECTION: usata con .map()).
 * Props per item: name (required), description?, mainImage?, gallery?, size?, maxGuests?,
 * features?, amenities?, pricePerNight?, pricePeriod?, bookingUrl?, featured?, layout?, tone?, palette?.
 */

type Palette = { bg: string; ink: string; accent: string; muted: string };
type Img = { src: string; alt: string };
type Amenity = { icon?: string; label: string };

export interface RoomCardProps {
  name: string;
  description?: string;
  mainImage?: Img;
  gallery?: Img[];
  size?: string;
  maxGuests?: number;
  features?: string[];
  amenities?: Amenity[];
  pricePerNight?: number;
  pricePeriod?: string;
  bookingUrl?: string;
  featured?: boolean;
  layout?: 'card' | 'horizontal' | 'minimal';
  tone?: 'modern' | 'classic' | 'editorial' | 'playful';
  palette?: Palette;
  className?: string;
}

const cx = (...a: Array<string | false | undefined>) => a.filter(Boolean).join(' ');
const euro = (n: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
function paletteVars(p?: Palette): React.CSSProperties {
  return p ? ({ '--lumino-bg': p.bg, '--lumino-ink': p.ink, '--lumino-accent': p.accent, '--lumino-muted': p.muted } as React.CSSProperties) : {};
}
function iconFor(name?: string): React.ComponentType<{ className?: string }> {
  if (!name) return Icons.Dot;
  return ((Icons as any)[name] as React.ComponentType<{ className?: string }>) || Icons.Dot;
}

function Badge() {
  return <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold" style={{ background: 'var(--lumino-accent, #8b5cf6)', color: '#fff' }}>Più richiesta</span>;
}

function Meta({ size, maxGuests }: { size?: string; maxGuests?: number }) {
  return (
    <div className="flex items-center gap-4 text-sm" style={{ opacity: 0.7 }}>
      {size && <span className="flex items-center gap-1"><Maximize className="h-4 w-4" /> {size}</span>}
      {typeof maxGuests === 'number' && <span className="flex items-center gap-1"><Users className="h-4 w-4" /> fino a {maxGuests} ospiti</span>}
    </div>
  );
}

function Price({ pricePerNight, pricePeriod }: { pricePerNight?: number; pricePeriod?: string }) {
  if (typeof pricePerNight !== 'number') return null;
  return (
    <div className="flex items-baseline gap-1">
      <span className="text-2xl font-bold">{euro(pricePerNight)}</span>
      <span className="text-xs" style={{ opacity: 0.6 }}>{pricePeriod || '/notte'}</span>
    </div>
  );
}

function BookCta({ url }: { url?: string }) {
  return (
    <a href={url || '#'} target={url ? '_blank' : undefined} rel={url ? 'noopener noreferrer' : undefined}
      className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: 'var(--lumino-accent, #8b5cf6)', color: '#fff' }}>
      Prenota su Booking <ExternalLink className="h-4 w-4" />
    </a>
  );
}

function Chips({ features }: { features?: string[] }) {
  if (!features || !features.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {features.map((f, i) => (
        <span key={i} className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px]" style={{ background: 'var(--lumino-muted, #f5f5f5)' }}>
          <Check className="h-3 w-3" style={{ color: 'var(--lumino-accent, #8b5cf6)' }} /> {f}
        </span>
      ))}
    </div>
  );
}

function Amenities({ amenities }: { amenities?: Amenity[] }) {
  if (!amenities || !amenities.length) return null;
  return (
    <div className="flex flex-wrap gap-3 text-xs" style={{ opacity: 0.7 }}>
      {amenities.map((a, i) => {
        const Ico = iconFor(a.icon);
        return <span key={i} className="flex items-center gap-1"><Ico className="h-3.5 w-3.5" /> {a.label}</span>;
      })}
    </div>
  );
}

export function RoomCard(props: RoomCardProps) {
  const { name, description, mainImage, size, maxGuests, features, amenities, pricePerNight, pricePeriod, bookingUrl, featured, layout = 'card', tone = 'modern', palette, className } = props;
  const serif = tone === 'classic' || tone === 'editorial';
  const nameCls = cx('font-semibold leading-snug break-words', serif && 'font-serif');
  const rootStyle: React.CSSProperties = {
    ...paletteVars(palette), background: 'var(--lumino-bg, #ffffff)', color: 'var(--lumino-ink, #1a1a1a)',
    borderColor: featured ? 'var(--lumino-accent, #8b5cf6)' : 'var(--lumino-muted, #e5e5e5)',
  };

  if (layout === 'minimal') {
    return (
      <div className={cx('w-full border-b py-4', className)} style={{ ...paletteVars(palette), color: 'var(--lumino-ink, #1a1a1a)', borderColor: 'var(--lumino-muted, #e5e5e5)' }}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2"><h3 className={cx(nameCls, 'text-lg')}>{name}</h3>{featured && <Badge />}</div>
          <Price pricePerNight={pricePerNight} pricePeriod={pricePeriod} />
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <Chips features={features} />
          <BookCta url={bookingUrl} />
        </div>
      </div>
    );
  }

  if (layout === 'horizontal') {
    return (
      <article className={cx('flex w-full flex-col overflow-hidden rounded-2xl border sm:flex-row', className)} style={{ ...rootStyle, borderWidth: featured ? 2 : 1 }}>
        <div className="relative sm:w-2/5">
          {mainImage?.src
            ? <a href="#" className="block h-full"><img src={mainImage.src} alt={mainImage.alt} className="h-48 w-full object-cover sm:h-full" /></a>
            : <div className="h-48 w-full sm:h-full" style={{ background: 'var(--lumino-muted, #f5f5f5)' }} aria-hidden="true" />}
          {featured && <div className="absolute left-3 top-3"><Badge /></div>}
        </div>
        <div className="flex flex-1 flex-col gap-3 p-5 sm:w-3/5">
          <div className="flex items-start justify-between gap-2"><h3 className={cx(nameCls, 'text-xl')}>{name}</h3></div>
          <Meta size={size} maxGuests={maxGuests} />
          {description && <p className="text-sm" style={{ opacity: 0.7 }}>{description}</p>}
          <Chips features={features} />
          <Amenities amenities={amenities} />
          <div className="mt-auto flex items-end justify-between gap-3 pt-2"><Price pricePerNight={pricePerNight} pricePeriod={pricePeriod} /><BookCta url={bookingUrl} /></div>
        </div>
      </article>
    );
  }

  // CARD (default)
  return (
    <article className={cx('flex w-full flex-col overflow-hidden rounded-2xl border transition-shadow hover:shadow-md', className)} style={{ ...rootStyle, borderWidth: featured ? 2 : 1 }}>
      <div className="relative">
        {mainImage?.src
          ? <a href="#" className="block"><img src={mainImage.src} alt={mainImage.alt} className="aspect-[4/3] w-full object-cover transition-transform duration-500 hover:scale-105" /></a>
          : <div className="aspect-[4/3] w-full" style={{ background: 'var(--lumino-muted, #f5f5f5)' }} aria-hidden="true" />}
        {featured && <div className="absolute left-3 top-3"><Badge /></div>}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div><h3 className={cx(nameCls, 'text-xl')}>{name}</h3><div className="mt-1"><Meta size={size} maxGuests={maxGuests} /></div></div>
        {description && <p className="text-sm" style={{ opacity: 0.7 }}>{description}</p>}
        <Chips features={features} />
        <Amenities amenities={amenities} />
        <div className="mt-auto flex items-end justify-between gap-3 pt-2"><Price pricePerNight={pricePerNight} pricePeriod={pricePeriod} /><BookCta url={bookingUrl} /></div>
      </div>
    </article>
  );
}

export default RoomCard;
