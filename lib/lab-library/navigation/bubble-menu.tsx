'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

type Link = { label: string; href: string };

/**
 * BubbleMenu — menu a bolle con FAB rotondo.
 * Un bottone tondo che, al click, espande i link come bolle animate con stagger.
 *
 * @param links - elenco dei link da mostrare come bolle.
 * @param position - 'bottom' (default): le bolle escono verso l'alto; 'top': scendono verso il basso.
 * @param className - classi CSS aggiuntive per il contenitore.
 */
export interface BubbleMenuProps {
  links: Array<Link>;
  position?: 'top' | 'bottom';
  className?: string;
}

export function BubbleMenu({ links, position = 'bottom', className }: BubbleMenuProps) {
  const [open, setOpen] = useState(false);
  const goesUp = position === 'bottom';
  const offsetSign = goesUp ? -1 : 1;

  return (
    <div
      className={['relative inline-flex flex-col items-center', className].filter(Boolean).join(' ')}
      style={{ color: 'var(--lumino-ink, #1a1a1a)' }}
    >
      <AnimatePresence>
        {open && (
          <div
            className="absolute left-1/2 flex flex-col items-center gap-3"
            style={{
              transform: 'translateX(-50%)',
              [goesUp ? 'bottom' : 'top']: '4.5rem',
            }}
          >
            {(goesUp ? [...links].reverse() : links).map((link, i) => (
              <motion.a
                key={link.href + link.label}
                href={link.href}
                initial={{ opacity: 0, y: 20 * offsetSign, scale: 0.6 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20 * offsetSign, scale: 0.6 }}
                transition={{ delay: i * 0.06, type: 'spring', stiffness: 320, damping: 22 }}
                title={link.label}
                className="flex h-14 w-14 items-center justify-center rounded-full text-xs font-semibold shadow-lg"
                style={{
                  background: 'var(--lumino-accent, #8b5cf6)',
                  color: 'var(--lumino-bg, #ffffff)',
                }}
              >
                <span className="px-1 text-center leading-tight">
                  {link.label.length > 7 ? link.label.charAt(0).toUpperCase() : link.label}
                </span>
              </motion.a>
            ))}
          </div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Chiudi menu' : 'Apri menu'}
        aria-expanded={open}
        className="flex h-16 w-16 items-center justify-center rounded-full shadow-xl transition-transform hover:scale-105 active:scale-95"
        style={{
          background: 'var(--lumino-accent, #8b5cf6)',
          color: 'var(--lumino-bg, #ffffff)',
        }}
      >
        <motion.span animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.2 }}>
          {open ? <X size={26} /> : <Menu size={26} />}
        </motion.span>
      </button>
    </div>
  );
}

export default BubbleMenu;
