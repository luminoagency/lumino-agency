'use client';

import React, { useState } from 'react';
import * as LucideIcons from 'lucide-react';

/**
 * SiteFooter — footer di chiusura multi-business. Colonne di link, social, contatti,
 * newsletter opzionale con checkbox GDPR. Copyright sempre in fondo. Palette via CSS vars.
 *
 * Props:
 * - businessName (required) / description? / logo? { src, alt }.
 * - columns?: Array<{ title, links: Array<{ label, href }> }>.
 * - socials?: Array<{ platform, url }> — platform es. "instagram", "facebook" (icona lucide).
 * - address?/phone?/email?: contatti.
 * - copyright?: testo (default "© {anno} {businessName}. Tutti i diritti riservati.").
 * - newsletter?: { enabled, action? } — form email + GDPR.
 * - legalLinks?: Array<{ label, href }> — riga legale in fondo.
 * - layout?: 'multi-column' (default) | 'minimal' | 'centered'. size?, tone?, palette?.
 *
 * @example
 * <SiteFooter businessName="Trattoria Mario" description="..."
 *   columns={[{title:'Menu',links:[{label:'Antipasti',href:'#'}]}]}
 *   socials={[{platform:'instagram',url:'#'}]} email="info@x.it"
 *   newsletter={{enabled:true}} legalLinks={[{label:'Privacy',href:'/privacy'}]}
 *   palette={{bg:'#1a1a1a',ink:'#f5f5f5',accent:'#A0522D',muted:'#2a2a2a'}} />
 */

type Palette = { bg: string; ink: string; accent: string; muted: string };
type Link = { label: string; href: string };

export interface SiteFooterProps {
  businessName: string;
  description?: string;
  logo?: { src: string; alt: string };
  columns?: Array<{ title: string; links: Link[] }>;
  socials?: Array<{ platform: string; url: string }>;
  address?: string;
  phone?: string;
  email?: string;
  copyright?: string;
  newsletter?: { enabled: boolean; action?: string };
  legalLinks?: Link[];
  layout?: 'multi-column' | 'minimal' | 'centered';
  size?: 'compact' | 'normal' | 'spacious';
  tone?: 'modern' | 'classic' | 'editorial' | 'playful';
  palette?: Palette;
  className?: string;
}

const SIZE = { compact: 'py-10', normal: 'py-14', spacious: 'py-20' } as const;
const cx = (...a: Array<string | false | undefined>) => a.filter(Boolean).join(' ');
function paletteVars(p?: Palette): React.CSSProperties {
  return p ? ({ '--lumino-bg': p.bg, '--lumino-ink': p.ink, '--lumino-accent': p.accent, '--lumino-muted': p.muted } as React.CSSProperties) : {};
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

function Social({ platform, url }: { platform: string; url: string }) {
  const Cmp = ((LucideIcons as any)[cap(platform)] || (LucideIcons as any).Globe) as React.ComponentType<{ className?: string }>;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" aria-label={platform}
      className="flex h-9 w-9 items-center justify-center rounded-full transition-opacity hover:opacity-70"
      style={{ background: 'var(--lumino-muted, #2a2a2a)', color: 'var(--lumino-ink, #f5f5f5)' }}>
      <Cmp className="h-4 w-4" />
    </a>
  );
}

function NewsletterForm({ action }: { action?: string }) {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (action) { try { await fetch(action, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) }); } catch { /* noop */ } }
    else console.log('[SiteFooter] Newsletter (form da configurare):', email);
    setDone(true);
  };
  if (done) return <p className="text-sm" style={{ color: 'var(--lumino-accent, #8b5cf6)' }}>Iscrizione registrata. Grazie!</p>;
  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <div className="flex gap-2">
        <input type="email" required placeholder="La tua email" value={email} onChange={(e) => setEmail(e.target.value)}
          className="min-w-0 flex-1 rounded-lg px-3 py-2 text-sm outline-none"
          style={{ background: 'var(--lumino-muted, #2a2a2a)', color: 'var(--lumino-ink, #f5f5f5)' }} />
        <button type="submit" className="rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: 'var(--lumino-accent, #8b5cf6)', color: '#fff' }}>Iscriviti</button>
      </div>
      <label className="flex items-start gap-2 text-[11px]" style={{ opacity: 0.7 }}>
        <input type="checkbox" required className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ accentColor: 'var(--lumino-accent, #8b5cf6)' }} />
        <span>Acconsento al trattamento dei dati per l’invio della newsletter (GDPR Art. 6).</span>
      </label>
    </form>
  );
}

export function SiteFooter({
  businessName,
  description,
  logo,
  columns,
  socials,
  address,
  phone,
  email,
  copyright,
  newsletter,
  legalLinks,
  layout = 'multi-column',
  size = 'normal',
  tone = 'modern',
  palette,
  className,
}: SiteFooterProps) {
  const serif = tone === 'classic' || tone === 'editorial';
  const year = new Date().getFullYear();
  const copy = copyright || `© ${year} ${businessName}. Tutti i diritti riservati.`;
  const rootStyle: React.CSSProperties = { ...paletteVars(palette), background: 'var(--lumino-bg, #111111)', color: 'var(--lumino-ink, #f5f5f5)' };
  const brandCls = cx('text-lg font-bold', serif && 'font-serif');

  const Brand = (
    <div>
      {logo?.src ? <img src={logo.src} alt={logo.alt} className="mb-3 h-8 w-auto" /> : <div className={brandCls}>{businessName}</div>}
      {description && <p className="mt-3 max-w-xs text-sm" style={{ opacity: 0.7 }}>{description}</p>}
      {(address || phone || email) && (
        <div className="mt-4 space-y-1 text-sm" style={{ opacity: 0.7 }}>
          {address && <p>{address}</p>}
          {phone && <p><a href={`tel:${phone.replace(/\s+/g, '')}`} className="hover:underline">{phone}</a></p>}
          {email && <p><a href={`mailto:${email}`} className="hover:underline">{email}</a></p>}
        </div>
      )}
      {socials && socials.length > 0 && <div className="mt-5 flex gap-2">{socials.map((s, i) => <Social key={i} {...s} />)}</div>}
    </div>
  );

  const Columns = columns && columns.length > 0 && (
    <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
      {columns.map((c, i) => (
        <div key={i}>
          <h3 className="text-sm font-semibold">{c.title}</h3>
          <ul className="mt-3 space-y-2">
            {c.links.map((l, j) => <li key={j}><a href={l.href} className="text-sm hover:underline" style={{ opacity: 0.7 }}>{l.label}</a></li>)}
          </ul>
        </div>
      ))}
    </div>
  );

  const Bottom = (
    <div className="flex flex-col items-center justify-between gap-3 border-t pt-6 text-xs sm:flex-row" style={{ borderColor: 'var(--lumino-muted, #2a2a2a)', opacity: 0.7 }}>
      <p>{copy}</p>
      {legalLinks && legalLinks.length > 0 && (
        <div className="flex flex-wrap gap-4">
          {legalLinks.map((l, i) => <a key={i} href={l.href} className="hover:underline">{l.label}</a>)}
        </div>
      )}
    </div>
  );

  // MINIMAL — barra compatta
  if (layout === 'minimal') {
    return (
      <footer className={cx('w-full', SIZE[size], className)} style={rootStyle}>
        <div className="mx-auto max-w-6xl px-6 md:px-8">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className={brandCls}>{businessName}</div>
            {socials && socials.length > 0 && <div className="flex gap-2">{socials.map((s, i) => <Social key={i} {...s} />)}</div>}
          </div>
          <div className="mt-6">{Bottom}</div>
        </div>
      </footer>
    );
  }

  // CENTERED — tutto centrato
  if (layout === 'centered') {
    return (
      <footer className={cx('w-full', SIZE[size], className)} style={rootStyle}>
        <div className="mx-auto max-w-3xl px-6 text-center">
          <div className={brandCls}>{businessName}</div>
          {description && <p className="mx-auto mt-3 max-w-md text-sm" style={{ opacity: 0.7 }}>{description}</p>}
          {socials && socials.length > 0 && <div className="mt-5 flex justify-center gap-2">{socials.map((s, i) => <Social key={i} {...s} />)}</div>}
          {legalLinks && legalLinks.length > 0 && (
            <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs" style={{ opacity: 0.7 }}>
              {legalLinks.map((l, i) => <a key={i} href={l.href} className="hover:underline">{l.label}</a>)}
            </div>
          )}
          <p className="mt-6 text-xs" style={{ opacity: 0.6 }}>{copy}</p>
        </div>
      </footer>
    );
  }

  // MULTI-COLUMN (default)
  return (
    <footer className={cx('w-full', SIZE[size], className)} style={rootStyle}>
      <div className="mx-auto max-w-6xl px-6 md:px-8">
        <div className="grid gap-10 md:grid-cols-[1.5fr_2fr] lg:grid-cols-[1.5fr_2fr_1.2fr]">
          {Brand}
          <div>{Columns}</div>
          {newsletter?.enabled && (
            <div>
              <h3 className="text-sm font-semibold">Newsletter</h3>
              <p className="mb-3 mt-1 text-sm" style={{ opacity: 0.7 }}>Novità e offerte, niente spam.</p>
              <NewsletterForm action={newsletter.action} />
            </div>
          )}
        </div>
        <div className="mt-10">{Bottom}</div>
      </div>
    </footer>
  );
}

export default SiteFooter;
