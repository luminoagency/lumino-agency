'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as LucideIcons from 'lucide-react';

/**
 * FeatureCarousel — feature a tab con anteprima che cambia (immagine + descrizione).
 * Icone lucide per nome (fallback Sparkles). Autoplay opzionale.
 *
 * Props:
 * - title?/description?: intestazione.
 * - features (required, >=2): Array<{ id, label, icon?, image: { src, alt }, description? }>.
 * - autoplay? (default false) / autoplayMs? (default 4000).
 * - layout?: 'split' (default, tab a sx / preview a dx) | 'compact' (tab sopra).
 * - size?: 'compact' | 'normal' (default) | 'spacious'. tone?, palette?.
 *
 * @example
 * <FeatureCarousel title="Come funziona"
 *   features={[{id:'a',label:'Menu',icon:'BookOpen',image:{src:'...',alt:'Menu'},description:'...'}]}
 *   autoplay palette={{bg:'#fff',ink:'#111',accent:'#8b5cf6',muted:'#f5f5f5'}} />
 */

type Palette = { bg: string; ink: string; accent: string; muted: string };
type Feature = { id: string; label: string; icon?: string; image: { src: string; alt: string }; description?: string };

export interface FeatureCarouselProps {
  title?: string;
  description?: string;
  features: Feature[];
  autoplay?: boolean;
  autoplayMs?: number;
  layout?: 'split' | 'compact';
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

function Icon({ name, className }: { name?: string; className?: string }) {
  const Cmp = ((name && (LucideIcons as any)[name]) || (LucideIcons as any).Sparkles) as React.ComponentType<{ className?: string }>;
  return <Cmp className={className} />;
}

export function FeatureCarousel({
  title,
  description,
  features,
  autoplay = false,
  autoplayMs = 4000,
  layout = 'split',
  size = 'normal',
  tone = 'modern',
  palette,
  className,
}: FeatureCarouselProps) {
  const list = (features || []).slice(0, 8);
  const [active, setActive] = useState(0);
  const serif = tone === 'classic' || tone === 'editorial';
  const rootStyle: React.CSSProperties = { ...paletteVars(palette), background: 'var(--lumino-bg, #ffffff)', color: 'var(--lumino-ink, #1a1a1a)' };
  const go = useCallback(() => setActive((i) => (i + 1) % Math.max(list.length, 1)), [list.length]);

  useEffect(() => {
    if (!autoplay || list.length <= 1) return;
    const id = setInterval(go, Math.max(2000, autoplayMs));
    return () => clearInterval(id);
  }, [autoplay, autoplayMs, go, list.length]);

  if (!list.length) return null;
  const current = list[Math.min(active, list.length - 1)];

  const Tabs = ({ horizontal }: { horizontal?: boolean }) => (
    <div role="tablist" className={cx('flex gap-2', horizontal ? 'flex-wrap justify-center' : 'flex-col')}>
      {list.map((f, i) => (
        <button key={f.id} type="button" role="tab" aria-selected={i === active} onClick={() => setActive(i)}
          className={cx('flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors', horizontal && 'flex-1 justify-center')}
          style={i === active
            ? { background: 'var(--lumino-muted, #f5f5f5)', boxShadow: 'inset 0 0 0 1px var(--lumino-accent, #8b5cf6)' }
            : { opacity: 0.7 }}>
          <Icon name={f.icon} className="h-4 w-4" />
          {f.label}
        </button>
      ))}
    </div>
  );

  const Preview = (
    <AnimatePresence mode="wait">
      <motion.div key={current.id} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
        <div className="overflow-hidden rounded-2xl border" style={{ borderColor: 'var(--lumino-muted, #e5e5e5)' }}>
          <img src={current.image.src} alt={current.image.alt} className="aspect-[16/10] w-full object-cover" />
        </div>
        {current.description && <p className="mt-4 text-sm md:text-base" style={{ opacity: 0.78 }}>{current.description}</p>}
      </motion.div>
    </AnimatePresence>
  );

  const Heading = (title || description) && (
    <div className={cx('mb-10', layout === 'compact' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl')}>
      {title && <h2 className={cx('text-3xl md:text-4xl font-bold tracking-tight', serif && 'font-serif')}>{title}</h2>}
      {description && <p className="mt-3 text-base" style={{ opacity: 0.7 }}>{description}</p>}
    </div>
  );

  if (layout === 'compact') {
    return (
      <section className={cx('w-full', SIZE[size], className)} style={rootStyle}>
        <div className="mx-auto max-w-4xl px-6 md:px-8">
          {Heading}
          <motion.div {...fade}><Tabs horizontal /></motion.div>
          <motion.div {...fade} className="mt-8">{Preview}</motion.div>
        </div>
      </section>
    );
  }

  return (
    <section className={cx('w-full', SIZE[size], className)} style={rootStyle}>
      <div className="mx-auto max-w-6xl px-6 md:px-8">
        {Heading}
        <div className="grid items-start gap-10 md:grid-cols-[2fr_3fr]">
          <motion.div {...fade}><Tabs /></motion.div>
          <motion.div {...fade}>{Preview}</motion.div>
        </div>
      </div>
    </section>
  );
}

export default FeatureCarousel;
