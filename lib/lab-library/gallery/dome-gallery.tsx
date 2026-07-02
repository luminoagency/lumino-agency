'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Image, Billboard } from '@react-three/drei';
import * as THREE from 'three';

/**
 * DomeGallery — galleria a cupola 3D: le immagini sono disposte sulla metà
 * superiore di una semisfera e il gruppo ruota lentamente (se autoRotate).
 * Render solo client-side (guard `mounted`) per evitare crash SSR.
 *
 * Props:
 * - images (required): Array<{ src, alt }>, max ~12 immagini.
 * - autoRotate? (default true): rotazione automatica della cupola.
 * - className?: classi extra del contenitore.
 *
 * @example
 * <DomeGallery images={[{ src: '/foto1.jpg', alt: 'Sala' }]} />
 */

type Img = { src: string; alt: string };

export interface DomeGalleryProps {
  images: Img[];
  autoRotate?: boolean;
  className?: string;
}

const cx = (...a: Array<string | false | undefined>) => a.filter(Boolean).join(' ');

function Dome({ images, autoRotate }: { images: Img[]; autoRotate: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current && autoRotate) ref.current.rotation.y += dt * 0.1;
  });

  const radius = 9;
  // Distribuzione delle immagini sulla metà superiore della cupola:
  // phi limitato a [0, ~70°] (dal polo verso l'equatore), theta a giro completo.
  const placed = useMemo(() => {
    const n = images.length;
    return images.map((img, i) => {
      const phi = (Math.PI / 2.6) * ((i + 0.5) / n); // 0..~70°, evita il polo netto
      const theta = Math.PI * (1 + Math.sqrt(5)) * i; // spirale aurea
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi); // sempre >= 0 → metà superiore
      const z = radius * Math.sin(phi) * Math.sin(theta);
      return { img, pos: [x, y - radius * 0.45, z] as [number, number, number] };
    });
  }, [images]);

  return (
    <group ref={ref}>
      {placed.map(({ img, pos }, i) => (
        <Billboard key={i} position={pos}>
          <Image url={img.src} scale={[3, 3] as any} transparent radius={0.18} />
        </Billboard>
      ))}
    </group>
  );
}

export function DomeGallery({ images, autoRotate = true, className }: DomeGalleryProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const imgs = images.slice(0, 12);
  const rootStyle: React.CSSProperties = {
    background: 'var(--lumino-bg, #0a0a0a)',
    color: 'var(--lumino-ink, #ffffff)',
  };

  return (
    <section className={cx('relative w-full overflow-hidden h-[70vh]', className)} style={rootStyle}>
      {mounted ? (
        <Canvas camera={{ position: [0, 4, 22], fov: 45 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
          <ambientLight intensity={1.3} />
          <Dome images={imgs} autoRotate={autoRotate} />
        </Canvas>
      ) : (
        <div className="absolute inset-0 grid place-items-center text-sm" style={{ opacity: 0.5 }}>
          Caricamento galleria 3D…
        </div>
      )}
    </section>
  );
}

export default DomeGallery;
