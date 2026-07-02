'use client';

import React, { useRef, useState } from 'react';

/** TiltedCard — card che si inclina seguendo il mouse. Props: children, intensity?. */
export interface TiltedCardProps { children: React.ReactNode; intensity?: number; className?: string; }

export function TiltedCard({ children, intensity = 12, className }: TiltedCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [t, setT] = useState('');
  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setT(`perspective(800px) rotateY(${(px * intensity).toFixed(2)}deg) rotateX(${(-py * intensity).toFixed(2)}deg)`);
  };
  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={() => setT('perspective(800px) rotateX(0deg) rotateY(0deg)')}
      className={['transition-transform duration-200 ease-out will-change-transform', className].filter(Boolean).join(' ')}
      style={{ transform: t || 'perspective(800px)' }}
    >
      {children}
    </div>
  );
}

export default TiltedCard;
