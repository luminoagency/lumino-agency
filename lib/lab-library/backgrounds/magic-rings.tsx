'use client';

import React from 'react';

/**
 * MagicRings — sfondo decorativo con anelli concentrici che pulsano ed
 * espandono in loop, con delay scaglionato. Overlay assoluto da inserire
 * dentro un contenitore `relative`. Puramente decorativo (aria-hidden).
 *
 * Props:
 * - color?: colore del bordo degli anelli (fallback var --lumino-accent).
 * - ringsCount? (default 5): numero di anelli.
 * - speed? (default 8): durata in secondi di un ciclo completo.
 * - className?: classi extra del contenitore.
 *
 * @example
 * <div className="relative">
 *   <MagicRings color="#8b5cf6" ringsCount={6} />
 *   …contenuto…
 * </div>
 */

export interface MagicRingsProps {
  color?: string;
  ringsCount?: number;
  speed?: number;
  className?: string;
}

const cx = (...a: Array<string | false | undefined>) => a.filter(Boolean).join(' ');

export function MagicRings({ color, ringsCount = 5, speed = 8, className }: MagicRingsProps) {
  const stroke = color || 'var(--lumino-accent, #8b5cf6)';
  const rings = Array.from({ length: Math.max(1, ringsCount) });

  return (
    <div
      aria-hidden
      className={cx('pointer-events-none absolute inset-0 overflow-hidden', className)}
    >
      <style>{`
        @keyframes lumino-rings {
          0%   { transform: translate(-50%, -50%) scale(0.2); opacity: 0; }
          15%  { opacity: 0.8; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
        }
      `}</style>
      {rings.map((_, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '120vmax',
            height: '120vmax',
            borderRadius: '9999px',
            border: `1.5px solid ${stroke}`,
            transform: 'translate(-50%, -50%) scale(0.2)',
            opacity: 0,
            animation: `lumino-rings ${speed}s linear infinite`,
            animationDelay: `${(speed / rings.length) * i}s`,
          }}
        />
      ))}
    </div>
  );
}

export default MagicRings;
