'use client';

import React, { useRef } from 'react';

/** VariableProximity — il peso del font cambia in base alla distanza del mouse. Props: text, radius?. */
export interface VariableProximityProps { text: string; radius?: number; className?: string; }

export function VariableProximity({ text, radius = 100, className }: VariableProximityProps) {
  const refs = useRef<Array<HTMLSpanElement | null>>([]);
  const onMove = (e: React.MouseEvent) => {
    refs.current.forEach((el) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
      const w = Math.max(100, 900 - (d / radius) * 800);
      el.style.fontWeight = String(Math.round(w));
    });
  };
  const reset = () => refs.current.forEach((el) => { if (el) el.style.fontWeight = '400'; });
  return (
    <span className={className} onMouseMove={onMove} onMouseLeave={reset} aria-label={text}>
      {text.split('').map((ch, i) => (
        <span key={i} aria-hidden ref={(el) => { refs.current[i] = el; }} style={{ display: 'inline-block', whiteSpace: 'pre', transition: 'font-weight .12s ease' }}>{ch}</span>
      ))}
    </span>
  );
}

export default VariableProximity;
