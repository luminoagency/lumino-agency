'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Notch — indicatore stile "Dynamic Island": pillola scura con dot di stato pulsante e label.
 * All'hover si espande mostrando lo stato testuale in italiano.
 *
 * Props:
 * - status: stato corrente ('online' | 'offline' | 'busy', default 'online')
 * - label: etichetta mostrata accanto al dot
 * - className: classi aggiuntive sul contenitore
 */
export interface NotchProps {
  status?: 'online' | 'offline' | 'busy';
  label?: string;
  className?: string;
}

const STATUS_CONFIG: Record<NonNullable<NotchProps['status']>, { color: string; text: string }> = {
  online: { color: '#22c55e', text: 'Online' },
  busy: { color: '#f59e0b', text: 'Occupato' },
  offline: { color: '#9ca3af', text: 'Offline' },
};

export function Notch({ status = 'online', label, className }: NotchProps) {
  const [hovered, setHovered] = useState<boolean>(false);
  const config = STATUS_CONFIG[status];

  return (
    <motion.div
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      layout
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={[
        'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ background: 'var(--lumino-ink, #1a1a1a)', color: 'var(--lumino-bg, #ffffff)' }}
    >
      <span className="relative flex h-2.5 w-2.5 items-center justify-center">
        <motion.span
          className="absolute inline-flex h-full w-full rounded-full"
          style={{ background: config.color }}
          animate={{ scale: [1, 1.9, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <span
          className="relative inline-flex h-2.5 w-2.5 rounded-full"
          style={{ background: config.color }}
        />
      </span>

      {label && <span className="whitespace-nowrap">{label}</span>}

      <AnimatePresence initial={false}>
        {hovered && (
          <motion.span
            initial={{ width: 0, opacity: 0, marginLeft: 0 }}
            animate={{ width: 'auto', opacity: 0.7, marginLeft: 2 }}
            exit={{ width: 0, opacity: 0, marginLeft: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden whitespace-nowrap text-xs"
          >
            {config.text}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default Notch;
