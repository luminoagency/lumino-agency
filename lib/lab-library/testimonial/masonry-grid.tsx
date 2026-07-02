'use client';

import React from 'react';
import { motion } from 'framer-motion';

/**
 * MasonryGrid — wrapper a colonne (masonry CSS) per impaginare card eterogenee come
 * children. Pensato per muri di recensioni/immagini. Ogni child entra in vista con fade.
 *
 * Props:
 * - columns?: numero colonne (default 3).
 * - gap?: spaziatura in unità tailwind (default 4).
 * - children (required): le card da impaginare.
 * - palette?: { bg, ink, accent, muted }. tone?, className?.
 *
 * @example
 * <MasonryGrid columns={3} gap={5} palette={{bg:'#fff',ink:'#111',accent:'#8b5cf6',muted:'#f5f5f5'}}>
 *   <Card/> <Card/> <Card/>
 * </MasonryGrid>
 */

type Palette = { bg: string; ink: string; accent: string; muted: string };

export interface MasonryGridProps {
  columns?: number;
  gap?: number;
  children: React.ReactNode;
  palette?: Palette;
  tone?: 'modern' | 'classic' | 'editorial' | 'playful';
  className?: string;
}

const cx = (...a: Array<string | false | undefined>) => a.filter(Boolean).join(' ');
function paletteVars(p?: Palette): React.CSSProperties {
  return p ? ({ '--lumino-bg': p.bg, '--lumino-ink': p.ink, '--lumino-accent': p.accent, '--lumino-muted': p.muted } as React.CSSProperties) : {};
}

export function MasonryGrid({ columns = 3, gap = 4, children, palette, className }: MasonryGridProps) {
  const style: React.CSSProperties = {
    ...paletteVars(palette),
    columnCount: columns,
    columnGap: `${gap * 0.25}rem`,
    background: 'var(--lumino-bg, #ffffff)',
    color: 'var(--lumino-ink, #1a1a1a)',
  };
  return (
    <div className={cx('w-full', className)} style={style}>
      {React.Children.map(children, (child, i) => (
        <motion.div
          className="break-inside-avoid"
          style={{ marginBottom: `${gap * 0.25}rem` }}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.4), ease: 'easeOut' }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
}

export default MasonryGrid;
