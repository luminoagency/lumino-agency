'use client';

import { useEffect, useState } from 'react';
import type { SiteBuild } from '@/lib/lab/builder';
import { publishProject, rollbackToSnapshot, advanceToStep, createSubscription, runAuditForProject } from './actions';
import type { AuditReport, AuditCheck } from '@/lib/lab/audit';
import { Rocket, ExternalLink, Copy, Check, ArrowLeft, Globe, History, ChevronDown, ShieldCheck } from 'lucide-react';

interface DeployEntry { url?: string; at: string; testMode?: boolean }
interface SnapEntry { id: string; reason?: string; created_at: string }

interface Step5PublishProps {
  projectId: string;
  build: SiteBuild;
  businessName: string;
  businessType?: string;
  publishedUrl?: string;
  customDomain?: string;
  publishedAt?: string;
  history?: DeployEntry[];
  snapshots?: SnapEntry[];
}

const PHASES = ['Snapshot in corso…', 'Generazione HTML…', 'Upload su Vercel…', 'Deploy in corso…', 'Quasi pronto…'];

export default function Step5Publish({ projectId, build, businessName, businessType, publishedUrl, customDomain, publishedAt, history = [], snapshots = [] }: Step5PublishProps) {
  const isHotel = /hotel|b&b|bnb|resort|agriturismo|ostello|locanda|relais/i.test(businessType || '');
  const [subForm, setSubForm] = useState({ setupFee: '300', monthly: '89', billingDay: '1', notes: '' });
  const [subBusy, setSubBusy] = useState(false);
  const [subMsg, setSubMsg] = useState<string | null>(null);
  const activateSub = async () => {
    if (projectId === 'test-no-db') { setSubMsg('Test mode: attivazione su progetto reale.'); return; }
    setSubBusy(true); setSubMsg(null);
    try {
      const r = await createSubscription(projectId, {
        setupFee: Number(subForm.setupFee) || 0,
        monthlyAmount: Number(subForm.monthly) || 0,
        billingDay: Number(subForm.billingDay) || 1,
        notes: subForm.notes || undefined,
      });
      if (!r.ok) { setSubMsg(r.error || 'Errore.'); return; }
      await advanceToStep(projectId, 6);
      window.location.reload();
    } finally { setSubBusy(false); }
  };
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState(0);
  const [url, setUrl] = useState<string | undefined>(publishedUrl);
  const [testMode, setTestMode] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [domainOpen, setDomainOpen] = useState(false);
  const [domain, setDomain] = useState(customDomain || '');
  const [dns, setDns] = useState<{ nameservers?: string[]; error?: string } | null>(null);
  const [audit, setAudit] = useState<AuditReport | null>(null);
  const [auditBusy, setAuditBusy] = useState(false);

  const runAudit = async () => { setAuditBusy(true); try { setAudit(await runAuditForProject(projectId)); } finally { setAuditBusy(false); } };
  const blockedByAudit = !!audit && !audit.canPublish;
  const scoreColor = (s: number) => s >= 90 ? '#16a34a' : s >= 70 ? '#d97706' : '#dc2626';

  const totalSections = build.pages.reduce((n, p) => n + p.sections.length, 0);
  const pal = build.globalConfig.palette;
  const logo = build.globalConfig.logo?.url;

  useEffect(() => {
    if (!busy) return;
    const t = setInterval(() => setPhase(p => (p + 1) % PHASES.length), 1400);
    return () => clearInterval(t);
  }, [busy]);

  const fullUrl = (u?: string) => (!u ? '' : u.startsWith('http') ? u : `${typeof window !== 'undefined' ? window.location.origin : ''}${u}`);

  const doPublish = async (withDomain?: string) => {
    setBusy(true); setErr(null); setPhase(0);
    try {
      const r = await publishProject(projectId, withDomain);
      if (!r.ok) { setErr(r.error || 'Errore pubblicazione.'); return; }
      setUrl(r.url); setTestMode(!!r.testMode);
      if (r.customDomainStatus) setDns(r.customDomainStatus);
    } finally { setBusy(false); }
  };

  const copy = async () => {
    const u = fullUrl(url);
    if (typeof navigator !== 'undefined' && navigator.clipboard && u) {
      await navigator.clipboard.writeText(u); setCopied(true); setTimeout(() => setCopied(false), 2000);
    }
  };

  const reopenEditor = async () => { await advanceToStep(projectId, 4); window.location.reload(); };
  const restore = async (id: string) => { if (confirm('Ripristinare questo snapshot?')) { await rollbackToSnapshot(projectId, id); window.location.reload(); } };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-8 flex items-center gap-3">
          <a href="/lumino-admin/lab" className="text-xs text-zinc-500 hover:text-zinc-300">← Lab</a>
          <span className="text-zinc-600">/</span>
          <span className="text-xs uppercase tracking-wider text-amber-500">Step 5 — Publish</span>
        </div>

        <h1 className="font-serif text-3xl">{businessName}</h1>

        {/* A) RIEPILOGO */}
        <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="mb-3 text-sm uppercase tracking-wider text-zinc-400">Riepilogo</h2>
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div><span className="text-2xl font-bold">{build.pages.length}</span> <span className="text-zinc-500">pagine</span></div>
            <div><span className="text-2xl font-bold">{totalSections}</span> <span className="text-zinc-500">sezioni</span></div>
            <div className="flex items-center gap-2">
              {logo ? <img src={logo} alt="logo" className="h-10 w-10 rounded bg-zinc-800 object-contain p-1" /> : <span className="text-zinc-600 text-xs">no logo</span>}
              <div className="flex gap-1">
                {[pal.bg, pal.ink, pal.accent, pal.muted].map((c, i) => <span key={i} className="h-5 w-5 rounded border border-white/10" style={{ background: c }} />)}
              </div>
            </div>
            {build.globalConfig.font?.heading && <div className="text-zinc-500">Font: {build.globalConfig.font.heading}{build.globalConfig.font.body ? ` / ${build.globalConfig.font.body}` : ''}</div>}
          </div>
          <p className="mt-3 text-xs text-zinc-500">{url ? `Pubblicato${publishedAt ? ' il ' + new Date(publishedAt).toLocaleString('it-IT') : ''}` : 'Mai pubblicato'}</p>
        </section>

        {/* AUDIT (Layer 6) */}
        <section className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm uppercase tracking-wider text-zinc-400"><ShieldCheck className="h-4 w-4" /> Audit qualità sito</h2>
            <button onClick={runAudit} disabled={auditBusy} className="rounded bg-zinc-800 px-3 py-1.5 text-xs hover:bg-zinc-700 disabled:opacity-50">{auditBusy ? 'Analisi…' : 'Esegui audit'}</button>
          </div>
          {audit && (
            <div className="mt-4">
              <div className="flex items-center gap-4">
                <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full text-2xl font-bold" style={{ border: `4px solid ${scoreColor(audit.overallScore)}`, color: scoreColor(audit.overallScore) }}>{audit.overallScore}</div>
                <div>
                  <p className="font-semibold" style={{ color: audit.canPublish ? '#16a34a' : '#dc2626' }}>{audit.canPublish ? 'Pronto per il publish' : 'Correggi gli errori critici'}</p>
                  <p className="mt-1 text-xs text-zinc-400">🔴 {audit.criticalCount} critici · 🟡 {audit.warningCount} warning · 🔵 {audit.infoCount} info</p>
                </div>
              </div>
              <div className="mt-4 max-h-72 space-y-1.5 overflow-y-auto">
                {audit.checks.map((c: AuditCheck) => (
                  <div key={c.id} className="flex items-start gap-2 text-xs">
                    <span>{c.passed ? '✅' : c.severity === 'critical' ? '❌' : c.severity === 'warning' ? '🟡' : '🔵'}</span>
                    <span className="flex-1">
                      <span className="mr-1 text-[10px] uppercase text-zinc-500">{c.category}</span>{c.message}
                      {!c.passed && c.suggestion ? <span className="block text-zinc-500">→ {c.suggestion}</span> : null}
                      {c.affectedPages && c.affectedPages.length ? <span className="block text-zinc-600">Pagine: {c.affectedPages.join(', ')}</span> : null}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* B) PUBBLICAZIONE */}
        <section className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          {err && <div className="mb-3 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>}

          {busy ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-amber-500" />
              <p className="text-sm text-zinc-400">{PHASES[phase]}</p>
            </div>
          ) : url ? (
            <div className="rounded-xl border border-green-500/30 bg-green-500/[0.06] p-4">
              <p className="font-semibold text-green-300">✅ Sito pubblicato</p>
              {testMode && <p className="mt-1 text-xs text-amber-400">Test mode — sito generato localmente. Configura VERCEL_TOKEN per il deploy reale.</p>}
              <a href={fullUrl(url)} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-2 break-all text-sm text-amber-400 hover:underline">
                <ExternalLink className="h-4 w-4 shrink-0" /> {fullUrl(url)}
              </a>
              <div className="mt-3 flex gap-2">
                <button onClick={copy} className="flex items-center gap-1.5 rounded border border-zinc-700 px-3 py-1.5 text-xs hover:bg-zinc-800">
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? 'Copiato!' : 'Copia URL'}
                </button>
                <button onClick={reopenEditor} className="flex items-center gap-1.5 rounded border border-zinc-700 px-3 py-1.5 text-xs hover:bg-zinc-800">
                  <ArrowLeft className="h-3.5 w-3.5" /> Riapri editor
                </button>
                <button onClick={() => doPublish(domain || undefined)} className="rounded border border-zinc-700 px-3 py-1.5 text-xs hover:bg-zinc-800">↻ Ripubblica</button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <button onClick={() => doPublish(domain || undefined)} disabled={blockedByAudit}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-4 text-base font-bold text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50">
                <Rocket className="h-5 w-5" /> Pubblica online
              </button>
              {blockedByAudit && <p className="text-center text-xs text-red-400">Risolvi {audit?.criticalCount} errori critici (audit) prima di pubblicare.</p>}
            </div>
          )}
        </section>

        {/* C) DOMINIO CUSTOM */}
        <section className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-900">
          <button onClick={() => setDomainOpen(o => !o)} className="flex w-full items-center justify-between p-5 text-sm">
            <span className="flex items-center gap-2"><Globe className="h-4 w-4" /> Dominio personalizzato</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${domainOpen ? 'rotate-180' : ''}`} />
          </button>
          {domainOpen && (
            <div className="space-y-3 border-t border-zinc-800 p-5">
              <div className="flex gap-2">
                <input value={domain} onChange={e => setDomain(e.target.value)} placeholder="es. trattoriamario.it"
                  className="flex-1 rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm" />
                <button onClick={() => doPublish(domain)} disabled={!domain || busy} className="rounded bg-zinc-800 px-4 text-sm hover:bg-zinc-700 disabled:opacity-50">Collega dominio</button>
              </div>
              <div className="rounded border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-400">
                <p className="mb-1 font-semibold text-zinc-300">Configura nel tuo registrar:</p>
                <p>Tipo: <b>A</b> — Nome: <b>@</b> — Valore: <b>76.76.21.21</b></p>
                <p>Tipo: <b>CNAME</b> — Nome: <b>www</b> — Valore: <b>cname.vercel-dns.com</b></p>
              </div>
              {dns?.error && <p className="text-xs text-red-400">{dns.error}</p>}
              {dns?.nameservers && <p className="text-xs text-green-400">Nameserver: {dns.nameservers.join(', ')}</p>}
            </div>
          )}
        </section>

        {/* HOTEL — Attiva abbonamento */}
        {isHotel && (
          <section className="mt-5 rounded-2xl border border-amber-700/40 bg-amber-900/10 p-5">
            <h2 className="mb-3 text-sm uppercase tracking-wider text-amber-400">🏨 Hotel — Attiva abbonamento</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <label className="block"><span className="text-[11px] text-zinc-500">Setup fee (€)</span>
                <input type="number" value={subForm.setupFee} onChange={e => setSubForm(s => ({ ...s, setupFee: e.target.value }))} placeholder="300" className="mt-0.5 w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm" /></label>
              <label className="block"><span className="text-[11px] text-zinc-500">Canone mensile (€)</span>
                <input type="number" value={subForm.monthly} onChange={e => setSubForm(s => ({ ...s, monthly: e.target.value }))} placeholder="89" className="mt-0.5 w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm" /></label>
              <label className="block"><span className="text-[11px] text-zinc-500">Giorno addebito (1-28)</span>
                <input type="number" min={1} max={28} value={subForm.billingDay} onChange={e => setSubForm(s => ({ ...s, billingDay: e.target.value }))} className="mt-0.5 w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm" /></label>
            </div>
            <textarea value={subForm.notes} onChange={e => setSubForm(s => ({ ...s, notes: e.target.value }))} rows={2} placeholder="Note (opzionale)" className="mt-2 w-full resize-y rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm" />
            {subMsg && <p className="mt-2 text-xs text-amber-400">{subMsg}</p>}
            <button onClick={activateSub} disabled={subBusy} className="mt-3 rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50">{subBusy ? 'Attivazione…' : '💼 Attiva abbonamento'}</button>
          </section>
        )}

        {/* D) STORICO */}
        {(history.length > 0 || snapshots.length > 0) && (
          <section className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm uppercase tracking-wider text-zinc-400"><History className="h-4 w-4" /> Storico</h2>
            <ul className="space-y-2 text-sm">
              {history.slice(-5).reverse().map((h, i) => (
                <li key={`h${i}`} className="flex items-center justify-between rounded bg-zinc-800/50 px-3 py-2">
                  <span className="text-zinc-400">{new Date(h.at).toLocaleString('it-IT')}{h.testMode ? ' · test' : ''}</span>
                  {h.url && <a href={fullUrl(h.url)} target="_blank" rel="noreferrer" className="text-xs text-amber-400 hover:underline">apri</a>}
                </li>
              ))}
              {snapshots.slice(-5).reverse().map(s => (
                <li key={s.id} className="flex items-center justify-between rounded bg-zinc-800/50 px-3 py-2">
                  <span className="text-zinc-400">{new Date(s.created_at).toLocaleString('it-IT')} · {s.reason || 'snapshot'}</span>
                  <button onClick={() => restore(s.id)} className="text-xs text-zinc-300 hover:text-white">Ripristina</button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <footer className="mt-10 border-t border-zinc-800 pt-4 text-center text-[11px] text-zinc-600">Lumino Lab v1.0 · 2026</footer>
      </div>
    </div>
  );
}
