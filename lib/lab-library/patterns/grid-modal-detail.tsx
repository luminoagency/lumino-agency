'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * GridModalDetail — pattern lista/griglia di voci con modale di dettaglio al click.
 * Riusabile per servizi, team, menu, modelli. Barra di ricerca opzionale. Palette dinamica.
 *
 * Props:
 * - title?: intestazione. modalTitle?: titolo del modale (default = nome voce).
 * - items (required): Array<{ id, name, description?, badges?, meta? }>.
 *   meta?: Record<string,string|number> mostrato come righe chiave/valore nel modale.
 * - columns? (default 3): colonne in layout grid.
 * - showSearch? (default false): barra di ricerca per nome/descrizione.
 * - layout?: 'grid' (default) | 'list'. size?, tone?, palette?.
 *
 * @example
 * <GridModalDetail title="I nostri servizi" showSearch columns={3}
 *   items={[{id:'1',name:'Taglio',description:'...',badges:['30 min'],meta:{Prezzo:'18€'}}]}
 *   palette={{bg:'#fff',ink:'#111',accent:'#8b5cf6',muted:'#f5f5f5'}} />
 */

type Palette = { bg: string; ink: string; accent: string; muted: string };
export type GridModalItem = { id: string; name: string; description?: string; badges?: string[]; meta?: Record<string, string | number> };

export interface GridModalDetailProps {
  title?: string;
  modalTitle?: string;
  items: GridModalItem[];
  columns?: number;
  showSearch?: boolean;
  layout?: 'grid' | 'list';
  size?: 'compact' | 'normal' | 'spacious';
  tone?: 'modern' | 'classic' | 'editorial' | 'playful';
  palette?: Palette;
  className?: string;
}

const SIZE = { compact: 'py-12', normal: 'py-16 md:py-24', spacious: 'py-24 md:py-32' } as const;
const cx = (...a: Array<string | false | undefined>) => a.filter(Boolean).join(' ');
function paletteVars(p?: Palette): React.CSSProperties {
  return p ? ({ '--lumino-bg': p.bg, '--lumino-ink': p.ink, '--lumino-accent': p.accent, '--lumino-muted': p.muted } as React.CSSProperties) : {};
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium" style={{ background: 'var(--lumino-muted, #f5f5f5)', color: 'var(--lumino-ink, #1a1a1a)' }}>{children}</span>;
}

export function GridModalDetail({
  title,
  modalTitle,
  items,
  columns = 3,
  showSearch = false,
  layout = 'grid',
  size = 'normal',
  tone = 'modern',
  palette,
  className,
}: GridModalDetailProps) {
  const [selected, setSelected] = useState<GridModalItem | null>(null);
  const [query, setQuery] = useState('');
  const serif = tone === 'classic' || tone === 'editorial';

  const filtered = useMemo(() => {
    const sorted = [...(items || [])].sort((a, b) => a.name.localeCompare(b.name));
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((m) => m.name.toLowerCase().includes(q) || (m.description || '').toLowerCase().includes(q));
  }, [items, query]);

  const rootStyle: React.CSSProperties = { ...paletteVars(palette), background: 'var(--lumino-bg, #ffffff)', color: 'var(--lumino-ink, #1a1a1a)' };
  const gridCls = layout === 'list'
    ? 'flex flex-col gap-3'
    : 'grid gap-4 ' + (columns >= 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : columns === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3');

  return (
    <section className={cx('w-full', SIZE[size], className)} style={rootStyle}>
      <div className="mx-auto max-w-5xl px-6 md:px-8">
        {(title || showSearch) && (
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {title && <h2 className={cx('text-2xl md:text-3xl font-bold tracking-tight', serif && 'font-serif')}>{title}</h2>}
            {showSearch && (
              <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cerca…"
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 sm:w-64"
                style={{ background: 'var(--lumino-bg, #fff)', color: 'var(--lumino-ink, #1a1a1a)', borderColor: 'var(--lumino-muted, #e5e5e5)' }} />
            )}
          </div>
        )}

        <ul className={gridCls}>
          {filtered.map((m) => (
            <motion.li key={m.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="cursor-pointer rounded-xl border p-4 transition-shadow hover:shadow-md"
              style={{ borderColor: 'var(--lumino-muted, #e5e5e5)' }} onClick={() => setSelected(m)}>
              <div className="flex items-center justify-between gap-2">
                <span className={cx('font-medium', serif && 'font-serif')}>{m.name}</span>
              </div>
              {m.description && <p className="mt-2 line-clamp-2 text-sm" style={{ opacity: 0.7 }}>{m.description}</p>}
              {m.badges && m.badges.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{m.badges.map((b) => <Badge key={b}>{b}</Badge>)}</div>}
            </motion.li>
          ))}
        </ul>
        {filtered.length === 0 && <p className="py-10 text-center text-sm" style={{ opacity: 0.6 }}>Nessun risultato.</p>}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/50" onClick={() => setSelected(null)} aria-hidden="true" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative z-10 w-full max-w-lg rounded-2xl border p-6 shadow-xl" style={rootStyle} role="dialog" aria-modal="true">
              <button onClick={() => setSelected(null)} aria-label="Chiudi" className="absolute right-4 top-4 text-xl leading-none" style={{ opacity: 0.5 }}>×</button>
              <h3 className={cx('text-xl font-semibold', serif && 'font-serif')}>{modalTitle || selected.name}</h3>
              {modalTitle && <p className="text-sm font-medium" style={{ color: 'var(--lumino-accent, #8b5cf6)' }}>{selected.name}</p>}
              {selected.description && <p className="mt-3 text-sm leading-relaxed" style={{ opacity: 0.8 }}>{selected.description}</p>}
              {selected.badges && selected.badges.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{selected.badges.map((b) => <Badge key={b}>{b}</Badge>)}</div>}
              {selected.meta && Object.keys(selected.meta).length > 0 && (
                <dl className="mt-5 space-y-2 border-t pt-4" style={{ borderColor: 'var(--lumino-muted, #e5e5e5)' }}>
                  {Object.entries(selected.meta).map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 text-sm"><dt style={{ opacity: 0.6 }}>{k}</dt><dd className="font-medium">{String(v)}</dd></div>
                  ))}
                </dl>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export default GridModalDetail;
