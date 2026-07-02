'use client';

import React, { useRef } from 'react';
import { useScroll, useTransform, motion, type MotionValue } from 'framer-motion';

/**
 * ZoomParallax — galleria scroll-driven: le immagini si ingrandiscono mentre scorri.
 * Caption opzionale per ogni immagine. Palette/sfondo dinamici.
 *
 * Props:
 * - title?/description?: intestazione sopra la galleria.
 * - images (required, 3–9): Array<{ src, alt, caption? }>.
 * - maxScale? (default 5): zoom massimo dell'immagine centrale.
 * - backgroundColor?: override sfondo (altrimenti palette bg).
 * - layout?: 'standard' (default) | 'fullscreen' (sezione più alta, zoom più lungo).
 * - size?, tone?, palette?.
 *
 * @example
 * <ZoomParallax title="La galleria" images={[{src:'...',alt:'Sala',caption:'La sala'}]}
 *   maxScale={6} palette={{bg:'#111',ink:'#fff',accent:'#A0522D',muted:'#222'}} />
 */

type Palette = { bg: string; ink: string; accent: string; muted: string };
type Img = { src: string; alt: string; caption?: string };

export interface ZoomParallaxProps {
  title?: string;
  description?: string;
  images: Img[];
  maxScale?: number;
  backgroundColor?: string;
  layout?: 'standard' | 'fullscreen';
  size?: 'compact' | 'normal' | 'spacious';
  tone?: 'modern' | 'classic' | 'editorial' | 'playful';
  palette?: Palette;
  className?: string;
}

const cx = (...a: Array<string | false | undefined>) => a.filter(Boolean).join(' ');
function paletteVars(p?: Palette): React.CSSProperties {
  return p ? ({ '--lumino-bg': p.bg, '--lumino-ink': p.ink, '--lumino-accent': p.accent, '--lumino-muted': p.muted } as React.CSSProperties) : {};
}

// Posizioni dei riquadri non centrali (il primo è centrale e pieno).
const POS = [
  { top: '0', left: '0', w: '25vw', h: '25vh' },
  { top: '-30vh', left: '5vw', w: '35vw', h: '30vh' },
  { top: '-10vh', left: '-25vw', w: '20vw', h: '45vh' },
  { top: '0', left: '27.5vw', w: '25vw', h: '25vh' },
  { top: '27.5vh', left: '5vw', w: '20vw', h: '25vh' },
  { top: '27.5vh', left: '-22.5vw', w: '30vw', h: '25vh' },
  { top: '22.5vh', left: '25vw', w: '15vw', h: '15vh' },
  { top: '-22.5vh', left: '25.5vw', w: '22vw', h: '20vh' },
];

export function ZoomParallax({
  title,
  description,
  images,
  maxScale = 5,
  backgroundColor,
  layout = 'standard',
  size = 'normal',
  tone = 'modern',
  palette,
  className,
}: ZoomParallaxProps) {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: container, offset: ['start start', 'end end'] });
  const serif = tone === 'classic' || tone === 'editorial';

  // Un set fisso di scale; l'immagine centrale arriva a maxScale, le altre meno.
  const s1 = useTransform(scrollYProgress, [0, 1], [1, maxScale]);
  const s2 = useTransform(scrollYProgress, [0, 1], [1, Math.max(2, maxScale - 1)]);
  const s3 = useTransform(scrollYProgress, [0, 1], [1, Math.max(2, maxScale - 2)]);
  const s4 = useTransform(scrollYProgress, [0, 1], [1, maxScale + 2]);
  const s5 = useTransform(scrollYProgress, [0, 1], [1, maxScale + 1]);
  const scales: MotionValue<number>[] = [s1, s2, s3, s2, s3, s4, s5, s4, s5];

  const imgs = images.slice(0, 9);
  const rootStyle: React.CSSProperties = { ...paletteVars(palette), background: backgroundColor || 'var(--lumino-bg, #111111)', color: 'var(--lumino-ink, #ffffff)' };
  const tall = layout === 'fullscreen' ? 'h-[400vh]' : 'h-[300vh]';

  return (
    <section style={rootStyle} className={cx('w-full', className)}>
      {(title || description) && (
        <div className="mx-auto max-w-3xl px-6 pt-16 text-center">
          {title && <h2 className={cx('text-3xl md:text-4xl font-bold tracking-tight', serif && 'font-serif')}>{title}</h2>}
          {description && <p className="mt-3 text-base" style={{ opacity: 0.7 }}>{description}</p>}
        </div>
      )}
      <div ref={container} className={cx('relative', tall)}>
        <div className="sticky top-0 h-screen overflow-hidden">
          {imgs.map((img, i) => {
            const scale = scales[i % scales.length];
            const pos = i === 0 ? null : POS[(i - 1) % POS.length];
            return (
              <motion.div key={i} style={{ scale }} className="absolute inset-0 flex h-full w-full items-center justify-center">
                <div
                  className="relative overflow-hidden rounded-lg"
                  style={pos ? { width: pos.w, height: pos.h, top: pos.top, left: pos.left, position: 'relative' } : { width: '25vw', height: '25vh' }}
                >
                  <img src={img.src} alt={img.alt} className="h-full w-full object-cover" />
                  {img.caption && (
                    <div className="absolute inset-x-0 bottom-0 px-3 py-2 text-xs font-medium text-white" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }}>
                      {img.caption}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default ZoomParallax;
