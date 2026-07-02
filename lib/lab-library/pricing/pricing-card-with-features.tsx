'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import * as LucideIcons from 'lucide-react';
import { Check, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * PricingCardWithFeatures — singola card prezzo con lista feature e tooltip informativo.
 *
 * Props:
 * - title (required) / subtitle?. startingFrom?: mostra "A partire da".
 * - price (required): numero (€) o stringa. buttonText (required) / buttonIcon? (nome lucide) / href?.
 * - features (required): Array<{ label, info? }> — info = tooltip.
 * - layout?: 'card'. size?, tone?, palette?.
 *
 * @example
 * <PricingCardWithFeatures title="Pro" subtitle="Per chi cresce" startingFrom price={390}
 *   buttonText="Scegli Pro" buttonIcon="Phone"
 *   features={[{label:'Sito multi-pagina',info:'Fino a 8 pagine'}]}
 *   palette={{bg:'#fff',ink:'#111',accent:'#8b5cf6',muted:'#f5f5f5'}} />
 */

type Palette = { bg: string; ink: string; accent: string; muted: string };

export interface PricingCardWithFeaturesProps {
  title: string;
  subtitle?: string;
  startingFrom?: boolean;
  price: number | string;
  buttonText: string;
  buttonIcon?: string;
  href?: string;
  features: Array<{ label: string; info?: string }>;
  layout?: 'card';
  size?: 'compact' | 'normal' | 'spacious';
  tone?: 'modern' | 'classic' | 'editorial' | 'playful';
  palette?: Palette;
  className?: string;
}

const cx = (...a: Array<string | false | undefined>) => a.filter(Boolean).join(' ');
const euro = (n: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
function paletteVars(p?: Palette): React.CSSProperties {
  return p ? ({ '--lumino-bg': p.bg, '--lumino-ink': p.ink, '--lumino-accent': p.accent, '--lumino-muted': p.muted } as React.CSSProperties) : {};
}

export function PricingCardWithFeatures({
  title,
  subtitle,
  startingFrom,
  price,
  buttonText,
  buttonIcon,
  href = '#',
  features,
  tone = 'modern',
  palette,
  className,
}: PricingCardWithFeaturesProps) {
  const serif = tone === 'classic' || tone === 'editorial';
  const BtnIcon = (buttonIcon && (LucideIcons as any)[buttonIcon]) as React.ComponentType<{ className?: string }> | undefined;
  const priceLabel = typeof price === 'number' ? euro(price) : price;

  return (
    <Card className={cx('mx-auto w-full max-w-sm', className)} style={{ ...paletteVars(palette), background: 'var(--lumino-bg, #fff)', color: 'var(--lumino-ink, #1a1a1a)', borderColor: 'var(--lumino-muted, #e5e5e5)' }}>
      <CardContent className="p-7">
        <h3 className={cx('text-xl font-bold', serif && 'font-serif')}>{title}</h3>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        <div className="mt-5 flex items-baseline gap-2">
          {startingFrom && <span className="text-xs text-muted-foreground">A partire da</span>}
          <span className="text-4xl font-bold" style={{ color: 'var(--lumino-accent, #8b5cf6)' }}>{priceLabel}</span>
        </div>
        <TooltipProvider>
          <ul className="mt-6 space-y-2.5">
            {features.map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 shrink-0" style={{ color: 'var(--lumino-accent, #8b5cf6)' }} />
                <span style={{ opacity: 0.85 }}>{f.label}</span>
                {f.info && (
                  <Tooltip>
                    <TooltipTrigger><Info className="h-3.5 w-3.5 opacity-50" /></TooltipTrigger>
                    <TooltipContent>{f.info}</TooltipContent>
                  </Tooltip>
                )}
              </li>
            ))}
          </ul>
        </TooltipProvider>
        <a href={href} className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-opacity hover:opacity-90" style={{ background: 'var(--lumino-accent, #8b5cf6)', color: '#fff' }}>
          {BtnIcon && <BtnIcon className="h-4 w-4" />}
          {buttonText}
        </a>
      </CardContent>
    </Card>
  );
}

export default PricingCardWithFeatures;
