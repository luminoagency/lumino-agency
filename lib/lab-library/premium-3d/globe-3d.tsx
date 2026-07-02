'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Globe3D — globo 3D rotante con pin geolocalizzati.
 * Render solo client-side (guard `mounted`) per evitare crash SSR.
 *
 * Props:
 * - pins (required): Array<{ lat, lng, label? }> coordinate dei pin sul globo.
 * - autoRotate? (default true): rotazione automatica del globo.
 * - color?: colore accento (sfera + pin). Se assente usa --lumino-accent.
 * - className?: classi extra sul contenitore.
 *
 * @example
 * <Globe3D pins={[{ lat: 41.9, lng: 12.5, label: 'Roma' }]} />
 */

export interface Globe3DProps {
  pins: Array<{ lat: number; lng: number; label?: string }>;
  autoRotate?: boolean;
  color?: string;
  className?: string;
}

const RADIUS = 2;

/** Converte lat/lng (gradi) in posizione cartesiana sulla sfera. */
function latLngToVec3(lat: number, lng: number, r: number): [number, number, number] {
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;
  const x = -r * Math.cos(latRad) * Math.cos(lngRad);
  const y = r * Math.sin(latRad);
  const z = r * Math.cos(latRad) * Math.sin(lngRad);
  return [x, y, z];
}

function GlobeMesh({
  pins,
  autoRotate,
  accent,
}: {
  pins: Array<{ lat: number; lng: number; label?: string }>;
  autoRotate: boolean;
  accent: string;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, dt) => {
    if (groupRef.current && autoRotate) groupRef.current.rotation.y += dt * 0.18;
  });

  const pinPositions = useMemo(
    () => pins.map((p) => latLngToVec3(p.lat, p.lng, RADIUS * 1.02)),
    [pins],
  );

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[RADIUS, 48, 48]} />
        <meshStandardMaterial
          color={accent}
          wireframe
          transparent
          opacity={0.35}
          emissive={accent}
          emissiveIntensity={0.15}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[RADIUS * 0.985, 48, 48]} />
        <meshStandardMaterial color={accent} transparent opacity={0.08} />
      </mesh>
      {pinPositions.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.8} />
        </mesh>
      ))}
    </group>
  );
}

export function Globe3D({ pins, autoRotate = true, color, className }: Globe3DProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const accent = color || 'var(--lumino-accent, #8b5cf6)';
  // Per i materiali three.js serve un colore concreto, non una CSS var.
  const accentSolid = color || '#8b5cf6';

  const rootStyle: React.CSSProperties = {
    background: 'var(--lumino-bg, #0a0a0a)',
    color: 'var(--lumino-ink, #ffffff)',
  };

  return (
    <section
      className={['relative w-full h-[70vh] overflow-hidden', className].filter(Boolean).join(' ')}
      style={rootStyle}
    >
      {mounted ? (
        <Canvas
          camera={{ position: [0, 0, 6], fov: 45 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true }}
        >
          <ambientLight intensity={0.9} />
          <pointLight position={[5, 5, 5]} intensity={1.4} color={accent} />
          <GlobeMesh pins={pins} autoRotate={autoRotate} accent={accentSolid} />
        </Canvas>
      ) : (
        <div className="absolute inset-0 grid place-items-center text-sm" style={{ opacity: 0.5 }}>
          Caricamento 3D…
        </div>
      )}
    </section>
  );
}

export default Globe3D;
