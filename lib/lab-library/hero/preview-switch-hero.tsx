'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

/**
 * PreviewSwitchHero — hero con tab interattivi: a sinistra testo + elenco tab, a destra
 * l'anteprima che cambia al click. Ripulito da ratings/avatars/logos hardcoded.
 *
 * Props:
 * - title (required) / description?.
 * - primaryCta?/secondaryCta?: { label, href? }.
 * - tabs (required, >=1): Array<{ id, label, media: { src, alt } }> — media = immagine anteprima.
 * - layout?: 'standard' (default, testo+tab a sx / preview a dx) | 'compact' (tab a pillole sopra).
 * - size?: 'compact' | 'normal' (default) | 'spacious'. tone?, palette?.
 *
 * @example
 * <PreviewSwitchHero title="Il nostro mondo" description="..."
 *   primaryCta={{ label:'Prenota' }}
 *   tabs={[{id:'a',label:'Sala',media:{src:'...',alt:'Sala'}},{id:'b',label:'Cucina',media:{src:'...',alt:'Cucina'}}]}
 *   palette={{bg:'#fff',ink:'#111',accent:'#8b5cf6',muted:'#f5f5f5'}} />
 */

type Palette = { bg: string; ink: string; accent: string; muted: string };
type Cta = { label: string; href?: string };
type Tab = { id: string; label: string; media: { src: string; alt: string } };

export interface PreviewSwitchHeroProps {
  title: string;
  description?: string;
  primaryCta?: Cta;
  secondaryCta?: Cta;
  tabs: Tab[];
  layout?: 'standard' | 'compact';
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
const fade = { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.15 }, transition: { duration: 0.6, ease: 'easeOut' as const } };

function HeroCta({ cta, variant }: { cta: Cta; variant: 'primary' | 'secondary' }) {
  const base = 'inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-90';
  const style: React.CSSProperties = variant === 'primary'
    ? { background: 'var(--lumino-accent, #8b5cf6)', color: '#fff' }
    : { border: '1px solid var(--lumino-accent, #8b5cf6)', color: 'var(--lumino-ink, #1a1a1a)', background: 'transparent' };
  return cta.href ? <a href={cta.href} className={base} style={style}>{cta.label}</a> : <button type="button" className={base} style={style}>{cta.label}</button>;
}

export function PreviewSwitchHero({
  title,
  description,
  primaryCta,
  secondaryCta,
  tabs,
  layout = 'standard',
  size = 'normal',
  tone = 'modern',
  palette,
  className,
}: PreviewSwitchHeroProps) {
  const list = tabs && tabs.length ? tabs : [];
  const [active, setActive] = useState(0);
  const serif = tone === 'classic' || tone === 'editorial';
  const titleCls = cx('text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight', serif && 'font-serif', tone === 'editorial' && 'italic font-medium');
  const rootStyle: React.CSSProperties = { ...paletteVars(palette), background: 'var(--lumino-bg, #ffffff)', color: 'var(--lumino-ink, #1a1a1a)' };
  if (!list.length) return null;
  const current = list[Math.min(active, list.length - 1)];

  const Preview = (
    <motion.div key={current.id} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35, ease: 'easeOut' }} className="overflow-hidden rounded-2xl border" style={{ borderColor: 'var(--lumino-muted, #e5e5e5)' }}>
      <img src={current.media.src} alt={current.media.alt} className="aspect-[16/10] w-full object-cover" />
    </motion.div>
  );

  const PillTabs = (
    <div role="tablist" className="flex flex-wrap gap-2">
      {list.map((t, i) => (
        <button key={t.id} type="button" role="tab" aria-selected={i === active} onClick={() => setActive(i)}
          className="rounded-full px-4 py-2 text-sm font-medium transition-colors"
          style={i === active ? { background: 'var(--lumino-accent, #8b5cf6)', color: '#fff' } : { background: 'var(--lumino-muted, #f5f5f5)', color: 'var(--lumino-ink, #1a1a1a)' }}>
          {t.label}
        </button>
      ))}
    </div>
  );

  const Cta = (primaryCta || secondaryCta) ? (
    <div className="mt-8 flex flex-wrap gap-4">
      {primaryCta && <HeroCta cta={primaryCta} variant="primary" />}
      {secondaryCta && <HeroCta cta={secondaryCta} variant="secondary" />}
    </div>
  ) : null;

  // COMPACT — testo centrato, tab a pillole, preview sotto
  if (layout === 'compact') {
    return (
      <section className={cx('w-full', SIZE[size], className)} style={rootStyle}>
        <motion.div {...fade} className="mx-auto max-w-3xl px-6 text-center">
          <h1 className={titleCls}>{title}</h1>
          {description && <p className="mx-auto mt-4 max-w-2xl text-base md:text-lg" style={{ opacity: 0.78 }}>{description}</p>}
          <div className="mt-6 flex justify-center">{PillTabs}</div>
          {Cta && <div className="flex justify-center">{Cta}</div>}
        </motion.div>
        <motion.div {...fade} className="mx-auto mt-10 max-w-4xl px-6">{Preview}</motion.div>
      </section>
    );
  }

  // STANDARD — testo + elenco tab a sinistra, preview a destra
  return (
    <section className={cx('w-full', SIZE[size], className)} style={rootStyle}>
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 md:grid-cols-2 md:px-8">
        <motion.div {...fade}>
          <h1 className={titleCls}>{title}</h1>
          {description && <p className="mt-4 text-base md:text-lg" style={{ opacity: 0.78 }}>{description}</p>}
          <div role="tablist" className="mt-6 flex flex-col gap-2">
            {list.map((t, i) => (
              <button key={t.id} type="button" role="tab" aria-selected={i === active} onClick={() => setActive(i)}
                className="rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors"
                style={i === active ? { background: 'var(--lumino-muted, #f5f5f5)', color: 'var(--lumino-ink, #1a1a1a)', boxShadow: 'inset 0 0 0 1px var(--lumino-accent, #8b5cf6)' } : { color: 'var(--lumino-ink, #1a1a1a)', opacity: 0.7 }}>
                {t.label}
              </button>
            ))}
          </div>
          {Cta}
        </motion.div>
        <motion.div {...fade}>{Preview}</motion.div>
      </div>
    </section>
  );
}

export default PreviewSwitchHero;
