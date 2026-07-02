'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';

type Link = { label: string; href: string };

/**
 * PillNav — navbar in stile "pill" con indicatore animato che scorre sulla voce attiva.
 *
 * @param links - elenco delle voci di navigazione.
 * @param activeIndex - indice della voce attiva iniziale (default 0).
 * @param className - classi CSS aggiuntive per il contenitore.
 */
export interface PillNavProps {
  links: Array<Link>;
  activeIndex?: number;
  className?: string;
}

export function PillNav({ links, activeIndex = 0, className }: PillNavProps) {
  const [active, setActive] = useState(activeIndex);

  return (
    <nav
      className={['inline-flex items-center gap-1 rounded-full p-1.5', className].filter(Boolean).join(' ')}
      style={{ background: 'var(--lumino-muted, #f5f5f5)' }}
    >
      {links.map((link, i) => {
        const isActive = i === active;
        return (
          <a
            key={link.href + link.label}
            href={link.href}
            onClick={() => setActive(i)}
            className="relative rounded-full px-5 py-2 text-sm font-medium transition-colors"
            style={{
              color: isActive ? 'var(--lumino-bg, #ffffff)' : 'var(--lumino-ink, #1a1a1a)',
            }}
          >
            {isActive && (
              <motion.span
                layoutId="pill-indicator"
                className="absolute inset-0 rounded-full"
                style={{ background: 'var(--lumino-accent, #8b5cf6)' }}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative z-10">{link.label}</span>
          </a>
        );
      })}
    </nav>
  );
}

export default PillNav;
