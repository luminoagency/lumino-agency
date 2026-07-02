'use client';

import React from 'react';
import { motion } from 'framer-motion';

/**
 * FluidGlass — pannello "vetro fluido" animato che avvolge dei children.
 * Glassmorphism + highlight in movimento. Nessun three.js.
 *
 * Props:
 * - children (required): contenuto sopra il vetro.
 * - distortion? (default 1): ampiezza dell'ondulazione del highlight.
 * - color?: colore base/highlight. Se assente usa --lumino-accent.
 * - className?: classi extra sul contenitore.
 *
 * @example
 * <FluidGlass distortion={1.2}><h2>Ciao</h2></FluidGlass>
 */

export interface FluidGlassProps {
  children: React.ReactNode;
  distortion?: number;
  color?: string;
  className?: string;
}

export function FluidGlass({ children, distortion = 1, color, className }: FluidGlassProps) {
  const accent = color || 'var(--lumino-accent, #8b5cf6)';
  const amp = 24 * distortion;

  const rootStyle: React.CSSProperties = {
    backdropFilter: 'blur(18px) saturate(140%)',
    WebkitBackdropFilter: 'blur(18px) saturate(140%)',
    background: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    color: 'var(--lumino-ink, #ffffff)',
    boxShadow: '0 8px 40px rgba(0, 0, 0, 0.35)',
  };

  return (
    <div
      className={['relative overflow-hidden rounded-2xl p-8', className].filter(Boolean).join(' ')}
      style={rootStyle}
    >
      {/* Highlight fluido animato che ondeggia dietro i children */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -z-0"
        style={{
          top: '-30%',
          left: '-20%',
          width: '60%',
          height: '80%',
          borderRadius: '9999px',
          background: `radial-gradient(circle, ${accent} 0%, transparent 70%)`,
          filter: 'blur(40px)',
          opacity: 0.5,
        }}
        animate={{
          x: [0, amp, -amp, 0],
          y: [0, -amp, amp, 0],
          scale: [1, 1.15, 0.95, 1],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -z-0"
        style={{
          bottom: '-30%',
          right: '-20%',
          width: '55%',
          height: '75%',
          borderRadius: '9999px',
          background: `radial-gradient(circle, ${accent} 0%, transparent 70%)`,
          filter: 'blur(50px)',
          opacity: 0.35,
        }}
        animate={{
          x: [0, -amp, amp, 0],
          y: [0, amp, -amp, 0],
          scale: [1, 0.9, 1.1, 1],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export default FluidGlass;
