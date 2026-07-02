'use client';

import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/** MobileMenu — menu hamburger fullscreen. Props: links, ctaButton?. */
type Link = { label: string; href: string };
export interface MobileMenuProps { links: Link[]; ctaButton?: Link; className?: string; }

export function MobileMenu({ links, ctaButton, className }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className={['md:hidden', className].filter(Boolean).join(' ')}>
      <button type="button" aria-label="Apri menu" onClick={() => setOpen(true)} className="p-2" style={{ color: 'var(--lumino-ink, #1a1a1a)' }}>
        <Menu className="h-6 w-6" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col p-6" style={{ background: 'var(--lumino-bg, #ffffff)', color: 'var(--lumino-ink, #1a1a1a)' }}>
            <div className="flex justify-end">
              <button type="button" aria-label="Chiudi menu" onClick={() => setOpen(false)} className="p-2"><X className="h-6 w-6" /></button>
            </div>
            <nav className="mt-8 flex flex-col gap-6">
              {links.map((l, i) => (
                <motion.a key={i} href={l.href} onClick={() => setOpen(false)}
                  initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="text-2xl font-semibold">{l.label}</motion.a>
              ))}
            </nav>
            {ctaButton && <a href={ctaButton.href} onClick={() => setOpen(false)} className="mt-auto rounded-full py-3 text-center text-sm font-semibold" style={{ background: 'var(--lumino-accent, #8b5cf6)', color: '#fff' }}>{ctaButton.label}</a>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default MobileMenu;
