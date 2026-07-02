'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * CircularGallery — galleria coverflow ruotante.
 * Le immagini sono disposte su un anello 3D: quella frontale è grande e nitida,
 * le laterali sono ridotte, ruotate e sfocate. Si naviga con le frecce.
 *
 * Props:
 * - images: elenco immagini { src, alt, caption? }
 * - autoRotate: se true avanza automaticamente ogni ~3s (default false)
 * - className: classi aggiuntive sul contenitore
 */
export interface CircularGalleryProps {
  images: Array<{ src: string; alt: string; caption?: string }>;
  autoRotate?: boolean;
  className?: string;
}

export function CircularGallery({ images, autoRotate = false, className }: CircularGalleryProps) {
  const list = images || [];
  const [active, setActive] = useState(0);

  const go = useCallback(
    (dir: number) => setActive((a) => (a + dir + list.length) % list.length),
    [list.length],
  );

  useEffect(() => {
    if (!autoRotate || list.length < 2) return;
    const id = setInterval(() => setActive((a) => (a + 1) % list.length), 3000);
    return () => clearInterval(id);
  }, [autoRotate, list.length]);

  if (list.length === 0) return null;

  const current = list[active];

  return (
    <div
      className={['relative w-full select-none', className].filter(Boolean).join(' ')}
      style={{ color: 'var(--lumino-ink, #1a1a1a)' }}
    >
      <div
        className="relative mx-auto flex h-72 w-full max-w-3xl items-center justify-center sm:h-96"
        style={{ perspective: '1200px' }}
      >
        {list.map((img, i) => {
          let offset = i - active;
          if (offset > list.length / 2) offset -= list.length;
          if (offset < -list.length / 2) offset += list.length;
          const isActive = offset === 0;
          const abs = Math.abs(offset);
          if (abs > 2) return null;
          return (
            <motion.div
              key={i}
              className="absolute top-1/2 left-1/2 h-56 w-44 overflow-hidden rounded-2xl shadow-xl sm:h-72 sm:w-56"
              style={{
                background: 'var(--lumino-muted, #f5f5f5)',
                transformStyle: 'preserve-3d',
                cursor: isActive ? 'default' : 'pointer',
              }}
              onClick={() => !isActive && setActive(i)}
              animate={{
                x: `calc(-50% + ${offset * 58}%)`,
                y: '-50%',
                rotateY: offset * -28,
                translateZ: isActive ? 0 : -140,
                scale: isActive ? 1 : 0.82,
                opacity: abs > 1 ? 0.4 : 1,
                filter: isActive ? 'blur(0px)' : 'blur(2px)',
                zIndex: 10 - abs,
              }}
              transition={{ type: 'spring', stiffness: 220, damping: 28 }}
            >
              <img src={img.src} alt={img.alt} className="h-full w-full object-cover" />
            </motion.div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-center gap-6">
        <button
          type="button"
          aria-label="Immagine precedente"
          onClick={() => go(-1)}
          className="flex h-11 w-11 items-center justify-center rounded-full transition-transform hover:scale-110"
          style={{ background: 'var(--lumino-muted, #f5f5f5)', color: 'var(--lumino-ink, #1a1a1a)' }}
        >
          <ChevronLeft size={22} />
        </button>

        <div className="min-h-[2.5rem] max-w-xs text-center">
          <AnimatePresence mode="wait">
            {current.caption && (
              <motion.p
                key={active}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="text-sm font-medium"
                style={{ color: 'var(--lumino-ink, #1a1a1a)' }}
              >
                {current.caption}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <button
          type="button"
          aria-label="Immagine successiva"
          onClick={() => go(1)}
          className="flex h-11 w-11 items-center justify-center rounded-full transition-transform hover:scale-110"
          style={{ background: 'var(--lumino-accent, #8b5cf6)', color: 'var(--lumino-bg, #ffffff)' }}
        >
          <ChevronRight size={22} />
        </button>
      </div>
    </div>
  );
}

export default CircularGallery;
