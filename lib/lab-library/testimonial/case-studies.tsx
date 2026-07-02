'use client';

import React from 'react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import * as LucideIcons from 'lucide-react';

/**
 * CaseStudies — casi studio con metriche animate (CountUp allo scroll). Layout zigzag.
 *
 * Props:
 * - title (required) / description?.
 * - studies (required, 1–3): Array<{ quote, name, role, image?, icon?, metrics: Array<{ value, label, sub? }> }>.
 *   value es. "+250%", "1.2M", "30" — la parte numerica viene animata, prefisso/suffisso mantenuti.
 * - layout?: 'standard' (default) | 'compact'. size?, tone?, palette?.
 *
 * @example
 * <CaseStudies title="Risultati" studies={[{quote:'...',name:'Mario',role:'Titolare',
 *   metrics:[{value:'+40%',label:'Prenotazioni',sub:'in 3 mesi'}]}]}
 *   palette={{bg:'#fff',ink:'#111',accent:'#8b5cf6',muted:'#f5f5f5'}} />
 */

type Palette = { bg: string; ink: string; accent: string; muted: string };
type Metric = { value: string; label: string; sub?: string };
type Study = { quote: string; name: string; role: string; image?: { src: string; alt: string }; icon?: string; metrics: Metric[] };

export interface CaseStudiesProps {
  title: string;
  description?: string;
  studies: Study[];
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
const fade = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.2 }, transition: { duration: 0.6, ease: 'easeOut' as const } };

function Stat({ m }: { m: Metric }) {
  const match = m.value.match(/^([^\d-]*)(-?[\d.,]+)(.*)$/);
  const prefix = match?.[1] || '';
  const num = match ? parseFloat(match[2].replace(/\./g, '').replace(',', '.')) : NaN;
  const suffix = match?.[3] || '';
  const decimals = match && /[.,]\d/.test(match[2]) ? 1 : 0;
  return (
    <div>
      <div className="text-3xl md:text-4xl font-bold" style={{ color: 'var(--lumino-accent, #8b5cf6)' }}>
        {isNaN(num)
          ? m.value
          : <CountUp end={num} prefix={prefix} suffix={suffix} decimals={decimals} duration={1.8} separator="." enableScrollSpy scrollSpyOnce />}
      </div>
      <div className="mt-1 text-sm font-medium">{m.label}</div>
      {m.sub && <div className="text-xs" style={{ opacity: 0.6 }}>{m.sub}</div>}
    </div>
  );
}

function StudyIcon({ name }: { name?: string }) {
  if (!name) return null;
  const Cmp = ((LucideIcons as any)[name] || (LucideIcons as any).Sparkles) as React.ComponentType<{ className?: string }>;
  return <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: 'var(--lumino-muted, #f5f5f5)', color: 'var(--lumino-accent, #8b5cf6)' }}><Cmp className="h-5 w-5" /></div>;
}

export function CaseStudies({
  title,
  description,
  studies,
  layout = 'standard',
  size = 'normal',
  tone = 'modern',
  palette,
  className,
}: CaseStudiesProps) {
  const serif = tone === 'classic' || tone === 'editorial';
  const list = (studies || []).slice(0, 3);
  const rootStyle: React.CSSProperties = { ...paletteVars(palette), background: 'var(--lumino-bg, #ffffff)', color: 'var(--lumino-ink, #1a1a1a)' };
  const compact = layout === 'compact';

  return (
    <section className={cx('w-full', SIZE[size], className)} style={rootStyle}>
      <div className="mx-auto max-w-6xl px-6 md:px-8">
        <motion.div {...fade} className="mb-12 max-w-2xl">
          <h2 className={cx('text-3xl md:text-4xl font-bold tracking-tight', serif && 'font-serif')}>{title}</h2>
          {description && <p className="mt-3 text-base md:text-lg" style={{ opacity: 0.75 }}>{description}</p>}
        </motion.div>

        <div className="space-y-16">
          {list.map((s, i) => (
            <motion.div {...fade} key={i} className={cx('grid items-center gap-10', !compact && 'md:grid-cols-2')}>
              <div className={cx(!compact && i % 2 === 1 && 'md:order-2')}>
                <StudyIcon name={s.icon} />
                <blockquote className={cx('text-xl md:text-2xl leading-relaxed', serif && 'font-serif', tone === 'editorial' && 'italic')}>“{s.quote}”</blockquote>
                <div className="mt-5">
                  <div className="font-semibold">{s.name}</div>
                  <div className="text-sm" style={{ opacity: 0.6 }}>{s.role}</div>
                </div>
              </div>
              <div className={cx('rounded-2xl border p-6 md:p-8', !compact && i % 2 === 1 && 'md:order-1')} style={{ borderColor: 'var(--lumino-muted, #e5e5e5)', background: 'var(--lumino-muted, #f8f8f8)' }}>
                {s.image?.src && <img src={s.image.src} alt={s.image.alt} className="mb-6 aspect-video w-full rounded-xl object-cover" />}
                <div className="grid grid-cols-2 gap-6">
                  {s.metrics.slice(0, 4).map((m, j) => <Stat key={j} m={m} />)}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default CaseStudies;
