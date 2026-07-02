'use client';

import React from 'react';

/**
 * ProductCard — card prodotto (COLLECTION: usata con .map()). Multi-business: prodotti
 * shop, pacchetti, articoli. Palette via CSS vars.
 *
 * Props (per item):
 * - name (required) / description? / price (required) / originalPrice? (per sconto).
 * - image?: { src, alt } — fallback gradient se assente.
 * - badges?: string[] — etichette in alto (es. "Novità").
 * - variants?: Array<{ color: string; label?: string }> — pallini colore selezionabili (statici).
 * - cta?: { label, href? } — pulsante.
 * - layout?: 'card' (default) | 'minimal'. size?, tone?, palette?.
 *
 * @example
 * <ProductCard name="Camicia di lino" price={59} originalPrice={79}
 *   image={{src:'...',alt:'Camicia'}} badges={['Novità']} variants={[{color:'#222'},{color:'#a33'}]}
 *   cta={{label:'Acquista'}} palette={{bg:'#fff',ink:'#111',accent:'#8b5cf6',muted:'#f5f5f5'}} />
 */

type Palette = { bg: string; ink: string; accent: string; muted: string };
type Img = { src: string; alt: string };
type Cta = { label: string; href?: string };

export interface ProductCardProps {
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  image?: Img;
  badges?: string[];
  variants?: Array<{ color: string; label?: string }>;
  cta?: Cta;
  layout?: 'card' | 'minimal';
  size?: 'compact' | 'normal' | 'spacious';
  tone?: 'modern' | 'classic' | 'editorial' | 'playful';
  palette?: Palette;
  className?: string;
}

const cx = (...a: Array<string | false | undefined>) => a.filter(Boolean).join(' ');
const euro = (n: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n);
function paletteVars(p?: Palette): React.CSSProperties {
  return p ? ({ '--lumino-bg': p.bg, '--lumino-ink': p.ink, '--lumino-accent': p.accent, '--lumino-muted': p.muted } as React.CSSProperties) : {};
}

function PriceRow({ price, originalPrice }: { price: number; originalPrice?: number }) {
  const discount = typeof originalPrice === 'number' && originalPrice > price;
  return (
    <div className="flex items-baseline gap-2">
      {discount && <span className="text-sm line-through" style={{ opacity: 0.5 }}>{euro(originalPrice!)}</span>}
      <span className="text-lg font-bold">{euro(price)}</span>
    </div>
  );
}

export function ProductCard(props: ProductCardProps) {
  const { name, description, price, originalPrice, image, badges, variants, cta, layout = 'card', tone = 'modern', palette, className } = props;
  const serif = tone === 'classic' || tone === 'editorial';
  const rootStyle: React.CSSProperties = { ...paletteVars(palette), background: 'var(--lumino-bg, #ffffff)', color: 'var(--lumino-ink, #1a1a1a)', borderColor: 'var(--lumino-muted, #e5e5e5)' };

  if (layout === 'minimal') {
    return (
      <div className={cx('flex items-center justify-between gap-4 border-b py-3', className)} style={{ ...paletteVars(palette), color: 'var(--lumino-ink, #1a1a1a)', borderColor: 'var(--lumino-muted, #e5e5e5)' }}>
        <div>
          <h3 className={cx('text-sm font-semibold', serif && 'font-serif')}>{name}</h3>
          {description && <p className="text-xs" style={{ opacity: 0.6 }}>{description}</p>}
        </div>
        <PriceRow price={price} originalPrice={originalPrice} />
      </div>
    );
  }

  return (
    <article className={cx('flex w-full flex-col overflow-hidden rounded-2xl border', className)} style={rootStyle}>
      <div className="relative aspect-square overflow-hidden" style={{ background: 'var(--lumino-muted, #f5f5f5)' }}>
        {image?.src
          ? <img src={image.src} alt={image.alt} className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" />
          : <div className="h-full w-full" style={{ background: 'linear-gradient(135deg, var(--lumino-accent, #8b5cf6), var(--lumino-muted, #f5f5f5))' }} aria-hidden="true" />}
        {badges && badges.length > 0 && (
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {badges.map((b, i) => (
              <span key={i} className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold" style={{ background: 'var(--lumino-accent, #8b5cf6)', color: '#fff' }}>{b}</span>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <h3 className={cx('text-base font-semibold break-words', serif && 'font-serif')}>{name}</h3>
        {description && <p className="mt-1 break-words text-sm" style={{ opacity: 0.7 }}>{description}</p>}
        {variants && variants.length > 0 && (
          <div className="mt-3 flex gap-2">
            {variants.map((v, i) => (
              <span key={i} title={v.label} className="h-5 w-5 rounded-full border" style={{ background: v.color, borderColor: 'var(--lumino-muted, #d4d4d4)' }} />
            ))}
          </div>
        )}
        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <PriceRow price={price} originalPrice={originalPrice} />
          {cta && (
            cta.href
              ? <a href={cta.href} className="rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: 'var(--lumino-accent, #8b5cf6)', color: '#fff' }}>{cta.label}</a>
              : <button type="button" className="rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: 'var(--lumino-accent, #8b5cf6)', color: '#fff' }}>{cta.label}</button>
          )}
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
