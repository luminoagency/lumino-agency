'use client';

import { useEffect, useRef, useState } from 'react';
import type { Subscription, Invoice, PaymentMethod } from '@/lib/lab/subscriptions';
import type { ClientUser } from '@/lib/lab/client-auth';
import {
  getSubscriptionWithInvoices, markInvoicePaid, suspendSubscription, reactivateSubscription,
  cancelSubscription, updateSubscriptionAmount, updateSubscriptionNotes,
  createClientAccessForProject, resetClientPasswordAdmin, listClientUsers, deleteClientUser,
} from './actions';

interface Props { projectId: string; businessName: string; businessType?: string }

const euro = (n?: number) => typeof n === 'number' ? new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n) : '—';
const dt = (s?: string) => s ? new Date(s).toLocaleDateString('it-IT') : '—';
const STATUS_STYLE: Record<string, string> = {
  active: 'bg-green-600', past_due: 'bg-amber-600', suspended: 'bg-red-600', canceled: 'bg-zinc-600', trial: 'bg-blue-600',
};

export default function Step6Subscription({ projectId, businessName, businessType }: Props) {
  const [sub, setSub] = useState<Subscription | undefined>();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [users, setUsers] = useState<ClientUser[]>([]);
  const [accessForm, setAccessForm] = useState({ email: '', fullName: '' });
  const [accessBusy, setAccessBusy] = useState(false);
  const [cred, setCred] = useState<{ email: string; password: string; loginUrl: string } | null>(null);

  const load = async () => {
    setLoading(true);
    const r = await getSubscriptionWithInvoices(projectId);
    setSub(r.subscription); setInvoices(r.invoices); setNotes(r.subscription?.notes || '');
    setUsers(await listClientUsers(projectId));
    setLoading(false);
  };

  const createAccess = async () => {
    if (!accessForm.email) return;
    setAccessBusy(true);
    const r = await createClientAccessForProject(projectId, { email: accessForm.email, fullName: accessForm.fullName || undefined });
    setAccessBusy(false);
    if (r.ok && r.temporaryPassword) { setCred({ email: accessForm.email, password: r.temporaryPassword, loginUrl: r.loginUrl || '/portal/login' }); setAccessForm({ email: '', fullName: '' }); await load(); }
    else alert(r.error || 'Errore.');
  };
  const resetPw = async (u: ClientUser) => { const r = await resetClientPasswordAdmin(u.id); if (r.ok && r.newPassword) setCred({ email: u.email, password: r.newPassword, loginUrl: '' }); };
  const delUser = async (u: ClientUser) => { if (!confirm(`Eliminare l'accesso di ${u.email}?`)) return; await deleteClientUser(u.id); await load(); };
  useEffect(() => { void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [projectId]);

  const pay = async (id: string, method: PaymentMethod) => { await markInvoicePaid(id, method); await load(); };
  const doSuspend = async () => { const r = prompt('Motivo sospensione:'); if (r == null || !sub) return; await suspendSubscription(sub.id, r || 'Sospeso'); await load(); };
  const doReactivate = async () => { if (!sub) return; await reactivateSubscription(sub.id); await load(); };
  const doCancel = async () => { if (!sub) return; if (!confirm('Cancellare l\'abbonamento?')) return; if (!confirm('Sei sicuro? Operazione definitiva.')) return; const r = prompt('Motivo cancellazione:') || 'Cancellato'; await cancelSubscription(sub.id, r); await load(); };
  const doAmount = async () => { if (!sub) return; const v = prompt('Nuovo canone mensile (€):', String(sub.monthly_amount)); if (v == null) return; const n = Number(v); if (!isFinite(n) || n < 0) return; await updateSubscriptionAmount(sub.id, n); await load(); };
  const onNotes = (v: string) => { setNotes(v); if (!sub) return; if (notesTimer.current) clearTimeout(notesTimer.current); notesTimer.current = setTimeout(() => { void updateSubscriptionNotes(sub.id, v); }, 1000); };

  const daysUntil = sub?.next_billing_date ? Math.ceil((new Date(sub.next_billing_date).getTime() - Date.now()) / 86_400_000) : null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-6 flex items-center gap-3 text-xs">
          <a href="/lumino-admin/lab" className="text-zinc-500 hover:text-zinc-300">← Lab</a>
          <span className="text-zinc-600">/</span>
          <a href="/lumino-admin/subscriptions" className="text-zinc-500 hover:text-zinc-300">Abbonamenti</a>
          <span className="text-zinc-600">/</span>
          <span className="uppercase tracking-wider text-amber-500">Step 6 — Abbonamento</span>
        </div>

        {/* A) HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl">{businessName}</h1>
            <p className="text-xs text-zinc-500">{businessType || 'hotel'}</p>
          </div>
          {sub && <span className={`rounded-full px-3 py-1 text-xs font-semibold text-white ${STATUS_STYLE[sub.status] || 'bg-zinc-600'}`}>{sub.status}</span>}
        </div>

        {loading ? (
          <p className="mt-10 text-sm text-zinc-500">Caricamento…</p>
        ) : !sub ? (
          <div className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center">
            <p className="text-zinc-400">Nessun abbonamento attivo per questo progetto.</p>
            <p className="mt-2 text-xs text-zinc-600">Attivalo dallo Step 5 (Publish) dopo la pubblicazione.</p>
          </div>
        ) : (
          <>
            <p className="mt-2 text-sm text-zinc-400">MRR cliente: <span className="text-lg font-bold text-white">{euro(sub.monthly_amount)}</span>/mese</p>

            {/* B) ABBONAMENTO CORRENTE */}
            <section className="mt-5 grid grid-cols-2 gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-5 text-sm sm:grid-cols-3">
              <div><p className="text-zinc-500">Setup fee</p><p className="font-semibold">{euro(sub.setup_fee_amount)} {sub.setup_fee_paid ? '✅' : '⏳'}</p></div>
              <div><p className="text-zinc-500">Canone mensile</p><p className="font-semibold">{euro(sub.monthly_amount)}</p></div>
              <div><p className="text-zinc-500">Prossima fattura</p><p className="font-semibold">{dt(sub.next_billing_date)}</p></div>
              <div><p className="text-zinc-500">Ultimo pagamento</p><p className="font-semibold">{dt(sub.last_paid_at)}</p></div>
              <div><p className="text-zinc-500">Giorni alla fattura</p><p className={`font-semibold ${daysUntil != null && daysUntil < 3 ? 'text-red-400' : ''}`}>{daysUntil != null ? daysUntil : '—'}</p></div>
              <div><p className="text-zinc-500">Giorno addebito</p><p className="font-semibold">{sub.billing_day}</p></div>
            </section>

            {/* C) AZIONI RAPIDE */}
            <section className="mt-5 flex flex-wrap gap-2">
              {sub.status !== 'suspended'
                ? <button onClick={doSuspend} className="rounded bg-zinc-800 px-3 py-1.5 text-sm hover:bg-zinc-700">⏸️ Sospendi sito</button>
                : <button onClick={doReactivate} className="rounded bg-green-700 px-3 py-1.5 text-sm hover:bg-green-600">▶️ Riattiva sito</button>}
              <button onClick={doAmount} className="rounded bg-zinc-800 px-3 py-1.5 text-sm hover:bg-zinc-700">💰 Cambia importo</button>
              <button onClick={doCancel} className="rounded bg-zinc-800 px-3 py-1.5 text-sm text-red-400 hover:bg-zinc-700">❌ Cancella abbonamento</button>
            </section>

            {/* D) STORICO FATTURE */}
            <section className="mt-5 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
              <h2 className="border-b border-zinc-800 p-4 text-sm uppercase tracking-wider text-zinc-400">Storico fatture</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-[11px] uppercase text-zinc-500">
                    <tr><th className="p-3">Numero</th><th className="p-3">Tipo</th><th className="p-3">Importo</th><th className="p-3">Scadenza</th><th className="p-3">Stato</th><th className="p-3">Metodo</th><th className="p-3"></th></tr>
                  </thead>
                  <tbody>
                    {invoices.length === 0 && <tr><td colSpan={7} className="p-4 text-center text-zinc-600">Nessuna fattura.</td></tr>}
                    {invoices.map(inv => (
                      <tr key={inv.id} className="border-t border-zinc-800/60">
                        <td className="p-3 font-mono text-xs">{inv.invoice_number}</td>
                        <td className="p-3">{inv.invoice_type}</td>
                        <td className="p-3">{euro(inv.amount)}</td>
                        <td className="p-3">{dt(inv.due_date)}</td>
                        <td className="p-3"><span className={inv.status === 'paid' ? 'text-green-400' : inv.status === 'failed' ? 'text-red-400' : 'text-amber-400'}>{inv.status}</span></td>
                        <td className="p-3 text-zinc-400">{inv.payment_method || '—'}</td>
                        <td className="p-3 text-right">
                          {inv.status === 'pending' && (
                            <span className="flex justify-end gap-1">
                              <button onClick={() => pay(inv.id, 'bonifico')} className="rounded bg-zinc-800 px-2 py-1 text-[11px] hover:bg-zinc-700" title="Pagata via bonifico">✅ Bonifico</button>
                              <button onClick={() => pay(inv.id, 'cash')} className="rounded bg-zinc-800 px-2 py-1 text-[11px] hover:bg-zinc-700" title="Pagata in contanti">💶 Cash</button>
                            </span>
                          )}
                          <button title="PDF (in arrivo)" className="ml-1 cursor-not-allowed text-[11px] text-zinc-600">PDF</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* E) NOTE ADMIN */}
            <section className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
              <h2 className="mb-2 text-sm uppercase tracking-wider text-zinc-400">Note admin</h2>
              <textarea value={notes} onChange={e => onNotes(e.target.value)} rows={3}
                placeholder="Appunti su questo cliente (es. VIP, sconto 10% fino a dicembre)…"
                className="w-full resize-y rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm" />
            </section>
          </>
        )}

        {/* ACCESSO CLIENTE (Layer 5) */}
        <section className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="mb-3 text-sm uppercase tracking-wider text-zinc-400">👤 Accesso cliente</h2>
          {cred && (
            <div className="mb-3 rounded border border-green-600/40 bg-green-900/10 p-3 text-xs">
              <p className="mb-1 text-green-300">✅ Credenziali generate — copia e invia al cliente:</p>
              <p>Email: <b>{cred.email}</b></p>
              <p>Password: <b className="font-mono">{cred.password}</b></p>
              {cred.loginUrl && <p>Login: <b>{cred.loginUrl}</b></p>}
              <button onClick={() => { if (typeof navigator !== 'undefined' && navigator.clipboard) navigator.clipboard.writeText(`Email: ${cred.email}\nPassword: ${cred.password}\nLogin: ${cred.loginUrl}`); }} className="mt-2 rounded bg-zinc-800 px-2 py-1 hover:bg-zinc-700">📋 Copia tutto</button>
            </div>
          )}
          {users.length === 0 ? (
            <div className="space-y-2">
              <input value={accessForm.email} onChange={e => setAccessForm(s => ({ ...s, email: e.target.value }))} placeholder="Email cliente" className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm" />
              <input value={accessForm.fullName} onChange={e => setAccessForm(s => ({ ...s, fullName: e.target.value }))} placeholder="Nome (opzionale)" className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm" />
              <button onClick={createAccess} disabled={accessBusy || !accessForm.email} className="rounded bg-amber-700 px-3 py-1.5 text-sm text-white hover:bg-amber-600 disabled:opacity-50">{accessBusy ? 'Creazione…' : 'Crea accesso cliente'}</button>
            </div>
          ) : (
            <ul className="space-y-1 text-sm">
              {users.map(u => (
                <li key={u.id} className="flex items-center justify-between rounded bg-zinc-800/50 px-3 py-2">
                  <span>{u.full_name || u.email} <span className="text-zinc-500">· {u.role} · ultimo: {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString('it-IT') : 'mai'}</span></span>
                  <span className="flex gap-2 text-xs"><button onClick={() => resetPw(u)} className="text-amber-400 hover:underline">Reset password</button><button onClick={() => delUser(u)} className="text-red-400 hover:underline">Elimina</button></span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
