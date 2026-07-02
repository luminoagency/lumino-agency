'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { clientPublishDraft, clientDiscardDraft } from '../actions';
import { Rocket, AlertTriangle } from 'lucide-react';

const dt = (s: string | null) => s ? new Date(s).toLocaleString('it-IT') : '—';

export default function PublishClient({ hasDraft, draftUpdatedAt, lastPublishAt, draftPages }: {
  hasDraft: boolean; draftUpdatedAt: string | null; lastPublishAt: string | null; draftPages: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const publish = async () => {
    setBusy(true); setMsg(null);
    const r = await clientPublishDraft();
    setBusy(false);
    if (r.ok) { setMsg('✅ Modifiche pubblicate!'); setTimeout(() => router.push('/portal'), 1000); }
    else setMsg(r.error || 'Errore pubblicazione.');
  };
  const discard = async () => {
    if (!confirm('Scartare la bozza?')) return;
    if (!confirm('Sicuro? Le modifiche non pubblicate andranno perse.')) return;
    setBusy(true); await clientDiscardDraft(); setBusy(false); router.push('/portal');
  };

  return (
    <div className="max-w-xl">
      <h1 className="mb-4 text-2xl font-semibold" style={{ fontFamily: 'var(--lumino-font-heading, inherit)' }}>Pubblica modifiche</h1>

      <section className="rounded-2xl border border-white/10 p-5" style={{ background: 'var(--lumino-muted, rgba(255,255,255,0.05))' }}>
        <p className="text-sm">Modifiche in bozza da: <b>{dt(draftUpdatedAt)}</b></p>
        <p className="text-sm">Ultima pubblicazione: <b>{dt(lastPublishAt)}</b></p>
        <p className="text-sm">Pagine in bozza: <b>{draftPages || '—'}</b></p>
      </section>

      {msg && <p className="mt-4 text-sm text-amber-400">{msg}</p>}

      {hasDraft ? (
        <div className="mt-5 space-y-3">
          <div className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            Le modifiche saranno immediatamente visibili sul sito pubblico.
          </div>
          <button onClick={publish} disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl py-4 text-base font-bold text-white disabled:opacity-50" style={{ background: 'var(--lumino-accent, #8b5cf6)' }}>
            <Rocket className="h-5 w-5" /> {busy ? 'Pubblicazione…' : 'Pubblica modifiche'}
          </button>
          <button onClick={discard} disabled={busy} className="w-full rounded-xl border border-white/15 py-2.5 text-sm text-red-300 disabled:opacity-50">Scarta bozza</button>
        </div>
      ) : (
        <p className="mt-5 text-sm opacity-60">Nessuna modifica in bozza da pubblicare. Vai su <a href="/portal/content" className="underline">Contenuti</a> per modificare il sito.</p>
      )}
    </div>
  );
}
