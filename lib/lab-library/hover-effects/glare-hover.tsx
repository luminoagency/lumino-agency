'use client';

import React, { useState } from 'react';

/** GlareHover — riflesso luminoso che segue il mouse. Props: children, color?, intensity?. */
export interface GlareHoverProps { children: React.ReactNode; color?: string; intensity?: number; className?: string; }

export function GlareHover({ children, color, intensity = 0.4, className }: GlareHoverProps) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const c = color || 'rgba(255,255,255,0.8)';
  const onMove = (e: React.MouseEvent) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPos({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };
  return (
    <div className={['relative overflow-hidden', className].filter(Boolean).join(' ')} onMouseMove={onMove} onMouseLeave={() => setPos(null)}>
      {children}
      <div className="pointer-events-none absolute inset-0 transition-opacity duration-200" aria-hidden
        style={{ opacity: pos ? intensity : 0, background: pos ? `radial-gradient(circle at ${pos.x}% ${pos.y}%, ${c} 0%, transparent 45%)` : 'none' }} />
    </div>
  );
}

export default GlareHover;
