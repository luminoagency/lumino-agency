'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { requestResetAction, resetPasswordAction } from '../actions';

const inputClass =
  'mt-1 w-full rounded-lg border border-black/15 bg-white/80 px-3 py-2 text-sm text-black outline-none';
const buttonClass =
  'w-full rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-50';

export default function ResetClient({ token }: { token: string }) {
  const router = useRouter();

  // STEP 1 state
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);

  // STEP 2 state
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const onRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    const r = await requestResetAction(new FormData(e.currentTarget));
    setBusy(false);
    if (r.ok) {
      setSent(true);
      setDevToken(r.devToken || null);
    }
  };

  const onReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const password = String(fd.get('password') || '');
    const confirm = String(fd.get('confirm') || '');
    if (password.length < 8) {
      setError('La password deve avere almeno 8 caratteri.');
      return;
    }
    if (password !== confirm) {
      setError('Le password non coincidono.');
      return;
    }
    setBusy(true);
    const submit = new FormData();
    submit.set('token', token);
    submit.set('password', password);
    const r = await resetPasswordAction(submit);
    setBusy(false);
    if (r.ok) setDone(true);
    else setError(r.error || 'Token non valido o scaduto.');
  };

  // STEP 2: token presente
  if (token) {
    if (done) {
      return (
        <div className="space-y-4 text-center">
          <h1 className="text-lg font-semibold">Password reimpostata</h1>
          <p className="text-sm opacity-70">
            La tua password è stata aggiornata con successo.
          </p>
          <button
            type="button"
            onClick={() => router.push('/portal/login')}
            className={buttonClass}
            style={{ background: 'var(--lumino-accent, #8b5cf6)' }}
          >
            Vai al login
          </button>
        </div>
      );
    }

    return (
      <form onSubmit={onReset} className="space-y-3">
        <h1 className="text-lg font-semibold">Reimposta password</h1>
        {error && (
          <p className="rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}
        <label className="block text-sm">
          <span className="opacity-70">Nuova password</span>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={inputClass}
          />
        </label>
        <label className="block text-sm">
          <span className="opacity-70">Conferma password</span>
          <input
            name="confirm"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={inputClass}
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className={buttonClass}
          style={{ background: 'var(--lumino-accent, #8b5cf6)' }}
        >
          {busy ? 'Salvataggio…' : 'Reimposta password'}
        </button>
      </form>
    );
  }

  // STEP 1: nessun token → richiesta link
  if (sent) {
    return (
      <div className="space-y-4">
        <h1 className="text-lg font-semibold">Controlla la tua email</h1>
        <p className="text-sm opacity-70">
          Se l&apos;email esiste, ti abbiamo inviato le istruzioni.
        </p>
        {devToken && (
          <a
            href={`/portal/reset-password?token=${encodeURIComponent(devToken)}`}
            className="block break-all text-xs text-amber-300 underline"
          >
            DEV: usa questo link
          </a>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={onRequest} className="space-y-3">
      <h1 className="text-lg font-semibold">Recupera password</h1>
      <p className="text-sm opacity-70">
        Inserisci la tua email per ricevere il link di reset.
      </p>
      <label className="block text-sm">
        <span className="opacity-70">Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className={inputClass}
        />
      </label>
      <button
        type="submit"
        disabled={busy}
        className={buttonClass}
        style={{ background: 'var(--lumino-accent, #8b5cf6)' }}
      >
        {busy ? 'Invio…' : 'Invia link reset'}
      </button>
    </form>
  );
}
