'use client';

import { useState, type FormEvent } from 'react';
import { Lock, User, Bell, LogOut } from 'lucide-react';
import { changePasswordAction, updateNotificationsAction, logoutAction } from '../actions';

interface Props {
  email: string;
  fullName: string;
  role: string;
  notifyMessages: boolean;
  notifyBilling: boolean;
}

const border = '1px solid var(--lumino-muted, rgba(255,255,255,0.12))';
const cardStyle: React.CSSProperties = {
  border,
  background: 'var(--lumino-card, rgba(255,255,255,0.03))',
  borderRadius: 12,
};
const inputStyle: React.CSSProperties = {
  border,
  background: 'var(--lumino-bg, rgba(0,0,0,0.2))',
  borderRadius: 8,
};

export default function SettingsClient({ email, fullName, role, notifyMessages, notifyBilling }: Props) {
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pwBusy, setPwBusy] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [newPw, setNewPw] = useState('');

  const [msgs, setMsgs] = useState(notifyMessages);
  const [billing, setBilling] = useState(notifyBilling);
  const [notifBusy, setNotifBusy] = useState(false);

  async function onChangePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPwMsg(null);
    if (newPw !== confirm) {
      setPwMsg({ ok: false, text: 'La nuova password e la conferma non coincidono.' });
      return;
    }
    const form = e.currentTarget;
    setPwBusy(true);
    try {
      const res = await changePasswordAction(new FormData(form));
      if (res.ok) {
        setPwMsg({ ok: true, text: 'Password aggiornata con successo.' });
        form.reset();
        setNewPw('');
        setConfirm('');
      } else {
        setPwMsg({ ok: false, text: res.error || 'Errore durante il cambio password.' });
      }
    } catch {
      setPwMsg({ ok: false, text: 'Errore imprevisto. Riprova.' });
    } finally {
      setPwBusy(false);
    }
  }

  async function saveNotifications(nextMsgs: boolean, nextBilling: boolean) {
    setMsgs(nextMsgs);
    setBilling(nextBilling);
    setNotifBusy(true);
    try {
      await updateNotificationsAction(nextMsgs, nextBilling);
    } catch {
      // ripristina in caso di errore
      setMsgs(msgs);
      setBilling(billing);
    } finally {
      setNotifBusy(false);
    }
  }

  const labelCls = 'mb-1 block text-xs font-medium opacity-70';
  const fieldCls = 'w-full px-3 py-2 text-sm outline-none';

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold" style={{ fontFamily: 'var(--lumino-font-heading, inherit)' }}>
        Impostazioni
      </h1>

      {/* A) SICUREZZA */}
      <section className="p-5" style={cardStyle}>
        <div className="mb-4 flex items-center gap-2">
          <Lock className="h-4 w-4 opacity-70" />
          <h2 className="text-sm font-semibold">Sicurezza</h2>
        </div>

        <div className="mb-4">
          <label className={labelCls}>Email</label>
          <input value={email} readOnly className={fieldCls + ' opacity-70'} style={inputStyle} />
          <p className="mt-1 text-xs opacity-50">Per cambiare email contatta Lumino.</p>
        </div>

        <form onSubmit={onChangePassword} className="space-y-3">
          <div>
            <label className={labelCls} htmlFor="old">Password attuale</label>
            <input id="old" name="old" type="password" required autoComplete="current-password"
              className={fieldCls} style={inputStyle} />
          </div>
          <div>
            <label className={labelCls} htmlFor="new">Nuova password</label>
            <input id="new" name="new" type="password" required autoComplete="new-password"
              value={newPw} onChange={e => setNewPw(e.target.value)}
              className={fieldCls} style={inputStyle} />
          </div>
          <div>
            <label className={labelCls} htmlFor="confirm">Conferma nuova password</label>
            <input id="confirm" type="password" required autoComplete="new-password"
              value={confirm} onChange={e => setConfirm(e.target.value)}
              className={fieldCls} style={inputStyle} />
          </div>
          {pwMsg ? (
            <p className="text-xs" style={{ color: pwMsg.ok ? '#4ade80' : '#f87171' }}>{pwMsg.text}</p>
          ) : null}
          <button type="submit" disabled={pwBusy}
            className="rounded px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            style={{ background: 'var(--lumino-accent, #8b5cf6)' }}>
            {pwBusy ? 'Salvataggio…' : 'Cambia password'}
          </button>
        </form>
      </section>

      {/* B) PROFILO */}
      <section className="p-5" style={cardStyle}>
        <div className="mb-4 flex items-center gap-2">
          <User className="h-4 w-4 opacity-70" />
          <h2 className="text-sm font-semibold">Profilo</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Nome</label>
            <input value={fullName || '—'} readOnly className={fieldCls + ' opacity-70'} style={inputStyle} />
          </div>
          <div>
            <label className={labelCls}>Ruolo</label>
            <input value={role} readOnly className={fieldCls + ' opacity-70'} style={inputStyle} />
          </div>
        </div>
      </section>

      {/* C) NOTIFICHE */}
      <section className="p-5" style={cardStyle}>
        <div className="mb-4 flex items-center gap-2">
          <Bell className="h-4 w-4 opacity-70" />
          <h2 className="text-sm font-semibold">Notifiche</h2>
        </div>
        <div className="space-y-3">
          <label className="flex cursor-pointer items-center gap-3 text-sm">
            <input type="checkbox" checked={msgs} disabled={notifBusy}
              onChange={e => saveNotifications(e.target.checked, billing)}
              className="h-4 w-4 accent-[var(--lumino-accent,#8b5cf6)]" />
            <span>Ricevi email per nuovi contatti</span>
          </label>
          <label className="flex cursor-pointer items-center gap-3 text-sm">
            <input type="checkbox" checked={billing} disabled={notifBusy}
              onChange={e => saveNotifications(msgs, e.target.checked)}
              className="h-4 w-4 accent-[var(--lumino-accent,#8b5cf6)]" />
            <span>Ricevi email prima del rinnovo</span>
          </label>
        </div>
      </section>

      {/* D) LOGOUT */}
      <button onClick={() => logoutAction()}
        className="flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-medium"
        style={{ border, color: '#f87171' }}>
        <LogOut className="h-4 w-4" /> Logout
      </button>
    </div>
  );
}
