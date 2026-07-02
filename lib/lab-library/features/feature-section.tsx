'use client';

import React from 'react';
import { motion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';

/**
 * FeatureSection — sezione "Cosa offriamo" flessibile. Le feature e le icone arrivano
 * via prop (niente più 5 task hardcoded). Icone lucide-react per NOME (es. "Bell"),
 * con fallback a Sparkles se il nome manca o è invalido.
 *
 * Props:
 * - title (required, default "Cosa offriamo"): titolo sezione.
 * - description?: paragrafo. highlight?: frase corta in evidenza (accent).
 * - features (required, 3–12): Array<{ title, subtitle?, icon? }> — icon = nome lucide.
 * - tags?: string[] — badge sotto la descrizione.
 * - layout?: 'autoscroll' (default) | 'grid' | 'list'.
 * - size?: 'compact' | 'normal' (default) | 'spacious'. tone?, palette?.
 *
 * @example
 * <FeatureSection title="Cosa offriamo" highlight="100+ automazioni"
 *   features={[{title:'Notifiche AI',subtitle:'...',icon:'Bell'},{title:'Report',icon:'FileBarChart'}]}
 *   tags={['Bot AI','Enterprise']} palette={{bg:'#fff',ink:'#111',accent:'#8b5cf6',muted:'#f5f5f5'}} />
 */

type Palette = { bg: string; ink: string; accent: string; muted: string };
type Feature = { title: string; subtitle?: string; icon?: string };

export interface FeatureSectionProps {
  title?: string;
  description?: string;
  highlight?: string;
  features: Feature[];
  tags?: string[];
  layout?: 'autoscroll' | 'grid' | 'list';
  size?: 'compact' | 'normal' | 'spacious';
  tone?: 'modern' | 'classic' | 'editorial' | 'playful';
  palette?: Palette;
  className?: string;
}

const SIZE = { compact: 'py-12 md:py-16', normal: 'py-16 md:py-24', spacious: 'py-24 md:py-36' } as const;
const cx = (...a: Array<string | false | undefined>) => a.filter(Boolean).join(' ');
function paletteVars(p?: Palette): React.CSSProperties {
  return p ? ({ '--lumino-bg': p.bg, '--lumino-ink': p.ink, '--lumino-accent': p.accent, '--lumino-muted': p.muted } as React.CSSProperties) : {};
}
const fade = { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.15 }, transition: { duration: 0.6, ease: 'easeOut' as const } };

function Icon({ name, className }: { name?: string; className?: string }) {
  const Cmp = ((name && (LucideIcons as any)[name]) || (LucideIcons as any).Sparkles) as React.ComponentType<{ className?: string }>;
  return <Cmp className={className} />;
}

function IconBadge({ name }: { name?: string }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: 'var(--lumino-muted, #f5f5f5)', color: 'var(--lumino-accent, #8b5cf6)' }}>
      <Icon name={name} className="h-5 w-5" />
    </div>
  );
}

function Tags({ tags }: { tags?: string[] }) {
  if (!tags || !tags.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((t, i) => (
        <span key={i} className="rounded-full px-3 py-1 text-xs font-medium" style={{ background: 'var(--lumino-muted, #f5f5f5)', color: 'var(--lumino-ink, #1a1a1a)' }}>{t}</span>
      ))}
    </div>
  );
}

export function FeatureSection({
  title = 'Cosa offriamo',
  description,
  highlight,
  features,
  tags,
  layout = 'autoscroll',
  size = 'normal',
  tone = 'modern',
  palette,
  className,
}: FeatureSectionProps) {
  const serif = tone === 'classic' || tone === 'editorial';
  const titleCls = cx('text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight', serif && 'font-serif', tone === 'editorial' && 'italic font-medium');
  const rootStyle: React.CSSProperties = { ...paletteVars(palette), background: 'var(--lumino-bg, #ffffff)', color: 'var(--lumino-ink, #1a1a1a)' };
  const items = features.slice(0, 12);

  const TextBlock = (
    <div>
      {highlight && <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--lumino-accent, #8b5cf6)' }}>{highlight}</p>}
      <h2 className={titleCls}>{title}</h2>
      {description && <p className="mt-4 text-base md:text-lg leading-relaxed" style={{ opacity: 0.78 }}>{description}</p>}
      {tags && <div className="mt-6"><Tags tags={tags} /></div>}
    </div>
  );

  const Row = ({ f }: { f: Feature }) => (
    <div className="flex items-center gap-3 rounded-xl border p-3 transition-shadow hover:shadow-sm" style={{ borderColor: 'var(--lumino-muted, #e5e5e5)', background: 'var(--lumino-bg, #ffffff)' }}>
      <IconBadge name={f.icon} />
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-tight">{f.title}</p>
        {f.subtitle && <p className="text-xs" style={{ opacity: 0.6 }}>{f.subtitle}</p>}
      </div>
    </div>
  );

  // GRID — header centrato + griglia di card
  if (layout === 'grid') {
    return (
      <section className={cx('w-full', SIZE[size], className)} style={rootStyle}>
        <div className="mx-auto max-w-6xl px-6 md:px-8">
          <motion.div {...fade} className="mx-auto max-w-2xl text-center">
            {highlight && <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--lumino-accent, #8b5cf6)' }}>{highlight}</p>}
            <h2 className={titleCls}>{title}</h2>
            {description && <p className="mt-4 text-base md:text-lg leading-relaxed" style={{ opacity: 0.78 }}>{description}</p>}
          </motion.div>
          <motion.div {...fade} className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((f, i) => (
              <div key={i} className="rounded-2xl border p-5 transition-shadow hover:shadow-md" style={{ borderColor: 'var(--lumino-muted, #e5e5e5)', background: 'var(--lumino-bg, #ffffff)' }}>
                <IconBadge name={f.icon} />
                <h3 className={cx('mt-4 text-base font-semibold', serif && 'font-serif')}>{f.title}</h3>
                {f.subtitle && <p className="mt-1.5 text-sm" style={{ opacity: 0.7 }}>{f.subtitle}</p>}
              </div>
            ))}
          </motion.div>
          {tags && <div className="mt-10 flex justify-center"><Tags tags={tags} /></div>}
        </div>
      </section>
    );
  }

  // LIST — testo a sinistra, elenco feature a destra
  if (layout === 'list') {
    return (
      <section className={cx('w-full', SIZE[size], className)} style={rootStyle}>
        <div className="mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-2 md:px-8">
          <motion.div {...fade}>{TextBlock}</motion.div>
          <motion.div {...fade} className="flex flex-col gap-3">
            {items.map((f, i) => <Row key={i} f={f} />)}
          </motion.div>
        </div>
      </section>
    );
  }

  // AUTOSCROLL (default) — card che scorrono in loop (pausa su hover) + testo a destra
  return (
    <section className={cx('w-full', SIZE[size], className)} style={rootStyle}>
      <style>{`
        @keyframes lumino-vscroll { from { transform: translateY(0); } to { transform: translateY(-50%); } }
        .lumino-vscroll { animation: lumino-vscroll 18s linear infinite; }
        .lumino-vscroll-wrap:hover .lumino-vscroll { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) { .lumino-vscroll { animation: none; } }
      `}</style>
      <div className="mx-auto grid max-w-5xl items-center gap-12 px-6 md:grid-cols-2 md:px-8">
        <motion.div {...fade} className="lumino-vscroll-wrap relative h-[360px] overflow-hidden rounded-2xl border" style={{ borderColor: 'var(--lumino-muted, #e5e5e5)' }}>
          <div className="lumino-vscroll flex flex-col gap-3 p-3">
            {[...items, ...items].map((f, i) => <Row key={i} f={f} />)}
          </div>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-12" style={{ background: 'linear-gradient(to bottom, var(--lumino-bg, #fff), transparent)' }} />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12" style={{ background: 'linear-gradient(to top, var(--lumino-bg, #fff), transparent)' }} />
        </motion.div>
        <motion.div {...fade}>{TextBlock}</motion.div>
      </div>
    </section>
  );
}

export default FeatureSection;
