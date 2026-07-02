'use client';

import React, { useId } from 'react';

/** TrueFocus — sfoca gli altri elementi tranne quello sotto il mouse (CSS puro). Props: children, intensity?. */
export interface TrueFocusProps { children: React.ReactNode; intensity?: number; className?: string; }

export function TrueFocus({ children, intensity = 4, className }: TrueFocusProps) {
  const cls = `tf-${useId().replace(/:/g, '')}`;
  return (
    <div className={[cls, className].filter(Boolean).join(' ')}>
      <style>{`.${cls} > * { transition: filter .3s, opacity .3s; } .${cls}:hover > *:not(:hover) { filter: blur(${intensity}px); opacity: .5; }`}</style>
      {children}
    </div>
  );
}

export default TrueFocus;
