'use client';

import React, { useState } from 'react';

/** TextHoverEffect — riempimento del testo (outline → fill) all'hover. Props: text, color?. */
export interface TextHoverEffectProps { text: string; color?: string; className?: string; }

export function TextHoverEffect({ text, color, className }: TextHoverEffectProps) {
  const [hover, setHover] = useState(false);
  const c = color || 'var(--lumino-accent, #8b5cf6)';
  return (
    <span
      className={className}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ position: 'relative', display: 'inline-block', fontWeight: 800 }}
      aria-label={text}
    >
      <span aria-hidden style={{ color: 'transparent', WebkitTextStroke: `1px ${c}` }}>{text}</span>
      <span aria-hidden style={{ position: 'absolute', inset: 0, color: c, clipPath: hover ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)', transition: 'clip-path .5s ease' }}>{text}</span>
    </span>
  );
}

export default TextHoverEffect;
