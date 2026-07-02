'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

/**
 * PixelHero — hero con canvas di pixel animati che usano la PALETTE del business
 * (niente più colori dedotti da getComputedStyle). Il titolo si adatta: effetto "glass"
 * su sfondi scuri, testo solido leggibile su sfondi chiari.
 *
 * Props:
 * - title (required): titolo principale.
 * - subtitle?: occhiello (accent).
 * - description?: paragrafo.
 * - primaryCta?/secondaryCta?: { label: string; href?: string }. Default IT.
 * - palette?: { bg, ink, accent, muted } — il canvas usa accent+muted+ink.
 * - layout?: 'centered' (default) | 'left'.
 * - size?: 'compact' | 'normal' (default) | 'spacious' — compact = griglia pixel più densa.
 * - tone?: 'modern' (default) | 'classic' | 'editorial' | 'playful' — tipografia del titolo.
 *
 * @example
 * <PixelHero title="Trattoria Mario" description="..."
 *   palette={{bg:'#FAF7F2',ink:'#2A1F1A',accent:'#A0522D',muted:'#E8DDD0'}}
 *   layout="centered" size="normal" tone="modern" />
 */

type Palette = { bg: string; ink: string; accent: string; muted: string };
type Cta = { label: string; href?: string };

export interface PixelHeroProps {
  title: string;
  subtitle?: string;
  description?: string;
  primaryCta?: Cta;
  secondaryCta?: Cta;
  palette?: Palette;
  layout?: 'centered' | 'left';
  size?: 'compact' | 'normal' | 'spacious';
  tone?: 'modern' | 'classic' | 'editorial' | 'playful';
  className?: string;
}

const SIZE = {
  // compact = gap più piccolo (griglia più densa) ma area minore → conteggio pixel sotto controllo.
  compact: { gap: 5, minH: 'min-h-[60vh]', pad: 'py-14', title: 'text-4xl sm:text-5xl md:text-6xl' },
  normal: { gap: 6, minH: 'min-h-[80vh]', pad: 'py-20', title: 'text-5xl sm:text-6xl md:text-7xl' },
  spacious: { gap: 8, minH: 'min-h-[92vh]', pad: 'py-28', title: 'text-6xl sm:text-7xl md:text-8xl' },
} as const;

function isLight(hex?: string): boolean {
  if (!hex) return true;
  const h = hex.replace('#', '');
  const v = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const r = parseInt(v.slice(0, 2), 16), g = parseInt(v.slice(2, 4), 16), b = parseInt(v.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
}

function paletteVars(p?: Palette): React.CSSProperties {
  return p ? ({ '--lumino-bg': p.bg, '--lumino-ink': p.ink, '--lumino-accent': p.accent, '--lumino-muted': p.muted } as React.CSSProperties) : {};
}

function HeroCta({ cta, variant }: { cta: Cta; variant: 'primary' | 'secondary' }) {
  const base = 'inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold shadow-sm transition-transform duration-200 hover:scale-[1.02]';
  const style: React.CSSProperties = variant === 'primary'
    ? { background: 'var(--lumino-accent, #8b5cf6)', color: '#ffffff' }
    : { border: '1px solid var(--lumino-accent, #8b5cf6)', color: 'var(--lumino-ink, #1a1a1a)', background: 'transparent' };
  return cta.href
    ? <a href={cta.href} className={base} style={style}>{cta.label}</a>
    : <button type="button" className={base} style={style}>{cta.label}</button>;
}

type Pixel = {
  x: number; y: number; color: string; ctx: CanvasRenderingContext2D;
  speed: number; size: number; sizeStep: number; minSize: number;
  maxSizeInt: number; maxSize: number; delay: number; counter: number;
  counterStep: number; isIdle: boolean; isReverse: boolean; isShimmer: boolean;
  draw: () => void; appear: () => void; shimmer: () => void;
};

function createPixel(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, x: number, y: number, color: string, baseSpeed: number, delay: number): Pixel {
  const rand = (min: number, max: number) => Math.random() * (max - min) + min;
  const p: Pixel = {
    x, y, color, ctx,
    speed: rand(0.08, 0.4) * baseSpeed,
    size: 0, sizeStep: rand(0.12, 0.28), minSize: 0.5, maxSizeInt: 2,
    maxSize: rand(0.5, 2), delay, counter: 0,
    counterStep: rand(1.8, 3.2) + (canvas.width + canvas.height) * 0.008,
    isIdle: false, isReverse: false, isShimmer: false,
    draw() {
      const offset = p.maxSizeInt * 0.5 - p.size * 0.5;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x + offset, p.y + offset, p.size, p.size);
    },
    appear() {
      p.isIdle = false;
      if (p.counter <= p.delay) { p.counter += p.counterStep; return; }
      if (p.size >= p.maxSize) p.isShimmer = true;
      if (p.isShimmer) p.shimmer(); else p.size += p.sizeStep;
      p.draw();
    },
    shimmer() {
      if (p.size >= p.maxSize) p.isReverse = true;
      else if (p.size <= p.minSize) p.isReverse = false;
      if (p.isReverse) p.size -= p.speed; else p.size += p.speed;
    },
  };
  return p;
}

function PixelCanvas({ colors, gap, speed = 30 }: { colors: string[]; gap: number; speed?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const pixelsRef = useRef<Pixel[]>([]);
  const animationRef = useRef<number>(0);
  const lastFrameRef = useRef(performance.now());
  const reducedMotionRef = useRef(false);

  const init = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap || colors.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { width, height } = wrap.getBoundingClientRect();
    const w = Math.floor(width); const h = Math.floor(height);
    canvas.width = w; canvas.height = h;
    canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
    const effectiveSpeed = reducedMotionRef.current ? 0 : Math.min(speed, 100) * 0.001;
    const pixels: Pixel[] = [];
    for (let x = 0; x < w; x += gap) {
      for (let y = 0; y < h; y += gap) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        const dx = x - w / 2; const dy = y - h / 2;
        const delay = reducedMotionRef.current ? 0 : Math.sqrt(dx * dx + dy * dy) * 0.65;
        pixels.push(createPixel(ctx, canvas, x, y, color, effectiveSpeed, delay));
      }
    }
    pixelsRef.current = pixels;
  }, [colors, gap, speed]);

  const animate = useCallback(() => {
    cancelAnimationFrame(animationRef.current);
    const frameInterval = 1000 / 60;
    const loop = () => {
      animationRef.current = requestAnimationFrame(loop);
      const now = performance.now();
      const elapsed = now - lastFrameRef.current;
      if (elapsed < frameInterval) return;
      lastFrameRef.current = now - (elapsed % frameInterval);
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const pixel of pixelsRef.current) pixel.appear();
    };
    animationRef.current = requestAnimationFrame(loop);
  }, []);

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    init();
    const resizeObserver = new ResizeObserver(() => init());
    if (wrapRef.current) resizeObserver.observe(wrapRef.current);
    animate();
    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationRef.current);
    };
  }, [init, animate]);

  return (
    <div ref={wrapRef} className="absolute inset-0 overflow-hidden">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}

export function PixelHero({
  title,
  subtitle,
  description,
  primaryCta = { label: 'Scopri di più' },
  secondaryCta,
  palette,
  layout = 'centered',
  size = 'normal',
  tone = 'modern',
  className,
}: PixelHeroProps) {
  const s = SIZE[size];
  const left = layout === 'left';
  const serif = tone === 'classic' || tone === 'editorial';
  const light = isLight(palette?.bg);
  const [colors, setColors] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cols: string[];
    if (palette) {
      cols = [palette.accent, palette.muted, palette.ink, palette.accent, palette.muted];
    } else {
      // Niente palette esplicita: leggo le CSS vars correnti (con fallback).
      const probe = document.createElement('div');
      document.body.appendChild(probe);
      const read = (v: string, fb: string) => { probe.style.color = `var(${v}, ${fb})`; return getComputedStyle(probe).color; };
      cols = [read('--lumino-accent', '#8b5cf6'), read('--lumino-muted', '#e8e8e8'), read('--lumino-ink', '#1a1a1a'), read('--lumino-accent', '#8b5cf6'), read('--lumino-muted', '#e8e8e8')];
      document.body.removeChild(probe);
    }
    setColors(cols);
    const t = setTimeout(() => setLoaded(true), 50);
    return () => clearTimeout(t);
  }, [palette]);

  const titleStyle: React.CSSProperties = light
    ? { color: 'var(--lumino-ink, #1a1a1a)', textShadow: '0 1px 2px rgba(0,0,0,0.08)' }
    : {
        color: 'transparent',
        background: 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.45) 30%, rgba(255,255,255,1) 60%, rgba(255,255,255,0.5) 100%)',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextStroke: '1px rgba(255,255,255,0.35)',
        filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.35))',
      };

  return (
    <div
      className={['relative isolate w-full select-none overflow-hidden flex flex-col justify-center', s.minH, s.pad, 'px-6', className].filter(Boolean).join(' ')}
      style={{ ...paletteVars(palette), background: 'var(--lumino-bg, #ffffff)', color: 'var(--lumino-ink, #1a1a1a)' }}
    >
      {/* Canvas pixel + vignettatura verso il bg per fondere i bordi */}
      <div className="pointer-events-none absolute inset-0 z-0">
        {colors.length > 0 && <PixelCanvas colors={colors} gap={s.gap} speed={30} />}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at center, transparent 0%, var(--lumino-bg, #ffffff) 100%)', opacity: 0.85 }} />
      </div>

      <div className={['relative z-10 mx-auto w-full max-w-5xl', left ? 'text-left' : 'text-center'].join(' ')}>
        {subtitle && (
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--lumino-accent, #8b5cf6)' }}>
            {subtitle}
          </p>
        )}
        <h1
          className={[s.title, serif ? 'font-serif' : 'font-sans', 'font-extrabold leading-[1.05] tracking-tight', tone === 'editorial' ? 'italic font-medium' : '']
            .filter(Boolean)
            .join(' ')}
          style={titleStyle}
        >
          {title}
        </h1>
        {description && (
          <p
            className={['mt-6 text-base sm:text-lg leading-relaxed', left ? 'max-w-xl' : 'mx-auto max-w-2xl']
              .join(' ')}
            style={{ color: 'var(--lumino-ink, #1a1a1a)', opacity: 0.82 }}
          >
            {description}
          </p>
        )}
        {(primaryCta || secondaryCta) && (
          <div
            className={['mt-9 flex flex-wrap gap-3 transition-all duration-700', left ? 'justify-start' : 'justify-center', loaded ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'].join(' ')}
          >
            {primaryCta && <HeroCta cta={primaryCta} variant="primary" />}
            {secondaryCta && <HeroCta cta={secondaryCta} variant="secondary" />}
          </div>
        )}
      </div>
    </div>
  );
}
