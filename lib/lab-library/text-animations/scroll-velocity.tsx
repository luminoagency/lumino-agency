'use client';

import React from 'react';
import { useScroll, useVelocity, useTransform, useSpring, motion } from 'framer-motion';

/** ScrollVelocity — il testo scorre in orizzontale in base alla velocità di scroll. Props: text, velocity?. */
export interface ScrollVelocityProps { text: string; velocity?: number; className?: string; }

export function ScrollVelocity({ text, velocity = 1, className }: ScrollVelocityProps) {
  const { scrollY } = useScroll();
  const v = useVelocity(scrollY);
  const x = useSpring(useTransform(v, [-1500, 1500], [-120 * velocity, 120 * velocity]), { stiffness: 200, damping: 40 });
  return (
    <div className={['overflow-hidden', className].filter(Boolean).join(' ')}>
      <motion.div style={{ x, whiteSpace: 'nowrap', display: 'inline-block' }}>{text}</motion.div>
    </div>
  );
}

export default ScrollVelocity;
