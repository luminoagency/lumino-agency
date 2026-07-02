'use client';

import React, { useState } from 'react';

/** TextPressure — il testo si schiaccia mentre lo premi. Props: text, intensity?, color?. */
export interface TextPressureProps { text: string; intensity?: number; color?: string; className?: string; }

export function TextPressure({ text, intensity = 0.82, color, className }: TextPressureProps) {
  const [pressed, setPressed] = useState(false);
  return (
    <span
      className={className}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        display: 'inline-block',
        cursor: 'pointer',
        transition: 'transform .15s ease',
        transformOrigin: 'bottom center',
        transform: pressed ? `scaleY(${intensity}) scaleX(${(2 - intensity).toFixed(2)})` : 'none',
        color: color || 'var(--lumino-ink, currentColor)',
        fontWeight: 800,
      }}
    >
      {text}
    </span>
  );
}

export default TextPressure;
