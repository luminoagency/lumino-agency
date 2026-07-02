'use client';

import React from 'react';
import { motion } from 'framer-motion';

/**
 * MasonryImages — layout masonry basato su colonne CSS.
 * A differenza di masonry-grid (wrapper con children), questo riceve direttamente
 * un array di immagini e le impagina su colonne, con entrata animata in stagger.
 *
 * Props:
 * - images: elenco immagini { src, alt, aspect? } (aspect = larghezza/altezza)
 * - columns: numero di colonne su schermo grande (default 3)
 * - className: classi aggiuntive sul contenitore
 */
export interface MasonryImagesProps {
  images: Array<{ src: string; alt: string; aspect?: number }>;
  columns?: number;
  className?: string;
}

export function MasonryImages({ images, columns = 3, className }: MasonryImagesProps) {
  const list = images || [];
  if (list.length === 0) return null;

  const lg = Math.max(1, columns);
  const sm = Math.max(1, Math.min(2, lg));

  return (
    <div
      className={['masonry-images w-full', className].filter(Boolean).join(' ')}
      style={{ columnGap: '1rem' }}
    >
      <style>{`
        .masonry-images { column-count: 1; }
        @media (min-width: 640px) { .masonry-images { column-count: ${sm}; } }
        @media (min-width: 1024px) { .masonry-images { column-count: ${lg}; } }
      `}</style>
      {list.map((img, i) => (
        <motion.div
          key={i}
          className="mb-4 overflow-hidden rounded-xl"
          style={{ breakInside: 'avoid', background: 'var(--lumino-muted, #f5f5f5)' }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.45, delay: Math.min(i * 0.06, 0.4) }}
        >
          <img
            src={img.src}
            alt={img.alt}
            className="w-full object-cover transition-transform duration-500 hover:scale-105"
            style={img.aspect ? { aspectRatio: String(img.aspect) } : undefined}
          />
        </motion.div>
      ))}
    </div>
  );
}

export default MasonryImages;
