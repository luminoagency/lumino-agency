'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

/**
 * ScrollStack
 * Sequenza di card che si impilano e si sovrappongono durante lo scroll (sticky stacking).
 * Ogni card resta "incollata" in alto con un offset incrementale e si scala leggermente
 * man mano che si avvicina alla cima, creando un effetto di accatastamento.
 *
 * @prop cards - elenco di card con titolo, descrizione e immagine opzionale.
 * @prop className - classi CSS aggiuntive per il contenitore.
 */
export interface ScrollStackProps {
  cards: Array<{ title: string; description: string; image?: string }>;
  className?: string;
}

function StackCard({
  card,
  index,
  total,
}: {
  card: { title: string; description: string; image?: string };
  index: number;
  total: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'start start'],
  });

  // Le card precedenti si rimpiccioliscono leggermente quando vengono coperte.
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.94]);
  const top = `calc(6rem + ${index * 1.5}rem)`;

  return (
    <div ref={ref} className="sticky" style={{ top }}>
      <motion.article
        style={{
          scale,
          backgroundColor: 'var(--lumino-muted, #f5f5f5)',
          color: 'var(--lumino-ink, #1a1a1a)',
          border: '1px solid var(--lumino-accent, #8b5cf6)',
          borderRadius: '1.25rem',
          overflow: 'hidden',
          boxShadow: '0 20px 40px -24px rgba(0,0,0,0.35)',
        }}
        className="grid gap-0 md:grid-cols-2"
      >
        <div className="flex flex-col justify-center gap-3 p-8">
          <span
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: 'var(--lumino-accent, #8b5cf6)' }}
          >
            {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </span>
          <h3
            className="text-2xl font-bold md:text-3xl"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            {card.title}
          </h3>
          <p className="text-sm leading-relaxed opacity-80">{card.description}</p>
        </div>
        {card.image ? (
          <div className="min-h-[200px] md:min-h-[260px]">
            <img
              src={card.image}
              alt={card.title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        ) : null}
      </motion.article>
    </div>
  );
}

export function ScrollStack({ cards, className }: ScrollStackProps) {
  if (!cards || cards.length === 0) return null;

  const containerClass = ['relative flex flex-col gap-6', className].filter(Boolean).join(' ');

  return (
    <div
      className={containerClass}
      style={{ backgroundColor: 'var(--lumino-bg, #ffffff)' }}
    >
      {cards.map((card, i) => (
        <StackCard key={i} card={card} index={i} total={cards.length} />
      ))}
    </div>
  );
}

export default ScrollStack;
