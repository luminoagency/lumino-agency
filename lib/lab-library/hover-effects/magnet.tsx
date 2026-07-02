'use client';

import React, { useRef, useState } from 'react';

/** Magnet — l'elemento viene attratto verso il cursore. Props: children, strength?. */
export interface MagnetProps { children: React.ReactNode; strength?: number; className?: string; }

export function Magnet({ children, strength = 0.5, className }: MagnetProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [t, setT] = useState('translate(0px,0px)');
  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) * strength;
    const dy = (e.clientY - (r.top + r.height / 2)) * strength;
    setT(`translate(${dx.toFixed(1)}px,${dy.toFixed(1)}px)`);
  };
  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={() => setT('translate(0px,0px)')}
      className={['inline-block transition-transform duration-200 ease-out will-change-transform', className].filter(Boolean).join(' ')}
      style={{ transform: t }}>
      {children}
    </div>
  );
}

export default Magnet;
