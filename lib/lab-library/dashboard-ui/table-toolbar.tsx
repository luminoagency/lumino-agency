'use client';

import React, { useState } from 'react';
import { Search } from 'lucide-react';

/**
 * TableToolbar — barra strumenti per tabelle: titolo, ricerca, filtri a dropdown e azioni.
 *
 * Props:
 * - title: titolo mostrato a sinistra
 * - search: se true mostra un campo di ricerca con icona
 * - filters: elenco di filtri, ciascuno con label (placeholder) e opzioni
 * - actions: elenco di pulsanti azione con relativo handler
 * - className: classi aggiuntive sul contenitore
 */
export interface TableToolbarProps {
  title?: string;
  search?: boolean;
  filters?: Array<{ label: string; options: string[] }>;
  actions?: Array<{ label: string; onClick?: () => void }>;
  className?: string;
}

export function TableToolbar({ title, search, filters, actions, className }: TableToolbarProps) {
  const [query, setQuery] = useState<string>('');
  const [filterValues, setFilterValues] = useState<Record<number, string>>({});

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleFilter = (index: number) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterValues((prev) => ({ ...prev, [index]: e.target.value }));
  };

  const controlStyle: React.CSSProperties = {
    background: 'var(--lumino-bg, #ffffff)',
    color: 'var(--lumino-ink, #1a1a1a)',
    border: '1px solid color-mix(in srgb, var(--lumino-ink, #1a1a1a) 15%, transparent)',
  };

  return (
    <div
      className={[
        'flex flex-wrap items-center justify-between gap-3 rounded-xl p-3',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ background: 'var(--lumino-muted, #f5f5f5)' }}
    >
      {title ? (
        <h3 className="text-base font-semibold" style={{ color: 'var(--lumino-ink, #1a1a1a)' }}>
          {title}
        </h3>
      ) : (
        <span />
      )}

      <div className="flex flex-wrap items-center gap-2">
        {search && (
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 opacity-60"
              style={{ color: 'var(--lumino-ink, #1a1a1a)' }}
            />
            <input
              type="text"
              value={query}
              onChange={handleSearch}
              placeholder="Cerca..."
              className="rounded-lg py-2 pl-8 pr-3 text-sm outline-none focus:ring-2"
              style={controlStyle}
            />
          </div>
        )}

        {filters?.map((filter, i) => (
          <select
            key={i}
            value={filterValues[i] ?? ''}
            onChange={handleFilter(i)}
            className="rounded-lg px-3 py-2 text-sm outline-none focus:ring-2"
            style={controlStyle}
          >
            <option value="">{filter.label}</option>
            {filter.options.map((option, j) => (
              <option key={j} value={option}>
                {option}
              </option>
            ))}
          </select>
        ))}

        {actions?.map((action, i) => (
          <button
            key={i}
            type="button"
            onClick={action.onClick}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ background: 'var(--lumino-accent, #8b5cf6)' }}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default TableToolbar;
