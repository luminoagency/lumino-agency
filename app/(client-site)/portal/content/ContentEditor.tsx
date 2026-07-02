'use client';

import { useState } from 'react';
import type { SiteBuild, SiteSection, ProjectAsset } from '@/lib/lab/builder';
import { updateSectionProps } from '@/lib/lab/section-utils';
import { clientSaveDraft } from '../actions';
import ClientPhotoPicker from './ClientPhotoPicker';
import { Save, Image as ImageIcon, Plus, Trash2 } from 'lucide-react';

type ApplyAsset = (asset: ProjectAsset) => void;

export default function ContentEditor({ initialBuild }: { initialBuild: SiteBuild }) {
  const [build, setBuildState] = useState<SiteBuild>(initialBuild);
  const [pageIdx, setPageIdx] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [picker, setPicker] = useState<{ apply: ApplyAsset } | null>(null);

  const assets = build.assets || [];
  const mutate = (fn: (b: SiteBuild) => void) => { const b: SiteBuild = JSON.parse(JSON.stringify(build)); fn(b); setBuildState(b); setDirty(true); };

  const updateSection = (si: number, path: string, value: unknown) => mutate(b => {
    const sec = b.pages[pageIdx].sections[si];
    if (sec.type !== 'library') return;
    b.pages[pageIdx].sections[si] = updateSectionProps({ section: sec, propPath: path, newValue: value });
  });
  const setContact = (field: string, value: string) => mutate(b => {
    const gc: any = b.globalConfig; gc.businessInfo = { ...(gc.businessInfo || {}), [field]: value };
  });

  const openPicker = (apply: ApplyAsset) => setPicker({ apply });
  const onUploaded = (a: ProjectAsset) => setBuildState(prev => ({ ...prev, assets: [...(prev.assets || []), a] }));

  const save = async () => {
    setSaving(true); setMsg(null);
    const r = await clientSaveDraft(build);
    setSaving(false);
    if (r.ok) { setDirty(false); setMsg('Bozza salvata ✓'); } else setMsg(r.error || 'Errore.');
  };

  const page = build.pages[pageIdx];
  const inputCls = 'mt-0.5 w-full rounded border border-white/15 bg-white/5 px-2 py-1.5 text-sm';
  const bi: any = (build.globalConfig as any).businessInfo || {};

  const Photo = ({ src, alt, onPick }: { src?: string; alt?: string; onPick: ApplyAsset }) => (
    <div className="flex items-center gap-2">
      {src ? <img src={src} alt={alt || ''} className="h-14 w-14 rounded object-cover" /> : <div className="grid h-14 w-14 place-items-center rounded bg-white/10 text-[10px] opacity-50">no foto</div>}
      <button type="button" onClick={() => openPicker(onPick)} className="flex items-center gap-1 rounded border border-white/15 px-2 py-1 text-xs"><ImageIcon className="h-3.5 w-3.5" /> Cambia foto</button>
    </div>
  );

  const renderSection = (sec: SiteSection, si: number) => {
    if (sec.type === 'custom') return <p className="text-xs opacity-50">Sezione avanzata — per modifiche contatta Lumino.</p>;
    const props = sec.props;

    // Collection (array di items)
    if (Array.isArray(props)) {
      return (
        <div className="space-y-3">
          {props.map((raw, i) => {
            const it = raw as Record<string, any>;
            return (
              <div key={i} className="rounded-lg border border-white/10 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs opacity-60">#{i + 1}</span>
                  <button type="button" onClick={() => updateSection(si, '', props.filter((_, j) => j !== i))} className="text-red-300"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
                {'name' in it && <label className="block text-xs">Nome<input className={inputCls} value={String(it.name ?? '')} onChange={e => updateSection(si, `${i}.name`, e.target.value)} /></label>}
                {('pricePerNight' in it || 'price' in it) && <label className="block text-xs">Prezzo €<input type="number" className={inputCls} value={Number(it.pricePerNight ?? it.price ?? 0)} onChange={e => updateSection(si, `${i}.${'pricePerNight' in it ? 'pricePerNight' : 'price'}`, Number(e.target.value))} /></label>}
                {'description' in it && <label className="block text-xs">Descrizione<textarea rows={2} className={inputCls} value={String(it.description ?? '')} onChange={e => updateSection(si, `${i}.description`, e.target.value)} /></label>}
                {'bookingUrl' in it && <label className="block text-xs">URL Booking<input className={inputCls} value={String(it.bookingUrl ?? '')} onChange={e => updateSection(si, `${i}.bookingUrl`, e.target.value)} /></label>}
                {it.image && typeof it.image === 'object' && <div className="mt-1"><Photo src={it.image.src} alt={it.image.alt} onPick={a => { updateSection(si, `${i}.image.src`, a.url); updateSection(si, `${i}.image.alt`, a.alt); }} /></div>}
                {typeof it.featured === 'boolean' && <label className="mt-1 flex items-center gap-2 text-xs"><input type="checkbox" checked={it.featured} onChange={e => updateSection(si, `${i}.featured`, e.target.checked)} /> In evidenza</label>}
              </div>
            );
          })}
          <button type="button" onClick={() => updateSection(si, '', [...props, { ...(props[props.length - 1] || {}) }])} className="flex w-full items-center justify-center gap-1 rounded border border-dashed border-white/20 py-2 text-sm"><Plus className="h-4 w-4" /> Aggiungi elemento</button>
        </div>
      );
    }

    // Sezione singola
    const p = props as Record<string, any>;
    return (
      <div className="space-y-2">
        {typeof p.title === 'string' && <label className="block text-xs">Titolo<input className={inputCls} value={p.title} onChange={e => updateSection(si, 'title', e.target.value)} /></label>}
        {typeof p.subtitle === 'string' && <label className="block text-xs">Sottotitolo<input className={inputCls} value={p.subtitle} onChange={e => updateSection(si, 'subtitle', e.target.value)} /></label>}
        {typeof p.description === 'string' && <label className="block text-xs">Descrizione<textarea rows={2} className={inputCls} value={p.description} onChange={e => updateSection(si, 'description', e.target.value)} /></label>}
        {p.image && typeof p.image === 'object' && 'src' in p.image && <div><span className="text-xs opacity-60">Foto principale</span><Photo src={p.image.src} alt={p.image.alt} onPick={a => { updateSection(si, 'image.src', a.url); updateSection(si, 'image.alt', a.alt); }} /></div>}
        {Array.isArray(p.images) && (
          <div className="space-y-1">
            <span className="text-xs opacity-60">Foto ({p.images.length})</span>
            {p.images.map((im: any, i: number) => <div key={i} className="flex items-center gap-2"><Photo src={im?.src} alt={im?.alt} onPick={a => { updateSection(si, `images.${i}.src`, a.url); updateSection(si, `images.${i}.alt`, a.alt); }} /><button type="button" onClick={() => updateSection(si, 'images', p.images.filter((_: any, j: number) => j !== i))} className="text-red-300"><Trash2 className="h-3.5 w-3.5" /></button></div>)}
            <button type="button" onClick={() => updateSection(si, 'images', [...p.images, { src: '', alt: '' }])} className="flex items-center gap-1 rounded border border-white/15 px-2 py-1 text-xs"><Plus className="h-3 w-3" /> Aggiungi foto</button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-2xl">
      {/* Top bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select value={pageIdx} onChange={e => setPageIdx(Number(e.target.value))} className="rounded border border-white/15 bg-white/5 px-2 py-1.5 text-sm">
          {build.pages.map((pg, i) => <option key={pg.slug} value={i}>{pg.title}</option>)}
        </select>
        <div className="ml-auto flex items-center gap-2">
          {dirty && <span className="h-2.5 w-2.5 rounded-full bg-amber-500" title="Modifiche non salvate" />}
          <button onClick={save} disabled={saving} className="flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50" style={{ background: 'var(--lumino-accent, #8b5cf6)' }}><Save className="h-3.5 w-3.5" /> {saving ? 'Salvo…' : 'Salva bozza'}</button>
        </div>
      </div>
      {msg && <p className="mb-3 text-sm text-amber-400">{msg}</p>}

      {/* Sezioni della pagina */}
      <div className="space-y-4">
        {page.sections.map((sec, si) => (
          <section key={si} className="rounded-2xl border border-white/10 p-4" style={{ background: 'var(--lumino-muted, rgba(255,255,255,0.04))' }}>
            <h3 className="mb-2 text-sm font-semibold capitalize opacity-80">📝 {sec.sectionKey}</h3>
            {renderSection(sec, si)}
          </section>
        ))}
      </div>

      {/* Info contatti globali */}
      <section className="mt-6 rounded-2xl border border-white/10 p-4" style={{ background: 'var(--lumino-muted, rgba(255,255,255,0.04))' }}>
        <h3 className="mb-2 text-sm font-semibold opacity-80">📞 Info contatti (usati in tutte le pagine)</h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {([['phone', 'Telefono'], ['email', 'Email'], ['address', 'Indirizzo'], ['hours', 'Orari reception']] as const).map(([k, label]) => (
            <label key={k} className="block text-xs">{label}<input className={inputCls} value={String(bi[k] ?? '')} onChange={e => setContact(k, e.target.value)} /></label>
          ))}
        </div>
      </section>

      {picker && <ClientPhotoPicker assets={assets} onSelect={a => { picker.apply(a); }} onClose={() => setPicker(null)} onUploaded={onUploaded} />}
    </div>
  );
}
