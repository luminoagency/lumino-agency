'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Check, Star } from 'lucide-react';
// @ts-ignore - canvas-confetti non fornisce dichiarazioni di tipo
import confetti from 'canvas-confetti';
import NumberFlow from '@number-flow/react';

/**
 * Pricing — listino 3-tier con prezzo animato (NumberFlow) e toggle mensile/annuale
 * con coriandoli. Valuta sempre in €. Niente shadcn richiesto.
 *
 * Props:
 * - title?/description?: intestazione.
 * - plans (required, 2–4): Array<{ name, price, yearlyPrice, period, features[], description, buttonText, href, isPopular }>.
 *   price/yearlyPrice = numeri (€). period = unità (es. "mese").
 * - layout?: 'standard' (default) | 'compact'. size?, tone?, palette?.
 *
 * @example
 * <Pricing title="Prezzi" plans={[{name:'Base',price:190,yearlyPrice:1900,period:'una tantum',
 *   features:['Sito 1 pagina'],description:'...',buttonText:'Scegli',href:'#',isPopular:false}]}
 *   palette={{bg:'#fff',ink:'#111',accent:'#8b5cf6',muted:'#f5f5f5'}} />
 */

type Palette = { bg: string; ink: string; accent: string; muted: string };
type Plan = { name: string; price: number; yearlyPrice: number; period: string; features: string[]; description: string; buttonText: string; href: string; isPopular?: boolean };

export interface PricingProps {
  title?: string;
  description?: string;
  plans: Plan[];
  layout?: 'standard' | 'compact';
  size?: 'compact' | 'normal' | 'spacious';
  tone?: 'modern' | 'classic' | 'editorial' | 'playful';
  palette?: Palette;
  className?: string;
}

const SIZE = { compact: 'py-12 md:py-16', normal: 'py-16 md:py-24', spacious: 'py-24 md:py-32' } as const;
const cx = (...a: Array<string | false | undefined>) => a.filter(Boolean).join(' ');
function paletteVars(p?: Palette): React.CSSProperties {
  return p ? ({ '--lumino-bg': p.bg, '--lumino-ink': p.ink, '--lumino-accent': p.accent, '--lumino-muted': p.muted } as React.CSSProperties) : {};
}

export function Pricing({
  title = 'Prezzi semplici e trasparenti',
  description = 'Scegli il piano che fa per te.',
  plans,
  size = 'normal',
  tone = 'modern',
  palette,
  className,
}: PricingProps) {
  const [yearly, setYearly] = useState(false);
  const switchRef = useRef<HTMLButtonElement>(null);
  const serif = tone === 'classic' || tone === 'editorial';
  const accent = palette?.accent || '#8b5cf6';
  const rootStyle: React.CSSProperties = { ...paletteVars(palette), background: 'var(--lumino-bg, #ffffff)', color: 'var(--lumino-ink, #1a1a1a)' };
  const list = (plans || []).slice(0, 4);

  const toggle = (next: boolean) => {
    setYearly(next);
    if (next && switchRef.current) {
      const r = switchRef.current.getBoundingClientRect();
      confetti({
        particleCount: 50, spread: 60,
        origin: { x: (r.left + r.width / 2) / window.innerWidth, y: (r.top + r.height / 2) / window.innerHeight },
        colors: [accent, palette?.muted || '#d4d4d4', palette?.ink || '#1a1a1a'],
        ticks: 200, gravity: 1.2, decay: 0.94, startVelocity: 30, shapes: ['circle'],
      });
    }
  };

  return (
    <section className={cx('w-full', SIZE[size], className)} style={rootStyle}>
      <div className="mx-auto max-w-6xl px-6 md:px-8">
        <div className="mb-8 text-center">
          <h2 className={cx('text-3xl md:text-4xl font-bold tracking-tight', serif && 'font-serif')}>{title}</h2>
          {description && <p className="mx-auto mt-3 max-w-2xl text-base" style={{ opacity: 0.75 }}>{description}</p>}
        </div>

        <div className="mb-10 flex items-center justify-center gap-3">
          <span className="text-sm font-medium" style={{ opacity: yearly ? 0.5 : 1 }}>Mensile</span>
          <button ref={switchRef} type="button" role="switch" aria-checked={yearly} onClick={() => toggle(!yearly)}
            className="relative h-7 w-12 rounded-full transition-colors" style={{ background: yearly ? accent : 'var(--lumino-muted, #d4d4d4)' }}>
            <span className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform" style={{ transform: yearly ? 'translateX(22px)' : 'translateX(2px)' }} />
          </button>
          <span className="text-sm font-medium" style={{ opacity: yearly ? 1 : 0.5 }}>Annuale</span>
        </div>

        <div className={cx('grid gap-6', list.length >= 3 ? 'md:grid-cols-3' : 'sm:grid-cols-2', list.length === 4 && 'lg:grid-cols-4')}>
          {list.map((plan, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.5, delay: i * 0.08, ease: 'easeOut' }}
              className={cx('relative flex flex-col rounded-3xl border p-7', plan.isPopular && 'shadow-lg')}
              style={{ background: 'var(--lumino-bg, #fff)', borderColor: plan.isPopular ? accent : 'var(--lumino-muted, #e5e5e5)', borderWidth: plan.isPopular ? 2 : 1 }}>
              {plan.isPopular && (
                <span className="absolute -top-3 right-6 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold" style={{ background: accent, color: '#fff' }}>
                  <Star className="h-3 w-3" /> Popolare
                </span>
              )}
              <h3 className={cx('text-lg font-bold', serif && 'font-serif')}>{plan.name}</h3>
              <p className="mt-1 text-sm" style={{ opacity: 0.65 }}>{plan.description}</p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-4xl font-bold">
                  <NumberFlow value={yearly ? plan.yearlyPrice : plan.price} format={{ style: 'currency', currency: 'EUR', maximumFractionDigits: 0 } as any} />
                </span>
                <span className="text-sm" style={{ opacity: 0.6 }}>/{yearly ? 'anno' : plan.period}</span>
              </div>
              <ul className="mt-6 flex-grow space-y-2.5">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: accent }} />
                    <span style={{ opacity: 0.85 }}>{f}</span>
                  </li>
                ))}
              </ul>
              <a href={plan.href} className="mt-7 inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition-opacity hover:opacity-90"
                style={plan.isPopular ? { background: accent, color: '#fff' } : { border: `1px solid ${accent}`, color: 'var(--lumino-ink, #1a1a1a)' }}>
                {plan.buttonText}
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Pricing;
