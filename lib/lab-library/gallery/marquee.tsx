'use client';

import React from 'react';

/** Marquee — loop infinito di immagini. Props: images, speed?, direction?. Pausa su hover. */
export interface MarqueeProps {
  images: Array<{ src: string; alt: string }>;
  speed?: number;
  direction?: 'left' | 'right';
  className?: string;
}

export function Marquee({ images, speed = 30, direction = 'left', className }: MarqueeProps) {
  const list = images || [];
  if (!list.length) return null;
  const anim = direction === 'left' ? 'lumino-marquee-l' : 'lumino-marquee-r';
  return (
    <div className={['lumino-marquee-wrap group relative w-full overflow-hidden', className].filter(Boolean).join(' ')} style={{ background: 'var(--lumino-bg, transparent)' }}>
      <style>{`
        @keyframes lumino-marquee-l { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes lumino-marquee-r { from { transform: translateX(-50%); } to { transform: translateX(0); } }
        .lumino-marquee-wrap:hover .lumino-marquee-track { animation-play-state: paused; }
      `}</style>
      <div className="lumino-marquee-track flex w-max gap-4 py-4" style={{ animation: `${anim} ${speed}s linear infinite` }}>
        {[...list, ...list].map((img, i) => (
          <img key={i} src={img.src} alt={img.alt} className="h-32 w-auto shrink-0 rounded-xl object-cover" />
        ))}
      </div>
    </div>
  );
}

export default Marquee;
