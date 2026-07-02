'use client';

import React, { useState, useCallback } from 'react';

/** ClickSpark — particelle al click sull'area. Props: children, color?, particleCount?. */
export interface ClickSparkProps { children: React.ReactNode; color?: string; particleCount?: number; className?: string; }
type Spark = { id: number; x: number; y: number };

export function ClickSpark({ children, color, particleCount = 8, className }: ClickSparkProps) {
  const [sparks, setSparks] = useState<Spark[]>([]);
  const c = color || 'var(--lumino-accent, #8b5cf6)';
  const onClick = useCallback((e: React.MouseEvent) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const base = sparks.length ? sparks[sparks.length - 1].id + 1 : 0;
    const fresh = Array.from({ length: particleCount }, (_, i) => ({ id: base + i, x: e.clientX - r.left, y: e.clientY - r.top }));
    setSparks((s) => [...s, ...fresh]);
    setTimeout(() => setSparks((s) => s.filter((sp) => sp.id < base)), 650);
  }, [particleCount, sparks]);
  return (
    <div onClick={onClick} className={['relative', className].filter(Boolean).join(' ')}>
      <style>{`@keyframes lumino-spark { to { transform: translate(var(--dx), var(--dy)) scale(0); opacity: 0; } }`}</style>
      {children}
      {sparks.map((sp, i) => {
        const a = (i % particleCount) / particleCount * Math.PI * 2;
        return <span key={sp.id} aria-hidden style={{ position: 'absolute', left: sp.x, top: sp.y, width: 6, height: 6, borderRadius: 9999, background: c, pointerEvents: 'none', ['--dx' as any]: `${Math.cos(a) * 40}px`, ['--dy' as any]: `${Math.sin(a) * 40}px`, animation: 'lumino-spark 0.6s ease-out forwards' }} />;
      })}
    </div>
  );
}

export default ClickSpark;
