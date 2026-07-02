'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

/**
 * TagList — lista di tag/chip inline, opzionalmente rimovibili.
 *
 * Mostra una serie di chip arrotondati con tinta personalizzabile per tag.
 * Se `removable` è attivo, ogni chip espone una piccola X cliccabile che
 * rimuove il tag dallo stato locale con uscita animata.
 *
 * @prop tags - Elenco dei tag da mostrare (label + colore opzionale).
 * @prop removable - Se true, i chip possono essere rimossi.
 * @prop className - Classi CSS aggiuntive.
 */
export interface TagListProps {
  tags: Array<{ label: string; color?: string }>;
  removable?: boolean;
  className?: string;
}

export function TagList({ tags, removable = false, className }: TagListProps) {
  const [items, setItems] = useState(tags);

  const remove = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className={['flex flex-wrap gap-2', className].filter(Boolean).join(' ')}>
      <AnimatePresence initial={false}>
        {items.map((tag, index) => {
          const tint = tag.color ?? 'var(--lumino-accent, #8b5cf6)';
          return (
            <motion.span
              key={`${tag.label}-${index}`}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.18 }}
              className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium"
              style={{
                color: tint,
                backgroundColor: 'color-mix(in srgb, currentColor 14%, transparent)',
              }}
            >
              {tag.label}
              {removable && (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  aria-label={`Rimuovi ${tag.label}`}
                  className="inline-flex items-center justify-center rounded-full p-0.5 transition-opacity hover:opacity-70"
                  style={{ color: tint }}
                >
                  <X size={14} strokeWidth={2.5} />
                </button>
              )}
            </motion.span>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export default TagList;
