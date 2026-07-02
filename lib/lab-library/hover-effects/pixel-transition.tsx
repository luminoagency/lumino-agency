'use client';

import React from 'react';

/** PixelTransition — overlay "a pixel" che appare all'hover. Props: children, pixelSize?, color?. */
export interface PixelTransitionProps { children: React.ReactNode; pixelSize?: number; color?: string; className?: string; }

export function PixelTransition({ children, pixelSize = 24, color, className }: PixelTransitionProps) {
  const c = color || 'var(--lumino-accent, #8b5cf6)';
  const cols = Math.max(4, Math.round(240 / pixelSize));
  const rows = Math.max(3, Math.round(cols * 0.6));
  return (
    <span className={['group relative inline-block overflow-hidden', className].filter(Boolean).join(' ')}>
      {children}
      <span className="pointer-events-none absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${cols},1fr)`, gridTemplateRows: `repeat(${rows},1fr)` }} aria-hidden>
        {Array.from({ length: cols * rows }).map((_, i) => (
          <span key={i} className="opacity-0 transition-opacity duration-200 group-hover:opacity-100" style={{ background: c, transitionDelay: `${((i % cols) + Math.floor(i / cols)) * 18}ms` }} />
        ))}
      </span>
    </span>
  );
}

export default PixelTransition;
