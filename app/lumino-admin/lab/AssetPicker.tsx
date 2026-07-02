'use client';

import { useState } from 'react';
import type { ProjectAsset } from '@/lib/lab/builder';
import { X, Search } from 'lucide-react';

const HOTEL_TYPES = /hotel|b&b|bnb|resort|agriturismo|ostello|locanda|relais/i;
export function categoriesForBusiness(businessType?: string): string[] {
  return HOTEL_TYPES.test(businessType || '')
    ? ['rooms', 'spa', 'restaurant', 'exterior', 'common-areas', 'amenities', 'other']
    : ['food', 'interior', 'people', 'product', 'other'];
}

interface AssetPickerProps {
  assets: ProjectAsset[];
  onSelect: (asset: ProjectAsset) => void;
  onClose: () => void;
  filterCategory?: string;
  multiSelect?: boolean;
  businessType?: string;
}

/** Modale full-screen per scegliere una foto dalla galleria progetto (filtro + ricerca). */
export default function AssetPicker({ assets, onSelect, onClose, filterCategory, businessType }: AssetPickerProps) {
  const CATEGORIES = categoriesForBusiness(businessType);
  const [cat, setCat] = useState<string>(filterCategory || 'all');
  const [q, setQ] = useState('');

  const query = q.trim().toLowerCase();
  const filtered = assets.filter(a => {
    if (cat !== 'all' && a.category !== cat) return false;
    if (!query) return true;
    return a.alt.toLowerCase().includes(query) || (a.tags || []).some(t => t.toLowerCase().includes(query));
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-6" onClick={onClose}>
      <div className="flex max-h-[82vh] w-full max-w-3xl flex-col rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-100" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-zinc-800 p-4">
          <h3 className="font-serif text-lg">Scegli una foto dalla galleria</h3>
          <button type="button" onClick={onClose} aria-label="Chiudi"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 p-3">
          <div className="flex items-center gap-1 rounded border border-zinc-700 bg-zinc-800 px-2">
            <Search className="h-3.5 w-3.5 text-zinc-500" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Cerca per alt o tag"
              className="bg-transparent py-1 text-xs outline-none placeholder:text-zinc-500" />
          </div>
          {['all', ...CATEGORIES].map(c => (
            <button key={c} type="button" onClick={() => setCat(c)}
              className={`rounded-full px-2.5 py-1 text-xs ${cat === c ? 'bg-amber-700 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}>{c}</button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3 overflow-y-auto p-4 sm:grid-cols-4">
          {filtered.length === 0 && <p className="col-span-full py-8 text-center text-sm text-zinc-500">Nessuna foto in galleria per questo filtro.</p>}
          {filtered.map(a => (
            <button key={a.id} type="button" onClick={() => { onSelect(a); onClose(); }}
              className="group overflow-hidden rounded-lg border border-zinc-800 text-left hover:border-amber-500">
              <img src={a.url} alt={a.alt} className="aspect-square w-full object-cover" />
              <span className="block truncate px-1.5 py-1 text-[10px] text-zinc-400">{a.alt}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
