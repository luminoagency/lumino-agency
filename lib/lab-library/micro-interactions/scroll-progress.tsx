'use client';

import React from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';

/**
 * ScrollProgress — barra di avanzamento dello scroll della pagina.
 *
 * Barra fissa in alto che si riempie in base alla percentuale di scroll
 * della pagina. Lo scorrimento viene smussato con useSpring per un effetto
 * fluido. Puramente decorativa (aria-hidden).
 *
 * @prop color - Colore della barra (default accento Lumino).
 * @prop height - Altezza della barra in px (default 3).
 * @prop className - Classi CSS aggiuntive.
 */
export interface ScrollProgressProps {
  color?: string;
  height?: number;
  className?: string;
}

export function ScrollProgress({ color, height = 3, className }: ScrollProgressProps) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden
      className={['fixed top-0 left-0 right-0 z-50', className].filter(Boolean).join(' ')}
      style={{
        height: `${height}px`,
        transformOrigin: '0%',
        scaleX,
        backgroundColor: color ?? 'var(--lumino-accent, #8b5cf6)',
      }}
    />
  );
}

export default ScrollProgress;
