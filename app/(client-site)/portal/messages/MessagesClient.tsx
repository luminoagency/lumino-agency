'use client';

import { useMemo, useState } from 'react';
import type { ClientMessage } from '../actions';
import { markMessageAction, deleteMessageAction } from '../actions';

type StatusFilter = 'all' | 'new' | 'read' | 'replied' | 'archived';
type MessageStatus = 'new' | 'read' | 'replied' | 'archived';

const ACCENT = 'var(--lumino-accent, #8b5cf6)';

const STATUS_META: Record<MessageStatus, { label: string; badge: string }> = {
  new: { label: 'Nuovo', badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  read: { label: 'Letto', badge: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30' },
  replied: { label: 'Risposto', badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  archived: { label: 'Archiviato', badge: 'bg-neutral-700/40 text-neutral-400 border-neutral-600/40' },
};

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'Tutti' },
  { key: 'new', label: 'Nuovi' },
  { key: 'read', label: 'Letti' },
  { key: 'replied', label: 'Risposti' },
  { key: 'archived', label: 'Archiviati' },
];

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString('it-IT');
}

function normStatus(status: string): MessageStatus {
  return status === 'new' || status === 'read' || status === 'replied' || status === 'archived'
    ? status
    : 'new';
}

export default function MessagesClient({ initial }: { initial: ClientMessage[] }) {
  const [messages, setMessages] = useState<ClientMessage[]>(initial);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [q, setQ] = useState<string>('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState<boolean>(false);

  const newCount = useMemo<number>(
    () => messages.filter((m) => m.status === 'new').length,
    [messages],
  );

  const visible = useMemo<ClientMessage[]>(() => {
    const query = q.trim().toLowerCase();
    return messages.filter((m) => {
      if (filter !== 'all' && m.status !== filter) return false;
      if (!query) return true;
      const hay = `${m.from_name ?? ''} ${m.from_email ?? ''}`.toLowerCase();
      return hay.includes(query);
    });
  }, [messages, filter, q]);

  const selected = useMemo<ClientMessage | null>(
    () => messages.find((m) => m.id === selectedId) ?? null,
    [messages, selectedId],
  );

  function selectMessage(m: ClientMessage): void {
    setSelectedId(m.id);
  }

  async function updateStatus(id: string, status: MessageStatus): Promise<void> {
    setBusy(true);
    try {
      const res = await markMessageAction(id, status);
      if (res.ok) {
        setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
      }
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string): Promise<void> {
    if (!window.confirm('Eliminare definitivamente questo messaggio?')) return;
    setBusy(true);
    try {
      const res = await deleteMessageAction(id);
      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== id));
        setSelectedId((cur) => (cur === id ? null : cur));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="text-zinc-200">
      {/* Header */}
      <div className="mb-6 flex items-baseline gap-3">
        <h1 className="text-2xl font-semibold text-white">Messaggi ricevuti</h1>
        <span
          className="rounded-full border px-2.5 py-0.5 text-sm"
          style={{ borderColor: ACCENT, color: ACCENT }}
        >
          {newCount} nuovi
        </span>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const isActive = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className="rounded-lg border px-3 py-1.5 text-sm transition-colors"
                style={
                  isActive
                    ? { backgroundColor: ACCENT, borderColor: ACCENT, color: '#fff' }
                    : { borderColor: '#3f3f46', color: '#d4d4d8' }
                }
              >
                {f.label}
              </button>
            );
          })}
        </div>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cerca per nome o email…"
          className="ml-auto w-full max-w-xs rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-1.5 text-sm text-zinc-200 placeholder-zinc-500 outline-none focus:border-zinc-500"
        />
      </div>

      {/* List */}
      {visible.length === 0 ? (
        <p className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-10 text-center text-zinc-500">
          Nessun messaggio.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {visible.map((m) => {
            const meta = STATUS_META[normStatus(m.status)];
            const isSel = m.id === selectedId;
            const preview = (m.message_body ?? '').slice(0, 100);
            return (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => selectMessage(m)}
                  className="w-full rounded-lg border bg-zinc-900/40 px-4 py-3 text-left transition-colors hover:bg-zinc-900/70"
                  style={{ borderColor: isSel ? ACCENT : '#27272a' }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full border px-2 py-0.5 text-xs ${meta.badge}`}>
                        {meta.label}
                      </span>
                      <span className="font-medium text-white">
                        {m.from_name ?? 'Anonimo'}
                      </span>
                    </div>
                    <span className="shrink-0 text-xs text-zinc-500">{fmtDate(m.created_at)}</span>
                  </div>
                  {preview && (
                    <p className="mt-1.5 line-clamp-1 text-sm text-zinc-400">
                      {preview}
                      {(m.message_body?.length ?? 0) > 100 ? '…' : ''}
                    </p>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Detail */}
      {selected && (
        <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2 py-0.5 text-xs ${STATUS_META[normStatus(selected.status)].badge}`}>
              {STATUS_META[normStatus(selected.status)].label}
            </span>
            <h2 className="text-lg font-semibold text-white">
              {selected.subject ?? 'Messaggio'}
            </h2>
          </div>

          <dl className="mb-4 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-zinc-500">Da</dt>
              <dd className="text-zinc-200">{selected.from_name ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Email</dt>
              <dd>
                {selected.from_email ? (
                  <a
                    href={`mailto:${selected.from_email}`}
                    className="hover:underline"
                    style={{ color: ACCENT }}
                  >
                    {selected.from_email}
                  </a>
                ) : (
                  <span className="text-zinc-200">—</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Telefono</dt>
              <dd>
                {selected.from_phone ? (
                  <a
                    href={`tel:${selected.from_phone}`}
                    className="hover:underline"
                    style={{ color: ACCENT }}
                  >
                    {selected.from_phone}
                  </a>
                ) : (
                  <span className="text-zinc-200">—</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Data</dt>
              <dd className="text-zinc-200">{fmtDate(selected.created_at)}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Pagina</dt>
              <dd className="text-zinc-200">{selected.page_slug ?? '—'}</dd>
            </div>
          </dl>

          {selected.message_body && (
            <div className="mb-5 whitespace-pre-wrap rounded-lg border border-zinc-800 bg-zinc-950/40 p-4 text-sm text-zinc-200">
              {selected.message_body}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => updateStatus(selected.id, 'read')}
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
            >
              Segna letto
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => updateStatus(selected.id, 'replied')}
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
            >
              Segna risposto
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => updateStatus(selected.id, 'archived')}
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
            >
              Archivia
            </button>
            {selected.from_email && (
              <a
                href={`mailto:${selected.from_email}`}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-white"
                style={{ backgroundColor: ACCENT }}
              >
                Rispondi via email
              </a>
            )}
            {selected.from_phone && (
              <a
                href={`tel:${selected.from_phone}`}
                className="rounded-lg border px-3 py-1.5 text-sm"
                style={{ borderColor: ACCENT, color: ACCENT }}
              >
                Chiama
              </a>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={() => remove(selected.id)}
              className="ml-auto rounded-lg border border-red-500/40 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10 disabled:opacity-50"
            >
              Elimina
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
