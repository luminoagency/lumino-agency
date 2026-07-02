import React from 'react';

/** GridPattern — sfondo a griglia sottile (decorativo, assoluto). Props: size?, color?, opacity?. */
export interface GridPatternProps { size?: number; color?: string; opacity?: number; className?: string; }

export function GridPattern({ size = 40, color, opacity = 0.4, className }: GridPatternProps) {
  const c = color || 'var(--lumino-muted, #e5e5e5)';
  return (
    <div
      aria-hidden
      className={['pointer-events-none absolute inset-0', className].filter(Boolean).join(' ')}
      style={{ opacity, backgroundImage: `linear-gradient(${c} 1px, transparent 1px), linear-gradient(90deg, ${c} 1px, transparent 1px)`, backgroundSize: `${size}px ${size}px` }}
    />
  );
}

export default GridPattern;
