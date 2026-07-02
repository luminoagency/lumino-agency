'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { RenderSection } from '@/lib/lab/render';
import { updateSectionProps } from '@/lib/lab/section-utils';
import { LUMINO_LIBRARY } from '@/lib/lab-library';
import type { SiteBuild, SiteSection, EditorState, GlobalConfig, ProjectAsset, Locale } from '@/lib/lab/builder';
import { saveEditorState, advanceToStep, setActivePage, uploadLogoAction, updateGlobalConfig, uploadAssetAction, deleteAssetAction, updateAssetAction, setProjectLocales, autoTranslateProject, updateSectionTranslation, translateOneSection, startPhotoImport } from './actions';
import AssetPicker, { categoriesForBusiness } from './AssetPicker';
import {
  ChevronUp, ChevronDown, Eye, EyeOff, Save, ArrowRight,
  Monitor, Tablet, Smartphone, Plus, Trash2, Repeat, X,
  MoreHorizontal, Copy, RotateCcw, Undo2, FileText,
  Upload, Type, Phone, Mail, MapPin, Clock, Link2, Images, Languages, Sparkles,
} from 'lucide-react';

const ALL_LOCALES: Locale[] = ['it', 'en', 'de'];

interface Step4EditorProps {
  projectId: string;
  build: SiteBuild;
  businessName: string;
  businessType?: string;
}

type DeviceKey = 'desktop' | 'tablet' | 'mobile';
const DEVICE_W: Record<DeviceKey, number> = { desktop: 1280, tablet: 768, mobile: 375 };
type Palette = { bg: string; ink: string; accent: string; muted: string };

// Branding — Google Fonts curati + toni + social.
const HEADING_FONTS = ['Cormorant Garamond', 'Inter', 'Playfair Display', 'Poppins', 'Lora', 'Montserrat'];
const BODY_FONTS = ['Inter', 'Lora', 'Open Sans', 'Source Sans Pro', 'Nunito'];
const TONES: Array<{ key: NonNullable<GlobalConfig['tone']>; label: string }> = [
  { key: 'modern', label: 'Modern' }, { key: 'classic', label: 'Classic' }, { key: 'editorial', label: 'Editorial' },
  { key: 'playful', label: 'Playful' }, { key: 'professional', label: 'Professional' }, { key: 'friendly', label: 'Friendly' },
];
const SOCIAL_PLATFORMS = ['instagram', 'facebook', 'tiktok', 'linkedin'];

const sectionKeyOf = (s: SiteSection, i: number) => (s as any).sectionKey || `section-${i}`;

// Stato editor iniziale multi-pagina (inlined: NON importare builder.ts nel client — SDK).
function initialEditorState(build: SiteBuild): EditorState {
  const pages: EditorState['pages'] = {};
  for (const page of build.pages) {
    pages[page.slug] = {
      palette: { ...build.globalConfig.palette },
      sections: page.sections.map((s, i) => ({ key: sectionKeyOf(s, i), visible: true, order: i })),
    };
  }
  const home = build.pages.find(p => p.isHomepage) || build.pages[0];
  return { activePage: home?.slug, pages };
}

// CSS container-query: nella preview il grid collection risponde al frame device, non al viewport.
const PREVIEW_CQ_CSS = `
.lab-cq-root { container-type: inline-size; }
@container (max-width: 639px) { .lab-cq-root .lab-collection { grid-template-columns: 1fr !important; } }
@container (min-width: 640px) and (max-width: 1023px) { .lab-cq-root .lab-collection { grid-template-columns: repeat(2, minmax(0,1fr)) !important; } }
@container (min-width: 1024px) { .lab-cq-root .lab-collection { grid-template-columns: repeat(3, minmax(0,1fr)) !important; } }
`;

// ── Helpers props-schema ─────────────────────────────────────────
function parseEnumOptions(schemaStr?: string): string[] {
  if (!schemaStr) return [];
  const head = schemaStr.split('(')[0];
  const matches = head.match(/'([^']+)'/g);
  return matches ? matches.map(m => m.replace(/'/g, '')) : [];
}
const DROPDOWN_FALLBACK: Record<string, string[]> = {
  size: ['compact', 'normal', 'spacious'],
  tone: ['modern', 'classic', 'editorial', 'playful'],
};
function isImageItem(it: unknown): boolean {
  return !!it && typeof it === 'object' && !Array.isArray(it) && 'src' in (it as Record<string, unknown>);
}
function isImageArray(key: string, val: unknown[]): boolean {
  if (['images', 'logos', 'photos', 'gallery'].includes(key)) return true;
  return val.length > 0 && val.every(isImageItem);
}
const isScalar = (v: unknown): v is string | number | boolean =>
  typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean';

// ── Editor sub-components ─────────────────────────────────────────
type UpdateFn = (propPath: string, newValue: unknown) => void;
type PickImageFn = (apply: (asset: ProjectAsset) => void) => void;

function ScalarField({ label, path, value, onUpdate }: { label: string; path: string; value: string | number | boolean; onUpdate: UpdateFn }) {
  if (typeof value === 'boolean') {
    return (
      <label className="flex items-center gap-2 text-xs text-zinc-300">
        <input type="checkbox" checked={value} onChange={e => onUpdate(path, e.target.checked)} className="accent-amber-500" />
        {label}
      </label>
    );
  }
  if (typeof value === 'number') {
    return (
      <label className="block">
        <span className="text-[11px] text-zinc-500">{label}</span>
        <input type="number" value={value}
          onChange={e => onUpdate(path, e.target.value === '' ? 0 : Number(e.target.value))}
          className="mt-0.5 w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs" />
      </label>
    );
  }
  const long = value.length > 48 || /descri|testo|quote|bio|content/i.test(label);
  return (
    <label className="block">
      <span className="text-[11px] text-zinc-500">{label}</span>
      {long ? (
        <textarea value={value} rows={2} onChange={e => onUpdate(path, e.target.value)}
          className="mt-0.5 w-full resize-y rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs" />
      ) : (
        <input type="text" value={value} onChange={e => onUpdate(path, e.target.value)}
          className="mt-0.5 w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs" />
      )}
    </label>
  );
}

function EnumField({ label, path, value, options, onUpdate }: { label: string; path: string; value: string; options: string[]; onUpdate: UpdateFn }) {
  const opts = options.includes(value) ? options : [value, ...options];
  return (
    <label className="block">
      <span className="text-[11px] text-zinc-500">{label}</span>
      <select value={value} onChange={e => onUpdate(path, e.target.value)}
        className="mt-0.5 w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs">
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

function ImageArrayEditor({ label, baseKey, items, onUpdate, onPickImage }: { label: string; baseKey: string; items: Array<Record<string, unknown>>; onUpdate: UpdateFn; onPickImage?: PickImageFn }) {
  const addImage = () => onUpdate(baseKey, [...items, { src: '', alt: '' }]);
  const removeImage = (i: number) => onUpdate(baseKey, items.filter((_, j) => j !== i));
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-zinc-500">{label} ({items.length})</span>
        <button type="button" onClick={addImage} className="flex items-center gap-1 rounded bg-zinc-800 px-2 py-0.5 text-[11px] hover:bg-zinc-700">
          <Plus className="h-3 w-3" /> Immagine
        </button>
      </div>
      {items.map((img, i) => (
        <div key={i} className="rounded border border-zinc-800 p-2">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[10px] text-zinc-600">#{i + 1}</span>
            <button type="button" onClick={() => removeImage(i)} className="text-zinc-500 hover:text-red-400" aria-label={`Rimuovi immagine ${i + 1}`}>
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          {typeof img.src === 'string' && img.src
            ? <img src={img.src} alt={String(img.alt || '')} className="mb-1 h-14 w-full rounded object-cover" />
            : <div className="mb-1 grid h-14 w-full place-items-center rounded bg-zinc-800 text-[10px] text-zinc-600">no preview</div>}
          <input type="text" placeholder="URL src" value={String(img.src ?? '')}
            onChange={e => onUpdate(`${baseKey}.${i}.src`, e.target.value)}
            className="mb-1 w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-[11px]" />
          <input type="text" placeholder="alt" value={String(img.alt ?? '')}
            onChange={e => onUpdate(`${baseKey}.${i}.alt`, e.target.value)}
            className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-[11px]" />
          {onPickImage && (
            <button type="button"
              onClick={() => onPickImage(asset => { onUpdate(`${baseKey}.${i}.src`, asset.url); onUpdate(`${baseKey}.${i}.alt`, asset.alt); })}
              className="mt-1 flex w-full items-center justify-center gap-1 rounded border border-zinc-700 px-2 py-1 text-[11px] text-zinc-300 hover:bg-zinc-700">
              📁 Scegli da galleria
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function ObjectFields({ obj, prefix, schema, onUpdate, onPickImage }: { obj: Record<string, unknown>; prefix: string; schema?: Record<string, string>; onUpdate: UpdateFn; onPickImage?: PickImageFn }) {
  const p = (k: string) => (prefix ? `${prefix}.${k}` : k);
  return (
    <>
      {Object.entries(obj).map(([key, value]) => {
        const path = p(key);
        if (key === 'palette' && value && typeof value === 'object' && !Array.isArray(value)) {
          const pal = value as Record<string, string>;
          return (
            <div key={key} className="space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-zinc-500">Palette sezione</span>
              {Object.keys(pal).map(ck => (
                <div key={ck} className="flex items-center gap-2">
                  <span className="w-16 text-[11px] text-zinc-500">{ck}</span>
                  <input type="color" value={pal[ck] || '#000000'} onChange={e => onUpdate(`${path}.${ck}`, e.target.value)} className="h-6 w-8 rounded border border-zinc-700 bg-transparent" />
                  <input type="text" value={pal[ck] || ''} onChange={e => onUpdate(`${path}.${ck}`, e.target.value)} className="flex-1 rounded border border-zinc-700 bg-zinc-800 px-2 py-1 font-mono text-[11px]" />
                </div>
              ))}
            </div>
          );
        }
        if ((key === 'layout' || key === 'size' || key === 'tone') && typeof value === 'string') {
          const options = parseEnumOptions(schema?.[key]);
          const all = options.length ? options : (DROPDOWN_FALLBACK[key] || []);
          if (all.length) return <EnumField key={key} label={key} path={path} value={value} options={all} onUpdate={onUpdate} />;
        }
        if (isScalar(value)) return <ScalarField key={key} label={key} path={path} value={value} onUpdate={onUpdate} />;
        if (Array.isArray(value)) {
          if (isImageArray(key, value)) return <ImageArrayEditor key={key} label={key} baseKey={path} items={value as Array<Record<string, unknown>>} onUpdate={onUpdate} onPickImage={onPickImage} />;
          if (value.every(v => typeof v === 'string')) {
            return (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wider text-zinc-500">{key} ({value.length})</span>
                  <button type="button" onClick={() => onUpdate(path, [...value, ''])} className="flex items-center gap-1 rounded bg-zinc-800 px-2 py-0.5 text-[11px] hover:bg-zinc-700"><Plus className="h-3 w-3" /></button>
                </div>
                {value.map((v, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <input type="text" value={String(v)} onChange={e => onUpdate(`${path}.${i}`, e.target.value)} className="flex-1 rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-[11px]" />
                    <button type="button" onClick={() => onUpdate(path, value.filter((_, j) => j !== i))} className="text-zinc-500 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
              </div>
            );
          }
          if (value.every(v => v && typeof v === 'object' && !Array.isArray(v))) {
            const arr = value as Array<Record<string, unknown>>;
            const clone = arr.length ? { ...arr[arr.length - 1] } : {};
            return (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wider text-zinc-500">{key} ({arr.length})</span>
                  <button type="button" onClick={() => onUpdate(path, [...arr, clone])} className="flex items-center gap-1 rounded bg-zinc-800 px-2 py-0.5 text-[11px] hover:bg-zinc-700"><Plus className="h-3 w-3" /></button>
                </div>
                {arr.map((item, i) => (
                  <div key={i} className="space-y-1 rounded border border-zinc-800 p-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-zinc-600">#{i + 1}</span>
                      <button type="button" onClick={() => onUpdate(path, arr.filter((_, j) => j !== i))} className="text-zinc-500 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                    <ObjectFields obj={item} prefix={`${path}.${i}`} onUpdate={onUpdate} onPickImage={onPickImage} />
                  </div>
                ))}
              </div>
            );
          }
          return null;
        }
        if (value && typeof value === 'object') {
          return (
            <div key={key} className="space-y-1 rounded border border-zinc-800 p-2">
              <span className="text-[11px] uppercase tracking-wider text-zinc-500">{key}</span>
              <ObjectFields obj={value as Record<string, unknown>} prefix={path} onUpdate={onUpdate} onPickImage={onPickImage} />
            </div>
          );
        }
        return null;
      })}
    </>
  );
}

function SectionEditor({ section, meta, onUpdate, replaceOptions, onReplace, onReset, canReset, onPickImage }: {
  section: SiteSection;
  meta?: { propsSchema?: Record<string, string> };
  onUpdate: UpdateFn;
  replaceOptions: Array<{ key: string; name: string }>;
  onReplace: (component: string) => void;
  onReset: () => void;
  canReset: boolean;
  onPickImage?: PickImageFn;
}) {
  const [showReplace, setShowReplace] = useState(false);

  if (section.type === 'custom') {
    return <p className="text-xs text-zinc-500">Sezione custom (categoria: {section.categoryHint}). Non editabile inline.</p>;
  }

  return (
    <div className="space-y-3">
      <div>
        <button type="button" onClick={() => setShowReplace(v => !v)}
          className="flex w-full items-center justify-between rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-xs hover:bg-zinc-700">
          <span className="flex items-center gap-1.5"><Repeat className="h-3.5 w-3.5" /> Sostituisci componente</span>
          <span className="text-[10px] text-zinc-500">{section.component}</span>
        </button>
        {showReplace && (
          <div className="mt-1 max-h-40 overflow-y-auto rounded border border-zinc-800">
            {replaceOptions.length === 0 && <p className="p-2 text-[11px] text-zinc-600">Nessuna alternativa nella categoria.</p>}
            {replaceOptions.map(o => (
              <button key={o.key} type="button" onClick={() => { onReplace(o.key); setShowReplace(false); }}
                className={`block w-full px-2 py-1 text-left text-[11px] hover:bg-zinc-800 ${o.key === section.component ? 'text-amber-400' : 'text-zinc-300'}`}>
                {o.name} <span className="text-zinc-600">— {o.key}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {Array.isArray(section.props) ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-zinc-500">Items ({section.props.length})</span>
            <button type="button"
              onClick={() => {
                const arr = section.props as Array<Record<string, unknown>>;
                onUpdate('', [...arr, arr.length ? { ...arr[arr.length - 1] } : {}]);
              }}
              className="flex items-center gap-1 rounded bg-zinc-800 px-2 py-0.5 text-[11px] hover:bg-zinc-700">
              <Plus className="h-3 w-3" /> Item
            </button>
          </div>
          {(section.props as Array<Record<string, unknown>>).map((item, i) => (
            <div key={i} className="space-y-1 rounded border border-zinc-800 p-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-600">Item #{i + 1}</span>
                <button type="button"
                  onClick={() => onUpdate('', (section.props as Array<Record<string, unknown>>).filter((_, j) => j !== i))}
                  className="text-zinc-500 hover:text-red-400" aria-label={`Rimuovi item ${i + 1}`}>
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <ObjectFields obj={item} prefix={`${i}`} onUpdate={onUpdate} onPickImage={onPickImage} />
            </div>
          ))}
        </div>
      ) : (
        <ObjectFields obj={section.props as Record<string, unknown>} prefix="" schema={meta?.propsSchema} onUpdate={onUpdate} onPickImage={onPickImage} />
      )}

      <button type="button" onClick={onReset} disabled={!canReset}
        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded border border-zinc-700 px-2 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800 disabled:opacity-40"
        title={canReset ? 'Ripristina i valori generati da Opus' : 'Nessun valore originale (sezione duplicata)'}>
        <RotateCcw className="h-3.5 w-3.5" /> Reset valori originali
      </button>
    </div>
  );
}

// ── Componente principale ─────────────────────────────────────────
export default function Step4Editor({ projectId, build, businessName, businessType }: Step4EditorProps) {
  const assetCats = categoriesForBusiness(businessType);
  const galleryFilterCats = ['all', ...assetCats];
  const detailCats = [...assetCats, 'logo'];
  const initial = useMemo(() => build.editorState || initialEditorState(build), [build]);
  const [editorState, setEditorState] = useState<EditorState>(initial);
  const [savedSnapshot, setSavedSnapshot] = useState<string>(() => JSON.stringify(initial));
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [device, setDevice] = useState<DeviceKey>('desktop');
  const [openMenuKey, setOpenMenuKey] = useState<string | null>(null);
  const [extraPages, setExtraPages] = useState<Array<{ slug: string; title: string }>>([]);

  // ── Branding (Layer 2) ──
  const [globalConfig, setGlobalConfig] = useState<GlobalConfig>(build.globalConfig);
  const [logoBusy, setLogoBusy] = useState(false);
  const [logoMsg, setLogoMsg] = useState<string | null>(null);
  const lastExtracted = useRef<Palette | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cfgTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Persistenza globalConfig con debounce 1s (skip in test mode).
  const persistConfig = (next: GlobalConfig) => {
    setGlobalConfig(next);
    if (projectId === 'test-no-db') { console.log('🧪 [TEST] globalConfig:', next); return; }
    if (cfgTimer.current) clearTimeout(cfgTimer.current);
    cfgTimer.current = setTimeout(() => { void updateGlobalConfig(projectId, next); }, 1000);
  };

  // Carica i font scelti anche nella preview dell'editor.
  useEffect(() => {
    const fams = [globalConfig.font?.heading, globalConfig.font?.body].filter(Boolean) as string[];
    if (!fams.length) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?${fams.map(f => `family=${encodeURIComponent(f)}:wght@400;500;600;700`).join('&')}&display=swap`;
    document.head.appendChild(link);
    return () => { try { document.head.removeChild(link); } catch { /* noop */ } };
  }, [globalConfig.font?.heading, globalConfig.font?.body]);

  const applyPaletteEverywhere = (base: GlobalConfig, pal: Palette) => {
    persistConfig({ ...base, palette: pal });
    setEditorState(prev => {
      const entry = prev.pages[activeSlug] || { sections: [] };
      return { ...prev, pages: { ...prev.pages, [activeSlug]: { ...entry, palette: pal } } };
    });
  };

  const handleLogoFile = async (file: File | null) => {
    if (!file) return;
    if (projectId === 'test-no-db') { setLogoMsg('Test mode: upload disponibile solo su progetto reale.'); return; }
    setLogoBusy(true); setLogoMsg(null);
    const prevPalette = globalConfig.palette;
    try {
      const fd = new FormData(); fd.append('file', file);
      const r = await uploadLogoAction(projectId, fd);
      if (!r.ok || !r.url) { setLogoMsg(r.error || 'Errore upload.'); return; }
      const withLogo: GlobalConfig = {
        ...globalConfig,
        logo: { ...(globalConfig.logo || {}), url: r.url, alt: `${businessName} logo` },
        palette: r.palette || globalConfig.palette,
      };
      setGlobalConfig(withLogo);
      lastExtracted.current = r.palette || null;
      setLogoMsg('Logo caricato.');
      if (r.palette) {
        if (confirm('Palette estratta automaticamente dal logo. Usarla nel sito?')) {
          applyPaletteEverywhere(withLogo, r.palette);
        } else {
          persistConfig({ ...withLogo, palette: prevPalette }); // ripristina (il server aveva sovrascritto)
        }
      }
    } finally { setLogoBusy(false); }
  };

  const reExtractPalette = () => {
    if (lastExtracted.current) applyPaletteEverywhere(globalConfig, lastExtracted.current);
    else setLogoMsg('Carica prima un logo per estrarre la palette.');
  };

  const setFont = (which: 'heading' | 'body', value: string) =>
    persistConfig({ ...globalConfig, font: { ...globalConfig.font, [which]: value } });
  const setTone = (t: NonNullable<GlobalConfig['tone']>) => persistConfig({ ...globalConfig, tone: t });
  const setInfo = (k: 'phone' | 'email' | 'address' | 'hours', v: string) =>
    persistConfig({ ...globalConfig, businessInfo: { ...globalConfig.businessInfo, [k]: v } });
  const addSocial = () =>
    persistConfig({ ...globalConfig, businessInfo: { ...globalConfig.businessInfo, socials: [...(globalConfig.businessInfo?.socials || []), { platform: 'instagram', url: '' }] } });
  const setSocial = (i: number, field: 'platform' | 'url', v: string) => {
    const socials = [...(globalConfig.businessInfo?.socials || [])];
    socials[i] = { ...socials[i], [field]: v };
    persistConfig({ ...globalConfig, businessInfo: { ...globalConfig.businessInfo, socials } });
  };
  const removeSocial = (i: number) => {
    const socials = (globalConfig.businessInfo?.socials || []).filter((_, j) => j !== i);
    persistConfig({ ...globalConfig, businessInfo: { ...globalConfig.businessInfo, socials } });
  };

  // ── Asset library (Layer 3) ──
  const [assets, setAssets] = useState<ProjectAsset[]>(build.assets || []);
  const [assetBusy, setAssetBusy] = useState(false);
  const [assetMsg, setAssetMsg] = useState<string | null>(null);
  const [assetCat, setAssetCat] = useState<string>('all');
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const assetFileRef = useRef<HTMLInputElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerApply = useRef<((a: ProjectAsset) => void) | null>(null);

  const handleAssetFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    if (projectId === 'test-no-db') { setAssetMsg('Test mode: upload disponibile su progetto reale.'); return; }
    setAssetBusy(true); setAssetMsg(null);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('category', assetCat === 'all' ? 'other' : assetCat);
        const r = await uploadAssetAction(projectId, fd);
        if (r.ok && r.asset) setAssets(prev => [...prev, r.asset as ProjectAsset]);
        else setAssetMsg(r.error || 'Errore upload.');
      }
    } finally { setAssetBusy(false); }
  };

  const removeAsset = (id: string) => {
    if (!confirm('Eliminare questa foto?')) return;
    setAssets(prev => prev.filter(a => a.id !== id));
    if (selectedAssetId === id) setSelectedAssetId(null);
    if (projectId !== 'test-no-db') void deleteAssetAction(projectId, id);
  };

  const patchAsset = (id: string, updates: Partial<ProjectAsset>) => {
    setAssets(prev => prev.map(a => (a.id === id ? { ...a, ...updates } : a)));
    if (projectId !== 'test-no-db') void updateAssetAction(projectId, id, updates);
  };

  const openPicker: PickImageFn = (apply) => { pickerApply.current = apply; setPickerOpen(true); };

  const useAssetInSection = (asset: ProjectAsset) => {
    if (!selectedKey || !selectedSection || selectedSection.type !== 'library') { alert('Seleziona prima una sezione di libreria.'); return; }
    if (Array.isArray(selectedSection.props)) { alert('Sezione collection: usa l\'editor degli item.'); return; }
    const props = selectedSection.props as Record<string, unknown>;
    const arrKey = Object.keys(props).find(k => Array.isArray(props[k]) && isImageArray(k, props[k] as unknown[]));
    if (arrKey) { applyPropUpdate(arrKey, [{ src: asset.url, alt: asset.alt }, ...(props[arrKey] as Array<Record<string, unknown>>)]); return; }
    const objKey = Object.keys(props).find(k => { const v = props[k]; return !!v && typeof v === 'object' && !Array.isArray(v) && 'src' in (v as object); });
    if (objKey) { applyPropUpdate(`${objKey}.src`, asset.url); applyPropUpdate(`${objKey}.alt`, asset.alt); return; }
    alert('Questa sezione non ha campi immagine.');
  };

  // ── Photo Import hotel (Layer 4.7) ──
  const [importOpen, setImportOpen] = useState(false);
  const [importBusy, setImportBusy] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{ imported: number; categorized: Record<string, number>; errors: string[] } | null>(null);
  const [importForm, setImportForm] = useState({ bookingUrl: '', tripadvisorUrl: '', websiteUrl: '', useGoogle: false, maxPhotos: 50 });

  const doPhotoImport = async () => {
    if (projectId === 'test-no-db') { setImportMsg('Test mode: import disponibile su progetto reale.'); return; }
    setImportBusy(true); setImportMsg(null); setImportResult(null);
    try {
      const r = await startPhotoImport(projectId, {
        bookingUrl: importForm.bookingUrl || undefined,
        tripadvisorUrl: importForm.tripadvisorUrl || undefined,
        websiteUrl: importForm.websiteUrl || undefined,
        useGooglePlaces: importForm.useGoogle,
        maxPhotos: importForm.maxPhotos,
      });
      if (!r.ok) { setImportMsg(r.error || 'Errore import.'); return; }
      if (r.assets?.length) setAssets(prev => [...prev, ...(r.assets as ProjectAsset[])]);
      setImportResult({ imported: r.result?.imported || 0, categorized: r.result?.categorized || {}, errors: r.result?.errors || [] });
    } finally { setImportBusy(false); }
  };

  // ── Multi-lingua (Layer 4.5) ──
  const [locales, setLocales] = useState<Locale[]>(build.locales && build.locales.length ? build.locales : ['it']);
  const [translating, setTranslating] = useState(false);
  const [transMsg, setTransMsg] = useState<string | null>(null);
  const [editLocale, setEditLocale] = useState<Locale>('it');
  const [transOverrides, setTransOverrides] = useState<Record<string, any>>({});
  const transTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHotelBiz = /hotel|b&b|bnb|resort|agriturismo|ostello|locanda|relais/i.test(businessType || '');

  const toggleLocale = (loc: Locale) => {
    if (loc === 'it') return;
    const next = locales.includes(loc) ? locales.filter(l => l !== loc) : [...locales, loc];
    const uniq = Array.from(new Set<Locale>(['it', ...next]));
    setLocales(uniq);
    if (editLocale !== 'it' && !uniq.includes(editLocale)) setEditLocale('it');
    if (projectId !== 'test-no-db') void setProjectLocales(projectId, uniq);
  };

  const doTranslateAll = async () => {
    const targets = locales.filter(l => l !== 'it');
    if (!targets.length) return;
    if (projectId === 'test-no-db') { setTransMsg('Test mode: traduzione su progetto reale (richiede CLAUDE_API_KEY).'); return; }
    setTranslating(true); setTransMsg(null);
    try {
      const r = await autoTranslateProject(projectId, targets);
      setTransMsg(r.ok ? `Tradotte ${r.sectionsTranslated} sezioni. Ricarico…` : (r.error || 'Errore.'));
      if (r.ok) setTimeout(() => window.location.reload(), 900);
    } finally { setTranslating(false); }
  };

  const baseIndexForKey = (key: string): number => {
    const page = build.pages.find(p => p.slug === activeSlug);
    return page ? page.sections.findIndex((s, i) => sectionKeyOf(s, i) === key) : -1;
  };
  const transKey = (idx: number, loc: Locale) => `${activeSlug}#${idx}#${loc}`;

  const getTransProps = (idx: number, loc: Locale): any => {
    const k = transKey(idx, loc);
    if (k in transOverrides) return transOverrides[k];
    const base = build.pages.find(p => p.slug === activeSlug)?.sections[idx];
    const tr = base && base.type === 'library' ? base.translations?.[loc as Exclude<Locale, 'it'>]?.props : undefined;
    if (tr) return tr;
    const eff = selectedKey ? effectiveSection(selectedKey) : undefined;
    return eff && eff.type === 'library' ? eff.props : {};
  };

  const applyTransUpdate = (loc: Locale, propPath: string, newValue: unknown) => {
    if (!selectedKey) return;
    const idx = baseIndexForKey(selectedKey);
    if (idx < 0) return;
    const current = getTransProps(idx, loc);
    const updated = updateSectionProps({ section: { type: 'library', sectionKey: selectedKey, component: selectedComponent || '', props: current }, propPath, newValue });
    if (updated.type !== 'library') return;
    setTransOverrides(prev => ({ ...prev, [transKey(idx, loc)]: updated.props }));
    if (projectId !== 'test-no-db') {
      if (transTimer.current) clearTimeout(transTimer.current);
      const toSave = updated.props as Record<string, any>;
      transTimer.current = setTimeout(() => { void updateSectionTranslation(projectId, activeSlug, idx, loc, toSave); }, 1000);
    }
  };

  const doTranslateOne = async (loc: Locale) => {
    if (!selectedKey) return;
    const idx = baseIndexForKey(selectedKey);
    if (idx < 0) return;
    if (projectId === 'test-no-db') { setTransMsg('Test mode: traduzione su progetto reale (richiede CLAUDE_API_KEY).'); return; }
    const r = await translateOneSection(projectId, activeSlug, idx, loc);
    if (r.ok && r.props) setTransOverrides(prev => ({ ...prev, [transKey(idx, loc)]: r.props }));
    else if (r.error) setTransMsg(r.error);
  };

  const dirty = JSON.stringify(editorState) !== savedSnapshot;

  // Elenco pagine = pagine della build + eventuali pagine aggiunte nell'editor.
  const pageList = useMemo(() => {
    const base = build.pages.map(p => ({ slug: p.slug, title: p.title, isHomepage: !!p.isHomepage }));
    const baseSlugs = new Set(base.map(p => p.slug));
    const extras = extraPages.filter(p => !baseSlugs.has(p.slug)).map(p => ({ slug: p.slug, title: p.title, isHomepage: false }));
    return [...base, ...extras];
  }, [build.pages, extraPages]);

  const activeSlug = (editorState.activePage && editorState.pages[editorState.activePage])
    ? editorState.activePage
    : (pageList.find(p => p.isHomepage)?.slug || pageList[0]?.slug || 'home');

  const baseSectionMap = useMemo(() => {
    const page = build.pages.find(p => p.slug === activeSlug);
    return new Map((page?.sections || []).map((s, i) => [sectionKeyOf(s, i), s]));
  }, [build.pages, activeSlug]);

  const pageEntry = editorState.pages[activeSlug] || { sections: [] };
  const activePalette: Palette = pageEntry.palette || build.globalConfig.palette;

  const effectiveSection = (key: string): SiteSection | undefined => {
    const entry = pageEntry.sections.find(s => s.key === key);
    const base = baseSectionMap.get(key);
    if (base) {
      if (!entry || base.type !== 'library') return base;
      if (entry.component === undefined && entry.props === undefined) return base;
      return { ...base, component: entry.component ?? base.component, props: entry.props ?? base.props };
    }
    if (entry && entry.component !== undefined && entry.props !== undefined) {
      return { type: 'library', sectionKey: key, component: entry.component, props: entry.props };
    }
    return undefined;
  };

  const visibleSections = useMemo(() => {
    return pageEntry.sections
      .filter(s => s.visible)
      .sort((a, b) => a.order - b.order)
      .map(s => ({ key: s.key, section: effectiveSection(s.key) }))
      .filter((x): x is { key: string; section: SiteSection } => !!x.section);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorState, baseSectionMap, activeSlug]);

  const paletteStyle = {
    '--lumino-bg': activePalette.bg,
    '--lumino-ink': activePalette.ink,
    '--lumino-accent': activePalette.accent,
    '--lumino-muted': activePalette.muted,
    backgroundColor: activePalette.bg,
    color: activePalette.ink,
    ...(globalConfig.font?.body ? { fontFamily: `'${globalConfig.font.body}', system-ui, sans-serif` } : {}),
    ...(globalConfig.font?.heading ? { '--lumino-font-heading': `'${globalConfig.font.heading}', Georgia, serif` } : {}),
  } as React.CSSProperties;

  // Aggiorna le sezioni della pagina attiva immutabilmente.
  const setActiveSections = (updater: (sections: EditorState['pages'][string]['sections']) => EditorState['pages'][string]['sections']) => {
    setEditorState(prev => {
      const entry = prev.pages[activeSlug] || { sections: [] };
      return { ...prev, pages: { ...prev.pages, [activeSlug]: { ...entry, sections: updater(entry.sections) } } };
    });
  };

  const handleSave = async () => {
    if (projectId === 'test-no-db') {
      setSavedAt(new Date());
      setSavedSnapshot(JSON.stringify(editorState));
      console.log('🧪 [TEST MODE] EditorState che sarebbe salvato:', editorState);
      return;
    }
    setSaving(true);
    try {
      const result = await saveEditorState(projectId, editorState);
      if (result.ok) { setSavedAt(new Date()); setSavedSnapshot(JSON.stringify(editorState)); }
      else alert('Errore salvataggio: ' + result.error);
    } finally {
      setSaving(false);
    }
  };

  const handleUndo = () => {
    if (!dirty) return;
    if (!confirm('Annullare tutte le modifiche non salvate?')) return;
    setEditorState(JSON.parse(savedSnapshot) as EditorState);
    setSelectedKey(null);
    setOpenMenuKey(null);
  };

  // Scorciatoie: Ctrl/Cmd+S salva, Escape chiude il menu/selezione.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); void handleSave(); }
      else if (e.key === 'Escape') { setOpenMenuKey(null); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorState, savedSnapshot]);

  const handleAdvance = async () => {
    if (projectId === 'test-no-db') {
      alert('Test mode: avanzamento step 5 non disponibile senza progetto in DB');
      return;
    }
    await handleSave();
    await advanceToStep(projectId, 5);
    window.location.reload();
  };

  const switchPage = (slug: string) => {
    setEditorState(prev => {
      const pages = { ...prev.pages };
      if (!pages[slug]) pages[slug] = { palette: { ...build.globalConfig.palette }, sections: [] };
      return { ...prev, activePage: slug, pages };
    });
    setSelectedKey(null);
    setOpenMenuKey(null);
    if (projectId !== 'test-no-db') { void setActivePage(projectId, slug); }
  };

  const addPage = () => {
    const raw = prompt('Slug della nuova pagina (es. "galleria"):');
    if (!raw) return;
    const slug = raw.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    if (!slug) return;
    if (pageList.some(p => p.slug === slug)) { alert('Esiste già una pagina con questo slug.'); return; }
    const title = prompt('Titolo pagina (per il menu):', slug) || slug;
    setExtraPages(prev => [...prev, { slug, title }]);
    setEditorState(prev => ({
      ...prev,
      activePage: slug,
      pages: { ...prev.pages, [slug]: { palette: { ...build.globalConfig.palette }, sections: [] } },
    }));
    setSelectedKey(null);
  };

  const toggleVisible = (key: string) => setActiveSections(secs => secs.map(s => (s.key === key ? { ...s, visible: !s.visible } : s)));

  const moveSection = (key: string, direction: 'up' | 'down') => setActiveSections(secs => {
    const sorted = [...secs].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex(s => s.key === key);
    if (idx === -1) return secs;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= sorted.length) return secs;
    [sorted[idx], sorted[newIdx]] = [sorted[newIdx], sorted[idx]];
    return sorted.map((s, i) => ({ ...s, order: i }));
  });

  const duplicateSection = (key: string) => {
    const src = effectiveSection(key);
    if (!src || src.type !== 'library') { alert('Solo le sezioni di libreria possono essere duplicate.'); return; }
    setActiveSections(secs => {
      const sorted = [...secs].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex(s => s.key === key);
      if (idx === -1) return secs;
      const existing = new Set(sorted.map(s => s.key));
      let newKey = `${key}-copia`; let n = 2;
      while (existing.has(newKey)) newKey = `${key}-copia-${n++}`;
      sorted.splice(idx + 1, 0, { key: newKey, visible: true, order: 0, component: src.component, props: src.props });
      return sorted.map((s, i) => ({ ...s, order: i }));
    });
    setOpenMenuKey(null);
  };

  const deleteSection = (key: string) => {
    if (!confirm('Eliminare questa sezione?')) return;
    setActiveSections(secs => secs.filter(s => s.key !== key).sort((a, b) => a.order - b.order).map((s, i) => ({ ...s, order: i })));
    if (selectedKey === key) setSelectedKey(null);
    setOpenMenuKey(null);
  };

  const updatePaletteColor = (key: keyof Palette, value: string) => {
    setEditorState(prev => {
      const entry = prev.pages[activeSlug] || { sections: [] };
      const palette: Palette = { ...(entry.palette || build.globalConfig.palette), [key]: value };
      return { ...prev, pages: { ...prev.pages, [activeSlug]: { ...entry, palette } } };
    });
  };

  const applyPropUpdate: UpdateFn = (propPath, newValue) => {
    if (!selectedKey) return;
    const current = effectiveSection(selectedKey);
    if (!current || current.type !== 'library') return;
    const updated = updateSectionProps({ section: current, propPath, newValue });
    if (updated.type !== 'library') return;
    setActiveSections(secs => secs.map(s => (s.key === selectedKey ? { ...s, props: updated.props, component: s.component ?? current.component } : s)));
  };

  const replaceComponent = (newComponent: string) => {
    if (!selectedKey) return;
    const current = effectiveSection(selectedKey);
    if (!current || current.type !== 'library') return;
    const newSchema = LUMINO_LIBRARY[newComponent]?.propsSchema || {};
    const carried: Record<string, unknown> = {};
    if (!Array.isArray(current.props)) {
      for (const k of Object.keys(newSchema)) {
        if (k in current.props) carried[k] = (current.props as Record<string, unknown>)[k];
      }
    }
    setActiveSections(secs => secs.map(s => (s.key === selectedKey ? { ...s, component: newComponent, props: carried } : s)));
  };

  const resetSelected = () => {
    if (!selectedKey || !baseSectionMap.get(selectedKey)) return;
    if (!confirm('Ripristinare i valori originali generati da Opus per questa sezione?')) return;
    setActiveSections(secs => secs.map(s => (s.key === selectedKey ? { key: s.key, visible: s.visible, order: s.order } : s)));
  };

  const orderedSections = [...pageEntry.sections].sort((a, b) => a.order - b.order);
  const selectedSection = selectedKey ? effectiveSection(selectedKey) : undefined;
  const selectedAsset = selectedAssetId ? assets.find(a => a.id === selectedAssetId) : undefined;
  const galleryAssets = assets.filter(a => assetCat === 'all' || a.category === assetCat);
  const selectedComponent = selectedSection && selectedSection.type === 'library' ? selectedSection.component : undefined;
  const selectedMeta = selectedComponent ? LUMINO_LIBRARY[selectedComponent] : undefined;
  const selectedHasBase = selectedKey ? !!baseSectionMap.get(selectedKey) : false;

  const replaceOptions = useMemo(() => {
    if (!selectedMeta) return [] as Array<{ key: string; name: string }>;
    return Object.entries(LUMINO_LIBRARY)
      .filter(([, m]) => m.safe === true && m.status === 'ready' && m.category === selectedMeta.category)
      .map(([key, m]) => ({ key, name: m.name }));
  }, [selectedMeta]);

  return (
    <div className="h-screen flex flex-col bg-zinc-950 text-zinc-100">
      <style>{PREVIEW_CQ_CSS}</style>
      {globalConfig.font?.heading && <style>{`.lab-cq-root h1,.lab-cq-root h2,.lab-cq-root h3{font-family:var(--lumino-font-heading);}`}</style>}

      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-3 flex items-center justify-between bg-zinc-900">
        <div>
          <h1 className="font-serif text-xl">{businessName}</h1>
          <p className="text-xs text-zinc-500">Step 4 — Editor · Layer 1 multi-pagina</p>
        </div>
        <div className="flex items-center gap-3">
          {savedAt && !dirty && (
            <span className="text-xs text-zinc-500">Salvato {savedAt.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</span>
          )}
          {locales.some(l => l !== 'it') && (
            <button onClick={doTranslateAll} disabled={translating} title="Traduci tutte le sezioni nelle lingue attive"
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-sm flex items-center gap-2 disabled:opacity-50">
              <Languages className="w-3.5 h-3.5" /> {translating ? 'Traduco…' : '🌐 Traduci tutto'}
            </button>
          )}
          <button onClick={handleUndo} disabled={!dirty}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-sm flex items-center gap-2 disabled:opacity-40" title="Annulla modifiche non salvate">
            <Undo2 className="w-3.5 h-3.5" /> Annulla
          </button>
          <button onClick={handleSave} disabled={saving}
            className="relative px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-sm flex items-center gap-2 disabled:opacity-50">
            {dirty && <span className="absolute -left-1 -top-1 h-2.5 w-2.5 rounded-full bg-amber-500" title="Modifiche non salvate" />}
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Salvataggio...' : 'Salva'}
          </button>
          <button onClick={handleAdvance} className="px-4 py-1.5 bg-amber-700 hover:bg-amber-600 rounded text-sm flex items-center gap-2">
            Step 5 — Publish <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Colonna preview */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Nav bar sito (cambia pagina) */}
          <div className="flex items-center gap-2 overflow-x-auto border-b border-zinc-800 bg-zinc-900/80 px-4 py-2">
            <span className="text-[10px] uppercase tracking-wider text-zinc-600">Sito:</span>
            {pageList.map(p => (
              <button key={p.slug} type="button" onClick={() => switchPage(p.slug)}
                className={`whitespace-nowrap rounded-full px-3 py-1 text-xs ${p.slug === activeSlug ? 'bg-amber-700 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}>
                {p.title}{p.isHomepage ? ' ·' : ''}
              </button>
            ))}
          </div>

          {/* Device toggle */}
          <div className="flex items-center justify-center gap-2 border-b border-zinc-800 bg-zinc-900 py-2">
            {([['desktop', Monitor, 'Desktop'], ['tablet', Tablet, 'Tablet'], ['mobile', Smartphone, 'Mobile']] as const).map(([key, Icon, label]) => (
              <button key={key} type="button" onClick={() => setDevice(key)}
                className={`flex items-center gap-1.5 rounded px-3 py-1 text-xs ${device === key ? 'bg-amber-700 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
                <Icon className="h-3.5 w-3.5" /> {label}<span className="text-[10px] opacity-60">{DEVICE_W[key]}px</span>
              </button>
            ))}
          </div>

          {/* Preview pagina attiva */}
          <div className="flex-1 overflow-auto bg-zinc-800/40 p-4">
            <div className="lab-cq-root mx-auto bg-white shadow-2xl transition-all duration-300"
              style={{ width: DEVICE_W[device], maxWidth: '100%', ...paletteStyle }}>
              {visibleSections.length === 0 && (
                <div className="p-12 text-center text-sm text-zinc-400">Pagina vuota — aggiungi sezioni o cambia pagina.</div>
              )}
              {visibleSections.map(({ key, section }) => {
                const selected = key === selectedKey;
                return (
                  <div key={key} className="relative">
                    <div style={selected ? { outline: '2px solid var(--lumino-accent, #8b5cf6)', outlineOffset: '-2px' } : undefined}>
                      <RenderSection section={section} />
                    </div>
                    <button type="button" onClick={() => setSelectedKey(key)}
                      className="absolute inset-0 z-10 bg-transparent transition-colors hover:bg-amber-400/5"
                      title="Clicca per modificare contenuti" aria-label={`Seleziona sezione ${key}`} />
                    {selected && (
                      <span className="pointer-events-none absolute left-2 top-2 z-20 rounded bg-amber-600 px-2 py-0.5 text-[10px] font-semibold text-white">{key}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="w-[360px] border-l border-zinc-800 bg-zinc-900 overflow-y-auto flex-shrink-0">
          {/* LINGUE (Layer 4.5) */}
          <section className="p-4 border-b border-zinc-800">
            <h2 className="font-serif text-sm uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2"><Languages className="h-4 w-4" /> Lingue</h2>
            <div className="space-y-1">
              {ALL_LOCALES.map(loc => {
                const on = loc === 'it' || locales.includes(loc);
                return (
                  <label key={loc} className={`flex items-center gap-2 rounded p-2 text-sm ${on ? 'bg-zinc-800' : 'bg-zinc-900'} ${loc === 'it' ? 'opacity-70' : 'cursor-pointer'}`}>
                    <input type="checkbox" checked={on} disabled={loc === 'it'} onChange={() => toggleLocale(loc)} className="accent-amber-500" />
                    <span className="flex-1">{loc === 'it' ? 'Italiano' : loc === 'en' ? 'Inglese' : 'Tedesco'} <span className="text-zinc-500">({loc.toUpperCase()})</span></span>
                    {loc === 'it' && <span className="text-[10px] text-zinc-500">base</span>}
                  </label>
                );
              })}
            </div>
            {isHotelBiz && <p className="mt-2 text-[11px] text-amber-400">Auto-attivo per hotel (clientela internazionale).</p>}
            {transMsg && <p className="mt-2 text-[11px] text-zinc-400">{transMsg}</p>}
          </section>

          {/* PAGINE */}
          <section className="p-4 border-b border-zinc-800">
            <h2 className="font-serif text-sm uppercase tracking-wider text-zinc-400 mb-3">📑 Pagine</h2>
            <div className="space-y-1">
              {pageList.map(p => (
                <button key={p.slug} type="button" onClick={() => switchPage(p.slug)}
                  className={`flex w-full items-center gap-2 rounded p-2 text-left text-sm ${p.slug === activeSlug ? 'bg-amber-700/30 ring-1 ring-amber-600' : 'bg-zinc-800 hover:bg-zinc-700'}`}>
                  <FileText className="h-3.5 w-3.5 opacity-70" />
                  <span className="flex-1 truncate">{p.title}</span>
                  <span className="text-[10px] text-zinc-500">/{p.slug}</span>
                </button>
              ))}
            </div>
            <button type="button" onClick={addPage}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded border border-dashed border-zinc-700 px-2 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800">
              <Plus className="h-3.5 w-3.5" /> Aggiungi pagina
            </button>
          </section>

          {/* BRANDING (Layer 2) */}
          <section className="p-4 border-b border-zinc-800 space-y-4">
            <h2 className="font-serif text-sm uppercase tracking-wider text-zinc-400">🎨 Branding</h2>

            {/* A) LOGO */}
            <div>
              <span className="text-[11px] uppercase tracking-wider text-zinc-500">Logo</span>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                onChange={e => handleLogoFile(e.target.files?.[0] || null)} />
              {globalConfig.logo?.url ? (
                <div className="mt-2 flex items-center gap-3">
                  <img src={globalConfig.logo.url} alt="logo" className="h-12 w-12 rounded bg-zinc-800 object-contain p-1" />
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={logoBusy}
                    className="rounded border border-zinc-700 px-3 py-1.5 text-xs hover:bg-zinc-800 disabled:opacity-50">{logoBusy ? '…' : 'Cambia'}</button>
                </div>
              ) : (
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={logoBusy}
                  className="mt-2 flex w-full flex-col items-center gap-1 rounded border border-dashed border-zinc-700 py-5 text-xs text-zinc-400 hover:bg-zinc-800 disabled:opacity-50">
                  <Upload className="h-5 w-5" />{logoBusy ? 'Caricamento…' : 'Trascina o clicca per caricare il logo'}
                </button>
              )}
              {logoMsg && <p className="mt-1 text-[11px] text-amber-400">{logoMsg}</p>}
            </div>

            {/* B) Estrai palette dal logo */}
            <button type="button" onClick={reExtractPalette}
              className="flex w-full items-center justify-center gap-1.5 rounded border border-zinc-700 px-2 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800">
              <RotateCcw className="h-3.5 w-3.5" /> Estrai palette dal logo
            </button>

            {/* C) FONT */}
            <div className="space-y-2">
              <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-zinc-500"><Type className="h-3.5 w-3.5" /> Font</span>
              <label className="block">
                <span className="text-[11px] text-zinc-500">Titoli</span>
                <select value={globalConfig.font?.heading || ''} onChange={e => setFont('heading', e.target.value)}
                  className="mt-0.5 w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs">
                  <option value="">— default —</option>
                  {HEADING_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                {globalConfig.font?.heading && <span className="mt-1 block text-base" style={{ fontFamily: `'${globalConfig.font.heading}', serif` }}>Anteprima titolo</span>}
              </label>
              <label className="block">
                <span className="text-[11px] text-zinc-500">Corpo</span>
                <select value={globalConfig.font?.body || ''} onChange={e => setFont('body', e.target.value)}
                  className="mt-0.5 w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs">
                  <option value="">— default —</option>
                  {BODY_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                {globalConfig.font?.body && <span className="mt-1 block text-xs" style={{ fontFamily: `'${globalConfig.font.body}', sans-serif` }}>Anteprima testo del corpo.</span>}
              </label>
            </div>

            {/* D) TONO DI VOCE */}
            <div className="space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-zinc-500">Tono di voce</span>
              <div className="grid grid-cols-2 gap-1">
                {TONES.map(t => (
                  <button key={t.key} type="button" onClick={() => setTone(t.key)}
                    className={`rounded px-2 py-1 text-xs ${globalConfig.tone === t.key ? 'bg-amber-700 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}>{t.label}</button>
                ))}
              </div>
            </div>

            {/* E) INFO BUSINESS */}
            <div className="space-y-2">
              <span className="text-[11px] uppercase tracking-wider text-zinc-500">Contatti</span>
              {([['phone', Phone, 'Telefono'], ['email', Mail, 'Email'], ['address', MapPin, 'Indirizzo'], ['hours', Clock, 'Orari']] as const).map(([k, Ico, ph]) => (
                <div key={k} className="flex items-center gap-2">
                  <Ico className="h-3.5 w-3.5 text-zinc-500" />
                  <input type="text" placeholder={ph} value={globalConfig.businessInfo?.[k] || ''} onChange={e => setInfo(k, e.target.value)}
                    className="flex-1 rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs" />
                </div>
              ))}
              <div className="flex items-center justify-between pt-1">
                <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-zinc-500"><Link2 className="h-3.5 w-3.5" /> Social</span>
                <button type="button" onClick={addSocial} className="flex items-center gap-1 rounded bg-zinc-800 px-2 py-0.5 text-[11px] hover:bg-zinc-700"><Plus className="h-3 w-3" /> Social</button>
              </div>
              {(globalConfig.businessInfo?.socials || []).map((s, i) => (
                <div key={i} className="flex items-center gap-1">
                  <select value={s.platform} onChange={e => setSocial(i, 'platform', e.target.value)} className="rounded border border-zinc-700 bg-zinc-800 px-1 py-1 text-[11px]">
                    {SOCIAL_PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <input type="text" placeholder="URL" value={s.url} onChange={e => setSocial(i, 'url', e.target.value)} className="flex-1 rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-[11px]" />
                  <button type="button" onClick={() => removeSocial(i)} className="text-zinc-500 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ))}
            </div>
          </section>

          {/* GALLERIA FOTO (Layer 3) */}
          <section className="p-4 border-b border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-sm uppercase tracking-wider text-zinc-400">🖼️ Galleria foto</h2>
              <span className="text-[11px] text-zinc-500">{assets.length} foto</span>
            </div>

            {/* Import automatico foto hotel (Layer 4.7) */}
            {isHotelBiz && (
              <div className="rounded border border-amber-700/40 bg-amber-900/10 p-2">
                <button type="button" onClick={() => setImportOpen(o => !o)} className="flex w-full items-center justify-between text-xs text-amber-300">
                  <span>🏨 Import automatico foto hotel</span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${importOpen ? 'rotate-180' : ''}`} />
                </button>
                {importOpen && (
                  <div className="mt-2 space-y-1.5">
                    <input value={importForm.bookingUrl} onChange={e => setImportForm(s => ({ ...s, bookingUrl: e.target.value }))} placeholder="URL Booking.com" className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-[11px]" />
                    <input value={importForm.tripadvisorUrl} onChange={e => setImportForm(s => ({ ...s, tripadvisorUrl: e.target.value }))} placeholder="URL TripAdvisor (opz.)" className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-[11px]" />
                    <input value={importForm.websiteUrl} onChange={e => setImportForm(s => ({ ...s, websiteUrl: e.target.value }))} placeholder="URL sito hotel (opz.)" className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-[11px]" />
                    <label className="flex items-center gap-2 text-[11px] text-zinc-300"><input type="checkbox" checked={importForm.useGoogle} onChange={e => setImportForm(s => ({ ...s, useGoogle: e.target.checked }))} className="accent-amber-500" /> Usa Google Places</label>
                    <label className="block text-[11px] text-zinc-500">Max foto: {importForm.maxPhotos}
                      <input type="range" min={10} max={100} step={5} value={importForm.maxPhotos} onChange={e => setImportForm(s => ({ ...s, maxPhotos: Number(e.target.value) }))} className="w-full accent-amber-500" />
                    </label>
                    <button type="button" onClick={doPhotoImport} disabled={importBusy} className="w-full rounded bg-amber-700 px-2 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-50">{importBusy ? 'Import in corso…' : '✨ Importa foto'}</button>
                    {importMsg && <p className="text-[11px] text-amber-400">{importMsg}</p>}
                    {importResult && (
                      <div className="rounded border border-green-600/40 bg-green-900/10 p-2 text-[11px]">
                        <p className="text-green-300">✅ Importate {importResult.imported} foto</p>
                        <p className="text-zinc-400">{Object.entries(importResult.categorized).map(([k, v]) => `${v} ${k}`).join(' · ') || '—'}</p>
                        {importResult.errors.length > 0 && <p className="mt-1 text-amber-400">Fonti con problemi: {importResult.errors.length}</p>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <input ref={assetFileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleAssetFiles(e.target.files)} />
            <button type="button" onClick={() => assetFileRef.current?.click()} disabled={assetBusy}
              className="flex w-full flex-col items-center gap-1 rounded border border-dashed border-zinc-700 py-4 text-xs text-zinc-400 hover:bg-zinc-800 disabled:opacity-50">
              <Images className="h-5 w-5" />{assetBusy ? 'Caricamento…' : 'Trascina foto o clicca per caricare'}
            </button>
            {assetMsg && <p className="text-[11px] text-amber-400">{assetMsg}</p>}

            <div className="flex flex-wrap gap-1">
              {galleryFilterCats.map(c => (
                <button key={c} type="button" onClick={() => setAssetCat(c)}
                  className={`rounded-full px-2 py-0.5 text-[11px] ${assetCat === c ? 'bg-amber-700 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}>{c}</button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {galleryAssets.length === 0 && <p className="col-span-3 text-[11px] text-zinc-600">Nessuna foto.</p>}
              {galleryAssets.map(a => (
                <button key={a.id} type="button" onClick={() => setSelectedAssetId(selectedAssetId === a.id ? null : a.id)}
                  className={`overflow-hidden rounded border ${selectedAssetId === a.id ? 'border-amber-500' : 'border-zinc-800'}`}>
                  <img src={a.url} alt={a.alt} className="aspect-square w-full object-cover" />
                </button>
              ))}
            </div>

            {selectedAsset && (
              <div className="space-y-2 rounded border border-zinc-800 p-2">
                <img src={selectedAsset.url} alt={selectedAsset.alt} className="h-24 w-full rounded object-cover" />
                <input type="text" value={selectedAsset.alt} onChange={e => patchAsset(selectedAsset.id, { alt: e.target.value })}
                  placeholder="Descrizione (alt)" className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-[11px]" />
                <select value={selectedAsset.category || 'other'} onChange={e => patchAsset(selectedAsset.id, { category: e.target.value as ProjectAsset['category'] })}
                  className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-[11px]">
                  {detailCats.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input type="text" value={(selectedAsset.tags || []).join(', ')}
                  onChange={e => patchAsset(selectedAsset.id, { tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                  placeholder="tag separati da virgola" className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-[11px]" />
                <div className="flex gap-2">
                  <button type="button" onClick={() => useAssetInSection(selectedAsset)} className="flex-1 rounded bg-amber-700 px-2 py-1 text-[11px] text-white hover:bg-amber-600">Usa in sezione attiva</button>
                  <button type="button" onClick={() => removeAsset(selectedAsset.id)} className="rounded border border-zinc-700 px-2 py-1 text-[11px] text-red-400 hover:bg-zinc-800"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            )}
          </section>

          {/* PALETTE (pagina attiva) */}
          <section className="p-4 border-b border-zinc-800">
            <h2 className="font-serif text-sm uppercase tracking-wider text-zinc-400 mb-3">🎨 Palette</h2>
            <div className="space-y-3">
              {(['bg', 'ink', 'accent', 'muted'] as const).map(key => (
                <div key={key} className="flex items-center gap-3">
                  <label className="text-xs capitalize w-20 text-zinc-400">{
                    key === 'bg' ? 'Sfondo' : key === 'ink' ? 'Inchiostro' : key === 'accent' ? 'Accento' : 'Muted'
                  }</label>
                  <input type="color" value={activePalette[key]} onChange={e => updatePaletteColor(key, e.target.value)}
                    className="w-10 h-8 rounded cursor-pointer bg-transparent border border-zinc-700" />
                  <input type="text" value={activePalette[key]} onChange={e => updatePaletteColor(key, e.target.value)}
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs font-mono" />
                </div>
              ))}
            </div>
          </section>

          {/* SEZIONI (pagina attiva) */}
          <section className="p-4 border-b border-zinc-800">
            <h2 className="font-serif text-sm uppercase tracking-wider text-zinc-400 mb-3">🧩 Sezioni</h2>
            <div className="space-y-1">
              {orderedSections.length === 0 && <p className="text-xs text-zinc-600">Nessuna sezione in questa pagina.</p>}
              {orderedSections.map((s, idx) => (
                <div key={s.key}
                  className={`relative flex items-center gap-2 p-2 rounded cursor-pointer ${s.key === selectedKey ? 'ring-1 ring-amber-500' : ''} ${s.visible ? 'bg-zinc-800' : 'bg-zinc-900 opacity-50'}`}
                  onClick={() => setSelectedKey(s.key)}>
                  <button onClick={e => { e.stopPropagation(); toggleVisible(s.key); }} className="p-1 hover:bg-zinc-700 rounded" title={s.visible ? 'Nascondi' : 'Mostra'}>
                    {s.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                  <span className="flex-1 truncate text-sm">{s.key}</span>
                  <button onClick={e => { e.stopPropagation(); moveSection(s.key, 'up'); }} disabled={idx === 0} className="p-1 hover:bg-zinc-700 rounded disabled:opacity-30"><ChevronUp className="w-3.5 h-3.5" /></button>
                  <button onClick={e => { e.stopPropagation(); moveSection(s.key, 'down'); }} disabled={idx === orderedSections.length - 1} className="p-1 hover:bg-zinc-700 rounded disabled:opacity-30"><ChevronDown className="w-3.5 h-3.5" /></button>
                  <button onClick={e => { e.stopPropagation(); setOpenMenuKey(openMenuKey === s.key ? null : s.key); }} className="p-1 hover:bg-zinc-700 rounded" title="Altre azioni"><MoreHorizontal className="w-3.5 h-3.5" /></button>
                  {openMenuKey === s.key && (
                    <div className="absolute right-2 top-9 z-30 w-40 overflow-hidden rounded border border-zinc-700 bg-zinc-800 shadow-xl" onClick={e => e.stopPropagation()}>
                      <button onClick={() => duplicateSection(s.key)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-zinc-700"><Copy className="h-3.5 w-3.5" /> Duplica</button>
                      <button onClick={() => { toggleVisible(s.key); setOpenMenuKey(null); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-zinc-700">{s.visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />} {s.visible ? 'Nascondi' : 'Mostra'}</button>
                      <button onClick={() => deleteSection(s.key)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-400 hover:bg-zinc-700"><Trash2 className="h-3.5 w-3.5" /> Elimina</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* EDIT SEZIONE ATTIVA */}
          <section className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-serif text-sm uppercase tracking-wider text-zinc-400">✏️ Edit attiva{selectedKey ? `: ${selectedKey}` : ''}</h2>
              {selectedKey && <button onClick={() => setSelectedKey(null)} className="text-zinc-500 hover:text-zinc-300" aria-label="Deseleziona"><X className="h-4 w-4" /></button>}
            </div>
            {!selectedSection && <p className="text-xs text-zinc-500">Clicca una sezione nella preview per modificarne contenuti, immagini e componente.</p>}
            {selectedSection && (() => {
              const canTranslate = selectedSection.type === 'library' && locales.length > 1;
              const activeLoc = canTranslate ? editLocale : 'it';
              return (
                <>
                  {canTranslate && (
                    <div className="mb-3 flex gap-1">
                      {locales.map(loc => (
                        <button key={loc} type="button" onClick={() => setEditLocale(loc)}
                          className={`rounded px-2.5 py-1 text-xs ${activeLoc === loc ? 'bg-amber-700 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}>{loc.toUpperCase()}{loc === 'it' ? ' · base' : ''}</button>
                      ))}
                    </div>
                  )}
                  {activeLoc === 'it' ? (
                    <SectionEditor section={selectedSection} meta={selectedMeta} onUpdate={applyPropUpdate}
                      replaceOptions={replaceOptions} onReplace={replaceComponent} onReset={resetSelected} canReset={selectedHasBase} onPickImage={openPicker} />
                  ) : (
                    <div className="space-y-2">
                      <button type="button" onClick={() => doTranslateOne(activeLoc)}
                        className="flex w-full items-center justify-center gap-1.5 rounded border border-zinc-700 px-2 py-1.5 text-xs text-amber-400 hover:bg-zinc-800">
                        <Sparkles className="h-3.5 w-3.5" /> Traduci da IT
                      </button>
                      <SectionEditor
                        section={{ type: 'library', sectionKey: selectedKey || '', component: selectedComponent || '', props: getTransProps(baseIndexForKey(selectedKey || ''), activeLoc) }}
                        meta={selectedMeta}
                        onUpdate={(path, val) => applyTransUpdate(activeLoc, path, val)}
                        replaceOptions={[]} onReplace={() => {}} onReset={() => {}} canReset={false}
                        onPickImage={openPicker}
                      />
                    </div>
                  )}
                </>
              );
            })()}
          </section>
        </aside>
      </div>

      {pickerOpen && (
        <AssetPicker assets={assets} businessType={businessType} onSelect={a => { pickerApply.current?.(a); }} onClose={() => setPickerOpen(false)} />
      )}
    </div>
  );
}
