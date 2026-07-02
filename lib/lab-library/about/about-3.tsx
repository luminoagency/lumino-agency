'use client';

import React from 'react';
import { motion } from 'framer-motion';

/**
 * About3 — sezione "Chi siamo" flessibile e production-ready. Niente immagini/loghi
 * hardcoded che si rompono: se una foto manca mostra un blocco gradient della palette,
 * e i loghi clienti senza URL diventano il NOME del brand in tipografia elegante.
 *
 * Props:
 * - title (required): titolo sezione (es. "Chi siamo").
 * - description?: sottotitolo/paragrafo.
 * - mainImage?/secondaryImage?: { src, alt } — fallback gradient se assenti.
 * - breakout?: { title, description, buttonText?, buttonUrl?, icon? } — riquadro highlight.
 * - companiesTitle? (default "Apprezzati da") / companies?: Array<{ name, logo? }>.
 * - achievementsTitle? (default "I nostri numeri") / achievementsDescription? / achievements?: Array<{ label, value }>.
 * - layout?: 'standard' (default) | 'compact' | 'editorial'.
 * - size?: 'compact' | 'normal' (default) | 'spacious'.
 * - tone?: 'modern' (default) | 'classic' | 'editorial' | 'playful'.
 * - palette?: { bg, ink, accent, muted } — CSS vars dinamiche.
 *
 * @example
 * <About3 title="Chi siamo" description="..." mainImage={{src:'...',alt:'...'}}
 *   achievements={[{label:'Anni',value:'60+'},{label:'Coperti',value:'80'}]}
 *   palette={{bg:'#FAF7F2',ink:'#2A1F1A',accent:'#A0522D',muted:'#E8DDD0'}} tone="classic" />
 */

type Palette = { bg: string; ink: string; accent: string; muted: string };
type Img = { src: string; alt: string };

export interface About3Props {
  title: string;
  description?: string;
  mainImage?: Img;
  secondaryImage?: Img;
  breakout?: { title: string; description: string; buttonText?: string; buttonUrl?: string; icon?: React.ReactNode };
  companiesTitle?: string;
  companies?: Array<{ name: string; logo?: string }>;
  achievementsTitle?: string;
  achievementsDescription?: string;
  achievements?: Array<{ label: string; value: string }>;
  layout?: 'standard' | 'compact' | 'editorial';
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

function Media({ img, className, rounded = 'rounded-2xl' }: { img?: Img; className?: string; rounded?: string }) {
  if (img?.src) return <img src={img.src} alt={img.alt} className={cx('h-full w-full object-cover', rounded, className)} />;
  return <div className={cx('h-full w-full', rounded, className)} style={{ background: 'linear-gradient(135deg, var(--lumino-accent, #8b5cf6), var(--lumino-muted, #f5f5f5))' }} aria-hidden="true" />;
}

function Stats({ items, serif }: { items: Array<{ label: string; value: string }>; serif: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
      {items.map((a, i) => (
        <div key={i}>
          <div className={cx('text-3xl md:text-4xl font-bold', serif && 'font-serif')} style={{ color: 'var(--lumino-accent, #8b5cf6)' }}>{a.value}</div>
          <div className="mt-1 text-sm" style={{ color: 'var(--lumino-ink, #1a1a1a)', opacity: 0.7 }}>{a.label}</div>
        </div>
      ))}
    </div>
  );
}

function Companies({ title, companies, serif }: { title: string; companies: Array<{ name: string; logo?: string }>; serif: boolean }) {
  return (
    <div className="mt-14">
      <p className="text-center text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--lumino-ink, #1a1a1a)', opacity: 0.55 }}>{title}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
        {companies.map((c, i) =>
          c.logo
            ? <img key={i} src={c.logo} alt={c.name} className="h-7 w-auto opacity-70" />
            : <span key={i} className={cx('text-lg font-semibold tracking-wide', serif && 'font-serif')} style={{ color: 'var(--lumino-ink, #1a1a1a)', opacity: 0.6 }}>{c.name}</span>
        )}
      </div>
    </div>
  );
}

const fade = { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.15 }, transition: { duration: 0.6, ease: 'easeOut' as const } };

export function About3({
  title,
  description,
  mainImage,
  secondaryImage,
  breakout,
  companiesTitle = 'Apprezzati da',
  companies,
  achievementsTitle = 'I nostri numeri',
  achievementsDescription,
  achievements,
  layout = 'standard',
  size = 'normal',
  tone = 'modern',
  palette,
  className,
}: About3Props) {
  const serif = tone === 'classic' || tone === 'editorial';
  const titleCls = cx('text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight', serif && 'font-serif', tone === 'editorial' && 'italic font-medium');
  const rootStyle: React.CSSProperties = { ...paletteVars(palette), background: 'var(--lumino-bg, #ffffff)', color: 'var(--lumino-ink, #1a1a1a)' };

  const Header = (
    <div className="max-w-2xl">
      <h2 className={titleCls}>{title}</h2>
      {description && <p className="mt-4 text-base md:text-lg leading-relaxed" style={{ color: 'var(--lumino-ink, #1a1a1a)', opacity: 0.78 }}>{description}</p>}
    </div>
  );

  // COMPACT — foto + descrizione + max 3 stat
  if (layout === 'compact') {
    return (
      <section className={cx('w-full', SIZE[size], className)} style={rootStyle}>
        <motion.div {...fade} className="mx-auto grid max-w-6xl items-center gap-10 px-6 md:grid-cols-2 md:px-8">
          <div className="aspect-[4/3] overflow-hidden"><Media img={mainImage} /></div>
          <div>
            {Header}
            {achievements && achievements.length > 0 && <div className="mt-8"><Stats items={achievements.slice(0, 3)} serif={serif} /></div>}
          </div>
        </motion.div>
      </section>
    );
  }

  // EDITORIAL — testo ricco a sinistra, immagine grande a destra, stats sotto
  if (layout === 'editorial') {
    return (
      <section className={cx('w-full', SIZE[size], className)} style={rootStyle}>
        <div className="mx-auto max-w-6xl px-6 md:px-8">
          <motion.div {...fade} className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              {Header}
              {breakout && (
                <div className="mt-8 rounded-2xl p-6" style={{ background: 'var(--lumino-muted, #f5f5f5)' }}>
                  <h3 className={cx('text-lg font-semibold', serif && 'font-serif')}>{breakout.title}</h3>
                  <p className="mt-2 text-sm" style={{ opacity: 0.78 }}>{breakout.description}</p>
                  {breakout.buttonText && <a href={breakout.buttonUrl || '#'} className="mt-4 inline-block text-sm font-semibold" style={{ color: 'var(--lumino-accent, #8b5cf6)' }}>{breakout.buttonText} →</a>}
                </div>
              )}
            </div>
            <div className="aspect-[4/5] overflow-hidden"><Media img={mainImage} /></div>
          </motion.div>
          {achievements && achievements.length > 0 && (
            <motion.div {...fade} className="mt-14">
              {achievementsTitle && <p className="mb-6 text-xs font-semibold uppercase tracking-[0.2em]" style={{ opacity: 0.55 }}>{achievementsTitle}</p>}
              <Stats items={achievements} serif={serif} />
            </motion.div>
          )}
          {companies && companies.length > 0 && <Companies title={companiesTitle} companies={companies} serif={serif} />}
        </div>
      </section>
    );
  }

  // STANDARD — header + grid (foto grande + breakout + foto secondaria) + stats + companies
  return (
    <section className={cx('w-full', SIZE[size], className)} style={rootStyle}>
      <div className="mx-auto max-w-6xl px-6 md:px-8">
        <motion.div {...fade}>{Header}</motion.div>
        <motion.div {...fade} className="mt-10 grid gap-5 md:grid-cols-3">
          <div className="aspect-[16/10] overflow-hidden md:col-span-2"><Media img={mainImage} /></div>
          <div className="flex flex-col gap-5">
            {breakout ? (
              <div className="flex flex-1 flex-col justify-between rounded-2xl p-6" style={{ background: 'var(--lumino-muted, #f5f5f5)' }}>
                <div>
                  {breakout.icon && <div className="mb-3" style={{ color: 'var(--lumino-accent, #8b5cf6)' }}>{breakout.icon}</div>}
                  <h3 className={cx('text-lg font-semibold', serif && 'font-serif')}>{breakout.title}</h3>
                  <p className="mt-2 text-sm" style={{ opacity: 0.78 }}>{breakout.description}</p>
                </div>
                {breakout.buttonText && <a href={breakout.buttonUrl || '#'} className="mt-4 inline-block text-sm font-semibold" style={{ color: 'var(--lumino-accent, #8b5cf6)' }}>{breakout.buttonText} →</a>}
              </div>
            ) : (
              <div className="aspect-square overflow-hidden"><Media img={secondaryImage} /></div>
            )}
            {breakout && secondaryImage && <div className="aspect-[4/3] overflow-hidden"><Media img={secondaryImage} /></div>}
          </div>
        </motion.div>
        {achievements && achievements.length > 0 && (
          <motion.div {...fade} className="mt-14">
            {(achievementsTitle || achievementsDescription) && (
              <div className="mb-6 max-w-2xl">
                {achievementsTitle && <h3 className={cx('text-xl font-semibold', serif && 'font-serif')}>{achievementsTitle}</h3>}
                {achievementsDescription && <p className="mt-2 text-sm" style={{ opacity: 0.7 }}>{achievementsDescription}</p>}
              </div>
            )}
            <Stats items={achievements} serif={serif} />
          </motion.div>
        )}
        {companies && companies.length > 0 && <Companies title={companiesTitle} companies={companies} serif={serif} />}
      </div>
    </section>
  );
}
