'use client';

import React from 'react';
import { motion } from 'framer-motion';

/**
 * AuroraHero — hero con sfondo "aurora" animato che usa la PALETTE del business
 * (niente più viola/blu/pink hardcoded). Titolo sempre leggibile (colore solido, no shimmer).
 *
 * Props:
 * - title (required): titolo principale.
 * - subtitle?: occhiello sopra il titolo (colore accent).
 * - description?: paragrafo introduttivo.
 * - primaryCta?/secondaryCta?: { label: string; href?: string }. Default IT se assenti.
 * - palette?: { bg, ink, accent, muted } — iniettata come CSS vars; l'aurora usa accent+muted.
 * - layout?: 'centered' (default) | 'left'.
 * - size?: 'compact' | 'normal' (default) | 'spacious' — padding + min-height + scala titolo.
 * - tone?: 'modern' (default) | 'classic' | 'editorial' | 'playful' — tipografia del titolo.
 *
 * @example
 * <AuroraHero
 *   title="Trattoria Mario" subtitle="Cucina milanese dal 1962"
 *   description="..." primaryCta={{ label: 'Prenota un tavolo' }}
 *   palette={{ bg:'#FAF7F2', ink:'#2A1F1A', accent:'#A0522D', muted:'#E8DDD0' }}
 *   layout="left" size="spacious" tone="classic"
 * />
 */

type Palette = { bg: string; ink: string; accent: string; muted: string };
type Cta = { label: string; href?: string };

export interface AuroraHeroProps {
  title: string;
  subtitle?: string;
  description?: string;
  primaryCta?: Cta;
  secondaryCta?: Cta;
  palette?: Palette;
  layout?: 'centered' | 'left';
  size?: 'compact' | 'normal' | 'spacious';
  tone?: 'modern' | 'classic' | 'editorial' | 'playful';
  className?: string;
}

const SIZE = {
  compact: { pad: 'py-14 md:py-20', minH: 'min-h-[50vh]', title: 'text-3xl sm:text-4xl md:text-5xl' },
  normal: { pad: 'py-20 md:py-28', minH: 'min-h-[68vh]', title: 'text-4xl sm:text-5xl md:text-6xl' },
  spacious: { pad: 'py-28 md:py-40', minH: 'min-h-[82vh]', title: 'text-5xl sm:text-6xl md:text-7xl' },
} as const;

function isLight(hex?: string): boolean {
  if (!hex) return true;
  const h = hex.replace('#', '');
  const v = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const r = parseInt(v.slice(0, 2), 16), g = parseInt(v.slice(2, 4), 16), b = parseInt(v.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
}

function paletteVars(p?: Palette): React.CSSProperties {
  return p ? ({ '--lumino-bg': p.bg, '--lumino-ink': p.ink, '--lumino-accent': p.accent, '--lumino-muted': p.muted } as React.CSSProperties) : {};
}

function HeroCta({ cta, variant }: { cta: Cta; variant: 'primary' | 'secondary' }) {
  const base = 'inline-flex items-center justify-center rounded-full px-7 py-3 text-sm font-semibold transition-opacity hover:opacity-90';
  const style: React.CSSProperties = variant === 'primary'
    ? { background: 'var(--lumino-accent, #8b5cf6)', color: '#ffffff' }
    : { border: '1px solid var(--lumino-accent, #8b5cf6)', color: 'var(--lumino-ink, #1a1a1a)', background: 'transparent' };
  return cta.href
    ? <a href={cta.href} className={base} style={style}>{cta.label}</a>
    : <button type="button" className={base} style={style}>{cta.label}</button>;
}

export function AuroraHero({
  title,
  subtitle,
  description,
  primaryCta = { label: 'Scopri di più' },
  secondaryCta,
  palette,
  layout = 'centered',
  size = 'normal',
  tone = 'modern',
  className,
}: AuroraHeroProps) {
  const s = SIZE[size];
  const left = layout === 'left';
  const serif = tone === 'classic' || tone === 'editorial';
  const auroraOpacity = isLight(palette?.bg) ? 0.3 : 0.45;

  return (
    <section
      className={['relative w-full overflow-hidden flex items-center', s.minH, s.pad, className].filter(Boolean).join(' ')}
      style={{ ...paletteVars(palette), background: 'var(--lumino-bg, #ffffff)', color: 'var(--lumino-ink, #1a1a1a)' }}
    >
      {/* Aurora: usa accent + muted della palette, sottile e SEMPRE dietro al testo. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ opacity: auroraOpacity }} aria-hidden="true">
        <motion.div
          className="absolute inset-[-40%]"
          style={{
            background:
              'radial-gradient(40% 50% at 30% 30%, var(--lumino-accent, #8b5cf6) 0%, transparent 60%), radial-gradient(45% 55% at 70% 65%, var(--lumino-muted, #f5f5f5) 0%, transparent 60%)',
            filter: 'blur(90px)',
          }}
          animate={{ x: ['-6%', '6%', '-6%'], y: ['-4%', '5%', '-4%'] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className={['relative z-10 mx-auto w-full max-w-6xl px-6 md:px-8', left ? 'text-left' : 'text-center'].join(' ')}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className={left ? 'max-w-2xl' : 'mx-auto max-w-3xl'}
        >
          {subtitle && (
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--lumino-accent, #8b5cf6)' }}>
              {subtitle}
            </p>
          )}
          <h1
            className={[s.title, 'font-bold leading-[1.08] tracking-tight', serif ? 'font-serif' : 'font-sans', tone === 'editorial' ? 'italic font-medium' : '']
              .filter(Boolean)
              .join(' ')}
          >
            {title}
          </h1>
          {description && (
            <p
              className={['mt-6 text-base sm:text-lg leading-relaxed', left ? 'max-w-xl' : 'mx-auto max-w-2xl'].join(' ')}
              style={{ color: 'var(--lumino-ink, #1a1a1a)', opacity: 0.78 }}
            >
              {description}
            </p>
          )}
          {(primaryCta || secondaryCta) && (
            <div className={['mt-9 flex flex-wrap gap-4', left ? 'justify-start' : 'justify-center'].join(' ')}>
              {primaryCta && <HeroCta cta={primaryCta} variant="primary" />}
              {secondaryCta && <HeroCta cta={secondaryCta} variant="secondary" />}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
