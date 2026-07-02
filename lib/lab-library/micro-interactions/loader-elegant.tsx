import React from 'react';

/** LoaderElegant — spinner minimale. Props: size?, color?. */
export interface LoaderElegantProps { size?: number; color?: string; className?: string; }

export function LoaderElegant({ size = 28, color, className }: LoaderElegantProps) {
  const c = color || 'var(--lumino-accent, #8b5cf6)';
  return (
    <span role="status" aria-label="Caricamento" className={['inline-block', className].filter(Boolean).join(' ')} style={{ width: size, height: size }}>
      <style>{`@keyframes lumino-spin { to { transform: rotate(360deg); } }`}</style>
      <span style={{ display: 'block', width: '100%', height: '100%', borderRadius: '9999px', border: `${Math.max(2, size * 0.1)}px solid var(--lumino-muted, #e5e5e5)`, borderTopColor: c, animation: 'lumino-spin 0.7s linear infinite' }} />
    </span>
  );
}

export default LoaderElegant;
