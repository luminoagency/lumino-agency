'use client';

import React from 'react';
import * as Icons from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * HotelAmenities — griglia servizi/amenities dell'hotel (spa, ristorante, parking, wifi, ...).
 * Props: title?, description?, amenities (required), layout?, columns?, size?, tone?, palette?.
 */

type Palette = { bg: string; ink: string; accent: string; muted: string };
type Amenity = { name: string; description?: string; icon?: string; image?: { src: string; alt: string } };

export interface HotelAmenitiesProps {
  title?: string;
  description?: string;
  amenities: Amenity[];
  layout?: 'grid' | 'list' | 'showcase';
  columns?: 2 | 3 | 4;
  size?: 'compact' | 'normal' | 'spacious';
  tone?: 'modern' | 'classic' | 'editorial' | 'playful';
  palette?: Palette;
  className?: string;
}

const cx = (...a: Array<string | false | undefined>) => a.filter(Boolean).join(' ');
function paletteVars(p?: Palette): React.CSSProperties {
  return p ? ({ '--lumino-bg': p.bg, '--lumino-ink': p.ink, '--lumino-accent': p.accent, '--lumino-muted': p.muted } as React.CSSProperties) : {};
}
function iconFor(name?: string): React.ComponentType<{ className?: string; style?: React.CSSProperties }> {
  const fallback = Icons.Sparkles as React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  if (!name) return fallback;
  return ((Icons as any)[name] as React.ComponentType<{ className?: string; style?: React.CSSProperties }>) || fallback;
}

export function HotelAmenities({
  title = 'I nostri servizi',
  description,
  amenities,
  layout = 'grid',
  columns = 3,
  size = 'normal',
  tone = 'modern',
  palette,
  className,
}: HotelAmenitiesProps) {
  const list = amenities || [];
  const serif = tone === 'classic' || tone === 'editorial';
  const pad = size === 'compact' ? 'py-10' : size === 'spacious' ? 'py-24' : 'py-16';
  const colsCls = columns === 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : columns === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3';
  const rootStyle: React.CSSProperties = { ...paletteVars(palette), background: 'var(--lumino-bg, #ffffff)', color: 'var(--lumino-ink, #1a1a1a)' };

  return (
    <section className={cx('w-full px-4 sm:px-6', pad, className)} style={rootStyle}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <h2 className={cx('text-3xl md:text-4xl font-bold tracking-tight', serif && 'font-serif')}>{title}</h2>
          {description && <p className="mx-auto mt-3 max-w-2xl text-base" style={{ opacity: 0.7 }}>{description}</p>}
        </div>

        {layout === 'showcase' ? (
          <div className="grid gap-6 sm:grid-cols-2">
            {list.map((a, i) => {
              const Ico = iconFor(a.icon);
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.4, delay: Math.min(i * 0.06, 0.4) }}
                  className="overflow-hidden rounded-2xl border" style={{ borderColor: 'var(--lumino-muted, #e5e5e5)' }}>
                  {a.image?.src
                    ? <img src={a.image.src} alt={a.image.alt} className="aspect-[16/9] w-full object-cover" />
                    : <div className="aspect-[16/9] w-full" style={{ background: 'linear-gradient(135deg, var(--lumino-accent, #8b5cf6), var(--lumino-muted, #f5f5f5))' }} aria-hidden="true" />}
                  <div className="p-5">
                    <h3 className={cx('flex items-center gap-2 text-xl font-semibold', serif && 'font-serif')}><Ico className="h-5 w-5" style={{ color: 'var(--lumino-accent, #8b5cf6)' }} />{a.name}</h3>
                    {a.description && <p className="mt-2 text-sm" style={{ opacity: 0.7 }}>{a.description}</p>}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : layout === 'list' ? (
          <div className="mx-auto max-w-3xl divide-y" style={{ borderColor: 'var(--lumino-muted, #e5e5e5)' }}>
            {list.map((a, i) => {
              const Ico = iconFor(a.icon);
              return (
                <div key={i} className="flex items-start gap-4 py-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full" style={{ background: 'var(--lumino-muted, #f5f5f5)' }}><Ico className="h-5 w-5" style={{ color: 'var(--lumino-accent, #8b5cf6)' }} /></span>
                  <div>
                    <h3 className="font-semibold">{a.name}</h3>
                    {a.description && <p className="mt-0.5 text-sm" style={{ opacity: 0.7 }}>{a.description}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={cx('grid gap-6', colsCls)}>
            {list.map((a, i) => {
              const Ico = iconFor(a.icon);
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.4) }}
                  className="rounded-2xl border p-6 text-center" style={{ borderColor: 'var(--lumino-muted, #e5e5e5)' }}>
                  <span className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full" style={{ background: 'var(--lumino-muted, #f5f5f5)' }}><Ico className="h-7 w-7" style={{ color: 'var(--lumino-accent, #8b5cf6)' }} /></span>
                  <h3 className={cx('font-semibold', serif && 'font-serif')}>{a.name}</h3>
                  {a.description && <p className="mt-1 text-sm" style={{ opacity: 0.7 }}>{a.description}</p>}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default HotelAmenities;
