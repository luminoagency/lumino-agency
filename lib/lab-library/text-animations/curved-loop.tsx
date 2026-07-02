'use client';

import React, { useId } from 'react';

/** CurvedLoop — testo che scorre in loop su un tracciato curvo (SVG). Props: text, speed?, curve?. */
export interface CurvedLoopProps { text: string; speed?: number; curve?: number; className?: string; }

export function CurvedLoop({ text, speed = 12, curve = 40, className }: CurvedLoopProps) {
  const id = useId().replace(/:/g, '');
  const phrase = `${text}  `;
  return (
    <svg className={className} viewBox="0 0 400 120" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', overflow: 'visible' }} aria-label={text}>
      <defs><path id={`p-${id}`} d={`M0,100 Q200,${100 - curve} 400,100`} fill="none" /></defs>
      <text fontSize="22" fontWeight={600} fill="currentColor">
        <textPath href={`#p-${id}`} startOffset="0%">
          <animate attributeName="startOffset" from="0%" to="-50%" dur={`${Math.max(3, speed)}s`} repeatCount="indefinite" />
          {phrase}{phrase}{phrase}{phrase}
        </textPath>
      </text>
    </svg>
  );
}

export default CurvedLoop;
