'use client';

import React, { useEffect, useState } from 'react';

/** TextType — effetto macchina da scrivere. Props: text, speed?(ms/char), cursor?. */
export interface TextTypeProps { text: string; speed?: number; cursor?: boolean; className?: string; }

export function TextType({ text, speed = 50, cursor = true, className }: TextTypeProps) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    const id = setInterval(() => setN((p) => { if (p >= text.length) { clearInterval(id); return p; } return p + 1; }), Math.max(10, speed));
    return () => clearInterval(id);
  }, [text, speed]);
  return (
    <span className={className}>
      <style>{`@keyframes lumino-blink { 50% { opacity: 0; } } .lumino-caret { animation: lumino-blink 1s step-end infinite; }`}</style>
      {text.slice(0, n)}
      {cursor && <span className="lumino-caret" aria-hidden>|</span>}
    </span>
  );
}

export default TextType;
