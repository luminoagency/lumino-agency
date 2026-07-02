'use client';

import React from 'react';
import { motion } from 'framer-motion';

/**
 * FloatingFoodHero — hero per ristoranti/locali con foto, RISCRITTO per non sovrapporre
 * mai le immagini al testo. Tre layout sicuri:
 * - 'split' (default): testo a sinistra (~60%), griglia foto a destra (~40%). Nessuna sovrapposizione.
 * - 'centered': testo centrale grande su UNA foto di sfondo con overlay scuro forte (contrasto garantito).
 * - 'grid': testo in alto, sotto una griglia 2x2 di foto.
 *
 * Props:
 * - title (required): titolo principale.
 * - subtitle?: occhiello sopra il titolo (accent).
 * - description?: paragrafo.
 * - primaryCta?/secondaryCta?: { label: string; href?: string }. Default IT.
 * - images?: Array<{ src: string; alt: string }> — niente più className arbitrario.
 * - palette?: { bg, ink, accent, muted } — CSS vars dinamiche.
 * - layout?: 'split' (default) | 'centered' | 'grid'.
 * - size?: 'compact' | 'normal' (default) | 'spacious'.
 * - tone?: 'modern' (default) | 'classic' | 'editorial' | 'playful' — classic/editorial = titolo serif.
 *
 * @example
 * <FloatingFoodHero title="Trattoria Mario" subtitle="Dal 1962"
 *   description="..." images={[{src:'https://images.unsplash.com/...', alt:'Pasta'}]}
 *   palette={{bg:'#FAF7F2',ink:'#2A1F1A',accent:'#A0522D',muted:'#E8DDD0'}}
 *   layout="split" tone="classic" />
 */

type Palette = { bg: string; ink: string; accent: string; muted: string };
type Cta = { label: string; href?: string };
type Img = { src: string; alt: string };

export interface FloatingFoodHeroProps {
  title: string;
  subtitle?: string;
  description?: string;
  primaryCta?: Cta;
  secondaryCta?: Cta;
  images?: Img[];
  palette?: Palette;
  layout?: 'split' | 'centered' | 'grid';
  size?: 'compact' | 'normal' | 'spacious';
  tone?: 'modern' | 'classic' | 'editorial' | 'playful';
  className?: string;
}

const SIZE = {
  compact: { pad: 'py-12 md:py-16', minH: 'min-h-[48vh]', title: 'text-3xl sm:text-4xl md:text-5xl' },
  normal: { pad: 'py-16 md:py-24', minH: 'min-h-[62vh]', title: 'text-4xl sm:text-5xl md:text-6xl' },
  spacious: { pad: 'py-24 md:py-36', minH: 'min-h-[80vh]', title: 'text-5xl sm:text-6xl md:text-7xl' },
} as const;

function paletteVars(p?: Palette): React.CSSProperties {
  return p ? ({ '--lumino-bg': p.bg, '--lumino-ink': p.ink, '--lumino-accent': p.accent, '--lumino-muted': p.muted } as React.CSSProperties) : {};
}

function HeroCta({ cta, variant, onDark }: { cta: Cta; variant: 'primary' | 'secondary'; onDark?: boolean }) {
  const base = 'inline-flex items-center justify-center rounded-full px-7 py-3 text-sm font-semibold transition-opacity hover:opacity-90';
  let style: React.CSSProperties;
  if (variant === 'primary') {
    style = { background: 'var(--lumino-accent, #8b5cf6)', color: '#ffffff' };
  } else if (onDark) {
    style = { border: '1px solid rgba(255,255,255,0.6)', color: '#ffffff', background: 'transparent' };
  } else {
    style = { border: '1px solid var(--lumino-accent, #8b5cf6)', color: 'var(--lumino-ink, #1a1a1a)', background: 'transparent' };
  }
  return cta.href
    ? <a href={cta.href} className={base} style={style}>{cta.label}</a>
    : <button type="button" className={base} style={style}>{cta.label}</button>;
}

const fade = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: 'easeOut' as const },
};

export function FloatingFoodHero({
  title,
  subtitle,
  description,
  primaryCta = { label: 'Prenota un tavolo' },
  secondaryCta,
  images = [],
  palette,
  layout = 'split',
  size = 'normal',
  tone = 'modern',
  className,
}: FloatingFoodHeroProps) {
  const s = SIZE[size];
  const serif = tone === 'classic' || tone === 'editorial';
  const titleFont = serif ? 'font-serif' : 'font-sans';
  const imgs = images.slice(0, 4);

  const TitleBlock = ({ onDark = false }: { onDark?: boolean }) => (
    <>
      {subtitle && (
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: onDark ? '#fff' : 'var(--lumino-accent, #8b5cf6)' }}>
          {subtitle}
        </p>
      )}
      <h1
        className={[s.title, titleFont, 'font-bold leading-[1.1] tracking-tight', tone === 'editorial' ? 'italic font-medium' : '']
          .filter(Boolean)
          .join(' ')}
        style={{ color: onDark ? '#ffffff' : 'var(--lumino-ink, #1a1a1a)' }}
      >
        {title}
      </h1>
      {description && (
        <p className="mt-5 text-base sm:text-lg leading-relaxed" style={{ color: onDark ? 'rgba(255,255,255,0.85)' : 'var(--lumino-ink, #1a1a1a)', opacity: onDark ? 1 : 0.78 }}>
          {description}
        </p>
      )}
      {(primaryCta || secondaryCta) && (
        <div className="mt-8 flex flex-wrap gap-4">
          {primaryCta && <HeroCta cta={primaryCta} variant="primary" />}
          {secondaryCta && <HeroCta cta={secondaryCta} variant="secondary" onDark={onDark} />}
        </div>
      )}
    </>
  );

  // ── CENTERED: una foto di sfondo + overlay scuro forte (contrasto garantito) ──
  if (layout === 'centered') {
    const bg = imgs[0];
    return (
      <section
        className={['relative w-full overflow-hidden flex items-center justify-center', s.minH, s.pad, className].filter(Boolean).join(' ')}
        style={{ ...paletteVars(palette), background: 'var(--lumino-bg, #ffffff)' }}
      >
        {bg && <img src={bg.src} alt={bg.alt} className="absolute inset-0 h-full w-full object-cover" />}
        {/* overlay scuro al 60% per leggibilità del testo bianco */}
        <div className="absolute inset-0 bg-black/60" aria-hidden="true" />
        <motion.div {...fade} className="relative z-10 mx-auto max-w-3xl px-6 text-center">
          <TitleBlock onDark />
        </motion.div>
      </section>
    );
  }

  // ── GRID: testo in alto centrato, sotto griglia 2x2 di foto ──
  if (layout === 'grid') {
    return (
      <section
        className={['relative w-full overflow-hidden', s.pad, className].filter(Boolean).join(' ')}
        style={{ ...paletteVars(palette), background: 'var(--lumino-bg, #ffffff)', color: 'var(--lumino-ink, #1a1a1a)' }}
      >
        <motion.div {...fade} className="mx-auto max-w-3xl px-6 text-center">
          <TitleBlock />
        </motion.div>
        {imgs.length > 0 && (
          <div className="mx-auto mt-12 grid max-w-5xl grid-cols-2 gap-4 px-6">
            {imgs.map((img, i) => (
              <div key={i} className="overflow-hidden rounded-2xl" style={{ background: 'var(--lumino-muted, #f5f5f5)' }}>
                <img src={img.src} alt={img.alt} className="aspect-[4/3] h-full w-full object-cover transition-transform duration-500 hover:scale-105" />
              </div>
            ))}
          </div>
        )}
      </section>
    );
  }

  // ── SPLIT (default): testo a sinistra, griglia foto a destra. Nessuna sovrapposizione. ──
  return (
    <section
      className={['relative w-full overflow-hidden', s.minH, s.pad, className].filter(Boolean).join(' ')}
      style={{ ...paletteVars(palette), background: 'var(--lumino-bg, #ffffff)', color: 'var(--lumino-ink, #1a1a1a)' }}
    >
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 md:grid-cols-[3fr_2fr] md:px-8">
        <motion.div {...fade}>
          <TitleBlock />
        </motion.div>
        {imgs.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {imgs.map((img, i) => (
              <div
                key={i}
                className={['overflow-hidden rounded-2xl', i === 0 && imgs.length > 2 ? 'col-span-2' : ''].filter(Boolean).join(' ')}
                style={{ background: 'var(--lumino-muted, #f5f5f5)' }}
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  className={[(i === 0 && imgs.length > 2 ? 'aspect-[16/9]' : 'aspect-[4/5]'), 'h-full w-full object-cover transition-transform duration-500 hover:scale-105'].join(' ')}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
