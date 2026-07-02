'use client';

import React from 'react';
import { motion } from 'framer-motion';

/**
 * ShapeBlur — forme colorate sfocate che fluttuano lentamente, puramente decorative.
 * Nessun WebGL: solo CSS (filter blur) + framer-motion. Posizioni deterministiche in base all'indice.
 *
 * Props:
 * - shapes: elenco di forme da renderizzare (tipo, colore, dimensione in px)
 * - blur: intensità della sfocatura in px (default 80)
 * - className: classi aggiuntive sul contenitore
 */
export interface ShapeBlurProps {
  shapes: Array<{ type: 'circle' | 'blob' | 'square'; color: string; size: number }>;
  blur?: number;
  className?: string;
}

export function ShapeBlur({ shapes, blur = 80, className }: ShapeBlurProps) {
  if (!shapes || shapes.length === 0) return null;

  return (
    <div
      aria-hidden
      className={['relative overflow-hidden', className].filter(Boolean).join(' ')}
      style={{ background: 'var(--lumino-bg, #ffffff)' }}
    >
      {shapes.map((shape, i) => {
        // Posizioni e tempi pseudo-casuali ma deterministici in base all'indice.
        const left = (i * 37) % 90;
        const top = (i * 53) % 85;
        const driftX = ((i % 5) - 2) * 18;
        const driftY = (((i + 2) % 5) - 2) * 18;
        const duration = 14 + (i % 6) * 3;
        const delay = (i % 4) * 0.6;

        const radius =
          shape.type === 'circle'
            ? '9999px'
            : shape.type === 'blob'
              ? '42% 58% 63% 37% / 47% 36% 64% 53%'
              : '0.75rem';

        return (
          <motion.div
            key={i}
            initial={{ x: 0, y: 0, scale: 1 }}
            animate={{
              x: [0, driftX, -driftX, 0],
              y: [0, driftY, -driftY, 0],
              scale: [1, 1.12, 0.95, 1],
            }}
            transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              left: `${left}%`,
              top: `${top}%`,
              width: shape.size,
              height: shape.size,
              background: shape.color || 'var(--lumino-accent, #8b5cf6)',
              filter: `blur(${blur}px)`,
              borderRadius: radius,
              opacity: 0.6,
              willChange: 'transform',
            }}
          />
        );
      })}
    </div>
  );
}

export default ShapeBlur;
