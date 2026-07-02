'use client';

import React, { useEffect, useState } from 'react';

/** SparkleTrail — particelle che seguono il mouse e svaniscono. Props: color?, particleCount?. */
export interface SparkleTrailProps { color?: string; particleCount?: number; className?: string; }
type P = { id: number; x: number; y: number };

export function SparkleTrail({ color, particleCount = 12, className }: SparkleTrailProps) {
  const c = color || 'var(--lumino-accent, #8b5cf6)';
  const [parts, setParts] = useState<P[]>([]);
  useEffect(() => {
    let id = 0;
    let last = 0;
    const m = (e: MouseEvent) => {
      const now = Date.now();
      if (now - last < 40) return;
      last = now;
      const p = { id: id++, x: e.clientX, y: e.clientY };
      setParts((prev) => [...prev.slice(-(particleCount - 1)), p]);
      setTimeout(() => setParts((prev) => prev.filter((x) => x.id !== p.id)), 700);
    };
    window.addEventListener('mousemove', m);
    return () => window.removeEventListener('mousemove', m);
  }, [particleCount]);
  return (
    <div aria-hidden className={['pointer-events-none fixed inset-0 z-[9999]', className].filter(Boolean).join(' ')}>
      <style>{`@keyframes lumino-sparkle { to { transform: translate(-50%,-50%) scale(0); opacity: 0; } }`}</style>
      {parts.map((p) => (
        <span key={p.id} style={{ position: 'fixed', left: p.x, top: p.y, width: 8, height: 8, background: c, borderRadius: 9999, transform: 'translate(-50%,-50%)', animation: 'lumino-sparkle 0.7s ease-out forwards' }} />
      ))}
    </div>
  );
}

export default SparkleTrail;
