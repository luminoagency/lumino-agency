'use client';

import React from 'react';
import { motion } from 'framer-motion';

/**
 * Antigravity — elementi che fluttuano dolcemente contro gravità (levitazione).
 * Usa framer-motion (nessun three.js).
 *
 * Props:
 * - items (required): Array<React.ReactNode> elementi da far levitare.
 * - intensity? (default 1): ampiezza della fluttuazione.
 * - className?: classi extra sul contenitore.
 *
 * @example
 * <Antigravity items={[<Card key="a" />, <Card key="b" />]} intensity={1.4} />
 */

export interface AntigravityProps {
  items: Array<React.ReactNode>;
  intensity?: number;
  className?: string;
}

export function Antigravity({ items, intensity = 1, className }: AntigravityProps) {
  if (!items || items.length === 0) return null;

  const rootStyle: React.CSSProperties = {
    color: 'var(--lumino-ink, #ffffff)',
  };

  return (
    <div
      className={['flex flex-wrap items-center justify-center gap-8 p-8', className]
        .filter(Boolean)
        .join(' ')}
      style={rootStyle}
    >
      {items.map((item, i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -12 * intensity, 0] }}
          transition={{
            duration: 3 + i * 0.3,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.25,
          }}
        >
          {item}
        </motion.div>
      ))}
    </div>
  );
}

export default Antigravity;
