'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

/**
 * SplashCursor — splash/onde fluide che seguono il cursore.
 * Overlay fisso non interattivo, decorativo (aria-hidden). Nessun three.js.
 *
 * Props:
 * - color?: colore degli splash. Se assente usa --lumino-accent.
 * - viscosity? (default 0.5): 0..1, quanto persiste la scia (durata/decay).
 * - className?: classi extra sull'overlay.
 *
 * @example
 * <SplashCursor color="#8b5cf6" viscosity={0.7} />
 */

export interface SplashCursorProps {
  color?: string;
  viscosity?: number;
  className?: string;
}

type Splash = { id: number; x: number; y: number };

export function SplashCursor({ color, viscosity = 0.5, className }: SplashCursorProps) {
  const [splashes, setSplashes] = useState<Splash[]>([]);
  const idRef = useRef(0);
  const lastRef = useRef(0);

  const accent = color || 'var(--lumino-accent, #8b5cf6)';
  // viscosity 0..1 -> durata animazione 0.4s..1.6s
  const v = Math.min(1, Math.max(0, viscosity));
  const durationMs = 400 + v * 1200;

  const remove = useCallback((id: number) => {
    setSplashes((prev) => prev.filter((s) => s.id !== id));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const timers: ReturnType<typeof setTimeout>[] = [];

    const handleMove = (e: MouseEvent) => {
      const now = Date.now();
      // throttle per non generare troppi nodi
      if (now - lastRef.current < 40) return;
      lastRef.current = now;

      const id = idRef.current++;
      setSplashes((prev) => [...prev.slice(-24), { id, x: e.clientX, y: e.clientY }]);
      const t = setTimeout(() => remove(id), durationMs);
      timers.push(t);
    };

    window.addEventListener('mousemove', handleMove);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      timers.forEach(clearTimeout);
    };
  }, [durationMs, remove]);

  return (
    <div
      aria-hidden
      className={['fixed inset-0 z-50 pointer-events-none overflow-hidden', className]
        .filter(Boolean)
        .join(' ')}
    >
      {splashes.map((s) => (
        <span
          key={s.id}
          style={{
            position: 'absolute',
            left: s.x,
            top: s.y,
            width: 24,
            height: 24,
            marginLeft: -12,
            marginTop: -12,
            borderRadius: '9999px',
            background: accent,
            animation: `lumino-splash ${durationMs}ms ease-out forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes lumino-splash {
          0% { transform: scale(0.4); opacity: 0.6; }
          100% { transform: scale(3.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default SplashCursor;
