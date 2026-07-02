'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';

/**
 * StackGallery — stack di card sfogliabili stile Tinder.
 * La card in cima si trascina orizzontalmente: superata la soglia viene scartata
 * e va in fondo allo stack (ciclico). Si può anche usare i pulsanti scarta/avanti.
 *
 * Props:
 * - images: elenco immagini { src, alt, title? }
 * - onSwipe: callback opzionale chiamata con l'indice della card scartata
 * - className: classi aggiuntive sul contenitore
 */
export interface StackGalleryProps {
  images: Array<{ src: string; alt: string; title?: string }>;
  onSwipe?: (index: number) => void;
  className?: string;
}

export function StackGallery({ images, onSwipe, className }: StackGalleryProps) {
  const list = images || [];
  const [order, setOrder] = useState<number[]>(() => list.map((_, i) => i));

  const advance = useCallback(
    (index: number) => {
      onSwipe?.(index);
      setOrder((prev) => (prev.length < 2 ? prev : [...prev.slice(1), prev[0]]));
    },
    [onSwipe],
  );

  if (list.length === 0) return null;

  const visible = order.slice(0, 3);

  return (
    <div
      className={['flex flex-col items-center gap-6', className].filter(Boolean).join(' ')}
      style={{ color: 'var(--lumino-ink, #1a1a1a)' }}
    >
      <div className="relative h-80 w-64 sm:h-96 sm:w-72">
        <AnimatePresence>
          {visible
            .map((idx, pos) => ({ idx, pos }))
            .reverse()
            .map(({ idx, pos }) => {
              const isTop = pos === 0;
              const img = list[idx];
              return (
                <motion.div
                  key={idx}
                  className="absolute inset-0 overflow-hidden rounded-3xl shadow-2xl"
                  style={{
                    background: 'var(--lumino-muted, #f5f5f5)',
                    cursor: isTop ? 'grab' : 'default',
                    touchAction: 'none',
                  }}
                  drag={isTop ? 'x' : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.6}
                  onDragEnd={(_, info) => {
                    if (isTop && Math.abs(info.offset.x) > 110) advance(idx);
                  }}
                  initial={{ scale: 0.9, y: 24, opacity: 0 }}
                  animate={{ scale: 1 - pos * 0.05, y: pos * 16, opacity: 1 }}
                  exit={{ x: 320, opacity: 0, rotate: 12 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 30 }}
                  whileTap={isTop ? { cursor: 'grabbing' } : undefined}
                >
                  <img src={img.src} alt={img.alt} className="h-full w-full object-cover" draggable={false} />
                  {img.title && (
                    <div
                      className="absolute inset-x-0 bottom-0 p-4 text-lg font-semibold"
                      style={{
                        color: '#ffffff',
                        background: 'linear-gradient(to top, rgba(0,0,0,0.65), transparent)',
                      }}
                    >
                      {img.title}
                    </div>
                  )}
                </motion.div>
              );
            })}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-5">
        <button
          type="button"
          aria-label="Scarta"
          onClick={() => advance(order[0])}
          className="flex h-12 w-12 items-center justify-center rounded-full shadow-md transition-transform hover:scale-110"
          style={{ background: 'var(--lumino-muted, #f5f5f5)', color: 'var(--lumino-ink, #1a1a1a)' }}
        >
          <X size={22} />
        </button>
        <button
          type="button"
          aria-label="Avanti"
          onClick={() => advance(order[0])}
          className="flex h-12 w-12 items-center justify-center rounded-full shadow-md transition-transform hover:scale-110"
          style={{ background: 'var(--lumino-accent, #8b5cf6)', color: 'var(--lumino-bg, #ffffff)' }}
        >
          <Check size={22} />
        </button>
      </div>
    </div>
  );
}

export default StackGallery;
