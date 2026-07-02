'use client';

import React, { useEffect, useRef } from 'react';

/**
 * AetherHero — hero a tutto schermo con shader WebGL2 animato. Overlay scuro forte per
 * garantire la leggibilità del testo su qualunque pattern. Palette opzionale via CSS vars
 * (la CTA primaria usa l'accent). Testo italiano via prop.
 *
 * Props:
 * - title (required): titolo principale.
 * - subtitle?: sottotitolo.
 * - ctaLabel?/ctaHref? + secondaryCtaLabel?/secondaryCtaHref?: CTA.
 * - align?: 'left' | 'center' (default) | 'right'.
 * - palette?: { bg, ink, accent, muted } — accent usato per la CTA primaria.
 * - height?: altezza sezione (default '100vh'). className?, ariaLabel?.
 *
 * @example
 * <AetherHero title="Trattoria Mario" subtitle="Cucina milanese dal 1962"
 *   ctaLabel="Prenota" align="center"
 *   palette={{bg:'#0a0a0a',ink:'#fff',accent:'#A0522D',muted:'#222'}} />
 */

type Palette = { bg: string; ink: string; accent: string; muted: string };

export interface AetherHeroProps {
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  align?: 'left' | 'center' | 'right';
  maxWidth?: number;
  palette?: Palette;
  height?: string | number;
  className?: string;
  ariaLabel?: string;
}

function paletteVars(p?: Palette): React.CSSProperties {
  return p ? ({ '--lumino-bg': p.bg, '--lumino-ink': p.ink, '--lumino-accent': p.accent, '--lumino-muted': p.muted } as React.CSSProperties) : {};
}

const DEFAULT_FRAG = `#version 300 es
precision highp float;
out vec4 O;
uniform float time;
uniform vec2 resolution;
#define FC gl_FragCoord.xy
#define R resolution
#define T time
#define MN min(R.x,R.y)
float pattern(vec2 uv) {
  float d=.0;
  for (float i=.0; i<3.; i++) {
    uv.x+=sin(T*(1.+i)+uv.y*1.5)*.2;
    d+=.005/abs(uv.x);
  }
  return d;
}
vec3 scene(vec2 uv) {
  vec3 col=vec3(0);
  uv=vec2(atan(uv.x,uv.y)*2./6.28318,-log(length(uv))+T);
  for (float i=.0; i<3.; i++) {
    int k=int(mod(i,3.));
    col[k]+=pattern(uv+i*6./MN);
  }
  return col;
}
void main() {
  vec2 uv=(FC-.5*R)/MN;
  vec3 col=vec3(0);
  float s=12., e=9e-4;
  col+=e/(sin(uv.x*s)*cos(uv.y*s));
  uv.y+=R.x>R.y?.5:.5*(R.y/R.x);
  col+=scene(uv);
  O=vec4(col,1.);
}`;

const VERT_SRC = `#version 300 es
precision highp float;
in vec2 position;
void main(){ gl_Position = vec4(position, 0.0, 1.0); }`;

export default function AetherHero({
  title,
  subtitle,
  ctaLabel,
  ctaHref = '#',
  secondaryCtaLabel,
  secondaryCtaHref = '#',
  align = 'center',
  maxWidth = 960,
  palette,
  height = '100vh',
  className = '',
  ariaLabel = 'Sfondo animato',
}: AetherHeroProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const gl = canvas.getContext('webgl2', { alpha: true, antialias: true });
    if (!gl) return;

    const compile = (src: string, type: number) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) { gl.deleteShader(sh); throw new Error(gl.getShaderInfoLog(sh) || 'shader'); }
      return sh;
    };
    let prog: WebGLProgram;
    try {
      const v = compile(VERT_SRC, gl.VERTEX_SHADER);
      const f = compile(DEFAULT_FRAG, gl.FRAGMENT_SHADER);
      prog = gl.createProgram()!;
      gl.attachShader(prog, v); gl.attachShader(prog, f); gl.linkProgram(prog);
      gl.deleteShader(v); gl.deleteShader(f);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) || 'link');
    } catch (e) { console.error(e); return; }

    const verts = new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1]);
    const buf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
    gl.useProgram(prog);
    const posLoc = gl.getAttribLocation(prog, 'position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
    const uTime = gl.getUniformLocation(prog, 'time');
    const uRes = gl.getUniformLocation(prog, 'resolution');
    gl.clearColor(0, 0, 0, 1);

    const fit = () => {
      const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
      const rect = canvas.getBoundingClientRect();
      const W = Math.floor(Math.max(1, rect.width) * dpr);
      const H = Math.floor(Math.max(1, rect.height) * dpr);
      if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);

    const loop = (now: number) => {
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      if (uTime) gl.uniform1f(uTime, now * 1e-3);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      ro.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
    };
  }, []);

  const justify = align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center';
  const textAlign = align === 'left' ? 'left' : align === 'right' ? 'right' : 'center';

  return (
    <section className={className} style={{ ...paletteVars(palette), height, position: 'relative', overflow: 'hidden' }} aria-label="Hero">
      <canvas ref={canvasRef} role="img" aria-label={ariaLabel} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', userSelect: 'none', touchAction: 'none' }} />
      {/* Overlay scuro forte: leggibilità garantita su tutta l'area */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.78), rgba(0,0,0,0.5) 45%, rgba(0,0,0,0.62))', pointerEvents: 'none' }} />
      <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', alignItems: 'center', justifyContent: justify, padding: 'min(6vw, 64px)', color: '#ffffff' }}>
        <div style={{ width: '100%', maxWidth, marginInline: align === 'center' ? 'auto' : undefined, textAlign }}>
          <h1 style={{ margin: 0, fontSize: 'clamp(2.2rem, 6vw, 4.5rem)', lineHeight: 1.04, letterSpacing: '-0.02em', fontWeight: 700, textShadow: '0 6px 36px rgba(0,0,0,0.5)' }}>{title}</h1>
          {subtitle && <p style={{ marginTop: '1rem', fontSize: 'clamp(1rem, 2vw, 1.25rem)', lineHeight: 1.6, opacity: 0.92, textShadow: '0 4px 24px rgba(0,0,0,0.45)', maxWidth: 760, marginInline: align === 'center' ? 'auto' : undefined }}>{subtitle}</p>}
          {(ctaLabel || secondaryCtaLabel) && (
            <div style={{ display: 'inline-flex', gap: 12, marginTop: '2rem', flexWrap: 'wrap' }}>
              {ctaLabel && <a href={ctaHref} style={{ padding: '12px 22px', borderRadius: 9999, background: 'var(--lumino-accent, #8b5cf6)', color: '#fff', textDecoration: 'none', fontWeight: 600, boxShadow: '0 10px 30px rgba(0,0,0,.25)' }}>{ctaLabel}</a>}
              {secondaryCtaLabel && <a href={secondaryCtaHref} style={{ padding: '12px 22px', borderRadius: 9999, background: 'transparent', color: '#fff', textDecoration: 'none', fontWeight: 600, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.5)' }}>{secondaryCtaLabel}</a>}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export { AetherHero };
