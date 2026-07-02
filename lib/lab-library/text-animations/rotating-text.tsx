'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

/** RotatingText — parole che si alternano. Props: words, interval?, animation? ('fade'|'slide'|'spin'). */
export interface RotatingTextProps { words: string[]; interval?: number; animation?: 'fade' | 'slide' | 'spin'; className?: string; }

const VARIANTS = {
  fade: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } },
  slide: { initial: { y: '100%', opacity: 0 }, animate: { y: 0, opacity: 1 }, exit: { y: '-100%', opacity: 0 } },
  spin: { initial: { rotateX: 90, opacity: 0 }, animate: { rotateX: 0, opacity: 1 }, exit: { rotateX: -90, opacity: 0 } },
} as const;

export function RotatingText({ words, interval = 2000, animation = 'fade', className }: RotatingTextProps) {
  const list = words && words.length ? words : [''];
  const [i, setI] = useState(0);
  useEffect(() => {
    if (list.length < 2) return;
    const id = setInterval(() => setI((p) => (p + 1) % list.length), Math.max(800, interval));
    return () => clearInterval(id);
  }, [list.length, interval]);
  const v = VARIANTS[animation];
  return (
    <span className={className} style={{ display: 'inline-block', position: 'relative', perspective: 400 }}>
      <AnimatePresence mode="wait">
        <motion.span key={i} initial={v.initial} animate={v.animate} exit={v.exit} transition={{ duration: 0.4, ease: 'easeOut' }} style={{ display: 'inline-block' }}>
          {list[i % list.length]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export default RotatingText;
