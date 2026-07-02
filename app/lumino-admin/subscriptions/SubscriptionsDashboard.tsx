'use client';

import { useMemo, useState } from 'react';
import { runOverdueCheck, runGenerateInvoices } from '../lab/actions';

export interface SubRow {
  id: string;
  projectId: string;
  businessName: string;
  status: string;
  monthly: number;
  nextBilling?: string;
}

const euro = (n: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n);
const STATUS_STYLE: Record<string, string> = {
  active: 'bg-green-600', past_due: 'bg-amber-600', suspended: 'bg-red-600', canceled: 'bg-zinc-600', trial: 'bg-blue-600',
};
const daysUntil = (d?: string) => d ? Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000) : null;

export default function SubscriptionsDashboard({ items }: { items: SubRow[] }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [dueFilter, setDueFilter] = useState('all');
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const mrr = useMemo(() => items.filter(i => i.status === 'active').reduce((s, i) => s + i.monthly, 0), [items]);
  const counts = useMemo(() => ({
    active: items.filter(i => i.status === 'active').length,
    past_due: items.filter(i => i.status === 'past_due').length,
    suspended: items.filter(i => i.status === 'suspended').length,
  }), [items]);

  const filtered = items.filter(i => {
    if (statusFilter !== 'all' && i.status !== statusFilter) return false;
    if (q && !i.businessName.toLowerCase().includes(q.toLowerCase())) return false;
    if (dueFilter !== 'all') {
      const d = daysUntil(i.nextBilling);
      if (d == null) return false;
      if (dueFilter === 'week' && (d < 0 || d > 7)) return false;
      if (dueFilter === 'month' && (d < 0 || d > 31)) return false;
    }
    return true;
  });

  const runCheck = async () => { setBusy(true); setMsg(null); try { const r = await runOverdueCheck(); setMsg(`Check completato: ${r.notified} reminder, ${r.suspended} sospesi. Ricarico…`); setTimeout(() => window.location.reload(), 1000); } finally { setBusy(false); } };
  const runGen = async () => { setBusy(true); setMsg(null); try { const r = await runGenerateInvoices(); setMsg(`Generate ${r.generated} fatture. Ricarico…`); setTimeout(() => window.location.reload(), 1000); } finally { setBusy(false); } };
  const exportCsv = () => setMsg('Esportazione CSV in arrivo (stub).');

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-serif text-3xl">Abbonamenti</h1>
          <div className="flex gap-2">
            <button onClick={runCheck} disabled={busy} className="rounded bg-zinc-800 px-3 py-1.5 text-sm hover:bg-zinc-700 disabled:opacity-50">🔄 Check pagamenti scaduti</button>
            <button onClick={runGen} disabled={busy} className="rounded bg-zinc-800 px-3 py-1.5 text-sm hover:bg-zinc-700 disabled:opacity-50">🧾 Genera fatture</button>
            <button onClick={exportCsv} className="rounded bg-zinc-800 px-3 py-1.5 text-sm hover:bg-zinc-700">📥 Esporta</button>
          </div>
        </div>
        {msg && <p className="mb-4 text-sm text-amber-400">{msg}</p>}

        {/* A) SUMMARY */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4"><p className="text-xs text-zinc-500">MRR Totale</p><p className="text-2xl font-bold">{euro(mrr)}</p></div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4"><p className="text-xs text-zinc-500">Attivi</p><p className="text-2xl font-bold text-green-400">{counts.active}</p></div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4"><p className="text-xs text-zinc-500">Past due</p><p className="text-2xl font-bold text-amber-400">{counts.past_due}</p></div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4"><p className="text-xs text-zinc-500">Sospesi</p><p className="text-2xl font-bold text-red-400">{counts.suspended}</p></div>
        </div>

        {/* C) FILTRI */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Cerca hotel…" className="rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm">
            {['all', 'active', 'past_due', 'suspended', 'canceled'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={dueFilter} onChange={e => setDueFilter(e.target.value)} className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm">
            <option value="all">Scadenza: tutte</option>
            <option value="week">Questa settimana</option>
            <option value="month">Questo mese</option>
          </select>
        </div>

        {/* B) TABELLA */}
        <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] uppercase text-zinc-500">
                <tr><th className="p-3">Hotel</th><th className="p-3">Status</th><th className="p-3">Canone</th><th className="p-3">Prossima fattura</th><th className="p-3">Giorni</th><th className="p-3"></th></tr>
              </thead>
              <tbody>
                {filtered.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-zinc-600">Nessun abbonamento. (La migration 0020 dev'essere applicata per i dati reali.)</td></tr>}
                {filtered.map(i => {
                  const d = daysUntil(i.nextBilling);
                  return (
                    <tr key={i.id} className="border-t border-zinc-800/60">
                      <td className="p-3 font-medium">{i.businessName}</td>
                      <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-[11px] text-white ${STATUS_STYLE[i.status] || 'bg-zinc-600'}`}>{i.status}</span></td>
                      <td className="p-3">{euro(i.monthly)}</td>
                      <td className="p-3">{i.nextBilling ? new Date(i.nextBilling).toLocaleDateString('it-IT') : '—'}</td>
                      <td className="p-3">{d != null ? <span className={d < 3 ? 'rounded bg-red-600 px-1.5 py-0.5 text-[11px] text-white' : ''}>{d}</span> : '—'}</td>
                      <td className="p-3 text-right"><a href={`/lumino-admin/lab/${i.projectId}`} className="text-xs text-amber-400 hover:underline">Vedi dettagli</a></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
