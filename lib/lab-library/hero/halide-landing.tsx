'use client';

import React, { useEffect, useRef } from 'react';

/**
 * HalideLanding — hero editoriale con effetto 3D a layer in parallasse (le immagini si
 * inclinano seguendo il mouse). Riscritto: niente più testo inglese hardcoded, tutto via prop.
 *
 * Props:
 * - title (required): titolo principale.
 * - subtitle?: sottotitolo. eyebrow?: micro-testo in alto (accent, monospace).
 * - ctaLabel?/ctaHref?: CTA.
 * - images?: Array<{ src, alt }> — fino a 3 layer di profondità (fallback gradient palette).
 * - layout?: 'editorial' (default, titolo in basso) | 'centered'.
 * - size?: 'compact' | 'normal' (default) | 'spacious'. tone?, palette?.
 *
 * @example
 * <HalideLanding eyebrow="ARCHIVIO 2026" title="Sapori di una volta" subtitle="..."
 *   ctaLabel="Scopri" images={[{src:'...',alt:'...'}]} layout="editorial"
 *   palette={{bg:'#0a0a0a',ink:'#e8e8e8',accent:'#A0522D',muted:'#1a1a1a'}} />
 */

type Palette = { bg: string; ink: string; accent: string; muted: string };
type Img = { src: string; alt: string };

export interface HalideLandingProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  ctaLabel?: string;
  ctaHref?: string;
  images?: Img[];
  layout?: 'editorial' | 'centered';
  size?: 'compact' | 'normal' | 'spacious';
  tone?: 'modern' | 'classic' | 'editorial' | 'playful';
  palette?: Palette;
  className?: string;
}

const SIZE = { compact: 'min-h-[70vh]', normal: 'min-h-[85vh]', spacious: 'min-h-screen' } as const;
const cx = (...a: Array<string | false | undefined>) => a.filter(Boolean).join(' ');
function paletteVars(p?: Palette): React.CSSProperties {
  return p ? ({ '--lumino-bg': p.bg, '--lumino-ink': p.ink, '--lumino-accent': p.accent, '--lumino-muted': p.muted } as React.CSSProperties) : {};
}

export function HalideLanding({
  title,
  subtitle,
  eyebrow,
  ctaLabel,
  ctaHref = '#',
  images = [],
  layout = 'editorial',
  size = 'normal',
  tone = 'modern',
  palette,
  className,
}: HalideLandingProps) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const layersRef = useRef<Array<HTMLDivElement | null>>([]);
  const serif = tone === 'classic' || tone === 'editorial';
  const layers = images.slice(0, 3);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const onMove = (e: MouseEvent) => {
      const r = scene.getBoundingClientRect();
      const x = ((e.clientX - (r.left + r.width / 2)) / r.width) * 2;
      const y = ((e.clientY - (r.top + r.height / 2)) / r.height) * 2;
      scene.style.transform = `rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 7).toFixed(2)}deg)`;
      layersRef.current.forEach((layer, i) => {
        if (!layer) return;
        const d = (i + 1) * 28;
        layer.style.transform = `translateZ(${d}px) translate(${(x * (i + 1) * 6).toFixed(1)}px, ${(y * (i + 1) * 6).toFixed(1)}px)`;
      });
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  const centered = layout === 'centered';

  return (
    <section
      className={cx('relative w-full overflow-hidden', SIZE[size], className)}
      style={{ ...paletteVars(palette), background: 'var(--lumino-bg, #0a0a0a)', color: 'var(--lumino-ink, #e8e8e8)', perspective: '1600px' }}
    >
      {/* Scena 3D a layer */}
      <div ref={sceneRef} className="absolute left-1/2 top-1/2 h-[60%] w-[78%] max-w-3xl -translate-x-1/2 -translate-y-1/2 transition-transform duration-500 ease-out" style={{ transformStyle: 'preserve-3d' }}>
        {layers.length > 0 ? layers.map((img, i) => (
          <div
            key={i}
            ref={(el) => { layersRef.current[i] = el; }}
            className="absolute inset-0 rounded-xl bg-cover bg-center transition-transform duration-300"
            style={{ backgroundImage: `url('${img.src}')`, filter: 'grayscale(0.6) contrast(1.1) brightness(0.7)', opacity: i === 0 ? 1 : 0.55, mixBlendMode: i === 0 ? 'normal' : 'screen', border: '1px solid rgba(255,255,255,0.08)' }}
            role="img"
            aria-label={img.alt}
          />
        )) : (
          <div className="absolute inset-0 rounded-xl" style={{ background: 'linear-gradient(135deg, var(--lumino-accent, #8b5cf6), var(--lumino-muted, #1a1a1a))', opacity: 0.6 }} aria-hidden="true" />
        )}
      </div>

      {/* Interfaccia testuale */}
      <div className={cx('relative z-10 flex h-full flex-col p-6 md:p-12', centered ? 'items-center justify-center text-center' : 'justify-between')} style={{ minHeight: 'inherit' }}>
        {!centered && eyebrow && <div className="font-mono text-xs tracking-[0.25em]" style={{ color: 'var(--lumino-accent, #8b5cf6)' }}>{eyebrow}</div>}
        <div className={cx(centered ? 'max-w-3xl' : 'mt-auto max-w-2xl')}>
          {centered && eyebrow && <div className="mb-4 font-mono text-xs tracking-[0.25em]" style={{ color: 'var(--lumino-accent, #8b5cf6)' }}>{eyebrow}</div>}
          <h1 className={cx('text-4xl md:text-6xl lg:text-7xl font-bold leading-[0.95] tracking-tight', serif && 'font-serif', tone === 'editorial' && 'italic')} style={{ textShadow: '0 8px 40px rgba(0,0,0,0.6)' }}>{title}</h1>
          {subtitle && <p className="mt-5 max-w-xl text-base md:text-lg" style={{ opacity: 0.85 }}>{subtitle}</p>}
          {ctaLabel && (
            <a href={ctaHref} className="mt-8 inline-flex items-center rounded-full px-7 py-3 text-sm font-semibold transition-opacity hover:opacity-90" style={{ background: 'var(--lumino-accent, #8b5cf6)', color: '#fff' }}>
              {ctaLabel}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

export default HalideLanding;
