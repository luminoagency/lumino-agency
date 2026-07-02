'use client';

import React from 'react';

/** ElectricBorder — bordo con gradiente animato "elettrico". Props: children, color?, speed?. */
export interface ElectricBorderProps { children: React.ReactNode; color?: string; speed?: number; className?: string; }

export function ElectricBorder({ children, color, speed = 3, className }: ElectricBorderProps) {
  const c = color || 'var(--lumino-accent, #8b5cf6)';
  return (
    <span className={['relative inline-flex overflow-hidden rounded-xl p-[2px]', className].filter(Boolean).join(' ')}>
      <style>{`@keyframes lumino-elec-spin { to { transform: rotate(360deg); } } @keyframes lumino-elec-flicker { 0%,100%{opacity:1} 47%{opacity:.6} 50%{opacity:1} 53%{opacity:.75} }`}</style>
      <span className="absolute left-1/2 top-1/2 aspect-square w-[200%] -translate-x-1/2 -translate-y-1/2"
        style={{ background: `conic-gradient(from 0deg, transparent 0deg, ${c} 40deg, #ffffff 55deg, ${c} 70deg, transparent 110deg)`, animation: `lumino-elec-spin ${Math.max(1, speed)}s linear infinite, lumino-elec-flicker 0.4s infinite` }} aria-hidden />
      <span className="relative z-10 inline-flex rounded-[10px] px-4 py-2" style={{ background: 'var(--lumino-bg, #0a0a0a)', color: 'var(--lumino-ink, #ffffff)' }}>
        {children}
      </span>
    </span>
  );
}

export default ElectricBorder;
