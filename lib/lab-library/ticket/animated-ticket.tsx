'use client';

import React from 'react';
import { motion } from 'framer-motion';

/**
 * AnimatedTicket — ricevuta/conferma multi-business (prenotazione ristorante, hotel,
 * appuntamento, ordine). Niente più "carta di credito" hardcoded. Confetti opzionale (CSS).
 *
 * Props:
 * - ticketId (required): codice ricevuta. amount (required): importo €.
 * - itemName (required): cosa rappresenta (es. "Prenotazione tavolo", "Camera Deluxe").
 * - businessName? (default "Lumino"): intestazione.
 * - date?: data/ora (stringa già formattata o ISO). paymentMethod?: es. "Contanti", "Bonifico".
 * - cardLast4?: ultime 4 cifre (solo se pagamento con carta). qrValue?: stringa → barcode.
 * - confetti? (default false): effetto coriandoli all'ingresso.
 * - layout?: 'standard' (default) | 'compact' | 'business'. size?, tone?, palette?.
 *
 * @example
 * <AnimatedTicket ticketId="LB-2026-0042" amount={48} itemName="Prenotazione tavolo x2"
 *   businessName="Trattoria Mario" date="12 giu 2026 · 20:30" paymentMethod="Acconto" confetti
 *   palette={{bg:'#FAF7F2',ink:'#2A1F1A',accent:'#A0522D',muted:'#E8DDD0'}} />
 */

type Palette = { bg: string; ink: string; accent: string; muted: string };

export interface AnimatedTicketProps {
  ticketId: string;
  amount: number;
  itemName: string;
  businessName?: string;
  date?: string;
  paymentMethod?: string;
  cardLast4?: string;
  qrValue?: string;
  confetti?: boolean;
  layout?: 'standard' | 'compact' | 'business';
  size?: 'compact' | 'normal' | 'spacious';
  tone?: 'modern' | 'classic' | 'editorial' | 'playful';
  palette?: Palette;
  className?: string;
}

const cx = (...a: Array<string | false | undefined>) => a.filter(Boolean).join(' ');
const euro = (n: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n);
function paletteVars(p?: Palette): React.CSSProperties {
  return p ? ({ '--lumino-bg': p.bg, '--lumino-ink': p.ink, '--lumino-accent': p.accent, '--lumino-muted': p.muted } as React.CSSProperties) : {};
}

function Confetti() {
  const pieces = Array.from({ length: 28 });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <style>{`@keyframes lumino-fall { to { transform: translateY(120%) rotate(360deg); opacity: 0; } }`}</style>
      {pieces.map((_, i) => {
        const left = (i * 37) % 100;
        const delay = (i % 7) * 0.18;
        const dur = 2.4 + (i % 5) * 0.5;
        const c = i % 2 === 0 ? 'var(--lumino-accent, #8b5cf6)' : 'var(--lumino-muted, #d4d4d4)';
        return <span key={i} style={{ position: 'absolute', top: '-10%', left: `${left}%`, width: 8, height: 12, background: c, borderRadius: 2, transform: `rotate(${i * 33}deg)`, animation: `lumino-fall ${dur}s ${delay}s linear forwards` }} />;
      })}
    </div>
  );
}

function Barcode({ value }: { value: string }) {
  // Barre deterministiche dal valore (puramente decorative).
  const bars = value.split('').map((ch) => (ch.charCodeAt(0) % 4) + 1);
  return (
    <div className="flex h-12 items-end gap-[2px]" aria-label={`Codice ${value}`}>
      {bars.concat(bars).slice(0, 48).map((w, i) => (
        <span key={i} style={{ width: w, height: '100%', background: 'var(--lumino-ink, #1a1a1a)', opacity: i % 3 === 0 ? 1 : 0.7 }} />
      ))}
    </div>
  );
}

const Check = () => (
  <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export function AnimatedTicket({
  ticketId,
  amount,
  itemName,
  businessName = 'Lumino',
  date,
  paymentMethod,
  cardLast4,
  qrValue,
  confetti = false,
  layout = 'standard',
  size = 'normal',
  tone = 'modern',
  palette,
  className,
}: AnimatedTicketProps) {
  const serif = tone === 'classic' || tone === 'editorial';
  const rootStyle: React.CSSProperties = { ...paletteVars(palette), background: 'var(--lumino-bg, #ffffff)', color: 'var(--lumino-ink, #1a1a1a)', borderColor: 'var(--lumino-muted, #e5e5e5)' };
  const Row = ({ k, v }: { k: string; v: React.ReactNode }) => (
    <div className="flex items-center justify-between gap-4 text-sm"><span style={{ opacity: 0.6 }}>{k}</span><span className="font-medium">{v}</span></div>
  );

  if (layout === 'compact') {
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: 'easeOut' }}
        className={cx('relative mx-auto flex w-full max-w-sm items-center gap-4 overflow-hidden rounded-2xl border p-4', className)} style={rootStyle}>
        {confetti && <Confetti />}
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full" style={{ background: 'var(--lumino-accent, #8b5cf6)', color: '#fff' }}><Check /></div>
        <div className="min-w-0 flex-1">
          <p className={cx('truncate text-sm font-semibold', serif && 'font-serif')}>{itemName}</p>
          <p className="text-xs" style={{ opacity: 0.6 }}>{businessName}{date ? ` · ${date}` : ''}</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold" style={{ color: 'var(--lumino-accent, #8b5cf6)' }}>{euro(amount)}</div>
          <div className="text-[11px]" style={{ opacity: 0.5 }}>#{ticketId}</div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: 'easeOut' }}
      className={cx('relative mx-auto w-full max-w-sm overflow-hidden rounded-3xl border', size === 'spacious' && 'max-w-md', className)} style={rootStyle}>
      {confetti && <Confetti />}
      {/* tacche laterali da biglietto */}
      <span className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full" style={{ background: 'var(--lumino-muted, #f5f5f5)' }} />
      <span className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full" style={{ background: 'var(--lumino-muted, #f5f5f5)' }} />

      {layout === 'business' && (
        <div className="px-7 pt-6 text-center">
          <p className={cx('text-lg font-bold', serif && 'font-serif')}>{businessName}</p>
        </div>
      )}

      <div className="flex flex-col items-center px-7 py-7 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full" style={{ background: 'var(--lumino-accent, #8b5cf6)', color: '#fff' }}><Check /></div>
        <h2 className={cx('mt-4 text-xl font-semibold', serif && 'font-serif')}>Confermato!</h2>
        <p className="mt-1 text-sm" style={{ opacity: 0.65 }}>La tua ricevuta è stata emessa</p>
        <div className="mt-5 text-3xl font-bold" style={{ color: 'var(--lumino-accent, #8b5cf6)' }}>{euro(amount)}</div>
      </div>

      <div className="mx-7 border-t border-dashed" style={{ borderColor: 'var(--lumino-muted, #e5e5e5)' }} />

      <div className="space-y-2.5 px-7 py-6">
        <Row k="Dettaglio" v={itemName} />
        {layout !== 'business' && <Row k="Da" v={businessName} />}
        {date && <Row k="Data" v={date} />}
        {paymentMethod && <Row k="Pagamento" v={cardLast4 ? `${paymentMethod} ···· ${cardLast4}` : paymentMethod} />}
        <Row k="Ricevuta" v={`#${ticketId}`} />
      </div>

      {qrValue && (
        <div className="flex justify-center px-7 pb-7">
          <Barcode value={qrValue} />
        </div>
      )}
    </motion.div>
  );
}

export const AnimatedTicket_ = AnimatedTicket;
export default AnimatedTicket;
