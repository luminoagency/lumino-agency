'use client';

import React from 'react';
import { motion } from 'framer-motion';

/**
 * FeaturesSection — griglia "bento" di funzionalità con fade-in. Tutto via prop.
 *
 * Props:
 * - title (required) / description?.
 * - features (required, 3–8): Array<{ title, description, animation? }> (animation = hint, opzionale).
 * - layout?: 'grid' (default). size?, tone?, palette?.
 *
 * @example
 * <FeaturesSection title="Perché noi" features={[{title:'Veloce',description:'...'}]}
 *   palette={{bg:'#fff',ink:'#111',accent:'#8b5cf6',muted:'#f5f5f5'}} />
 */

type Palette = { bg: string; ink: string; accent: string; muted: string };

export interface FeaturesSectionProps {
  title: string;
  description?: string;
  features: Array<{ title: string; description: string; animation?: string }>;
  layout?: 'grid';
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

export function FeaturesSection({
  title,
  description,
  features,
  size = 'normal',
  tone = 'modern',
  palette,
  className,
}: FeaturesSectionProps) {
  const serif = tone === 'classic' || tone === 'editorial';
  const items = (features || []).slice(0, 8);
  const rootStyle: React.CSSProperties = { ...paletteVars(palette), background: 'var(--lumino-bg, #ffffff)', color: 'var(--lumino-ink, #1a1a1a)' };

  return (
    <section className={cx('w-full', SIZE[size], className)} style={rootStyle}>
      <div className="mx-auto max-w-6xl px-6 md:px-8">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className={cx('text-3xl md:text-4xl font-bold tracking-tight', serif && 'font-serif')}>{title}</h2>
          {description && <p className="mt-3 text-base md:text-lg" style={{ opacity: 0.75 }}>{description}</p>}
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: Math.min(i * 0.07, 0.5), ease: 'easeOut' }}
              className={cx('rounded-2xl border p-6', i === 0 && 'sm:col-span-2 lg:col-span-1')}
              style={{ borderColor: 'var(--lumino-muted, #e5e5e5)', background: 'var(--lumino-muted, #fafafa)' }}
            >
              <div className="mb-3 h-1.5 w-10 rounded-full" style={{ background: 'var(--lumino-accent, #8b5cf6)' }} />
              <h3 className={cx('text-lg font-semibold', serif && 'font-serif')}>{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ opacity: 0.75 }}>{f.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeaturesSection;
