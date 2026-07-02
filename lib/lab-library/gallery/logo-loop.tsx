'use client';

import React from 'react';

/**
 * LogoLoop — loop infinito orizzontale di loghi clienti (stile marquee), in pausa su hover.
 * Props:
 *  - logos: elenco { src, alt, name? } dei loghi da scorrere.
 *  - speed?: secondi per ciclo completo (default 25).
 *  - direction?: 'left' | 'right' verso dello scorrimento (default 'left').
 *  - className?: classi aggiuntive sul contenitore.
 * I loghi sono in scala di grigi e tornano a colori al passaggio del mouse.
 */
export interface LogoLoopProps {
  logos: Array<{ src: string; alt: string; name?: string }>;
  speed?: number;
  direction?: 'left' | 'right';
  className?: string;
}

export function LogoLoop({ logos, speed = 25, direction = 'left', className }: LogoLoopProps) {
  const list = logos || [];
  if (!list.length) return null;

  const anim = direction === 'left' ? 'lumino-logoloop-l' : 'lumino-logoloop-r';

  return (
    <div
      className={['lumino-logoloop-wrap group relative w-full overflow-hidden', className].filter(Boolean).join(' ')}
      style={{ background: 'var(--lumino-bg, transparent)' }}
    >
      <style>{`
        @keyframes lumino-logoloop-l { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes lumino-logoloop-r { from { transform: translateX(-50%); } to { transform: translateX(0); } }
        .lumino-logoloop-wrap:hover .lumino-logoloop-track { animation-play-state: paused; }
        .lumino-logoloop-item { filter: grayscale(100%); opacity: 0.7; transition: filter .3s ease, opacity .3s ease, transform .3s ease; }
        .lumino-logoloop-item:hover { filter: grayscale(0%); opacity: 1; transform: scale(1.06); }
      `}</style>

      <div
        className="lumino-logoloop-track flex w-max items-center gap-12 py-6"
        style={{ animation: `${anim} ${speed}s linear infinite` }}
      >
        {[...list, ...list].map((logo, i) => (
          <div
            key={i}
            className="lumino-logoloop-item flex shrink-0 items-center justify-center"
            title={logo.name || logo.alt}
            style={{ color: 'var(--lumino-ink, #1a1a1a)' }}
          >
            <img src={logo.src} alt={logo.alt} className="h-12 w-auto object-contain" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default LogoLoop;
