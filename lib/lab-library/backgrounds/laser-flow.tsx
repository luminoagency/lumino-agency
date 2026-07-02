'use client';

import React from 'react';

/**
 * LaserFlow — sfondo decorativo con fasci laser luminosi che scorrono in
 * movimento (diagonale, orizzontale o verticale). Overlay assoluto da
 * inserire in un contenitore `relative`. Puramente decorativo (aria-hidden).
 *
 * Props:
 * - color?: colore dei fasci (fallback var --lumino-accent).
 * - intensity? (default 0.6): opacità complessiva (0..1).
 * - direction? (default 'diagonal'): 'horizontal' | 'vertical' | 'diagonal'.
 * - className?: classi extra del contenitore.
 *
 * @example
 * <div className="relative">
 *   <LaserFlow color="#8b5cf6" intensity={0.5} direction="diagonal" />
 *   …contenuto…
 * </div>
 */

export interface LaserFlowProps {
  color?: string;
  intensity?: number;
  direction?: 'horizontal' | 'vertical' | 'diagonal';
  className?: string;
}

const cx = (...a: Array<string | false | undefined>) => a.filter(Boolean).join(' ');

export function LaserFlow({
  color,
  intensity = 0.6,
  direction = 'diagonal',
  className,
}: LaserFlowProps) {
  const beam = color || 'var(--lumino-accent, #8b5cf6)';
  const op = Math.max(0, Math.min(1, intensity));

  const rotate = direction === 'horizontal' ? 0 : direction === 'vertical' ? 90 : 35;
  const beams = Array.from({ length: 6 });

  return (
    <div
      aria-hidden
      className={cx('pointer-events-none absolute inset-0 overflow-hidden', className)}
      style={{ opacity: op, mixBlendMode: 'screen' }}
    >
      <style>{`
        @keyframes lumino-laser {
          0%   { transform: translateX(-120%); }
          100% { transform: translateX(120%); }
        }
      `}</style>
      <div
        style={{
          position: 'absolute',
          inset: '-50%',
          transform: `rotate(${rotate}deg)`,
        }}
      >
        {beams.map((_, i) => (
          <span
            key={i}
            style={{
              position: 'absolute',
              top: `${(i / beams.length) * 100}%`,
              left: 0,
              width: '60%',
              height: `${8 + (i % 3) * 4}px`,
              background: `linear-gradient(90deg, transparent, ${beam}, transparent)`,
              filter: 'blur(8px)',
              animation: `lumino-laser ${6 + i * 1.5}s linear infinite`,
              animationDelay: `${i * 0.9}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default LaserFlow;
