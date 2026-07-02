'use client';

import React from 'react';

/**
 * GradualBlur — overlay che applica un blur progressivo su un bordo, per
 * dissolvere il contenuto sottostante (utile sotto header/footer). Decorativo
 * (aria-hidden), ancorato al bordo indicato. Usa backdrop-filter + mask
 * gradiente così il blur sfuma da pieno a zero.
 *
 * Props:
 * - direction? (default 'bottom'): 'top' | 'bottom' | 'left' | 'right'.
 * - intensity? (default 1): moltiplicatore della forza del blur.
 * - className?: classi extra del contenitore.
 *
 * @example
 * <div className="relative">
 *   …contenuto…
 *   <GradualBlur direction="bottom" intensity={1.2} />
 * </div>
 */

export interface GradualBlurProps {
  direction?: 'top' | 'bottom' | 'left' | 'right';
  intensity?: number;
  className?: string;
}

const cx = (...a: Array<string | false | undefined>) => a.filter(Boolean).join(' ');

export function GradualBlur({ direction = 'bottom', intensity = 1, className }: GradualBlurProps) {
  const blur = `blur(${8 * Math.max(0, intensity)}px)`;

  const anchor: Record<NonNullable<GradualBlurProps['direction']>, string> = {
    top: 'absolute inset-x-0 top-0 h-32',
    bottom: 'absolute inset-x-0 bottom-0 h-32',
    left: 'absolute inset-y-0 left-0 w-32',
    right: 'absolute inset-y-0 right-0 w-32',
  };

  // La maschera è piena (nero opaco) sul lato del bordo e sfuma a trasparente.
  const maskGradient: Record<NonNullable<GradualBlurProps['direction']>, string> = {
    top: 'linear-gradient(to top, transparent, #000)',
    bottom: 'linear-gradient(to bottom, transparent, #000)',
    left: 'linear-gradient(to left, transparent, #000)',
    right: 'linear-gradient(to right, transparent, #000)',
  };

  const mask = maskGradient[direction];

  return (
    <div
      aria-hidden
      className={cx('pointer-events-none', anchor[direction], className)}
      style={{
        backdropFilter: blur,
        WebkitBackdropFilter: blur,
        WebkitMaskImage: mask,
        maskImage: mask,
      }}
    />
  );
}

export default GradualBlur;
