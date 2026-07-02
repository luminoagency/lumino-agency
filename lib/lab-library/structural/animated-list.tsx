'use client';

import React from 'react';
import { motion } from 'framer-motion';

/**
 * AnimatedList
 * Lista i cui elementi entrano con un'animazione stagger quando entrano nel viewport.
 * Ogni elemento appare dal basso con una leggera dissolvenza, in sequenza ritardata.
 *
 * @prop items - elenco di nodi React da renderizzare come voci della lista.
 * @prop stagger - secondi di ritardo tra l'ingresso di una voce e la successiva (default 0.05).
 * @prop className - classi CSS aggiuntive per il contenitore.
 */
export interface AnimatedListProps {
  items: Array<React.ReactNode>;
  stagger?: number;
  className?: string;
}

export function AnimatedList({ items, stagger = 0.05, className }: AnimatedListProps) {
  if (!items || items.length === 0) return null;

  const containerClass = ['flex flex-col gap-3', className].filter(Boolean).join(' ');

  return (
    <ul
      className={containerClass}
      style={{
        listStyle: 'none',
        margin: 0,
        padding: 0,
        color: 'var(--lumino-ink, #1a1a1a)',
      }}
    >
      {items.map((item, i) => (
        <motion.li
          key={i}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.4, delay: i * stagger }}
        >
          {item}
        </motion.li>
      ))}
    </ul>
  );
}

export default AnimatedList;
