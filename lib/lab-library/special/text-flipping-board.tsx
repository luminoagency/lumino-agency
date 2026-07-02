'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * TextFlippingBoard — tabellone split-flap stile aeroporto/Solari.
 * Ogni cella "gira" attraverso un set di caratteri fino a comporre il testo target.
 *
 * Props:
 * - text: testo da comporre (gestito in maiuscolo)
 * - speed: millisecondi per ogni step di flip (default 100)
 * - className: classi aggiuntive sul contenitore
 */
export interface TextFlippingBoardProps {
  text: string;
  speed?: number;
  className?: string;
}

const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ';

export function TextFlippingBoard({ text, speed = 100, className }: TextFlippingBoardProps) {
  const target = (text ?? '').toUpperCase();
  const [display, setDisplay] = useState<string>(() => ' '.repeat(target.length));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setDisplay(' '.repeat(target.length));

    intervalRef.current = setInterval(() => {
      setDisplay((prev) => {
        let done = true;
        const next = target
          .split('')
          .map((targetChar, i) => {
            const current = prev[i] ?? ' ';
            if (current === targetChar) return current;
            done = false;
            const idxCur = CHARSET.indexOf(current);
            const safeIdx = idxCur === -1 ? 0 : idxCur;
            // Avanza di una posizione nel set fino a raggiungere il target.
            return CHARSET[(safeIdx + 1) % CHARSET.length];
          })
          .join('');

        if (done && intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        return next;
      });
    }, speed);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [target, speed]);

  return (
    <div
      className={['inline-flex gap-1', className].filter(Boolean).join(' ')}
      style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
    >
      {display.split('').map((char, i) => (
        <motion.span
          key={`${i}-${char}`}
          initial={{ rotateX: -90, opacity: 0.4 }}
          animate={{ rotateX: 0, opacity: 1 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="flex items-center justify-center rounded-md text-lg font-bold uppercase"
          style={{
            minWidth: '1.4em',
            height: '1.9em',
            background: 'var(--lumino-ink, #1a1a1a)',
            color: char === ' ' ? 'transparent' : 'var(--lumino-accent, #8b5cf6)',
            border: '1px solid color-mix(in srgb, var(--lumino-accent, #8b5cf6) 30%, transparent)',
            transformStyle: 'preserve-3d',
          }}
        >
          {char === ' ' ? ' ' : char}
        </motion.span>
      ))}
    </div>
  );
}

export default TextFlippingBoard;
