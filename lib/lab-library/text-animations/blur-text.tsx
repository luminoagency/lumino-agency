'use client';

import React from 'react';
import { motion } from 'framer-motion';

/** BlurText — testo che appare da sfocato a nitido. Props: text, delay?. */
export interface BlurTextProps { text: string; delay?: number; className?: string; }

export function BlurText({ text, delay = 0, className }: BlurTextProps) {
  return (
    <motion.span
      className={className}
      initial={{ opacity: 0, filter: 'blur(8px)' }}
      whileInView={{ opacity: 1, filter: 'blur(0px)' }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.6, ease: 'easeOut' }}
      style={{ display: 'inline-block' }}
    >
      {text}
    </motion.span>
  );
}

export default BlurText;
