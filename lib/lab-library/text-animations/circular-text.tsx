'use client';

import React from 'react';

/** CircularText — testo disposto su un cerchio. Props: text, radius?, spin?. */
export interface CircularTextProps { text: string; radius?: number; spin?: boolean; className?: string; }

export function CircularText({ text, radius = 100, spin = false, className }: CircularTextProps) {
  const chars = text.split('');
  const step = 360 / Math.max(1, chars.length);
  return (
    <div className={className} style={{ position: 'relative', width: radius * 2, height: radius * 2, animation: spin ? 'lumino-cspin 14s linear infinite' : undefined }} aria-label={text}>
      <style>{`@keyframes lumino-cspin { to { transform: rotate(360deg); } }`}</style>
      {chars.map((ch, i) => (
        <span key={i} aria-hidden style={{ position: 'absolute', left: '50%', top: 0, height: radius, transformOrigin: `0 ${radius}px`, transform: `rotate(${i * step}deg)`, fontSize: 14, fontWeight: 600 }}>
          {ch}
        </span>
      ))}
    </div>
  );
}

export default CircularText;
