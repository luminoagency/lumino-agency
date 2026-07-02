'use client';

import React, { useEffect } from 'react';
import { motion, useSpring } from 'framer-motion';

/** BlobCursor — cursore blob morbido che insegue il mouse con spring. Props: color?, size?. */
export interface BlobCursorProps { color?: string; size?: number; className?: string; }

export function BlobCursor({ color, size = 40, className }: BlobCursorProps) {
  const c = color || 'var(--lumino-accent, #8b5cf6)';
  const x = useSpring(-100, { stiffness: 200, damping: 20, mass: 0.6 });
  const y = useSpring(-100, { stiffness: 200, damping: 20, mass: 0.6 });
  useEffect(() => {
    const m = (e: MouseEvent) => { x.set(e.clientX); y.set(e.clientY); };
    window.addEventListener('mousemove', m);
    return () => window.removeEventListener('mousemove', m);
  }, [x, y]);
  return (
    <motion.div aria-hidden className={['pointer-events-none fixed z-[9999]', className].filter(Boolean).join(' ')}
      style={{ left: x, top: y, width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2, borderRadius: 9999, background: c, opacity: 0.5, filter: 'blur(4px)' }} />
  );
}

export default BlobCursor;
