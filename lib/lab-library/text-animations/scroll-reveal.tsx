'use client';

import React from 'react';
import { motion } from 'framer-motion';

/** ScrollReveal — il testo (parola per parola) appare quando entra nel viewport. Props: text, threshold?, stagger?. */
export interface ScrollRevealProps { text: string; threshold?: number; stagger?: number; className?: string; }

export function ScrollReveal({ text, threshold = 0.3, stagger = 0.04, className }: ScrollRevealProps) {
  const words = text.split(' ');
  return (
    <span className={className}>
      {words.map((w, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: threshold }}
          transition={{ delay: i * stagger, duration: 0.4, ease: 'easeOut' }}
          style={{ display: 'inline-block', marginRight: '0.25em' }}
        >
          {w}
        </motion.span>
      ))}
    </span>
  );
}

export default ScrollReveal;
