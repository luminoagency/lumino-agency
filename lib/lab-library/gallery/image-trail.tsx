'use client';

import React, { useCallback, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * ImageTrail — scia di immagini che segue il puntatore del mouse dentro l'area del componente.
 * Props:
 *  - images: elenco { src, alt } usato a rotazione per ogni elemento della scia.
 *  - trailLength?: numero massimo di immagini visibili nella scia (default 5).
 *  - className?: classi aggiuntive sul contenitore.
 * Le immagini hanno opacità e scala decrescenti man mano che si allontanano dal cursore.
 */
export interface ImageTrailProps {
  images: Array<{ src: string; alt: string }>;
  trailLength?: number;
  className?: string;
}

interface TrailPoint {
  id: number;
  x: number;
  y: number;
  index: number;
}

export function ImageTrail({ images, trailLength = 5, className }: ImageTrailProps) {
  const list = images || [];
  const containerRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef(0);
  const [trail, setTrail] = useState<TrailPoint[]>([]);

  const handleMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = containerRef.current;
      if (!el || !list.length) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = counterRef.current++;
      const index = id % list.length;
      setTrail((prev) => [...prev, { id, x, y, index }].slice(-trailLength));
    },
    [list.length, trailLength]
  );

  const handleLeave = useCallback(() => setTrail([]), []);

  if (!list.length) return null;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={['relative min-h-[400px] w-full overflow-hidden rounded-2xl', className].filter(Boolean).join(' ')}
      style={{ background: 'var(--lumino-muted, #f5f5f5)' }}
    >
      <AnimatePresence>
        {trail.map((point, i) => {
          const depth = (i + 1) / trail.length;
          const img = list[point.index];
          return (
            <motion.div
              key={point.id}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 0.25 + depth * 0.75, scale: 0.7 + depth * 0.3 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl shadow-lg"
              style={{ left: point.x, top: point.y, width: 120, height: 120, background: 'var(--lumino-bg, #ffffff)' }}
            >
              <img src={img.src} alt={img.alt} className="h-full w-full object-cover" />
            </motion.div>
          );
        })}
      </AnimatePresence>

      {trail.length === 0 && (
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center text-lg font-medium"
          style={{ color: 'var(--lumino-ink, #1a1a1a)', opacity: 0.6 }}
        >
          Muovi il mouse
        </div>
      )}
    </div>
  );
}

export default ImageTrail;
