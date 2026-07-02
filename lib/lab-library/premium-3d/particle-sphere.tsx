'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Image, Billboard } from '@react-three/drei';
import * as THREE from 'three';

/**
 * ParticleSphere — sfera 3D di particelle con immagini in orbita. Premium gallery.
 * Render solo client-side (guard mounted) per evitare crash SSR.
 *
 * Props:
 * - title?: titolo sovrapposto.
 * - images (required, 4–8): Array<{ src, alt }> in orbita.
 * - particleCount? (default 1500). sphereRadius? (default 9). autoRotate? (default true).
 * - layout?: 'standard' (default) | 'compact'. size?, tone?, palette?.
 *
 * @example
 * <ParticleSphere title="La galleria" images={[{src:'...',alt:'Foto'}]}
 *   palette={{bg:'#0a0a0a',ink:'#fff',accent:'#A0522D',muted:'#222'}} />
 */

type Palette = { bg: string; ink: string; accent: string; muted: string };
type Img = { src: string; alt: string };

export interface ParticleSphereProps {
  title?: string;
  images: Img[];
  particleCount?: number;
  sphereRadius?: number;
  autoRotate?: boolean;
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

function Particles({ count, radius, color, autoRotate }: { count: number; radius: number; color: string; autoRotate: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / count);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      arr[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = radius * Math.cos(phi);
    }
    return arr;
  }, [count, radius]);
  useFrame((_, dt) => { if (ref.current && autoRotate) ref.current.rotation.y += dt * 0.08; });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.09} color={color} sizeAttenuation transparent opacity={0.85} />
    </points>
  );
}

function Orbit({ images, radius, autoRotate }: { images: Img[]; radius: number; autoRotate: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => { if (ref.current && autoRotate) ref.current.rotation.y -= dt * 0.12; });
  const r = radius * 1.35;
  return (
    <group ref={ref}>
      {images.map((img, i) => {
        const a = (i / images.length) * Math.PI * 2;
        return (
          <Billboard key={i} position={[Math.cos(a) * r, Math.sin(i * 1.2) * 1.5, Math.sin(a) * r]}>
            <Image url={img.src} scale={[3.2, 3.2] as any} transparent radius={0.15} />
          </Billboard>
        );
      })}
    </group>
  );
}

export function ParticleSphere({
  title,
  images,
  particleCount = 1500,
  sphereRadius = 9,
  autoRotate = true,
  layout = 'standard',
  size = 'normal',
  tone = 'modern',
  palette,
  className,
}: ParticleSphereProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const serif = tone === 'classic' || tone === 'editorial';
  const imgs = images.slice(0, 8);
  const accent = palette?.accent || '#8b5cf6';
  const h = layout === 'compact' ? 'h-[60vh]' : 'h-[80vh]';
  const rootStyle: React.CSSProperties = { ...paletteVars(palette), background: 'var(--lumino-bg, #0a0a0a)', color: 'var(--lumino-ink, #ffffff)' };

  return (
    <section className={cx('relative w-full overflow-hidden', h, className)} style={rootStyle}>
      {mounted ? (
        <Canvas camera={{ position: [0, 0, sphereRadius * 3], fov: 45 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
          <ambientLight intensity={1.2} />
          <Particles count={Math.max(200, particleCount)} radius={sphereRadius} color={accent} autoRotate={autoRotate} />
          <Orbit images={imgs} radius={sphereRadius} autoRotate={autoRotate} />
        </Canvas>
      ) : (
        <div className="absolute inset-0 grid place-items-center text-sm" style={{ opacity: 0.5 }}>Caricamento galleria 3D…</div>
      )}
      {title && (
        <div className="pointer-events-none absolute inset-x-0 top-0 p-8 text-center">
          <h2 className={cx('text-3xl md:text-4xl font-bold tracking-tight', serif && 'font-serif')} style={{ textShadow: '0 4px 24px rgba(0,0,0,0.5)' }}>{title}</h2>
        </div>
      )}
    </section>
  );
}

export default ParticleSphere;
