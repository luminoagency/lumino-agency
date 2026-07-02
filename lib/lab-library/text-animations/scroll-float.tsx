'use client';

import React, { useRef } from 'react';
import { useScroll, useTransform, motion } from 'framer-motion';

/** ScrollFloat — il testo fluttua in verticale durante lo scroll. Props: text, intensity?. */
export interface ScrollFloatProps { text: string; intensity?: number; className?: string; }

export function ScrollFloat({ text, intensity = 20, className }: ScrollFloatProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [intensity, -intensity]);
  return <motion.span ref={ref} className={className} style={{ display: 'inline-block', y }}>{text}</motion.span>;
}

export default ScrollFloat;
