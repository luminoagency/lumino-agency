'use client';

import React, { useRef, useState } from 'react';

/** Card3D — card che ruota in 3D seguendo il mouse, con leggero sollevamento. Props: children, intensity?. */
export interface Card3DProps { children: React.ReactNode; intensity?: number; className?: string; }

export function Card3D({ children, intensity = 15, className }: Card3DProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({ transform: 'perspective(900px)' });
  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setStyle({ transform: `perspective(900px) rotateY(${(px * intensity).toFixed(2)}deg) rotateX(${(-py * intensity).toFixed(2)}deg) translateZ(12px)`, boxShadow: '0 30px 60px rgba(0,0,0,0.25)' });
  };
  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={() => setStyle({ transform: 'perspective(900px)' })}
      className={['transition-transform duration-200 ease-out will-change-transform', className].filter(Boolean).join(' ')} style={style}>
      {children}
    </div>
  );
}

export default Card3D;
