'use client';

import React from 'react';
import { motion } from 'framer-motion';

/**
 * ClientFeedback — muro di recensioni testuali (no foto). Tre disposizioni a colonne.
 *
 * Props:
 * - title?/description?: intestazione opzionale (no testo hardcoded).
 * - testimonials (required, 4–6): Array<{ quote, author, role?, accent? }>.
 *   accent?: se true, la card usa lo sfondo accent (testo bianco) per spiccare.
 * - layout?: 'mosaic' (default) | 'grid' | 'masonry'.
 * - size?: 'compact' | 'normal' (default) | 'spacious'. tone?, palette?.
 *
 * @example
 * <ClientFeedback title="Dicono di noi"
 *   testimonials={[{quote:'...',author:'Mario',role:'Cliente',accent:true}, ...]}
 *   palette={{bg:'#fff',ink:'#111',accent:'#8b5cf6',muted:'#f5f5f5'}} />
 */

type Palette = { bg: string; ink: string; accent: string; muted: string };
type Item = { quote: string; author: string; role?: string; accent?: boolean };

export interface ClientFeedbackProps {
  title?: string;
  description?: string;
  testimonials: Item[];
  layout?: 'mosaic' | 'grid' | 'masonry';
  size?: 'compact' | 'normal' | 'spacious';
  tone?: 'modern' | 'classic' | 'editorial' | 'playful';
  palette?: Palette;
  className?: string;
}

const SIZE = { compact: 'py-12 md:py-16', normal: 'py-16 md:py-24', spacious: 'py-24 md:py-32' } as const;
const cx = (...a: Array<string | false | undefined>) => a.filter(Boolean).join(' ');
function paletteVars(p?: Palette): React.CSSProperties {
  return p ? ({ '--lumino-bg': p.bg, '--lumino-ink': p.ink, '--lumino-accent': p.accent, '--lumino-muted': p.muted } as React.CSSProperties) : {};
}
const fade = { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.1 }, transition: { duration: 0.5, ease: 'easeOut' as const } };

export function ClientFeedback({
  title,
  description,
  testimonials,
  layout = 'mosaic',
  size = 'normal',
  tone = 'modern',
  palette,
  className,
}: ClientFeedbackProps) {
  const list = (testimonials || []).slice(0, 6);
  const serif = tone === 'classic' || tone === 'editorial';
  const rootStyle: React.CSSProperties = { ...paletteVars(palette), background: 'var(--lumino-bg, #ffffff)', color: 'var(--lumino-ink, #1a1a1a)' };
  if (!list.length) return null;

  const Card = ({ t, span }: { t: Item; span?: boolean }) => (
    <motion.figure {...fade}
      className={cx('flex flex-col justify-between rounded-2xl border p-5 break-inside-avoid', span && 'sm:row-span-2')}
      style={t.accent
        ? { background: 'var(--lumino-accent, #8b5cf6)', color: '#ffffff', borderColor: 'transparent' }
        : { background: 'var(--lumino-muted, #f5f5f5)', borderColor: 'var(--lumino-muted, #e5e5e5)' }}>
      <blockquote className={cx('text-sm md:text-base leading-relaxed', serif && 'font-serif', tone === 'editorial' && 'italic')}>“{t.quote}”</blockquote>
      <figcaption className="mt-4">
        <div className="text-sm font-semibold">{t.author}</div>
        {t.role && <div className="text-xs" style={{ opacity: t.accent ? 0.85 : 0.6 }}>{t.role}</div>}
      </figcaption>
    </motion.figure>
  );

  const Heading = (title || description) && (
    <div className="mb-10 max-w-2xl">
      {title && <h2 className={cx('text-3xl md:text-4xl font-bold tracking-tight', serif && 'font-serif')}>{title}</h2>}
      {description && <p className="mt-3 text-base" style={{ opacity: 0.7 }}>{description}</p>}
    </div>
  );

  if (layout === 'masonry') {
    return (
      <section className={cx('w-full', SIZE[size], className)} style={rootStyle}>
        <div className="mx-auto max-w-6xl px-6 md:px-8">
          {Heading}
          <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
            {list.map((t, i) => <div key={i} className="mb-5"><Card t={t} /></div>)}
          </div>
        </div>
      </section>
    );
  }

  if (layout === 'grid') {
    return (
      <section className={cx('w-full', SIZE[size], className)} style={rootStyle}>
        <div className="mx-auto max-w-6xl px-6 md:px-8">
          {Heading}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((t, i) => <Card key={i} t={t} />)}
          </div>
        </div>
      </section>
    );
  }

  // MOSAIC (default) — alcune card più alte per ritmo visivo
  return (
    <section className={cx('w-full', SIZE[size], className)} style={rootStyle}>
      <div className="mx-auto max-w-6xl px-6 md:px-8">
        {Heading}
        <div className="grid auto-rows-[minmax(0,auto)] gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((t, i) => <Card key={i} t={t} span={i % 3 === 0} />)}
        </div>
      </div>
    </section>
  );
}

export default ClientFeedback;
