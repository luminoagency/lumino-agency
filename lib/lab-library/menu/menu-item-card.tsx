'use client';

import React from 'react';

/**
 * MenuItemCard — card per UN voce di menu / servizio (COLLECTION: usata con .map()).
 * Vetrina, NON delivery: rimosso l'hover "Aggiungi". Funziona per ristorante (piatti)
 * e per servizi (barbiere, hotel, dentista) grazie alle props opzionali.
 *
 * Props:
 * - name (required): nome piatto/servizio.
 * - description?: descrizione breve.
 * - price (required): prezzo €. originalPrice?: se > price mostra lo sconto.
 * - image?: { src, alt } — opzionale (layout 'minimal' la ignora).
 * - isVegetarian?/isVegan?/isGlutenFree?/isSpicy?: badge discreti in alto a destra.
 * - allergens?: string[] — riga "Allergeni: ..." sotto il prezzo.
 * - prepTime?: minuti. featured?: bordo accent + label "Specialità".
 * - layout?: 'card' (default, foto sopra) | 'list' (foto a sinistra) | 'minimal' (no foto).
 * - size?: 'compact' | 'normal' (default) | 'spacious'. tone?, palette?.
 *
 * @example
 * <MenuItemCard name="Ossobuco alla milanese" description="..." price={22} originalPrice={26}
 *   image={{src:'...',alt:'Ossobuco'}} prepTime={40} featured allergens={['glutine']}
 *   palette={{bg:'#FAF7F2',ink:'#2A1F1A',accent:'#A0522D',muted:'#E8DDD0'}} layout="card" />
 */

type Palette = { bg: string; ink: string; accent: string; muted: string };
type Img = { src: string; alt: string };

export interface MenuItemCardProps {
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  image?: Img;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  isSpicy?: boolean;
  allergens?: string[];
  prepTime?: number;
  featured?: boolean;
  layout?: 'card' | 'list' | 'minimal';
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

function Badges({ p }: { p: MenuItemCardProps }) {
  const items: Array<[string, string]> = [];
  if (p.isVegetarian) items.push(['🌱', 'Vegetariano']);
  if (p.isVegan) items.push(['🌿', 'Vegano']);
  if (p.isGlutenFree) items.push(['GF', 'Senza glutine']);
  if (p.isSpicy) items.push(['🌶️', 'Piccante']);
  if (!items.length) return null;
  return (
    <div className="flex gap-1.5">
      {items.map(([icon, label], i) => (
        <span key={i} title={label} aria-label={label}
          className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold shadow-sm"
          style={{ background: 'var(--lumino-bg, #ffffff)', color: 'var(--lumino-ink, #1a1a1a)' }}>
          {icon}
        </span>
      ))}
    </div>
  );
}

function Price({ price, originalPrice, featured }: { price: number; originalPrice?: number; featured?: boolean }) {
  const discount = typeof originalPrice === 'number' && originalPrice > price;
  return (
    <div className="flex items-baseline gap-2 whitespace-nowrap">
      {discount && <span className="text-sm line-through" style={{ opacity: 0.5 }}>{euro(originalPrice!)}</span>}
      <span className="text-lg font-bold" style={{ color: featured ? 'var(--lumino-accent, #8b5cf6)' : 'var(--lumino-ink, #1a1a1a)' }}>{euro(price)}</span>
      {discount && (
        <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold" style={{ background: 'var(--lumino-accent, #8b5cf6)', color: '#ffffff' }}>
          -{Math.round((1 - price / originalPrice!) * 100)}%
        </span>
      )}
    </div>
  );
}

function FeaturedTag() {
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold" style={{ background: 'var(--lumino-accent, #8b5cf6)', color: '#ffffff' }}>
      Specialità
    </span>
  );
}

function Meta({ prepTime, allergens }: { prepTime?: number; allergens?: string[] }) {
  return (
    <>
      {typeof prepTime === 'number' && <span className="text-xs" style={{ opacity: 0.6 }}>⏱ {prepTime} min</span>}
      {allergens && allergens.length > 0 && <p className="mt-1 text-xs" style={{ opacity: 0.55 }}>Allergeni: {allergens.join(', ')}</p>}
    </>
  );
}

export function MenuItemCard(props: MenuItemCardProps) {
  const { name, description, price, originalPrice, image, allergens, prepTime, featured, layout = 'card', tone = 'modern', palette, className } = props;
  const serif = tone === 'classic' || tone === 'editorial';
  const nameCls = cx('font-semibold leading-snug break-words', serif && 'font-serif');
  const rootStyle: React.CSSProperties = {
    ...paletteVars(palette),
    background: 'var(--lumino-bg, #ffffff)',
    color: 'var(--lumino-ink, #1a1a1a)',
    borderColor: featured ? 'var(--lumino-accent, #8b5cf6)' : 'var(--lumino-muted, #e5e5e5)',
  };

  // MINIMAL — nome … prezzo, descrizione sotto. Niente foto (carta elegante).
  if (layout === 'minimal') {
    return (
      <div className={cx('w-full border-b py-4', className)} style={{ ...paletteVars(palette), color: 'var(--lumino-ink, #1a1a1a)', borderColor: 'var(--lumino-muted, #e5e5e5)' }}>
        <div className="flex items-baseline justify-between gap-4">
          <div className="flex items-center gap-2">
            <h3 className={cx(nameCls, 'text-base')}>{name}</h3>
            {featured && <FeaturedTag />}
            <Badges p={props} />
          </div>
          <Price price={price} originalPrice={originalPrice} featured={featured} />
        </div>
        {description && <p className="mt-1 break-words text-sm" style={{ opacity: 0.7 }}>{description}</p>}
        <Meta prepTime={prepTime} allergens={allergens} />
      </div>
    );
  }

  // LIST — foto a sinistra, info a destra (menu lunghi).
  if (layout === 'list') {
    return (
      <article className={cx('flex w-full gap-4 overflow-hidden rounded-2xl border p-3', className)} style={rootStyle}>
        {image?.src && (
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl sm:h-28 sm:w-28">
            <img src={image.src} alt={image.alt} className="h-full w-full object-cover" />
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <h3 className={cx(nameCls, 'text-base')}>{name}</h3>
              {featured && <FeaturedTag />}
            </div>
            <Badges p={props} />
          </div>
          {description && <p className="mt-1 break-words text-sm" style={{ opacity: 0.7 }}>{description}</p>}
          <div className="mt-auto flex items-end justify-between gap-3 pt-2">
            <Price price={price} originalPrice={originalPrice} featured={featured} />
            <Meta prepTime={prepTime} allergens={allergens} />
          </div>
        </div>
      </article>
    );
  }

  // CARD (default) — foto sopra, info sotto. Nessun hover "Aggiungi".
  return (
    <article className={cx('flex w-full flex-col overflow-hidden rounded-2xl border transition-shadow hover:shadow-md', className)} style={{ ...rootStyle, borderWidth: featured ? 2 : 1 }}>
      {image?.src ? (
        <div className="relative aspect-[4/3] overflow-hidden">
          <img src={image.src} alt={image.alt} className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" />
          <div className="absolute right-3 top-3"><Badges p={props} /></div>
          {featured && <div className="absolute left-3 top-3"><FeaturedTag /></div>}
        </div>
      ) : null}
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className={cx(nameCls, 'text-base')}>{name}</h3>
            {featured && !image?.src && <FeaturedTag />}
          </div>
          {!image?.src && <Badges p={props} />}
        </div>
        {description && <p className="mt-1.5 break-words text-sm" style={{ opacity: 0.7 }}>{description}</p>}
        <div className="mt-auto flex items-end justify-between gap-3 pt-3">
          <Price price={price} originalPrice={originalPrice} featured={featured} />
          {typeof prepTime === 'number' && <span className="text-xs" style={{ opacity: 0.6 }}>⏱ {prepTime} min</span>}
        </div>
        {allergens && allergens.length > 0 && <p className="mt-1 text-xs" style={{ opacity: 0.55 }}>Allergeni: {allergens.join(', ')}</p>}
      </div>
    </article>
  );
}
