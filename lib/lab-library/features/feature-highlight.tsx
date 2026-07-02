'use client';

import React from 'react';
import { motion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';

/**
 * FeatureHighlight — sezione singola con un elenco di punti forti. Icona di sezione
 * opzionale (nome lucide) e footer opzionale. Per "Cosa includiamo" e simili.
 *
 * Props:
 * - title (required): titolo.
 * - icon?: nome icona lucide della sezione (es. "ShieldCheck").
 * - features (required): Array di stringhe (o ReactNode) — i punti elencati con spunta.
 * - footer?: testo/nodo finale (es. nota).
 * - layout?: 'card' (default, boxed) | 'inline' (aperto, due colonne).
 * - size?: 'compact' | 'normal' (default) | 'spacious'. tone?, palette?.
 *
 * @example
 * <FeatureHighlight title="Cosa includiamo" icon="PackageCheck"
 *   features={['Consulenza iniziale','Materiali premium','Garanzia 2 anni']}
 *   footer="Tutto incluso, nessun costo nascosto."
 *   palette={{bg:'#fff',ink:'#111',accent:'#8b5cf6',muted:'#f5f5f5'}} />
 */

type Palette = { bg: string; ink: string; accent: string; muted: string };

export interface FeatureHighlightProps {
  title: string;
  icon?: string;
  features: React.ReactNode[];
  footer?: React.ReactNode;
  layout?: 'card' | 'inline';
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

function SectionIcon({ name }: { name?: string }) {
  if (!name) return null;
  const Cmp = ((LucideIcons as any)[name] || (LucideIcons as any).Sparkles) as React.ComponentType<{ className?: string }>;
  return (
    <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: 'var(--lumino-muted, #f5f5f5)', color: 'var(--lumino-accent, #8b5cf6)' }}>
      <Cmp className="h-6 w-6" />
    </div>
  );
}

const Check = (LucideIcons as any).Check as React.ComponentType<{ className?: string }>;

export function FeatureHighlight({
  title,
  icon,
  features,
  footer,
  layout = 'card',
  size = 'normal',
  tone = 'modern',
  palette,
  className,
}: FeatureHighlightProps) {
  const serif = tone === 'classic' || tone === 'editorial';
  const titleCls = cx('text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight', serif && 'font-serif', tone === 'editorial' && 'italic font-medium');
  const rootStyle: React.CSSProperties = { ...paletteVars(palette), background: 'var(--lumino-bg, #ffffff)', color: 'var(--lumino-ink, #1a1a1a)' };
  const items = features || [];

  const List = (
    <ul className={cx('space-y-3', layout === 'inline' && 'sm:grid sm:grid-cols-2 sm:gap-3 sm:space-y-0')}>
      {items.map((f, i) => (
        <li key={i} className="flex items-start gap-3">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full" style={{ background: 'var(--lumino-accent, #8b5cf6)', color: '#fff' }}><Check className="h-3 w-3" /></span>
          <span className="text-sm md:text-base" style={{ opacity: 0.85 }}>{f}</span>
        </li>
      ))}
    </ul>
  );

  if (layout === 'inline') {
    return (
      <section className={cx('w-full', SIZE[size], className)} style={rootStyle}>
        <motion.div {...fade} className="mx-auto max-w-4xl px-6 md:px-8">
          <SectionIcon name={icon} />
          <h2 className={titleCls}>{title}</h2>
          <div className="mt-6">{List}</div>
          {footer && <p className="mt-6 text-sm" style={{ opacity: 0.6 }}>{footer}</p>}
        </motion.div>
      </section>
    );
  }

  // CARD (default)
  return (
    <section className={cx('w-full', SIZE[size], className)} style={rootStyle}>
      <motion.div {...fade} className="mx-auto max-w-3xl px-6">
        <div className="rounded-3xl border p-8 md:p-10" style={{ borderColor: 'var(--lumino-muted, #e5e5e5)' }}>
          <SectionIcon name={icon} />
          <h2 className={titleCls}>{title}</h2>
          <div className="mt-6">{List}</div>
          {footer && <p className="mt-6 border-t pt-5 text-sm" style={{ borderColor: 'var(--lumino-muted, #e5e5e5)', opacity: 0.6 }}>{footer}</p>}
        </div>
      </motion.div>
    </section>
  );
}

export default FeatureHighlight;
