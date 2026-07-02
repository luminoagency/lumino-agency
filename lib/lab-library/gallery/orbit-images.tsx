'use client';

import React from 'react';

/**
 * OrbitImages — immagini che orbitano in cerchio attorno a un centro con rotazione continua.
 * Props:
 *  - images: elenco di immagini { src, alt } disposte equidistanti lungo l'orbita.
 *  - radius?: raggio dell'orbita in px (default 180).
 *  - speed?: secondi per un giro completo (default 20).
 *  - color?: colore d'accento del punto centrale (fallback var(--lumino-accent)).
 *  - className?: classi aggiuntive sul contenitore.
 */
export interface OrbitImagesProps {
  images: Array<{ src: string; alt: string }>;
  radius?: number;
  speed?: number;
  color?: string;
  className?: string;
}

export function OrbitImages({ images, radius = 180, speed = 20, color, className }: OrbitImagesProps) {
  const list = images || [];
  if (!list.length) return null;

  const accent = color || 'var(--lumino-accent, #8b5cf6)';
  const size = radius * 2 + 120;
  const step = 360 / list.length;

  return (
    <div
      className={['lumino-orbit-wrap relative mx-auto', className].filter(Boolean).join(' ')}
      style={{ width: size, height: size, maxWidth: '100%', background: 'var(--lumino-bg, transparent)' }}
    >
      <style>{`
        @keyframes lumino-orbit { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes lumino-orbit-rev { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
      `}</style>

      {/* Punto centrale */}
      <div
        className="absolute left-1/2 top-1/2 z-10 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: accent, boxShadow: `0 0 40px ${accent}55` }}
      />

      {/* Anello rotante */}
      <div
        className="absolute left-1/2 top-1/2 h-0 w-0"
        style={{ animation: `lumino-orbit ${speed}s linear infinite` }}
      >
        {list.map((img, i) => (
          <div
            key={i}
            className="absolute left-0 top-0"
            style={{ transform: `rotate(${step * i}deg) translateX(${radius}px)` }}
          >
            <div
              className="overflow-hidden rounded-2xl shadow-lg"
              style={{
                width: 88,
                height: 88,
                marginLeft: -44,
                marginTop: -44,
                background: 'var(--lumino-muted, #f5f5f5)',
                // Controrotazione per mantenere l'immagine dritta
                animation: `lumino-orbit-rev ${speed}s linear infinite`,
                transformOrigin: 'center',
              }}
            >
              <img src={img.src} alt={img.alt} className="h-full w-full object-cover" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default OrbitImages;
