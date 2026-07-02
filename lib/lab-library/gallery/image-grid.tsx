'use client';

import React from 'react';
import { motion } from 'framer-motion';

/** ImageGrid — griglia responsive di immagini. Props: images, columns?, gap?. */
export interface ImageGridProps {
  images: Array<{ src: string; alt: string }>;
  columns?: number;
  gap?: number;
  className?: string;
}

export function ImageGrid({ images, columns = 3, gap = 4, className }: ImageGridProps) {
  const list = images || [];
  const cols = columns >= 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : columns === 2 ? 'grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3';
  return (
    <div className={['grid', cols, className].filter(Boolean).join(' ')} style={{ gap: `${gap * 0.25}rem` }}>
      {list.map((img, i) => (
        <motion.div key={i} initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.4) }}
          className="overflow-hidden rounded-xl" style={{ background: 'var(--lumino-muted, #f5f5f5)' }}>
          <img src={img.src} alt={img.alt} className="aspect-square h-full w-full object-cover transition-transform duration-500 hover:scale-105" />
        </motion.div>
      ))}
    </div>
  );
}

export default ImageGrid;
