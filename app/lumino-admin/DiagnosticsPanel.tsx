'use client'

import { useState, useEffect, useTransition } from 'react'
import { adminGetDiagnostics } from './actions'
import type { EmailMetrics, StrategyPerformance, WhatsAppMetrics, Anomaly, Win } from '@/lib/diagnostics/daily'

export interface DiagnosticsData {
  email: EmailMetrics
  strategies: StrategyPerformance[]
  whatsapp: WhatsAppMetrics
  anomalies: Anomaly[]
  wins: Win[]
  aiSummary: string
  generatedAt: string
}

interface Props {
  initialData: DiagnosticsData | null
}

function pct(rate: number) {
  return `${Math.round(rate * 100)}%`
}

function fmtTime(isoStr: string) {
  return new Date(isoStr).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
}

function fmtDate(isoStr: string) {
  return new Date(isoStr).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
}

function statusColor(status: StrategyPerformance['status']): string {
  if (status === 'underperforming') return '#f59e0b'
  if (status === 'paused') return 'rgba(255,255,255,0.35)'
  return '#22c55e'
}

function severityIcon(severity: Anomaly['severity']): string {
  if (severity === 'critical') return '🔴'
  if (severity === 'warning') return '🟡'
  return '🔵'
}

const AUTO_REFRESH_MS = 5 * 60 * 1000

export function DiagnosticsPanel({ initialData }: Props) {
  const [data, setData] = useState<DiagnosticsData | null>(initialData)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function refresh() {
    setError(null)
    startTransition(async () => {
      const res = await adminGetDiagnostics()
      if (res.ok && res.data) {
        setData(res.data as DiagnosticsData)
      } else {
        setError((res as any).error || 'Errore nel refresh')
      }
    })
  }

  useEffect(() => {
    const id = setInterval(refresh, AUTO_REFRESH_MS)
    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const today = data ? fmtDate(data.generatedAt) : fmtDate(new Date().toISOString())
  const lastUpdate = data ? fmtTime(data.generatedAt) : '—'

  const sentPct = data
    ? data.email.sent_target > 0
      ? Math.round((data.email.sent_today / data.email.sent_target) * 100)
      : 0
    : 0
  const sentEmoji = sentPct >= 90 ? '✅' : sentPct >= 60 ? '⚠️' : '🔴'

  return (
    <section className="dp-root">
      <style>{`
        .dp-root { margin-bottom: 32px; }

        .dp-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 18px; gap: 12px; flex-wrap: wrap;
        }
        .dp-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(1.3rem, 2.5vw, 1.75rem);
          font-weight: 400; letter-spacing: -0.02em; margin: 0; color: #fff;
        }
        .dp-title span { font-style: italic; color: rgba(255,255,255,0.55); font-size: 0.75em; margin-left: 10px; font-family: 'Inter', sans-serif; letter-spacing: 0; }
        .dp-refresh {
          padding: 8px 16px; background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12); color: rgba(255,255,255,0.85);
          border-radius: 100px; font-size: 12px; font-weight: 600; cursor: pointer;
          font-family: inherit; transition: all 0.2s; white-space: nowrap;
        }
        .dp-refresh:hover:not(:disabled) { background: rgba(255,255,255,0.11); color: #fff; }
        .dp-refresh:disabled { opacity: 0.5; cursor: not-allowed; }

        .dp-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }
        @media (max-width: 900px) { .dp-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 560px) { .dp-grid { grid-template-columns: 1fr; } }

        .dp-card {
          background: rgba(20,20,22,0.75); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px; padding: 20px 22px; backdrop-filter: blur(20px);
        }
        .dp-card.full { grid-column: 1 / -1; }
        .dp-card-head {
          font-size: 11px; font-weight: 700; letter-spacing: 0.2em;
          text-transform: uppercase; color: rgba(255,255,255,0.5);
          margin: 0 0 14px; display: flex; align-items: center; gap: 7px;
        }
        .dp-row { display: flex; justify-content: space-between; align-items: baseline; padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
        .dp-row:last-child { border-bottom: none; }
        .dp-label { font-size: 13px; color: rgba(255,255,255,0.6); }
        .dp-value { font-size: 13px; color: #fff; font-weight: 600; text-align: right; }

        .dp-strat { padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
        .dp-strat:last-child { border-bottom: none; }
        .dp-strat-name { font-size: 12px; color: rgba(255,255,255,0.55); margin-bottom: 4px; line-height: 1.35; }
        .dp-strat-stats { display: flex; gap: 14px; font-size: 12px; color: #fff; flex-wrap: wrap; }
        .dp-strat-stat { display: flex; align-items: center; gap: 4px; }

        .dp-anomaly { padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
        .dp-anomaly:last-child { border-bottom: none; }
        .dp-anomaly-msg { font-size: 13px; color: #fff; margin-bottom: 3px; }
        .dp-anomaly-sug { font-size: 11.5px; color: rgba(255,255,255,0.5); }

        .dp-win { padding: 5px 0; display: flex; gap: 10px; font-size: 13px; border-bottom: 1px solid rgba(255,255,255,0.04); }
        .dp-win:last-child { border-bottom: none; }
        .dp-win-label { color: rgba(255,255,255,0.6); min-width: 0; flex: 0 0 auto; max-width: 55%; }
        .dp-win-val { color: #c4b5fd; font-weight: 600; }

        .dp-ai-text {
          font-size: 14px; line-height: 1.7; color: rgba(255,255,255,0.88);
          font-style: italic;
        }

        .dp-empty { font-size: 13px; color: rgba(255,255,255,0.4); text-align: center; padding: 10px 0; }
        .dp-footer {
          margin-top: 10px; font-size: 11px; color: rgba(255,255,255,0.3);
          text-align: right;
        }
        .dp-error { font-size: 12px; color: #f87171; margin-top: 8px; }

        .dp-card.warn-border { border-color: rgba(245,158,11,0.3); }
        .dp-card.crit-border { border-color: rgba(239,68,68,0.3); }
        .dp-card.ok-border  { border-color: rgba(34,197,94,0.2); }
        .dp-card.ai-border  { border-color: rgba(167,139,250,0.25); background: linear-gradient(160deg, rgba(167,139,250,0.05), rgba(20,20,22,0.75)); }
      `}</style>

      {/* Header */}
      <div className="dp-header">
        <h2 className="dp-title">
          📈 Diagnostica oggi
          <span>{today}</span>
        </h2>
        <button className="dp-refresh" onClick={refresh} disabled={isPending}>
          {isPending ? 'Aggiornamento…' : '↻ Aggiorna'}
        </button>
      </div>

      {error && <p className="dp-error">⚠ {error}</p>}

      {!data ? (
        <p className="dp-empty">Dati non disponibili</p>
      ) : (
        <>
          <div className="dp-grid">

            {/* Card 1: Email */}
            <div className={`dp-card ${sentPct < 60 ? 'crit-border' : sentPct < 90 ? 'warn-border' : 'ok-border'}`}>
              <p className="dp-card-head">📤 Email oggi</p>
              <div className="dp-row">
                <span className="dp-label">Mandate</span>
                <span className="dp-value">{data.email.sent_today} / {data.email.sent_target} {sentEmoji}</span>
              </div>
              <div className="dp-row">
                <span className="dp-label">Aperte</span>
                <span className="dp-value">{data.email.opened_today} ({pct(data.email.opened_rate)})</span>
              </div>
              <div className="dp-row">
                <span className="dp-label">Risposte</span>
                <span className="dp-value">{data.email.replied_today} ({pct(data.email.replied_rate)})</span>
              </div>
              <div className="dp-row">
                <span className="dp-label">Spam stimate</span>
                <span className="dp-value" style={{ color: data.email.estimated_spam > 5 ? '#f59e0b' : 'inherit' }}>
                  ~{data.email.estimated_spam}
                </span>
              </div>
            </div>

            {/* Card 2: WhatsApp */}
            <div className={`dp-card ${data.whatsapp.avg_response_time > 120 ? 'crit-border' : ''}`}>
              <p className="dp-card-head">💬 WhatsApp Team Lumino</p>
              <div className="dp-row">
                <span className="dp-label">Conversazioni attive</span>
                <span className="dp-value">{data.whatsapp.active_conversations}</span>
              </div>
              {Object.keys(data.whatsapp.stages_breakdown).length > 0 && (
                <div className="dp-row">
                  <span className="dp-label">Stage</span>
                  <span className="dp-value" style={{ fontSize: 11 }}>
                    {Object.entries(data.whatsapp.stages_breakdown)
                      .map(([stage, count]) => `${stage} ${count}`)
                      .join(' · ')}
                  </span>
                </div>
              )}
              <div className="dp-row">
                <span className="dp-label">Form link mandati</span>
                <span className="dp-value">{data.whatsapp.form_links_sent_today}</span>
              </div>
              <div className="dp-row">
                <span className="dp-label">Risposta media</span>
                <span className="dp-value" style={{ color: data.whatsapp.avg_response_time > 120 ? '#f87171' : data.whatsapp.avg_response_time > 0 ? '#22c55e' : 'inherit' }}>
                  {data.whatsapp.avg_response_time > 0 ? `${data.whatsapp.avg_response_time}s` : '—'}
                </span>
              </div>
            </div>

            {/* Card 3: Anomalie */}
            <div className={`dp-card ${data.anomalies.some(a => a.severity === 'critical') ? 'crit-border' : data.anomalies.some(a => a.severity === 'warning') ? 'warn-border' : ''}`}>
              <p className="dp-card-head">🚨 Anomalie</p>
              {data.anomalies.length === 0 ? (
                <p className="dp-empty">✅ Nessuna anomalia rilevata</p>
              ) : (
                data.anomalies.map((a, i) => (
                  <div key={i} className="dp-anomaly">
                    <p className="dp-anomaly-msg">{severityIcon(a.severity)} {a.message}</p>
                    <p className="dp-anomaly-sug">→ {a.suggestion}</p>
                  </div>
                ))
              )}
            </div>

            {/* Card 4: Strategie — full width */}
            <div className="dp-card full">
              <p className="dp-card-head">🤖 Strategie usate oggi</p>
              {data.strategies.length === 0 ? (
                <p className="dp-empty">Nessuna strategia attiva</p>
              ) : (
                data.strategies.map((s) => {
                  const isBest = data.strategies.reduce((best, cur) =>
                    (cur.replies_today > best.replies_today ? cur : best), data.strategies[0]
                  ).strategy_slot === s.strategy_slot && s.replies_today > 0
                  return (
                    <div key={s.strategy_slot} className="dp-strat">
                      <p className="dp-strat-name">
                        {s.status === 'paused' ? '🚫' : isBest ? '⭐' : '·'}{' '}
                        <strong style={{ color: '#fff' }}>Strategia {s.strategy_slot}</strong>{' '}
                        — {s.strategy_name}
                        {' '}
                        <span style={{ color: statusColor(s.status), fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                          {s.status}
                        </span>
                      </p>
                      <div className="dp-strat-stats">
                        <span className="dp-strat-stat">📤 {s.sends_today} invii</span>
                        <span className="dp-strat-stat">👁 {s.opens_today} aperte</span>
                        <span className="dp-strat-stat" style={{ color: s.replies_today > 0 ? '#22c55e' : 'inherit' }}>
                          💬 {s.replies_today} risposte
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Card 5: Wins */}
            <div className="dp-card ok-border">
              <p className="dp-card-head">✅ Cosa sta funzionando</p>
              {data.wins.length === 0 ? (
                <p className="dp-empty">Dati insufficienti per questa settimana</p>
              ) : (
                data.wins.map((w, i) => (
                  <div key={i} className="dp-win">
                    <span className="dp-win-label">{w.label}</span>
                    <span className="dp-win-val">{w.value}</span>
                  </div>
                ))
              )}
            </div>

            {/* Card 6: AI Summary — full width */}
            <div className="dp-card ai-border full">
              <p className="dp-card-head">🧠 Riassunto AI</p>
              <p className="dp-ai-text">{data.aiSummary}</p>
            </div>

          </div>

          <p className="dp-footer">Ultimo aggiornamento: {lastUpdate} · Auto-refresh ogni 5 min</p>
        </>
      )}
    </section>
  )
}
