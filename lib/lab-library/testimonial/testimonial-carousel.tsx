'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * TestimonialCarousel — carosello recensioni flessibile. Nessun testo italiano hardcoded
 * (titolo e quote arrivano via prop). Frecce + dots + tastiera + swipe touch.
 *
 * Props:
 * - testimonials (required, >=1): Array<{ quote, author, role?, avatar?{src,alt}, rating?(1-5) }>.
 * - title?/description?: intestazione opzionale (NON hardcoded).
 * - autoplay? (default false) / autoplayMs? (default 5000).
 * - layout?: 'card' (default) | 'split' | 'minimal'.
 * - showRating? (default true) — stelle in colore accent.
 * - size?: 'compact' | 'normal' (default) | 'spacious'. tone?, palette?.
 *
 * Avatar mancante → iniziali dell'autore su cerchio palette muted. Navigazione disattivata se 1 sola.
 *
 * @example
 * <TestimonialCarousel title="Dicono di noi"
 *   testimonials={[{ quote:'...', author:'Mario Rossi', role:'Cliente', rating:5 }]}
 *   palette={{bg:'#FAF7F2',ink:'#2A1F1A',accent:'#A0522D',muted:'#E8DDD0'}} layout="card" autoplay />
 */

type Palette = { bg: string; ink: string; accent: string; muted: string };
type Img = { src: string; alt: string };
type Testimonial = { quote: string; author: string; role?: string; avatar?: Img; rating?: number };

export interface TestimonialCarouselProps {
  testimonials: Testimonial[];
  title?: string;
  description?: string;
  autoplay?: boolean;
  autoplayMs?: number;
  layout?: 'card' | 'split' | 'minimal';
  showRating?: boolean;
  size?: 'compact' | 'normal' | 'spacious';
  tone?: 'modern' | 'classic' | 'editorial' | 'playful';
  palette?: Palette;
  className?: string;
}

const SIZE = { compact: 'py-10 md:py-14', normal: 'py-16 md:py-24', spacious: 'py-24 md:py-32' } as const;
const cx = (...a: Array<string | false | undefined>) => a.filter(Boolean).join(' ');
function paletteVars(p?: Palette): React.CSSProperties {
  return p ? ({ '--lumino-bg': p.bg, '--lumino-ink': p.ink, '--lumino-accent': p.accent, '--lumino-muted': p.muted } as React.CSSProperties) : {};
}
function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('');
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} su 5`}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ color: 'var(--lumino-accent, #8b5cf6)', opacity: i <= rating ? 1 : 0.25 }}>★</span>
      ))}
    </div>
  );
}

function Avatar({ t, px }: { t: Testimonial; px: number }) {
  if (t.avatar?.src) return <img src={t.avatar.src} alt={t.avatar.alt} className="rounded-full object-cover" style={{ width: px, height: px }} />;
  return (
    <div className="flex items-center justify-center rounded-full font-semibold"
      style={{ width: px, height: px, background: 'var(--lumino-muted, #f5f5f5)', color: 'var(--lumino-ink, #1a1a1a)', fontSize: px * 0.36 }}
      aria-hidden="true">
      {initials(t.author)}
    </div>
  );
}

export function TestimonialCarousel({
  testimonials,
  title,
  description,
  autoplay = false,
  autoplayMs = 5000,
  layout = 'card',
  showRating = true,
  size = 'normal',
  tone = 'modern',
  palette,
  className,
}: TestimonialCarouselProps) {
  const list = testimonials && testimonials.length ? testimonials : [];
  const count = list.length;
  const [index, setIndex] = useState(0);
  const active = ((index % Math.max(count, 1)) + Math.max(count, 1)) % Math.max(count, 1);
  const serif = tone === 'classic' || tone === 'editorial';
  const startX = useRef(0);

  const go = useCallback((delta: number) => setIndex(i => i + delta), []);

  useEffect(() => {
    if (count <= 1) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [count, go]);

  useEffect(() => {
    if (!autoplay || count <= 1) return;
    const id = setInterval(() => go(1), Math.max(2000, autoplayMs));
    return () => clearInterval(id);
  }, [autoplay, autoplayMs, count, go]);

  if (count === 0) return null;
  const t = list[active];

  const Quote = (
    <AnimatePresence mode="wait">
      <motion.blockquote
        key={active}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -14 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className={cx(layout === 'minimal' ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl', serif && 'font-serif', tone === 'editorial' && 'italic', 'leading-relaxed')}
      >
        “{t.quote}”
      </motion.blockquote>
    </AnimatePresence>
  );

  const Author = (
    <div>
      <div className="font-semibold" style={{ color: 'var(--lumino-ink, #1a1a1a)' }}>{t.author}</div>
      {t.role && <div className="text-sm" style={{ opacity: 0.6 }}>{t.role}</div>}
      {showRating && typeof t.rating === 'number' && <div className="mt-1"><Stars rating={t.rating} /></div>}
    </div>
  );

  const Arrows = count > 1 && (
    <div className="flex gap-2">
      <button type="button" onClick={() => go(-1)} aria-label="Precedente"
        className="flex h-10 w-10 items-center justify-center rounded-full border transition-opacity hover:opacity-70"
        style={{ borderColor: 'var(--lumino-muted, #e5e5e5)', color: 'var(--lumino-ink, #1a1a1a)' }}>‹</button>
      <button type="button" onClick={() => go(1)} aria-label="Successivo"
        className="flex h-10 w-10 items-center justify-center rounded-full border transition-opacity hover:opacity-70"
        style={{ borderColor: 'var(--lumino-muted, #e5e5e5)', color: 'var(--lumino-ink, #1a1a1a)' }}>›</button>
    </div>
  );

  const Dots = count > 1 && (
    <div className="flex justify-center gap-2">
      {list.map((_, i) => (
        <button key={i} type="button" onClick={() => setIndex(i)} aria-label={`Vai alla recensione ${i + 1}`}
          className="h-2 rounded-full transition-all"
          style={{ width: i === active ? 20 : 8, background: i === active ? 'var(--lumino-accent, #8b5cf6)' : 'var(--lumino-muted, #d4d4d4)' }} />
      ))}
    </div>
  );

  const rootStyle: React.CSSProperties = { ...paletteVars(palette), background: 'var(--lumino-bg, #ffffff)', color: 'var(--lumino-ink, #1a1a1a)' };
  const swipe = {
    onTouchStart: (e: React.TouchEvent) => { startX.current = e.touches[0].clientX; },
    onTouchEnd: (e: React.TouchEvent) => { const dx = e.changedTouches[0].clientX - startX.current; if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1); },
  };

  const Heading = (title || description) && (
    <div className="mb-10 text-center">
      {title && <h2 className={cx('text-3xl md:text-4xl font-bold tracking-tight', serif && 'font-serif')}>{title}</h2>}
      {description && <p className="mx-auto mt-3 max-w-2xl text-base" style={{ opacity: 0.7 }}>{description}</p>}
    </div>
  );

  // SPLIT — avatar+nome a sinistra, quote grande a destra
  if (layout === 'split') {
    return (
      <section className={cx('w-full', SIZE[size], className)} style={rootStyle} {...swipe}>
        <div className="mx-auto max-w-5xl px-6 md:px-8">
          {Heading}
          <div className="grid items-center gap-8 md:grid-cols-[auto_1fr]">
            <div className="flex flex-col items-center gap-3 text-center md:w-44">
              <Avatar t={t} px={88} />
              {Author}
            </div>
            <div>{Quote}</div>
          </div>
          <div className="mt-10 flex items-center justify-between">{Dots}{Arrows}</div>
        </div>
      </section>
    );
  }

  // MINIMAL — solo quote + autore, editoriale, niente foto
  if (layout === 'minimal') {
    return (
      <section className={cx('w-full', SIZE[size], className)} style={rootStyle} {...swipe}>
        <div className="mx-auto max-w-3xl px-6 text-center">
          {Heading}
          {Quote}
          <div className="mt-6 flex flex-col items-center gap-1">{Author}</div>
          <div className="mt-8 flex items-center justify-center gap-6">{Arrows}{Dots}</div>
        </div>
      </section>
    );
  }

  // CARD (default) — testimonianza centrale con avatar in alto
  return (
    <section className={cx('w-full', SIZE[size], className)} style={rootStyle} {...swipe}>
      <div className="mx-auto max-w-3xl px-6 text-center">
        {Heading}
        <div className="rounded-3xl border p-8 md:p-10" style={{ background: 'var(--lumino-muted, #f5f5f5)', borderColor: 'var(--lumino-muted, #e5e5e5)' }}>
          <div className="mb-5 flex justify-center"><Avatar t={t} px={72} /></div>
          {Quote}
          <div className="mt-6 flex flex-col items-center gap-1">{Author}</div>
        </div>
        <div className="mt-8 flex items-center justify-center gap-6">{Arrows}{Dots}</div>
      </div>
    </section>
  );
}
