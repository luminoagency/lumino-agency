'use client';

import React, { useRef, useState } from 'react';

/**
 * MagnetLines — griglia di piccole linee (trattini) che si orientano verso il
 * cursore, creando un effetto magnetico. Riempie il contenitore parent.
 * Decorativo (aria-hidden) ma con pointer-events attivi per leggere il mouse.
 *
 * Props:
 * - color?: colore delle linee (fallback var --lumino-accent).
 * - density? (default 12): numero di linee per lato (griglia density×density).
 * - className?: classi extra del contenitore.
 *
 * @example
 * <div className="relative h-80">
 *   <MagnetLines color="#8b5cf6" density={14} />
 * </div>
 */

export interface MagnetLinesProps {
  color?: string;
  density?: number;
  className?: string;
}

const cx = (...a: Array<string | false | undefined>) => a.filter(Boolean).join(' ');

export function MagnetLines({ color, density = 12, className }: MagnetLinesProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState<{ x: number; y: number } | null>(null);
  const lineColor = color || 'var(--lumino-accent, #8b5cf6)';
  const n = Math.max(2, density);
  const cells = Array.from({ length: n * n });

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  function angleFor(col: number, row: number, rect: DOMRect | null): number {
    if (!mouse || !rect) return 0; // angolo neutro senza mouse
    const cx2 = ((col + 0.5) / n) * rect.width;
    const cy2 = ((row + 0.5) / n) * rect.height;
    return (Math.atan2(mouse.y - cy2, mouse.x - cx2) * 180) / Math.PI;
  }

  const rect = ref.current?.getBoundingClientRect() ?? null;

  return (
    <div
      ref={ref}
      aria-hidden
      onMouseMove={handleMove}
      onMouseLeave={() => setMouse(null)}
      className={cx('absolute inset-0 overflow-hidden', className)}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${n}, 1fr)`,
        gridTemplateRows: `repeat(${n}, 1fr)`,
        placeItems: 'center',
      }}
    >
      {cells.map((_, i) => {
        const col = i % n;
        const row = Math.floor(i / n);
        return (
          <span
            key={i}
            style={{
              width: '40%',
              maxWidth: '32px',
              height: '2px',
              background: lineColor,
              borderRadius: '9999px',
              transform: `rotate(${angleFor(col, row, rect)}deg)`,
              transition: 'transform 0.25s ease-out',
            }}
          />
        );
      })}
    </div>
  );
}

export default MagnetLines;
