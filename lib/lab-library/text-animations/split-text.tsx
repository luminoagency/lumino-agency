'use client';

import React from 'react';
import { motion } from 'framer-motion';

/** SplitText — testo che appare lettera per lettera allo scroll. Props: text, delay?, stagger?. */
export interface SplitTextProps { text: string; delay?: number; stagger?: number; className?: string; }

export function SplitText({ text, delay = 0, stagger = 0.03, className }: SplitTextProps) {
  return (
    <span className={className} aria-label={text}>
      {text.split('').map((ch, i) => (
        <motion.span
          key={i}
          aria-hidden
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: delay + i * stagger, duration: 0.3, ease: 'easeOut' }}
          style={{ display: 'inline-block', whiteSpace: 'pre' }}
        >
          {ch}
        </motion.span>
      ))}
    </span>
  );
}

export default SplitText;
