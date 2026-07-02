'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginAction } from '../actions';

export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true); setError(null);
    const r = await loginAction(new FormData(e.currentTarget));
    setBusy(false);
    if (r.ok) router.push('/portal');
    else setError(r.error || 'Accesso non riuscito.');
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {error && <p className="rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
      <label className="block text-sm">
        <span className="opacity-70">Email</span>
        <input name="email" type="email" required autoComplete="email"
          className="mt-1 w-full rounded-lg border border-black/15 bg-white/80 px-3 py-2 text-sm text-black outline-none" />
      </label>
      <label className="block text-sm">
        <span className="opacity-70">Password</span>
        <input name="password" type="password" required autoComplete="current-password"
          className="mt-1 w-full rounded-lg border border-black/15 bg-white/80 px-3 py-2 text-sm text-black outline-none" />
      </label>
      <label className="flex items-center gap-2 text-sm opacity-80">
        <input name="remember" type="checkbox" /> Ricordami (30 giorni)
      </label>
      <button type="submit" disabled={busy}
        className="w-full rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        style={{ background: 'var(--lumino-accent, #8b5cf6)' }}>
        {busy ? 'Accesso…' : 'Accedi'}
      </button>
      <a href="/portal/reset-password" className="block text-center text-xs opacity-60 hover:opacity-100">Password dimenticata?</a>
    </form>
  );
}
