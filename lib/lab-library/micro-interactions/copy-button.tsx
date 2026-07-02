'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check } from 'lucide-react';

/**
 * CopyButton — pulsante che copia un testo negli appunti con feedback visivo.
 *
 * Al click copia `text` tramite la Clipboard API (con guard di sicurezza) e
 * mostra per ~2s lo stato "copiato" (icona Check + testo "Copiato!"), poi
 * torna allo stato iniziale. Il timeout viene ripulito allo smontaggio.
 *
 * @prop text - Testo da copiare negli appunti.
 * @prop label - Etichetta del pulsante (default "Copia").
 * @prop className - Classi CSS aggiuntive.
 */
export interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
}

export function CopyButton({ text, label = 'Copia', className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? 'Copiato' : label}
      className={[
        'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        backgroundColor: 'var(--lumino-muted, #f5f5f5)',
        color: copied ? 'var(--lumino-accent, #8b5cf6)' : 'var(--lumino-ink, #1a1a1a)',
      }}
    >
      <span className="relative inline-flex h-4 w-4 items-center justify-center">
        <AnimatePresence mode="wait" initial={false}>
          {copied ? (
            <motion.span
              key="check"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 inline-flex items-center justify-center"
            >
              <Check size={16} strokeWidth={2.5} />
            </motion.span>
          ) : (
            <motion.span
              key="copy"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 inline-flex items-center justify-center"
            >
              <Copy size={16} strokeWidth={2} />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      <span>{copied ? 'Copiato!' : label}</span>
    </button>
  );
}

export default CopyButton;
