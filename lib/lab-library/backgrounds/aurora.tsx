'use client';

import React from 'react';

/** Aurora — sfondo gradiente animato (decorativo, assoluto). Props: colors?, intensity?. */
export interface AuroraProps { colors?: string[]; intensity?: number; className?: string; }

export function Aurora({ colors, intensity = 0.5, className }: AuroraProps) {
  const cs = colors && colors.length >= 2 ? colors : ['var(--lumino-accent, #8b5cf6)', 'var(--lumino-muted, #f5f5f5)'];
  return (
    <div aria-hidden className={['pointer-events-none absolute inset-0 overflow-hidden', className].filter(Boolean).join(' ')} style={{ opacity: intensity }}>
      <style>{`@keyframes lumino-aurora { 0%,100% { transform: translate(-5%,-5%) scale(1); } 50% { transform: translate(6%,4%) scale(1.15); } }`}</style>
      <div className="absolute inset-[-30%]" style={{
        background: `radial-gradient(40% 50% at 30% 30%, ${cs[0]} 0%, transparent 60%), radial-gradient(45% 55% at 70% 65%, ${cs[1]} 0%, transparent 60%)`,
        filter: 'blur(80px)',
        animation: 'lumino-aurora 18s ease-in-out infinite',
      }} />
    </div>
  );
}

export default Aurora;
