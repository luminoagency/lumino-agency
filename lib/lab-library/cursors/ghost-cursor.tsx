'use client';

import React, { useEffect, useState } from 'react';

/** GhostCursor — cursore con scia di punti che lo seguono. Props: color?, trailLength?. */
export interface GhostCursorProps { color?: string; trailLength?: number; className?: string; }

export function GhostCursor({ color, trailLength = 8, className }: GhostCursorProps) {
  const c = color || 'var(--lumino-accent, #8b5cf6)';
  const n = Math.max(3, Math.min(20, trailLength));
  const [trail, setTrail] = useState<Array<{ x: number; y: number }>>(() => Array.from({ length: n }, () => ({ x: -100, y: -100 })));
  useEffect(() => {
    const m = (e: MouseEvent) => setTrail((prev) => [{ x: e.clientX, y: e.clientY }, ...prev].slice(0, n));
    window.addEventListener('mousemove', m);
    return () => window.removeEventListener('mousemove', m);
  }, [n]);
  return (
    <div aria-hidden className={['pointer-events-none fixed inset-0 z-[9999]', className].filter(Boolean).join(' ')}>
      {trail.map((t, i) => {
        const s = 14 * (1 - i / n);
        return <span key={i} style={{ position: 'fixed', left: t.x, top: t.y, width: s, height: s, marginLeft: -s / 2, marginTop: -s / 2, borderRadius: 9999, background: c, opacity: 1 - i / n }} />;
      })}
    </div>
  );
}

export default GhostCursor;
