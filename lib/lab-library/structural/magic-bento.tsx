'use client';

import React from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';

/**
 * MagicBento
 * Griglia bento premium con effetto spotlight: un glow radiale color accento
 * segue il cursore all'interno di ogni card. Le card entrano con un'animazione
 * stagger e occupano colonne/righe diverse in base alla dimensione.
 *
 * @prop items - elenco di celle con titolo, descrizione, icona (nome lucide) e dimensione.
 * @prop className - classi CSS aggiuntive per il contenitore.
 */
export interface MagicBentoProps {
  items: Array<{
    title: string;
    description: string;
    icon?: string;
    size?: 'sm' | 'md' | 'lg';
  }>;
  className?: string;
}

function sizeClasses(size: 'sm' | 'md' | 'lg' | undefined): string {
  switch (size) {
    case 'lg':
      return 'md:col-span-2 md:row-span-2';
    case 'md':
      return 'md:col-span-2 md:row-span-1';
    default:
      return 'md:col-span-1 md:row-span-1';
  }
}

function BentoCell({
  item,
  index,
}: {
  item: { title: string; description: string; icon?: string; size?: 'sm' | 'md' | 'lg' };
  index: number;
}) {
  const Ico = (item.icon && (Icons as any)[item.icon]) ?? Icons.Star;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - rect.top}px`);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, delay: index * 0.06 }}
      className={['group relative overflow-hidden rounded-2xl p-6', sizeClasses(item.size)]
        .filter(Boolean)
        .join(' ')}
      style={{
        backgroundColor: 'var(--lumino-muted, #f5f5f5)',
        color: 'var(--lumino-ink, #1a1a1a)',
        border: '1px solid color-mix(in srgb, var(--lumino-accent, #8b5cf6) 25%, transparent)',
      }}
    >
      {/* Glow radiale che segue il mouse */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(420px circle at var(--mx) var(--my), color-mix(in srgb, var(--lumino-accent, #8b5cf6) 30%, transparent), transparent 60%)',
        }}
      />
      <div className="relative z-10 flex h-full flex-col gap-3">
        <span
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--lumino-accent, #8b5cf6) 15%, transparent)',
            color: 'var(--lumino-accent, #8b5cf6)',
          }}
        >
          <Ico size={22} strokeWidth={1.8} />
        </span>
        <h3 className="text-lg font-bold leading-tight">{item.title}</h3>
        <p className="text-sm leading-relaxed opacity-75">{item.description}</p>
      </div>
    </motion.div>
  );
}

export function MagicBento({ items, className }: MagicBentoProps) {
  if (!items || items.length === 0) return null;

  const containerClass = [
    'grid grid-cols-1 gap-4 md:grid-cols-3 md:auto-rows-[180px]',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={containerClass}
      style={{ backgroundColor: 'var(--lumino-bg, #ffffff)' }}
    >
      {items.map((item, i) => (
        <BentoCell key={i} item={item} index={i} />
      ))}
    </div>
  );
}

export default MagicBento;
