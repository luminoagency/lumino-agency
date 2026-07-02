'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';

/**
 * Contact — sezione contatti completa e production-ready, multi-business. Info aziendali
 * (telefono/email/indirizzo/orari) + form con checkbox GDPR OBBLIGATORIA. Palette via CSS vars.
 *
 * Props:
 * - title? (default "Contattaci") / description? (default "Hai una domanda? Scrivici, ti rispondiamo entro 24 ore.").
 * - phone?/email?/address?/hours?: info opzionali (rese con icone lucide).
 * - mapsUrl?: se passato, l'indirizzo diventa link cliccabile.
 * - formAction? (default "/api/contact"): endpoint POST. successMessage? / privacyUrl?.
 * - layout?: 'split' (default) | 'centered' | 'stacked'. size?, tone?, palette?.
 *
 * onSubmit: se formAction → POST fetch JSON; altrimenti alert + console.log. Mostra
 * card verde su successo, card rossa su errore. Submit usa --lumino-accent.
 *
 * @example
 * <Contact title="Contattaci" phone="02 1234567" email="info@x.it"
 *   address="Via Roma 1, Milano" hours="Lun-Ven 9:00-18:00" privacyUrl="/privacy"
 *   palette={{bg:'#fff',ink:'#111',accent:'#8b5cf6',muted:'#f5f5f5'}} layout="split" />
 */

type Palette = { bg: string; ink: string; accent: string; muted: string };

export interface ContactProps {
  title?: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  hours?: string;
  mapsUrl?: string;
  formAction?: string;
  successMessage?: string;
  privacyUrl?: string;
  projectId?: string;      // iniettato dal renderer → POST a /api/messages/{projectId}
  endpoint?: string;       // override endpoint
  messageType?: 'contact' | 'booking' | 'quote' | 'other';
  layout?: 'split' | 'centered' | 'stacked';
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
const fade = { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.15 }, transition: { duration: 0.6, ease: 'easeOut' as const } };

const GDPR_TEXT = 'Ho letto e accetto la Privacy Policy e acconsento al trattamento dei miei dati personali (GDPR Art. 6)';

const fieldCls = 'w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2';
const fieldStyle: React.CSSProperties = { background: 'var(--lumino-bg, #ffffff)', color: 'var(--lumino-ink, #1a1a1a)', borderColor: 'var(--lumino-muted, #e5e5e5)' };

function ContactInfo({ phone, email, address, hours, mapsUrl }: Pick<ContactProps, 'phone' | 'email' | 'address' | 'hours' | 'mapsUrl'>) {
  const Item = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: 'var(--lumino-muted, #f5f5f5)', color: 'var(--lumino-accent, #8b5cf6)' }}>{icon}</span>
      <span className="text-sm" style={{ opacity: 0.85 }}>{children}</span>
    </li>
  );
  return (
    <ul className="space-y-4">
      {phone && <Item icon={<Phone className="h-4 w-4" />}><a href={`tel:${phone.replace(/\s+/g, '')}`} className="hover:underline">{phone}</a></Item>}
      {email && <Item icon={<Mail className="h-4 w-4" />}><a href={`mailto:${email}`} className="hover:underline">{email}</a></Item>}
      {address && <Item icon={<MapPin className="h-4 w-4" />}>{mapsUrl ? <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">{address}</a> : address}</Item>}
      {hours && <Item icon={<Clock className="h-4 w-4" />}>{hours}</Item>}
    </ul>
  );
}

export function Contact({
  title = 'Contattaci',
  description = 'Hai una domanda? Scrivici, ti rispondiamo entro 24 ore.',
  phone,
  email,
  address,
  hours,
  mapsUrl,
  formAction = '/api/contact',
  successMessage = 'Grazie! Ti contatteremo presto.',
  privacyUrl,
  projectId,
  endpoint,
  messageType = 'contact',
  layout = 'split',
  size = 'normal',
  tone = 'modern',
  palette,
  className,
}: ContactProps) {
  const serif = tone === 'classic' || tone === 'editorial';
  const titleCls = cx('text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight', serif && 'font-serif', tone === 'editorial' && 'italic font-medium');
  const rootStyle: React.CSSProperties = { ...paletteVars(palette), background: 'var(--lumino-bg, #ffffff)', color: 'var(--lumino-ink, #1a1a1a)' };

  const [form, setForm] = useState({ nome: '', email: '', telefono: '', oggetto: '', messaggio: '' });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const formEndpoint = endpoint || (projectId ? `/api/messages/${projectId}` : formAction);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEndpoint) {
      if (process.env.NODE_ENV !== 'production') alert('Form da configurare, projectId mancante');
      else console.warn('[Contact] projectId/endpoint mancante: submit ignorato.');
      return;
    }
    setStatus('submitting');
    try {
      const payload = {
        message_type: messageType,
        from_name: form.nome,
        from_email: form.email,
        from_phone: form.telefono,
        subject: form.oggetto || 'Contatto dal sito',
        message_body: form.messaggio,
        page_slug: typeof window !== 'undefined' ? window.location.pathname : '/',
        extra_data: {},
      };
      const res = await fetch(formEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      setStatus('success');
      setForm({ nome: '', email: '', telefono: '', oggetto: '', messaggio: '' });
    } catch {
      setStatus('error');
    }
  };

  const Form = (
    <form onSubmit={onSubmit} className="lumino-form space-y-4" data-message-type={messageType} data-success-message={successMessage} data-endpoint={formEndpoint}>
      <div className="grid gap-4 sm:grid-cols-2">
        <input name="name" className={fieldCls} style={fieldStyle} placeholder="Nome *" required value={form.nome} onChange={set('nome')} aria-label="Nome" />
        <input name="email" className={fieldCls} style={fieldStyle} type="email" placeholder="Email *" required value={form.email} onChange={set('email')} aria-label="Email" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <input name="phone" className={fieldCls} style={fieldStyle} type="tel" placeholder="Telefono" value={form.telefono} onChange={set('telefono')} aria-label="Telefono" />
        <input name="subject" className={fieldCls} style={fieldStyle} placeholder="Oggetto *" required value={form.oggetto} onChange={set('oggetto')} aria-label="Oggetto" />
      </div>
      <textarea name="message" className={cx(fieldCls, 'resize-y')} style={fieldStyle} placeholder="Messaggio *" required rows={4} value={form.messaggio} onChange={set('messaggio')} aria-label="Messaggio" />
      <label className="flex items-start gap-2.5 text-xs" style={{ opacity: 0.85 }}>
        <input type="checkbox" name="gdpr" required className="mt-0.5 h-4 w-4 shrink-0" style={{ accentColor: 'var(--lumino-accent, #8b5cf6)' }} />
        <span>
          {privacyUrl
            ? <>Ho letto e accetto la <a href={privacyUrl} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'var(--lumino-accent, #8b5cf6)' }}>Privacy Policy</a> e acconsento al trattamento dei miei dati personali (GDPR Art. 6)</>
            : GDPR_TEXT}
        </span>
      </label>
      <button type="submit" disabled={status === 'submitting'}
        className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ background: 'var(--lumino-accent, #8b5cf6)', color: '#ffffff' }}>
        {status === 'submitting' ? 'Invio…' : 'Invia messaggio'}
      </button>
      {/* form-status: usato dallo script dello static export (nel render React usiamo le card sotto) */}
      <div className="form-status text-sm" aria-live="polite" />
      {status === 'success' && <div className="rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800">{successMessage}</div>}
      {status === 'error' && <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">Si è verificato un errore. Riprova o contattaci direttamente.</div>}
    </form>
  );

  const Heading = (
    <div>
      <h2 className={titleCls}>{title}</h2>
      {description && <p className="mt-3 text-base md:text-lg leading-relaxed" style={{ opacity: 0.78 }}>{description}</p>}
    </div>
  );

  const hasInfo = phone || email || address || hours;

  // CENTERED — form centrato, info sopra
  if (layout === 'centered') {
    return (
      <section id="contact" className={cx('w-full', SIZE[size], className)} style={rootStyle}>
        <motion.div {...fade} className="mx-auto max-w-[600px] px-6 text-center">
          {Heading}
          {hasInfo && <div className="mt-8 flex justify-center"><ContactInfo phone={phone} email={email} address={address} hours={hours} mapsUrl={mapsUrl} /></div>}
          <div className="mt-10 text-left">{Form}</div>
        </motion.div>
      </section>
    );
  }

  // STACKED — info in row in alto, form sotto a tutta larghezza
  if (layout === 'stacked') {
    return (
      <section id="contact" className={cx('w-full', SIZE[size], className)} style={rootStyle}>
        <div className="mx-auto max-w-4xl px-6 md:px-8">
          <motion.div {...fade}>{Heading}</motion.div>
          {hasInfo && <motion.div {...fade} className="mt-8"><ContactInfo phone={phone} email={email} address={address} hours={hours} mapsUrl={mapsUrl} /></motion.div>}
          <motion.div {...fade} className="mt-10">{Form}</motion.div>
        </div>
      </section>
    );
  }

  // SPLIT (default) — info a sinistra, form a destra
  return (
    <section id="contact" className={cx('w-full', SIZE[size], className)} style={rootStyle}>
      <div className="mx-auto grid max-w-6xl gap-12 px-6 md:grid-cols-2 md:px-8">
        <motion.div {...fade}>
          {Heading}
          {hasInfo && <div className="mt-8"><ContactInfo phone={phone} email={email} address={address} hours={hours} mapsUrl={mapsUrl} /></div>}
        </motion.div>
        <motion.div {...fade}>{Form}</motion.div>
      </div>
    </section>
  );
}

export default Contact;
