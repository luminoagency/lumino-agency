'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  adminGenerateSite, adminSetSiteStatus, adminSetSiteTier,
  adminApproveReview, adminDeleteReview, adminCalculatePrice,
  adminToggleOutreachAccount,
} from './actions'
import { logoutAction } from '../auth/actions'
import { DiagnosticsPanel } from './DiagnosticsPanel'
import type { DiagnosticsData } from './DiagnosticsPanel'

interface SiteRow {
  id: string; slug: string; tier: string; active: boolean; status: string;
  created_at: string; custom_domain: string | null;
  restaurant_name: string; city: string | null; client_email: string | null;
}
interface UserRow {
  id: string; email: string; created_at: string; last_sign_in_at: string | null;
  restaurant_name: string;
  site: { id: string; slug: string; tier: string; status: string } | null;
}
interface OutreachAccountRow {
  id: string; email: string; sender_name: string | null;
  status: string; warmup_day: number; daily_cap: number;
  delivery_rate: number | null; last_paused_at: string | null;
  active: boolean; failure_count: number;
}

/** Aggregato per sito — Lumino NON vede mai dati personali del guest. */
interface ResAggRow {
  site_id: string; siteSlug: string; restaurantName: string;
  total: number; confirmed: number; cancelled: number; pending: number;
  confirmedPct: number; cancelledPct: number;
}
interface PendingReview {
  siteId: string; siteSlug: string; restaurantName: string; index: number;
  review: { author: string; email?: string; rating: number; text: string; date: string };
}

interface Props {
  currentUserEmail: string
  diagnostics: DiagnosticsData | null
  stats: {
    totalUsers: number; totalSites: number; liveSites: number;
    buildingSites: number; errorSites: number; reservations30d: number;
    pendingReviewsCount: number; mrrPotential: number;
    planCount: { basic: number; pro: number; premium: number };
  }
  users: UserRow[]
  sites: SiteRow[]
  reservationsAggregate: ResAggRow[]
  outreachAccounts: OutreachAccountRow[]
  pendingReviews: PendingReview[]
  pricingMeta: {
    plans: Array<{ key: 'basic' | 'pro' | 'premium'; name: string; priceFrom: number; priceMax: number }>
    zones: string[]
    levels: string[]
  }
}

export function SuperAdminClient(props: Props) {
  const { stats, users, sites, reservationsAggregate, outreachAccounts, pendingReviews, pricingMeta, currentUserEmail, diagnostics } = props
  const [pending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ ok?: boolean; msg: string } | null>(null)

  function notify(ok: boolean, msg: string) {
    setFeedback({ ok, msg })
    setTimeout(() => setFeedback(null), 3500)
  }

  function doGenerate(siteId: string, name: string) {
    if (!confirm(`Generare con AI il contenuto del sito di "${name}"? Sovrascrive testi, foto, menu.`)) return
    startTransition(async () => {
      const r = await adminGenerateSite(siteId)
      notify(!!r.ok, r.ok ? `✓ Generato (template: ${r.template})` : `Errore: ${r.error}`)
    })
  }
  function doSetStatus(siteId: string, status: 'building' | 'live' | 'error') {
    startTransition(async () => {
      const r = await adminSetSiteStatus(siteId, status)
      notify(!!r.ok, r.ok ? '✓ Stato aggiornato' : `Errore: ${r.error}`)
    })
  }
  function doSetTier(siteId: string, tier: 'basic' | 'pro' | 'premium') {
    startTransition(async () => {
      const r = await adminSetSiteTier(siteId, tier)
      notify(!!r.ok, r.ok ? '✓ Piano aggiornato' : `Errore: ${r.error}`)
    })
  }
  function doToggleAccount(accountId: string, action: 'pause' | 'resume') {
    startTransition(async () => {
      const r = await adminToggleOutreachAccount(accountId, action)
      notify(!!r.ok, r.ok ? (action === 'pause' ? '⏸ In pausa' : '▶ Ripreso') : `Errore: ${r.error}`)
    })
  }
  function doApproveReview(siteId: string, idx: number) {
    startTransition(async () => {
      const r = await adminApproveReview(siteId, idx)
      notify(!!r.ok, r.ok ? '✓ Recensione pubblicata' : `Errore: ${r.error}`)
    })
  }
  function doDeleteReview(siteId: string, idx: number) {
    if (!confirm('Eliminare definitivamente questa recensione?')) return
    startTransition(async () => {
      const r = await adminDeleteReview(siteId, idx)
      notify(!!r.ok, r.ok ? '✓ Recensione eliminata' : `Errore: ${r.error}`)
    })
  }

  // Calcolatore prezzo
  const [calcPlan, setCalcPlan] = useState<'basic' | 'pro' | 'premium'>('pro')
  const [calcZone, setCalcZone] = useState<string>('cittaMedia')
  const [calcLevel, setCalcLevel] = useState<string>('mediaFascia')
  const [calcPrice, setCalcPrice] = useState<number | null>(null)
  function doCalc() {
    startTransition(async () => {
      const r = await adminCalculatePrice({ plan: calcPlan, zone: calcZone as any, level: calcLevel as any })
      if (r.ok) setCalcPrice(r.price!)
      else notify(false, r.error || 'Errore')
    })
  }

  return (
    <div className="la-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=Inter:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; background: #050505; }
        .la-root { min-height: 100vh; background: #050505; color: #fff; font-family: 'Inter', system-ui, sans-serif; padding-bottom: 80px; position: relative; }
        .la-bg { position: fixed; inset: 0; z-index: 0; pointer-events: none; background: radial-gradient(800px circle at 12% 18%, rgba(229,45,29,0.06), transparent 50%), radial-gradient(700px circle at 88% 75%, rgba(167,139,250,0.05), transparent 50%); }
        .la-wrap { position: relative; z-index: 1; max-width: 1400px; margin: 0 auto; padding: 24px 22px; }

        .la-top { display: flex; align-items: center; justify-content: space-between; padding-bottom: 22px; border-bottom: 1px solid rgba(255,255,255,0.06); margin-bottom: 28px; }
        .la-brand { display: inline-flex; align-items: baseline; gap: 10px; }
        .la-brand-name { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 28px; font-weight: 500; letter-spacing: -0.01em; color: #fff; }
        .la-brand-mark { font-size: 10px; letter-spacing: 0.28em; text-transform: uppercase; color: #e52d1d; font-weight: 700; padding: 3px 8px; border: 1px solid rgba(229,45,29,0.4); border-radius: 4px; }
        .la-top-right { display: flex; align-items: center; gap: 14px; font-size: 12px; color: rgba(255,255,255,0.55); }
        .la-top-right strong { color: #fff; font-weight: 600; }
        .la-logout { background: transparent; border: 1px solid rgba(255,255,255,0.15); color: rgba(255,255,255,0.7); padding: 7px 14px; border-radius: 100px; font-size: 12px; cursor: pointer; font-family: inherit; }
        .la-logout:hover { background: rgba(255,255,255,0.05); color: #fff; }

        .la-hero { margin-bottom: 28px; }
        .la-hero-eye { font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase; color: #e52d1d; font-weight: 600; margin: 0 0 10px; }
        .la-hero-title { font-family: 'Cormorant Garamond', Georgia, serif; font-size: clamp(2rem, 3.6vw, 2.8rem); font-weight: 400; letter-spacing: -0.025em; line-height: 1.05; margin: 0; }
        .la-hero-title em { font-style: italic; background: linear-gradient(135deg, #e52d1d, #a78bfa); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }

        /* Stats grid */
        .la-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 28px; }
        .la-stat { padding: 18px 20px; background: rgba(20,20,22,0.7); border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; backdrop-filter: blur(20px); }
        .la-stat-label { font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(255,255,255,0.5); font-weight: 700; margin: 0 0 8px; }
        .la-stat-value { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 2.2rem; font-weight: 400; line-height: 1; color: #fff; }
        .la-stat-sub { font-size: 11.5px; color: rgba(255,255,255,0.45); margin-top: 5px; }
        .la-stat.warn { border-color: rgba(245,158,11,0.3); background: linear-gradient(180deg, rgba(245,158,11,0.06), rgba(20,20,22,0.7)); }
        .la-stat.success { border-color: rgba(34,197,94,0.25); background: linear-gradient(180deg, rgba(34,197,94,0.06), rgba(20,20,22,0.7)); }
        .la-stat.mrr { border-color: rgba(167,139,250,0.3); background: linear-gradient(180deg, rgba(167,139,250,0.06), rgba(20,20,22,0.7)); }

        /* Section */
        .la-section { margin-bottom: 30px; }
        .la-section-title { font-family: 'Cormorant Garamond', Georgia, serif; font-style: italic; font-size: 22px; font-weight: 400; margin: 0 0 14px; color: #fff; letter-spacing: -0.01em; }
        .la-card { background: rgba(20,20,22,0.7); border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; overflow: hidden; backdrop-filter: blur(20px); }

        /* Tables */
        .la-table-wrap { overflow-x: auto; }
        .la-table { width: 100%; border-collapse: collapse; min-width: 720px; }
        .la-table th { text-align: left; padding: 12px 18px; color: rgba(255,255,255,0.5); font-size: 10px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; border-bottom: 1px solid rgba(255,255,255,0.06); background: rgba(0,0,0,0.2); }
        .la-table td { padding: 12px 18px; color: rgba(255,255,255,0.85); font-size: 13px; border-bottom: 1px solid rgba(255,255,255,0.04); vertical-align: middle; }
        .la-table tr:last-child td { border-bottom: none; }
        .la-table tr:hover td { background: rgba(255,255,255,0.025); }

        .la-pill { display: inline-block; padding: 3px 9px; border-radius: 100px; font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
        .la-pill.basic { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.7); }
        .la-pill.pro { background: rgba(167,139,250,0.18); color: #c4b5fd; }
        .la-pill.premium { background: rgba(229,45,29,0.18); color: #fda4a1; }
        .la-pill.live { background: rgba(34,197,94,0.15); color: #22c55e; }
        .la-pill.building { background: rgba(245,158,11,0.15); color: #f59e0b; }
        .la-pill.error { background: rgba(239,68,68,0.15); color: #f87171; }
        .la-pill.pending { background: rgba(245,158,11,0.15); color: #f59e0b; }
        .la-pill.confirmed { background: rgba(34,197,94,0.15); color: #22c55e; }
        .la-pill.cancelled { background: rgba(239,68,68,0.15); color: #f87171; }

        .la-empty { padding: 40px; text-align: center; color: rgba(255,255,255,0.4); font-size: 13px; }

        .la-actions { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
        .la-btn { padding: 6px 12px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.85); border-radius: 8px; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: inherit; text-decoration: none; display: inline-block; white-space: nowrap; }
        .la-btn:hover:not(:disabled) { background: rgba(255,255,255,0.1); color: #fff; }
        .la-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .la-btn-ai { background: linear-gradient(135deg, rgba(167,139,250,0.2), rgba(167,139,250,0.1)); border-color: rgba(167,139,250,0.35); color: #c4b5fd; }
        .la-btn-ai:hover:not(:disabled) { background: linear-gradient(135deg, rgba(167,139,250,0.3), rgba(167,139,250,0.15)); color: #fff; }
        .la-btn-danger { color: #f87171; border-color: rgba(239,68,68,0.3); }
        .la-btn-danger:hover:not(:disabled) { background: rgba(239,68,68,0.1); }
        .la-btn-success { color: #22c55e; border-color: rgba(34,197,94,0.3); }
        .la-btn-success:hover:not(:disabled) { background: rgba(34,197,94,0.1); }

        .la-tier-sel { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 5px 8px; border-radius: 6px; font-size: 11px; font-family: inherit; cursor: pointer; }
        .la-tier-sel option { background: #1a1a1a; }

        /* Plan breakdown */
        .la-plans { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .la-plan { padding: 22px; background: rgba(20,20,22,0.7); border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; }
        .la-plan-name { font-family: 'Cormorant Garamond', Georgia, serif; font-style: italic; font-size: 1.5rem; font-weight: 400; color: #fff; margin: 0 0 6px; }
        .la-plan-count { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 2.5rem; font-weight: 400; line-height: 1; color: #fff; }
        .la-plan-sub { font-size: 12px; color: rgba(255,255,255,0.5); margin-top: 4px; }

        /* Calculator */
        .la-calc { padding: 22px; background: rgba(20,20,22,0.7); border: 1px solid rgba(167,139,250,0.2); border-radius: 14px; }
        .la-calc-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 14px; }
        .la-calc-label { font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.5); font-weight: 600; margin: 0 0 6px; display: block; }
        .la-calc-sel { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 10px 12px; border-radius: 8px; font-size: 13px; font-family: inherit; cursor: pointer; }
        .la-calc-sel option { background: #1a1a1a; }
        .la-calc-go { padding: 11px 22px; background: linear-gradient(135deg, #a78bfa, #7c3aed); border: 0; color: #fff; border-radius: 100px; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; font-family: inherit; }
        .la-calc-out { margin-top: 16px; padding: 16px 20px; background: rgba(167,139,250,0.08); border: 1px solid rgba(167,139,250,0.25); border-radius: 12px; }
        .la-calc-out-label { font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: #c4b5fd; font-weight: 700; margin: 0 0 6px; }
        .la-calc-out-val { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 2.4rem; font-weight: 400; line-height: 1; color: #fff; }

        /* Reviews moderation */
        .la-review { padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .la-review:last-child { border-bottom: none; }
        .la-review-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; gap: 12px; flex-wrap: wrap; }
        .la-review-meta { font-size: 12px; color: rgba(255,255,255,0.6); }
        .la-review-meta strong { color: #fff; }
        .la-review-stars { color: #f59e0b; font-size: 13px; letter-spacing: 0.1em; }
        .la-review-text { color: rgba(255,255,255,0.85); font-size: 13.5px; line-height: 1.55; margin: 8px 0 12px; }

        /* Feedback toast */
        .la-toast { position: fixed; top: 20px; right: 20px; padding: 12px 18px; border-radius: 12px; font-size: 13px; font-weight: 600; z-index: 100; box-shadow: 0 12px 36px rgba(0,0,0,0.6); }
        .la-toast.ok { background: rgba(34,197,94,0.15); border: 1px solid rgba(34,197,94,0.35); color: #22c55e; }
        .la-toast.err { background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.35); color: #f87171; }

        @media (max-width: 768px) {
          .la-stats, .la-plans, .la-calc-row { grid-template-columns: 1fr 1fr; }
          .la-top { flex-direction: column; align-items: flex-start; gap: 12px; }
        }
        @media (max-width: 480px) {
          .la-stats, .la-plans, .la-calc-row { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="la-bg" />
      <div className="la-wrap">
        <div className="la-top">
          <div className="la-brand">
            <span className="la-brand-name">Lumino</span>
            <span className="la-brand-mark">Control</span>
          </div>
          <div className="la-top-right">
            <span>Loggato come <strong>{currentUserEmail}</strong></span>
            <Link href="/admin" className="la-logout">Il mio admin</Link>
            <form action={logoutAction}><button className="la-logout" type="submit">Esci</button></form>
          </div>
        </div>

        <div className="la-hero">
          <p className="la-hero-eye">✦ control center</p>
          <h1 className="la-hero-title">La <em>tua</em> piattaforma.<br />Tutto sotto controllo.</h1>
        </div>

        {/* DIAGNOSTICA */}
        <DiagnosticsPanel initialData={diagnostics} />

        {/* STATS */}
        <div className="la-stats">
          <div className="la-stat">
            <p className="la-stat-label">Utenti registrati</p>
            <p className="la-stat-value">{stats.totalUsers}</p>
          </div>
          <div className="la-stat success">
            <p className="la-stat-label">Siti pubblicati</p>
            <p className="la-stat-value">{stats.liveSites}</p>
            <p className="la-stat-sub">su {stats.totalSites} totali</p>
          </div>
          <div className="la-stat warn">
            <p className="la-stat-label">In costruzione</p>
            <p className="la-stat-value">{stats.buildingSites}</p>
            {stats.errorSites > 0 && <p className="la-stat-sub" style={{ color: '#f87171' }}>+{stats.errorSites} in errore</p>}
          </div>
          <div className="la-stat">
            <p className="la-stat-label">Prenotazioni 30gg</p>
            <p className="la-stat-value">{stats.reservations30d}</p>
          </div>
          <div className="la-stat warn">
            <p className="la-stat-label">Recensioni da approvare</p>
            <p className="la-stat-value">{stats.pendingReviewsCount}</p>
          </div>
          <div className="la-stat mrr">
            <p className="la-stat-label">Incasso siti live (one-shot)</p>
            <p className="la-stat-value">€{stats.mrrPotential.toLocaleString('it-IT')}</p>
            <p className="la-stat-sub">somma prezzi base dei piani live</p>
          </div>
          <div className="la-stat">
            <p className="la-stat-label">Piano più scelto</p>
            <p className="la-stat-value" style={{ fontFamily: 'Inter', fontSize: '1.4rem', fontWeight: 600, textTransform: 'capitalize' }}>
              {topPlan(stats.planCount) || '—'}
            </p>
          </div>
          <div className="la-stat">
            <p className="la-stat-label">Distribuzione</p>
            <p className="la-stat-value" style={{ fontFamily: 'Inter', fontSize: '0.95rem', fontWeight: 600 }}>
              <span style={{ color: 'rgba(255,255,255,0.7)' }}>B {stats.planCount.basic}</span>{' · '}
              <span style={{ color: '#c4b5fd' }}>P {stats.planCount.pro}</span>{' · '}
              <span style={{ color: '#fda4a1' }}>★ {stats.planCount.premium}</span>
            </p>
          </div>
        </div>

        {/* PRICE CALCULATOR */}
        <div className="la-section">
          <h2 className="la-section-title">Calcolatore prezzo dinamico</h2>
          <div className="la-calc">
            <div className="la-calc-row">
              <div>
                <label className="la-calc-label">Piano</label>
                <select className="la-calc-sel" value={calcPlan} onChange={e => setCalcPlan(e.target.value as any)}>
                  {pricingMeta.plans.map(p => <option key={p.key} value={p.key}>{p.name} (€{p.priceFrom}–{p.priceMax})</option>)}
                </select>
              </div>
              <div>
                <label className="la-calc-label">Zona</label>
                <select className="la-calc-sel" value={calcZone} onChange={e => setCalcZone(e.target.value)}>
                  {pricingMeta.zones.map(z => <option key={z} value={z}>{zoneLabel(z)}</option>)}
                </select>
              </div>
              <div>
                <label className="la-calc-label">Livello ristorante</label>
                <select className="la-calc-sel" value={calcLevel} onChange={e => setCalcLevel(e.target.value)}>
                  {pricingMeta.levels.map(l => <option key={l} value={l}>{levelLabel(l)}</option>)}
                </select>
              </div>
            </div>
            <button className="la-calc-go" onClick={doCalc} disabled={pending}>Calcola prezzo</button>
            {calcPrice !== null && (
              <div className="la-calc-out">
                <p className="la-calc-out-label">Prezzo da proporre al cliente</p>
                <p className="la-calc-out-val">€{calcPrice.toLocaleString('it-IT')}</p>
              </div>
            )}
          </div>
        </div>

        {/* PLAN BREAKDOWN */}
        <div className="la-section">
          <h2 className="la-section-title">Distribuzione piani</h2>
          <div className="la-plans">
            <div className="la-plan">
              <p className="la-plan-name">Basic</p>
              <p className="la-plan-count">{stats.planCount.basic}</p>
              <p className="la-plan-sub">€{stats.planCount.basic * (pricingMeta.plans[0]?.priceFrom || 190)} (min)</p>
            </div>
            <div className="la-plan" style={{ borderColor: 'rgba(167,139,250,0.3)' }}>
              <p className="la-plan-name" style={{ color: '#c4b5fd' }}>Pro</p>
              <p className="la-plan-count">{stats.planCount.pro}</p>
              <p className="la-plan-sub">€{stats.planCount.pro * (pricingMeta.plans[1]?.priceFrom || 390)} (min)</p>
            </div>
            <div className="la-plan" style={{ borderColor: 'rgba(229,45,29,0.3)' }}>
              <p className="la-plan-name" style={{ color: '#fda4a1' }}>Premium</p>
              <p className="la-plan-count">{stats.planCount.premium}</p>
              <p className="la-plan-sub">€{stats.planCount.premium * (pricingMeta.plans[2]?.priceFrom || 590)} (min)</p>
            </div>
          </div>
        </div>

        {/* PENDING REVIEWS */}
        {pendingReviews.length > 0 && (
          <div className="la-section">
            <h2 className="la-section-title">Recensioni da approvare ({pendingReviews.length})</h2>
            <div className="la-card">
              {pendingReviews.map(pr => (
                <div className="la-review" key={`${pr.siteId}-${pr.index}`}>
                  <div className="la-review-top">
                    <div className="la-review-meta">
                      <strong>{pr.review.author}</strong> su <strong>{pr.restaurantName}</strong> · {new Date(pr.review.date).toLocaleDateString('it-IT')}
                    </div>
                    <span className="la-review-stars">{'★'.repeat(pr.review.rating)}{'☆'.repeat(5 - pr.review.rating)}</span>
                  </div>
                  <p className="la-review-text">"{pr.review.text}"</p>
                  <div className="la-actions">
                    <button className="la-btn la-btn-success" disabled={pending} onClick={() => doApproveReview(pr.siteId, pr.index)}>✓ Approva e pubblica</button>
                    <button className="la-btn la-btn-danger" disabled={pending} onClick={() => doDeleteReview(pr.siteId, pr.index)}>Elimina</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STATO ACCOUNT OUTREACH */}
        <div className="la-section">
          <h2 className="la-section-title">📧 Stato account outreach</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12.5, margin: '0 0 14px' }}>
            4 sender Zoho @bylumino.com. Il warm-up è automatico (vedi cron warmup-tick). Pausa manuale se vedi anomalie.
          </p>
          <div className="la-card">
            <div className="la-table-wrap">
              <table className="la-table">
                <thead>
                  <tr>
                    <th>Account</th>
                    <th style={{ textAlign: 'center' }}>Stato</th>
                    <th style={{ textAlign: 'center' }}>Warmup</th>
                    <th style={{ textAlign: 'center' }}>Cap giorno</th>
                    <th style={{ textAlign: 'center' }}>Delivery 7gg</th>
                    <th style={{ textAlign: 'right' }}>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {outreachAccounts.length === 0 && <tr><td colSpan={6} className="la-empty">Nessun account outreach configurato (vedi migrazione 0014).</td></tr>}
                  {outreachAccounts.map(a => {
                    const isPaused = a.status === 'paused'
                    const isActive = a.status === 'active'
                    const dr = a.delivery_rate != null ? Math.round(a.delivery_rate * 1000) / 10 : null
                    return (
                      <tr key={a.id}>
                        <td>
                          <strong style={{ color: '#fff' }}>{a.sender_name || a.email}</strong><br/>
                          <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>{a.email}</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`la-pill ${a.status === 'paused' ? 'error' : a.status === 'active' ? 'live' : a.status === 'burned' ? 'error' : 'building'}`}>{a.status}</span>
                          {a.failure_count > 0 && <div style={{ fontSize: 10, color: '#f87171', marginTop: 4 }}>{a.failure_count} fallimenti</div>}
                        </td>
                        <td style={{ textAlign: 'center', fontSize: 12.5 }}>
                          {isActive ? `Attivo da ${Math.max(0, a.warmup_day - 22)}gg` : `Giorno ${a.warmup_day}/22`}
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 600 }}>{a.daily_cap}</td>
                        <td style={{ textAlign: 'center' }}>
                          {dr != null ? (
                            <strong style={{ color: dr >= 95 ? '#22c55e' : dr >= 85 ? '#f59e0b' : '#f87171' }}>{dr}%</strong>
                          ) : (
                            <span style={{ color: 'rgba(255,255,255,0.3)' }}>—</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className={`la-btn ${isPaused ? 'la-btn-success' : 'la-btn-danger'}`}
                            disabled={pending}
                            onClick={() => doToggleAccount(a.id, isPaused ? 'resume' : 'pause')}
                          >
                            {isPaused ? '▶ Riprendi' : '⏸ Pausa'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* PRENOTAZIONI — solo aggregati, niente dati personali */}
        <div className="la-section">
          <h2 className="la-section-title">Prenotazioni ultimi 30 giorni — aggregati</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12.5, margin: '0 0 14px' }}>
            Lumino non vede mai nome, telefono o email del cliente. Solo conteggi per ristorante. I dati personali stanno solo nel pannello del ristoratore.
          </p>
          <div className="la-card">
            <div className="la-table-wrap">
              <table className="la-table">
                <thead>
                  <tr>
                    <th>Ristorante</th>
                    <th style={{ textAlign: 'center' }}>Totali</th>
                    <th style={{ textAlign: 'center' }}>In attesa</th>
                    <th style={{ textAlign: 'center' }}>Confermate</th>
                    <th style={{ textAlign: 'center' }}>Annullate</th>
                    <th style={{ textAlign: 'right' }}>Tasso conferma</th>
                  </tr>
                </thead>
                <tbody>
                  {reservationsAggregate.length === 0 && <tr><td colSpan={6} className="la-empty">Nessuna prenotazione negli ultimi 30 giorni.</td></tr>}
                  {reservationsAggregate.map(a => (
                    <tr key={a.site_id}>
                      <td>
                        <strong style={{ color: '#fff' }}>{a.restaurantName}</strong><br/>
                        <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>{a.siteSlug}</span>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{a.total}</td>
                      <td style={{ textAlign: 'center', color: '#f59e0b' }}>{a.pending}</td>
                      <td style={{ textAlign: 'center', color: '#22c55e' }}>{a.confirmed}</td>
                      <td style={{ textAlign: 'center', color: '#f87171' }}>{a.cancelled}</td>
                      <td style={{ textAlign: 'right' }}>
                        <strong style={{ color: a.confirmedPct >= 80 ? '#22c55e' : a.confirmedPct >= 50 ? '#f59e0b' : '#f87171' }}>
                          {a.confirmedPct}%
                        </strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* USERS */}
        <div className="la-section">
          <h2 className="la-section-title">Utenti registrati</h2>
          <div className="la-card">
            <div className="la-table-wrap">
              <table className="la-table">
                <thead>
                  <tr>
                    <th>Email</th><th>Ristorante</th><th>Piano</th><th>Stato sito</th><th>Iscritto</th><th>Ultimo accesso</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 && <tr><td colSpan={6} className="la-empty">Ancora nessun utente.</td></tr>}
                  {users.slice(0, 80).map(u => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 600, color: '#fff' }}>{u.email}</td>
                      <td>{u.restaurant_name || u.site?.slug || '—'}</td>
                      <td>{u.site ? <span className={`la-pill ${u.site.tier}`}>{u.site.tier}</span> : <span style={{ color: 'rgba(255,255,255,0.3)' }}>—</span>}</td>
                      <td>{u.site ? <span className={`la-pill ${u.site.status}`}>{u.site.status}</span> : '—'}</td>
                      <td style={{ color: 'rgba(255,255,255,0.55)' }}>{new Date(u.created_at).toLocaleDateString('it-IT')}</td>
                      <td style={{ color: 'rgba(255,255,255,0.55)' }}>{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString('it-IT') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ALL SITES with actions */}
        <div className="la-section">
          <h2 className="la-section-title">Tutti i siti — azioni rapide</h2>
          <div className="la-card">
            <div className="la-table-wrap">
              <table className="la-table">
                <thead>
                  <tr>
                    <th>Ristorante</th><th>Slug</th><th>Piano</th><th>Stato</th><th>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {sites.length === 0 && <tr><td colSpan={5} className="la-empty">Nessun sito.</td></tr>}
                  {sites.map(s => (
                    <tr key={s.id}>
                      <td>
                        <strong style={{ color: '#fff' }}>{s.restaurant_name}</strong>{s.city ? <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}> · {s.city}</span> : null}<br/>
                        {s.client_email && <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)' }}>{s.client_email}</span>}
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{s.slug}</td>
                      <td>
                        <select className="la-tier-sel" value={s.tier} disabled={pending} onChange={e => doSetTier(s.id, e.target.value as any)}>
                          <option value="basic">basic</option>
                          <option value="pro">pro</option>
                          <option value="premium">premium</option>
                        </select>
                      </td>
                      <td><span className={`la-pill ${s.status}`}>{s.status}</span></td>
                      <td>
                        <div className="la-actions">
                          {s.status === 'live' && <a className="la-btn" href={`/sites/${s.slug}`} target="_blank" rel="noopener noreferrer">Apri ↗</a>}
                          <button className="la-btn la-btn-ai" disabled={pending} onClick={() => doGenerate(s.id, s.restaurant_name)}>✨ AI</button>
                          {s.status === 'live'
                            ? <button className="la-btn la-btn-danger" disabled={pending} onClick={() => doSetStatus(s.id, 'building')}>Nascondi</button>
                            : <button className="la-btn la-btn-success" disabled={pending} onClick={() => doSetStatus(s.id, 'live')}>Pubblica</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      {feedback && (
        <div className={`la-toast ${feedback.ok ? 'ok' : 'err'}`}>{feedback.msg}</div>
      )}
    </div>
  )
}

function topPlan(c: { basic: number; pro: number; premium: number }): string {
  const arr: Array<[string, number]> = [['Basic', c.basic], ['Pro', c.pro], ['Premium', c.premium]]
  arr.sort((a, b) => b[1] - a[1])
  return arr[0][1] > 0 ? arr[0][0] : ''
}

function zoneLabel(k: string): string {
  return ({
    milano: 'Milano (×1.4)',
    romaCentro: 'Roma centro (×1.35)',
    grandeCitta: 'Grande città (×1.2)',
    cittaMedia: 'Città media (×1.05)',
    provincia: 'Provincia (×0.95)',
    paeseRurale: 'Paese / rurale (×0.85)',
  } as any)[k] || k
}

function levelLabel(k: string): string {
  return ({
    cinqueStelle: '5 stelle (×1.3)',
    altaFascia: 'Alta fascia (×1.2)',
    mediaFascia: 'Media fascia (×1.0)',
    trattoria: 'Trattoria (×0.95)',
    nuovoApertura: 'Nuova apertura (×0.9)',
  } as any)[k] || k
}
