'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

type Link = { label: string; href: string };

/**
 * StaggeredMenu — overlay fullscreen con i link che entrano in sequenza (stagger).
 *
 * @param links - elenco dei link mostrati nell'overlay.
 * @param ctaButton - pulsante call-to-action opzionale in fondo all'overlay.
 * @param className - classi CSS aggiuntive per il bottone trigger.
 */
export interface StaggeredMenuProps {
  links: Array<Link>;
  ctaButton?: Link;
  className?: string;
}

export function StaggeredMenu({ links, ctaButton, className }: StaggeredMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={['inline-block', className].filter(Boolean).join(' ')}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Apri menu"
        aria-expanded={open}
        className="flex h-12 w-12 items-center justify-center rounded-full transition-transform hover:scale-105"
        style={{
          background: 'var(--lumino-muted, #f5f5f5)',
          color: 'var(--lumino-ink, #1a1a1a)',
        }}
      >
        <Menu size={24} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 px-6"
            style={{ background: 'var(--lumino-bg, #ffffff)', color: 'var(--lumino-ink, #1a1a1a)' }}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Chiudi menu"
              className="absolute right-6 top-6 flex h-12 w-12 items-center justify-center rounded-full transition-transform hover:scale-105"
              style={{
                background: 'var(--lumino-muted, #f5f5f5)',
                color: 'var(--lumino-ink, #1a1a1a)',
              }}
            >
              <X size={26} />
            </button>

            <nav className="flex flex-col items-center gap-4">
              {links.map((link, i) => (
                <motion.a
                  key={link.href + link.label}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 28 }}
                  transition={{ delay: i * 0.07, duration: 0.4, ease: 'easeOut' }}
                  className="text-3xl font-bold tracking-tight transition-colors hover:opacity-70 md:text-4xl"
                >
                  {link.label}
                </motion.a>
              ))}
            </nav>

            {ctaButton && (
              <motion.a
                href={ctaButton.href}
                onClick={() => setOpen(false)}
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 28 }}
                transition={{ delay: links.length * 0.07, duration: 0.4, ease: 'easeOut' }}
                className="mt-4 rounded-full px-8 py-3 text-base font-semibold shadow-lg transition-transform hover:scale-105"
                style={{
                  background: 'var(--lumino-accent, #8b5cf6)',
                  color: 'var(--lumino-bg, #ffffff)',
                }}
              >
                {ctaButton.label}
              </motion.a>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default StaggeredMenu;
