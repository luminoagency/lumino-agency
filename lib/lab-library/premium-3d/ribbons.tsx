'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

/**
 * Ribbons — nastri fluidi colorati che ondeggiano (decorativo).
 * Usa SVG + framer-motion (nessun three.js). aria-hidden, puramente estetico.
 *
 * Props:
 * - colors?: Array<string> colori dei nastri. Se assente usa accent + varianti.
 * - count? (default 3): numero di nastri.
 * - className?: classi extra sul contenitore.
 *
 * @example
 * <Ribbons count={4} colors={['#8b5cf6', '#ec4899']} />
 */

export interface RibbonsProps {
  colors?: Array<string>;
  count?: number;
  className?: string;
}

/** Genera il path di un'onda alla fase data (per l'animazione del `d`). */
function wavePath(phase: number, offsetY: number, amp: number): string {
  const y0 = offsetY + Math.sin(phase) * amp;
  const y1 = offsetY + Math.sin(phase + 1) * amp;
  const y2 = offsetY + Math.sin(phase + 2) * amp;
  const y3 = offsetY + Math.sin(phase + 3) * amp;
  return `M -10 ${y0} C 250 ${y1}, 500 ${y2}, 760 ${y3} C 900 ${y0}, 1000 ${y1}, 1210 ${y2}`;
}

export function Ribbons({ colors, count = 3, className }: RibbonsProps) {
  const accent = 'var(--lumino-accent, #8b5cf6)';
  const palette = useMemo(
    () =>
      colors && colors.length > 0
        ? colors
        : [accent, 'var(--lumino-accent, #8b5cf6)', 'var(--lumino-muted, #222)'],
    [colors],
  );

  const ribbons = useMemo(
    () =>
      Array.from({ length: Math.max(1, count) }, (_, i) => ({
        color: palette[i % palette.length],
        offsetY: 200 + ((i - count / 2) * 90),
        amp: 40 + i * 8,
        duration: 8 + i * 1.5,
      })),
    [count, palette],
  );

  return (
    <div
      aria-hidden
      className={['pointer-events-none absolute inset-0 overflow-hidden', className]
        .filter(Boolean)
        .join(' ')}
    >
      <svg
        className="h-full w-full"
        viewBox="0 0 1200 600"
        preserveAspectRatio="none"
        style={{ filter: 'blur(8px)' }}
      >
        {ribbons.map((r, i) => (
          <motion.path
            key={i}
            stroke={r.color}
            strokeWidth={36}
            strokeLinecap="round"
            fill="none"
            style={{ opacity: 0.4 }}
            initial={{ d: wavePath(0, r.offsetY, r.amp) }}
            animate={{
              d: [
                wavePath(0, r.offsetY, r.amp),
                wavePath(Math.PI, r.offsetY, r.amp),
                wavePath(Math.PI * 2, r.offsetY, r.amp),
              ],
            }}
            transition={{ duration: r.duration, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </svg>
    </div>
  );
}

export default Ribbons;
