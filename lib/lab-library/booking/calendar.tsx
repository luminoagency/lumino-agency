'use client';

import React from 'react';
import { motion } from 'framer-motion';

/**
 * Calendar — sezione prenotazione flessibile. Mostra il mese corrente (it-IT) con i
 * giorni di apertura evidenziati in accent e i giorni di chiusura in grigio. La CTA si
 * adatta: link di prenotazione esterno, telefono, oppure scroll a #contact. Zero dati Lumino.
 *
 * Props:
 * - title? (default "Prenota un appuntamento") / description? (default "Domande sul nostro servizio?").
 * - buttonText? (default "Prenota ora").
 * - bookingUrl?: link Calendly/Cal.com del cliente (apre in nuova tab).
 * - contactPhone?/contactEmail?: alternative se manca bookingUrl.
 * - duration? (default "30 minuti"). availableDays?: ['lun'..'dom'] (default lun–ven).
 * - closedMessage?: es. "Chiuso il lunedì".
 * - layout?: 'card' (default) | 'split' | 'minimal'. size?, tone?, palette?.
 *
 * CTA: bookingUrl → apre link · altrimenti contactPhone → "Chiama" (tel:) · altrimenti → "Scrivici" (#contact).
 *
 * @example
 * <Calendar title="Prenota un tavolo" bookingUrl="https://cal.com/trattoria"
 *   availableDays={['mar','mer','gio','ven','sab','dom']} closedMessage="Chiuso il lunedì"
 *   palette={{bg:'#FAF7F2',ink:'#2A1F1A',accent:'#A0522D',muted:'#E8DDD0'}} layout="card" />
 */

type Palette = { bg: string; ink: string; accent: string; muted: string };
type Day = 'lun' | 'mar' | 'mer' | 'gio' | 'ven' | 'sab' | 'dom';

export interface CalendarProps {
  title?: string;
  description?: string;
  buttonText?: string;
  bookingUrl?: string;
  contactPhone?: string;
  contactEmail?: string;
  duration?: string;
  availableDays?: string[];
  closedMessage?: string;
  layout?: 'card' | 'split' | 'minimal';
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
const fade = { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.2 }, transition: { duration: 0.6, ease: 'easeOut' as const } };

// getDay(): 0=dom..6=sab → chiave it
const DOW: Day[] = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'];
const HEADERS = ['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM'];

function MonthGrid({ availableDays }: { availableDays: Day[] }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthName = now.toLocaleString('it-IT', { month: 'long' });
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay(); // 0=dom
  const offset = (firstDow + 6) % 7; // griglia lunedì-first

  const cells: Array<number | null> = [...Array(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--lumino-muted, #e5e5e5)' }}>
      <p className="mb-3 text-sm font-semibold capitalize">{monthName} {year}</p>
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {HEADERS.map((h) => <div key={h} className="text-[10px] font-semibold" style={{ opacity: 0.5 }}>{h}</div>)}
        {cells.map((d, i) => {
          if (d === null) return <div key={`e${i}`} />;
          const dow = DOW[new Date(year, month, d).getDay()];
          const open = availableDays.includes(dow);
          return (
            <div key={d} className="flex h-8 items-center justify-center rounded-lg text-xs font-medium"
              style={open
                ? { background: 'var(--lumino-accent, #8b5cf6)', color: '#ffffff' }
                : { background: 'var(--lumino-muted, #f1f1f1)', color: 'var(--lumino-ink, #1a1a1a)', opacity: 0.4 }}>
              {d}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Calendar({
  title = 'Prenota un appuntamento',
  description = 'Domande sul nostro servizio?',
  buttonText = 'Prenota ora',
  bookingUrl,
  contactPhone,
  contactEmail,
  duration = '30 minuti',
  availableDays,
  closedMessage,
  layout = 'card',
  size = 'normal',
  tone = 'modern',
  palette,
  className,
}: CalendarProps) {
  const serif = tone === 'classic' || tone === 'editorial';
  const days = (availableDays && availableDays.length ? availableDays : ['lun', 'mar', 'mer', 'gio', 'ven']) as Day[];
  const titleCls = cx('text-2xl md:text-3xl font-bold tracking-tight', serif && 'font-serif', tone === 'editorial' && 'italic font-medium');
  const rootStyle: React.CSSProperties = { ...paletteVars(palette), background: 'var(--lumino-bg, #ffffff)', color: 'var(--lumino-ink, #1a1a1a)' };

  // CTA intelligente
  let href = '#contact';
  let label = buttonText || 'Scrivici';
  let external = false;
  if (bookingUrl) { href = bookingUrl; external = true; }
  else if (contactPhone) { href = `tel:${contactPhone.replace(/\s+/g, '')}`; label = 'Chiama'; }
  else { href = '#contact'; label = 'Scrivici'; }

  const Cta = (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-90"
      style={{ background: 'var(--lumino-accent, #8b5cf6)', color: '#ffffff' }}
    >
      {label}
    </a>
  );

  const Info = (
    <div className="space-y-2 text-sm" style={{ opacity: 0.8 }}>
      <p>⏱ Durata: {duration}</p>
      {contactPhone && <p>📞 {contactPhone}</p>}
      {contactEmail && <p>✉ {contactEmail}</p>}
      {closedMessage && <p style={{ color: 'var(--lumino-accent, #8b5cf6)' }}>{closedMessage}</p>}
    </div>
  );

  const Heading = (
    <div>
      <h2 className={titleCls}>{title}</h2>
      {description && <p className="mt-2 text-base" style={{ opacity: 0.75 }}>{description}</p>}
    </div>
  );

  // MINIMAL — solo testo + CTA grande
  if (layout === 'minimal') {
    return (
      <section className={cx('w-full', SIZE[size], className)} style={rootStyle}>
        <motion.div {...fade} className="mx-auto max-w-2xl px-6 text-center">
          {Heading}
          <div className="mt-4 flex justify-center">{Info}</div>
          <div className="mt-8">{Cta}</div>
        </motion.div>
      </section>
    );
  }

  // SPLIT — info a sinistra, calendario a destra
  if (layout === 'split') {
    return (
      <section className={cx('w-full', SIZE[size], className)} style={rootStyle}>
        <motion.div {...fade} className="mx-auto grid max-w-5xl items-center gap-10 px-6 md:grid-cols-2 md:px-8">
          <div>
            {Heading}
            <div className="mt-5">{Info}</div>
            <div className="mt-7">{Cta}</div>
          </div>
          <MonthGrid availableDays={days} />
        </motion.div>
      </section>
    );
  }

  // CARD (default) — tutto in una card: testo + CTA + calendario
  return (
    <section className={cx('w-full', SIZE[size], className)} style={rootStyle}>
      <motion.div {...fade} className="mx-auto max-w-xl px-6">
        <div className="rounded-3xl border p-6 md:p-8" style={{ borderColor: 'var(--lumino-muted, #e5e5e5)' }}>
          {Heading}
          <div className="mt-4">{Info}</div>
          <div className="mt-6">{Cta}</div>
          <div className="mt-6"><MonthGrid availableDays={days} /></div>
        </div>
      </motion.div>
    </section>
  );
}

export default Calendar;
