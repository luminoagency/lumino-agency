'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Link = { label: string; href: string };

type CardNavItem = {
  label: string;
  href: string;
  preview?: { image?: string; description?: string };
};

/**
 * CardNav — navigazione orizzontale dove ogni voce, al passaggio del mouse,
 * mostra una card di anteprima con immagine e descrizione.
 *
 * @param items - voci di menu, ciascuna con eventuale anteprima (immagine + descrizione).
 * @param className - classi CSS aggiuntive per il contenitore.
 */
export interface CardNavProps {
  items: Array<CardNavItem>;
  className?: string;
}

export function CardNav({ items, className }: CardNavProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const active = hovered !== null ? items[hovered] : null;

  return (
    <nav
      className={['relative inline-block', className].filter(Boolean).join(' ')}
      onMouseLeave={() => setHovered(null)}
      style={{ color: 'var(--lumino-ink, #1a1a1a)' }}
    >
      <ul
        className="flex items-center gap-1 rounded-xl px-2 py-2"
        style={{ background: 'var(--lumino-muted, #f5f5f5)' }}
      >
        {items.map((item, i) => (
          <li key={item.href + item.label}>
            <a
              href={item.href}
              onMouseEnter={() => setHovered(i)}
              className="block rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              style={{
                background: hovered === i ? 'var(--lumino-bg, #ffffff)' : 'transparent',
                color: hovered === i ? 'var(--lumino-accent, #8b5cf6)' : 'var(--lumino-ink, #1a1a1a)',
              }}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>

      <AnimatePresence>
        {active && active.preview && (
          <motion.div
            key={hovered}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="absolute left-0 top-full z-20 mt-3 w-72 overflow-hidden rounded-2xl shadow-2xl"
            style={{ background: 'var(--lumino-bg, #ffffff)' }}
          >
            {active.preview.image && (
              <img
                src={active.preview.image}
                alt={active.label}
                className="h-36 w-full object-cover"
              />
            )}
            <div className="p-4">
              <p className="text-sm font-semibold" style={{ color: 'var(--lumino-ink, #1a1a1a)' }}>
                {active.label}
              </p>
              {active.preview.description && (
                <p className="mt-1 text-sm leading-snug" style={{ color: 'var(--lumino-ink, #1a1a1a)', opacity: 0.7 }}>
                  {active.preview.description}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

export default CardNav;
