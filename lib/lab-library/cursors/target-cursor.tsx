'use client';

import React, { useEffect, useState } from 'react';

/** TargetCursor — cursore a mirino che segue il mouse (fixed, globale). Props: color?, size?. */
export interface TargetCursorProps { color?: string; size?: number; className?: string; }

export function TargetCursor({ color, size = 30, className }: TargetCursorProps) {
  const c = color || 'var(--lumino-accent, #8b5cf6)';
  const [p, setP] = useState({ x: -100, y: -100 });
  useEffect(() => {
    const m = (e: MouseEvent) => setP({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', m);
    return () => window.removeEventListener('mousemove', m);
  }, []);
  const tick: React.CSSProperties = { position: 'absolute', background: c };
  return (
    <div aria-hidden className={['pointer-events-none fixed z-[9999] -translate-x-1/2 -translate-y-1/2', className].filter(Boolean).join(' ')} style={{ left: p.x, top: p.y, width: size, height: size }}>
      <div style={{ position: 'absolute', inset: 0, border: `1.5px solid ${c}`, borderRadius: 4 }} />
      <span style={{ ...tick, left: '50%', top: -6, width: 1.5, height: 6 }} />
      <span style={{ ...tick, left: '50%', bottom: -6, width: 1.5, height: 6 }} />
      <span style={{ ...tick, top: '50%', left: -6, height: 1.5, width: 6 }} />
      <span style={{ ...tick, top: '50%', right: -6, height: 1.5, width: 6 }} />
    </div>
  );
}

export default TargetCursor;
