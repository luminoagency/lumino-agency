import React from 'react';

/** DotsPattern — sfondo a punti (decorativo, assoluto). Props: size?, gap?, color?, opacity?. */
export interface DotsPatternProps { size?: number; gap?: number; color?: string; opacity?: number; className?: string; }

export function DotsPattern({ size = 1.5, gap = 18, color, opacity = 0.5, className }: DotsPatternProps) {
  const c = color || 'var(--lumino-muted, #d4d4d4)';
  return (
    <div
      aria-hidden
      className={['pointer-events-none absolute inset-0', className].filter(Boolean).join(' ')}
      style={{ opacity, backgroundImage: `radial-gradient(${c} ${size}px, transparent ${size}px)`, backgroundSize: `${gap}px ${gap}px` }}
    />
  );
}

export default DotsPattern;
