'use client';

import React, { useEffect, useState } from 'react';
import { Warp } from '@paper-design/shaders-react';
import * as LucideIcons from 'lucide-react';

/**
 * FeaturesCards — card con shader Warp animato. I colori dello shader derivano dalla
 * palette (niente più violet/blue/pink hardcoded). Render WebGL solo client-side.
 *
 * Props:
 * - title?/description?: intestazione.
 * - features (required, 3–6): Array<{ title, description, icon? }> — icon = nome lucide.
 * - layout?: 'grid' (default). size?, tone?, palette?.
 *
 * @example
 * <FeaturesCards title="Funzionalità" features={[{title:'Veloce',description:'...',icon:'Zap'}]}
 *   palette={{bg:'#0a0a0a',ink:'#fff',accent:'#8b5cf6',muted:'#222'}} />
 */

type Palette = { bg: string; ink: string; accent: string; muted: string };
type Feature = { title: string; description: string; icon?: string };

export interface FeaturesCardsProps {
  title?: string;
  description?: string;
  features: Feature[];
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
function Icon({ name }: { name?: string }) {
  const Cmp = ((name && (LucideIcons as any)[name]) || (LucideIcons as any).Sparkles) as React.ComponentType<{ className?: string }>;
  return <Cmp className="h-10 w-10 text-white" />;
}

export function FeaturesCards({
  title,
  description,
  features,
  size = 'normal',
  tone = 'modern',
  palette,
  className,
}: FeaturesCardsProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const serif = tone === 'classic' || tone === 'editorial';
  const items = features.slice(0, 6);
  const accent = palette?.accent || '#8b5cf6';
  const muted = palette?.muted || '#222222';
  const ink = palette?.ink || '#111111';
  const colors = [accent, muted, ink, accent];
  const shapes = ['checks', 'stripes'] as const;
  const rootStyle: React.CSSProperties = { ...paletteVars(palette), background: 'var(--lumino-bg, #0a0a0a)', color: 'var(--lumino-ink, #ffffff)' };

  return (
    <section className={cx('w-full', SIZE[size], className)} style={rootStyle}>
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        {(title || description) && (
          <div className="mb-12 text-center">
            {title && <h2 className={cx('text-3xl md:text-4xl font-bold tracking-tight', serif && 'font-serif')}>{title}</h2>}
            {description && <p className="mx-auto mt-3 max-w-2xl text-base" style={{ opacity: 0.75 }}>{description}</p>}
          </div>
        )}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((f, i) => (
            <div key={i} className="relative h-72 overflow-hidden rounded-3xl">
              <div className="absolute inset-0">
                {mounted && (
                  <Warp style={{ height: '100%', width: '100%' }} proportion={0.35 + (i % 3) * 0.04} softness={0.9} distortion={0.18} swirl={0.7 + (i % 2) * 0.15} swirlIterations={10} shape={shapes[i % 2]} shapeScale={0.1} scale={1} rotation={0} speed={0.8} colors={colors} />
                )}
              </div>
              <div className="relative z-10 flex h-full flex-col rounded-3xl border border-white/15 bg-black/70 p-7">
                <div className="mb-5 drop-shadow-lg"><Icon name={f.icon} /></div>
                <h3 className="mb-3 text-xl font-bold text-white">{f.title}</h3>
                <p className="flex-grow font-medium leading-relaxed text-gray-100">{f.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeaturesCards;
