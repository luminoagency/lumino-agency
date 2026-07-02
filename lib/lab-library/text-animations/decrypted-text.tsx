'use client';

import React, { useEffect, useState } from 'react';

/** DecryptedText — effetto "decrittazione" matrix (caratteri casuali che si risolvono). Props: text, speed?, characters?. */
export interface DecryptedTextProps { text: string; speed?: number; characters?: string; className?: string; }

const SYM = '!<>-_\\/[]{}=+*^?#________';

export function DecryptedText({ text, speed = 30, characters, className }: DecryptedTextProps) {
  const pool = characters || SYM;
  const [disp, setDisp] = useState(text);
  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i++;
      const revealed = Math.floor(i / 2);
      setDisp(text.split('').map((ch, idx) => (idx < revealed ? ch : ch === ' ' ? ' ' : pool[Math.floor(Math.random() * pool.length)])).join(''));
      if (revealed >= text.length) clearInterval(id);
    }, Math.max(10, speed));
    return () => clearInterval(id);
  }, [text, speed, pool]);
  return <span className={className} style={{ fontFamily: 'monospace' }}>{disp}</span>;
}

export default DecryptedText;
