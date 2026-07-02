'use client';

import React, { useEffect, useState } from 'react';

/** ShuffleText — le lettere si mescolano prima di comporre il testo. Props: text, iterations?, speed?. */
export interface ShuffleTextProps { text: string; iterations?: number; speed?: number; className?: string; }

const POOL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

export function ShuffleText({ text, iterations = 10, speed = 30, className }: ShuffleTextProps) {
  const [disp, setDisp] = useState(text);
  useEffect(() => {
    let frame = 0;
    const total = Math.max(4, iterations);
    const id = setInterval(() => {
      frame++;
      setDisp(text.split('').map((ch, i) => {
        if (ch === ' ') return ' ';
        const settled = frame > total * (i / Math.max(1, text.length) + 0.3);
        return settled ? ch : POOL[Math.floor(Math.random() * POOL.length)];
      }).join(''));
      if (frame > total * 1.5) { clearInterval(id); setDisp(text); }
    }, Math.max(10, speed));
    return () => clearInterval(id);
  }, [text, iterations, speed]);
  return <span className={className}>{disp}</span>;
}

export default ShuffleText;
