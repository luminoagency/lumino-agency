'use client';

import React from 'react';

/** StarBorder — bordo con gradiente animato rotante. Props: children, color?, speed?. */
export interface StarBorderProps { children: React.ReactNode; color?: string; speed?: number; className?: string; }

export function StarBorder({ children, color, speed = 6, className }: StarBorderProps) {
  const c = color || 'var(--lumino-accent, #8b5cf6)';
  return (
    <span className={['relative inline-flex overflow-hidden rounded-xl p-[1.5px]', className].filter(Boolean).join(' ')}>
      <style>{`@keyframes lumino-star-spin { to { transform: rotate(360deg); } }`}</style>
      <span className="absolute left-1/2 top-1/2 aspect-square w-[200%] -translate-x-1/2 -translate-y-1/2"
        style={{ background: `conic-gradient(from 0deg, transparent 0deg, ${c} 60deg, transparent 120deg)`, animation: `lumino-star-spin ${speed}s linear infinite` }} aria-hidden />
      <span className="relative z-10 inline-flex rounded-[10px] px-4 py-2" style={{ background: 'var(--lumino-bg, #ffffff)', color: 'var(--lumino-ink, #1a1a1a)' }}>
        {children}
      </span>
    </span>
  );
}

export default StarBorder;
