'use client';

import { useState } from 'react';
import { completeOnboardingAction } from './actions';

const STEPS = (name: string, biz: string) => [
  `Benvenuto ${name || ''}! Questa è la tua dashboard per gestire ${biz}.`,
  "Modifica testi, foto e prezzi dalla sezione 'Contenuti'. Ricorda: le modifiche vanno pubblicate col bottone dedicato.",
  'Qui vedi i contatti ricevuti dai form del sito. Nessuna prenotazione — solo richieste di informazioni.',
  'Per modifiche strutturali (nuove pagine, cambi di design) contatta Lumino.',
];

export default function Onboarding({ show, userName, businessName }: { show: boolean; userName: string; businessName: string }) {
  const [open, setOpen] = useState(show);
  const [i, setI] = useState(0);
  if (!open) return null;
  const steps = STEPS(userName, businessName);
  const finish = async () => { setOpen(false); await completeOnboardingAction(); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-6 text-zinc-100">
        <div className="mb-2 text-xs opacity-60">Passo {i + 1} di {steps.length}</div>
        <p className="min-h-[72px] text-lg">{steps[i]}</p>
        <div className="mt-5 flex items-center justify-between">
          <button onClick={finish} className="text-xs opacity-60 hover:opacity-100">Salta tutorial</button>
          <div className="flex gap-2">
            {i > 0 && <button onClick={() => setI(i - 1)} className="rounded border border-white/15 px-3 py-1.5 text-sm">Precedente</button>}
            {i < steps.length - 1
              ? <button onClick={() => setI(i + 1)} className="rounded px-3 py-1.5 text-sm font-semibold text-white" style={{ background: 'var(--lumino-accent, #8b5cf6)' }}>Avanti</button>
              : <button onClick={finish} className="rounded px-3 py-1.5 text-sm font-semibold text-white" style={{ background: 'var(--lumino-accent, #8b5cf6)' }}>Fine</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
