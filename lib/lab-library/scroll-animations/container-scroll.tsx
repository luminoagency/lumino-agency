'use client';

import React, { useRef } from 'react';
import { useScroll, useTransform, motion } from 'framer-motion';

/**
 * ContainerScroll — wrapper che inclina e raddrizza il contenuto allo scroll (effetto
 * "device che si alza"). Il titolo (slot) sta sopra; i children dentro il riquadro 3D.
 *
 * Props:
 * - title?: ReactNode/stringa mostrata sopra il riquadro.
 * - children (required): contenuto dentro il riquadro (es. screenshot, immagine, dashboard).
 * - perspective? (default 1000): prospettiva 3D.
 * - rotateStart? (default 20): inclinazione iniziale in gradi (va a 0 allo scroll).
 * - layout?: 'standard' (default) | 'compact'. size?, tone?, palette?.
 *
 * @example
 * <ContainerScroll title={<h2>Scopri la dashboard</h2>} rotateStart={25}
 *   palette={{bg:'#0a0a0a',ink:'#fff',accent:'#8b5cf6',muted:'#1a1a1a'}}>
 *   <img src="..." alt="Anteprima" />
 * </ContainerScroll>
 */

type Palette = { bg: string; ink: string; accent: string; muted: string };

export interface ContainerScrollProps {
  title?: React.ReactNode;
  children: React.ReactNode;
  perspective?: number;
  rotateStart?: number;
  layout?: 'standard' | 'compact';
  size?: 'compact' | 'normal' | 'spacious';
  tone?: 'modern' | 'classic' | 'editorial' | 'playful';
  palette?: Palette;
  className?: string;
}

const cx = (...a: Array<string | false | undefined>) => a.filter(Boolean).join(' ');
function paletteVars(p?: Palette): React.CSSProperties {
  return p ? ({ '--lumino-bg': p.bg, '--lumino-ink': p.ink, '--lumino-accent': p.accent, '--lumino-muted': p.muted } as React.CSSProperties) : {};
}

export function ContainerScroll({
  title,
  children,
  perspective = 1000,
  rotateStart = 20,
  layout = 'standard',
  size = 'normal',
  tone = 'modern',
  palette,
  className,
}: ContainerScrollProps) {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: container, offset: ['start end', 'end start'] });
  const rotate = useTransform(scrollYProgress, [0, 0.5], [rotateStart, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1.05, 1]);
  const translateY = useTransform(scrollYProgress, [0, 0.5], [-40, 0]);
  const serif = tone === 'classic' || tone === 'editorial';

  const rootStyle: React.CSSProperties = { ...paletteVars(palette), background: 'var(--lumino-bg, #0a0a0a)', color: 'var(--lumino-ink, #ffffff)' };
  const pad = layout === 'compact' ? 'py-16' : 'py-24 md:py-40';

  return (
    <div ref={container} className={cx('relative flex w-full items-center justify-center', pad, className)} style={{ ...rootStyle, perspective: `${perspective}px` }}>
      <div className="mx-auto w-full max-w-5xl px-6">
        {title && (
          <motion.div style={{ translateY }} className={cx('mb-10 text-center text-2xl md:text-3xl font-bold tracking-tight', serif && 'font-serif')}>
            {title}
          </motion.div>
        )}
        <motion.div
          style={{ rotateX: rotate, scale, transformStyle: 'preserve-3d', boxShadow: '0 30px 80px rgba(0,0,0,0.35)' }}
          className="mx-auto w-full overflow-hidden rounded-2xl border p-2"
        >
          <div className="overflow-hidden rounded-xl" style={{ background: 'var(--lumino-muted, #1a1a1a)' }}>
            {children}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default ContainerScroll;
