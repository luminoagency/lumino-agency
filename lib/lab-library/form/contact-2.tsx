'use client';

import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/**
 * Contact2 — form contatti (legacy shadcn). Wired all'endpoint messaggi Lumino.
 * Props: projectId (iniettato dal renderer) / endpoint / messageType per il submit.
 */
interface Contact2Props {
  title?: string;
  description?: string;
  phone?: string;
  email?: string;
  web?: { label: string; url: string };
  projectId?: string;
  endpoint?: string;
  messageType?: 'contact' | 'booking' | 'quote' | 'other';
  successMessage?: string;
}

export const Contact2 = ({
  title = "Contattaci",
  description = "Siamo disponibili per domande, feedback o opportunità di collaborazione. Facci sapere come possiamo aiutarti!",
  phone = "(123) 34567890",
  email = "info@bylumino.com",
  web = { label: "bylumino.com", url: "https://bylumino.com" },
  projectId,
  endpoint,
  messageType = 'contact',
  successMessage = 'Grazie! Ti contatteremo presto.',
}: Contact2Props) => {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const formEndpoint = endpoint || (projectId ? `/api/messages/${projectId}` : '');

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formEndpoint) {
      if (process.env.NODE_ENV !== 'production') alert('Form da configurare, projectId mancante');
      else console.warn('[Contact2] projectId/endpoint mancante.');
      return;
    }
    const fd = new FormData(e.currentTarget);
    setStatus('submitting');
    try {
      const payload = {
        message_type: messageType,
        from_name: [fd.get('name'), fd.get('lastname')].filter(Boolean).join(' '),
        from_email: String(fd.get('email') || ''),
        from_phone: '',
        subject: String(fd.get('subject') || '') || 'Contatto dal sito',
        message_body: String(fd.get('message') || ''),
        page_slug: typeof window !== 'undefined' ? window.location.pathname : '/',
        extra_data: { lastname: fd.get('lastname') || '' },
      };
      const res = await fetch(formEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      setStatus('success');
      e.currentTarget.reset();
    } catch {
      setStatus('error');
    }
  };

  return (
    <section className="py-32">
      <div className="container">
        <div className="mx-auto flex max-w-screen-xl flex-col justify-between gap-10 lg:flex-row lg:gap-20">
          <div className="mx-auto flex max-w-sm flex-col justify-between gap-10">
            <div className="text-center lg:text-left">
              <h1 className="mb-2 text-5xl font-semibold lg:mb-1 lg:text-6xl">{title}</h1>
              <p className="text-muted-foreground">{description}</p>
            </div>
            <div className="mx-auto w-fit lg:mx-0">
              <h3 className="mb-6 text-center text-2xl font-semibold lg:text-left">Dettagli di contatto</h3>
              <ul className="ml-4 list-disc">
                <li><span className="font-bold">Telefono: </span>{phone}</li>
                <li><span className="font-bold">Email: </span><a href={`mailto:${email}`} className="underline">{email}</a></li>
                <li><span className="font-bold">Web: </span><a href={web.url} target="_blank" className="underline">{web.label}</a></li>
              </ul>
            </div>
          </div>
          <form onSubmit={onSubmit} className="lumino-form mx-auto flex max-w-screen-md flex-col gap-6 rounded-lg border p-10" data-message-type={messageType} data-success-message={successMessage} data-endpoint={formEndpoint}>
            <div className="flex gap-4">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="firstname">Nome</Label>
                <Input type="text" id="firstname" name="name" placeholder="Nome" required />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="lastname">Cognome</Label>
                <Input type="text" id="lastname" name="lastname" placeholder="Cognome" />
              </div>
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input type="email" id="email" name="email" placeholder="Email" required />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="subject">Oggetto</Label>
              <Input type="text" id="subject" name="subject" placeholder="Oggetto" />
            </div>
            <div className="grid w-full gap-1.5">
              <Label htmlFor="message">Messaggio</Label>
              <Textarea placeholder="Scrivi il tuo messaggio qui." id="message" name="message" required />
            </div>
            <div className="flex items-start gap-2">
              <input type="checkbox" required id="privacy" name="gdpr" className="mt-1" />
              <label htmlFor="privacy" className="text-xs text-muted-foreground">
                Ho letto e accetto la <a href="/privacy" className="underline">Privacy Policy</a> e acconsento al trattamento dei miei dati personali (GDPR Art. 6).
              </label>
            </div>
            <Button type="submit" className="w-full" disabled={status === 'submitting'}>{status === 'submitting' ? 'Invio…' : 'Invia Messaggio'}</Button>
            <div className="form-status text-sm" aria-live="polite" />
            {status === 'success' && <p className="text-sm text-green-600">{successMessage}</p>}
            {status === 'error' && <p className="text-sm text-red-600">Errore invio. Riprova.</p>}
          </form>
        </div>
      </div>
    </section>
  );
};

export default Contact2;
