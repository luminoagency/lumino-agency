'use client';

import { useState } from 'react';
import type { ProjectAsset } from '@/lib/lab/builder';
import { clientUploadAsset } from '../actions';
import { X, Upload } from 'lucide-react';

export default function ClientPhotoPicker({ assets, onSelect, onClose, onUploaded }: {
  assets: ProjectAsset[];
  onSelect: (asset: ProjectAsset) => void;
  onClose: () => void;
  onUploaded: (asset: ProjectAsset) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const upload = async (file: File | null) => {
    if (!file) return;
    setBusy(true); setErr(null);
    const fd = new FormData(); fd.append('file', file);
    const r = await clientUploadAsset(fd);
    setBusy(false);
    if (r.ok && r.asset) { onUploaded(r.asset); onSelect(r.asset); onClose(); }
    else setErr(r.error || 'Errore upload.');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-xl border border-white/15 bg-zinc-900 text-zinc-100" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <h3 className="font-semibold">Scegli o carica una foto</h3>
          <button onClick={onClose} aria-label="Chiudi"><X className="h-5 w-5" /></button>
        </div>
        <div className="border-b border-white/10 p-3">
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded border border-dashed border-white/20 py-3 text-sm hover:bg-white/5">
            <Upload className="h-4 w-4" /> {busy ? 'Caricamento…' : 'Carica nuova foto (max 10MB)'}
            <input type="file" accept="image/*" className="hidden" disabled={busy} onChange={e => upload(e.target.files?.[0] || null)} />
          </label>
          {err && <p className="mt-1 text-xs text-red-400">{err}</p>}
        </div>
        <div className="grid grid-cols-3 gap-2 overflow-y-auto p-4 sm:grid-cols-4">
          {assets.length === 0 && <p className="col-span-full py-6 text-center text-sm opacity-60">Nessuna foto in galleria.</p>}
          {assets.map(a => (
            <button key={a.id} type="button" onClick={() => { onSelect(a); onClose(); }} className="overflow-hidden rounded-lg border border-white/10 hover:border-[color:var(--lumino-accent,#8b5cf6)]">
              <img src={a.url} alt={a.alt} className="aspect-square w-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
