'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { confirmReservation, cancelReservation, type ReservationRow } from '../actions/reservations'

export type { ReservationRow }

type Tab = 'pending' | 'confirmed' | 'cancelled' | 'all'

interface Props {
  initial: ReservationRow[]
  siteSlug: string
  backPath?: string
  confirmAction?: (id: string, note?: string) => Promise<{ ok: boolean; error?: string }>
  cancelAction?: (id: string, note?: string) => Promise<{ ok: boolean; error?: string }>
}

export function ReservationsManager({ initial, siteSlug, backPath, confirmAction, cancelAction }: Props) {
  const [items, setItems] = useState(initial)
  const [tab, setTab] = useState<Tab>('pending')
  const [pending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ ok?: boolean; msg?: string } | null>(null)
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({})

  const filtered = useMemo(() => {
    if (tab === 'all') return items
    return items.filter(r => r.status === tab)
  }, [items, tab])

  const counts = useMemo(() => ({
    pending: items.filter(r => r.status === 'pending').length,
    confirmed: items.filter(r => r.status === 'confirmed').length,
    cancelled: items.filter(r => r.status === 'cancelled').length,
    all: items.length,
  }), [items])

  function notify(ok: boolean, msg: string) {
    setFeedback({ ok, msg })
    setTimeout(() => setFeedback(null), 3500)
  }

  function handleConfirm(id: string) {
    const note = (noteDraft[id] || '').trim()
    startTransition(async () => {
      const r = await (confirmAction ? confirmAction(id, note || undefined) : confirmReservation(id, note || undefined))
      if (r.ok) {
        setItems(prev => prev.map(x => x.id === id ? { ...x, status: 'confirmed', owner_note: note || null } : x))
        notify(true, '✓ Prenotazione confermata. Email inviata al cliente.')
      } else {
        notify(false, r.error || 'Errore')
      }
    })
  }

  function handleCancel(id: string) {
    if (!confirm('Annullare questa prenotazione? Il cliente riceverà una mail di scuse.')) return
    const note = (noteDraft[id] || '').trim()
    startTransition(async () => {
      const r = await (cancelAction ? cancelAction(id, note || undefined) : cancelReservation(id, note || undefined))
      if (r.ok) {
        setItems(prev => prev.map(x => x.id === id ? { ...x, status: 'cancelled', owner_note: note || null } : x))
        notify(true, '✓ Annullata. Email di scuse inviata.')
      } else {
        notify(false, r.error || 'Errore')
      }
    })
  }

  return (
    <div className="re-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;1,400&family=Inter:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; background: #050505; }
        .re-root { min-height: 100vh; background: #050505; color: #fff; font-family: 'Inter', system-ui, sans-serif; padding-bottom: 60px; }
        .re-top { padding:16px 22px; border-bottom:1px solid rgba(255,255,255,0.06); display:flex; align-items:center; justify-content:space-between; background:rgba(10,10,10,0.7); backdrop-filter:blur(20px); position:sticky; top:0; z-index:10; gap:12px; }
        .re-back { color:rgba(255,255,255,0.6); text-decoration:none; font-size:13px; }
        .re-back:hover { color:#fff; }
        .re-bartitle { font-family:'Cormorant Garamond', Georgia, serif; font-size:22px; font-style:italic; margin-left: 14px; }
        .re-wrap { max-width: 880px; margin: 0 auto; padding: 24px 18px; }

        .re-tabs { display:flex; gap:6px; flex-wrap:wrap; margin-bottom: 22px; }
        .re-tab { padding:10px 16px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); color: rgba(255,255,255,0.7); border-radius:9999px; font-family: inherit; font-size: 13px; cursor:pointer; transition: all 0.2s; min-height: 40px; }
        .re-tab:hover { color:#fff; background:rgba(255,255,255,0.08); }
        .re-tab.on { background:#fff; color:#0a0a0a; border-color:#fff; font-weight: 600; }
        .re-tab-badge { display:inline-block; margin-left: 6px; font-size: 11px; padding: 2px 7px; border-radius: 9999px; background: rgba(0,0,0,0.18); }
        .re-tab.on .re-tab-badge { background: rgba(0,0,0,0.1); color: #0a0a0a; }

        .re-card { background:rgba(20,20,22,0.6); border:1px solid rgba(255,255,255,0.06); border-radius:14px; padding: 18px 18px 14px; margin-bottom: 12px; }
        .re-card-status { display:inline-block; padding:3px 10px; border-radius:9999px; font-size:10.5px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; margin-bottom: 12px; }
        .re-status-pending { background: rgba(245,158,11,0.15); color:#f59e0b; }
        .re-status-confirmed { background: rgba(34,197,94,0.15); color:#22c55e; }
        .re-status-cancelled { background: rgba(239,68,68,0.15); color:#f87171; }
        .re-card-row { display:flex; align-items:flex-start; justify-content:space-between; gap: 14px; flex-wrap: wrap; }
        .re-guest { font-size: 18px; font-weight: 600; color: #fff; margin: 0; }
        .re-meta { font-size: 13px; color: rgba(255,255,255,0.6); margin: 4px 0 0; }
        .re-when { font-family: 'Cormorant Garamond', Georgia, serif; font-style: italic; font-size: 22px; color: #fff; letter-spacing: -0.01em; }
        .re-people { font-size: 14px; color: rgba(255,255,255,0.7); margin-top: 2px; }
        .re-notes { margin-top:12px; padding: 10px 14px; background: rgba(255,255,255,0.03); border-radius: 10px; font-size: 13.5px; color: rgba(255,255,255,0.8); line-height: 1.5; }
        .re-note-label { font-size: 10.5px; color: rgba(255,255,255,0.45); letter-spacing: 0.16em; text-transform: uppercase; font-weight: 600; margin-bottom: 4px; }

        .re-actions { display:flex; gap:10px; margin-top: 16px; flex-wrap: wrap; }
        .re-btn { padding:13px 22px; border:0; border-radius:9999px; font-family:inherit; font-size:13.5px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; cursor:pointer; transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s; flex: 1; min-height: 50px; min-width: 140px; }
        .re-btn:disabled { opacity:0.5; cursor:not-allowed; }
        .re-btn-confirm { background: linear-gradient(135deg, #22c55e, #16a34a); color: #fff; box-shadow: 0 10px 24px rgba(34,197,94,0.32); }
        .re-btn-confirm:hover:not(:disabled) { transform: translateY(-2px); }
        .re-btn-cancel { background: rgba(239,68,68,0.12); color: #f87171; border:1px solid rgba(239,68,68,0.32); }
        .re-btn-cancel:hover:not(:disabled) { background: rgba(239,68,68,0.18); }

        .re-note-input { width:100%; padding:11px 13px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:10px; color:#fff; font-size:14px; font-family:inherit; margin-top: 12px; resize: vertical; min-height: 56px; }
        .re-note-input:focus { outline:none; border-color: rgba(229,45,29,0.45); }
        .re-note-input::placeholder { color: rgba(255,255,255,0.3); }

        .re-empty { padding: 56px 20px; text-align:center; color: rgba(255,255,255,0.4); font-size: 14px; }

        .re-toast { position: fixed; top: 18px; left: 50%; transform: translateX(-50%); padding: 11px 18px; border-radius: 9999px; font-size: 13px; font-weight: 600; z-index: 100; box-shadow: 0 12px 32px rgba(0,0,0,0.55); }
        .re-toast-ok { background: rgba(34,197,94,0.18); color:#22c55e; border: 1px solid rgba(34,197,94,0.4); }
        .re-toast-err { background: rgba(239,68,68,0.18); color:#f87171; border: 1px solid rgba(239,68,68,0.4); }

        @media (max-width: 540px) {
          .re-btn { flex: 1 1 100%; }
        }
      `}</style>

      <nav className="re-top">
        <div style={{ display:'flex', alignItems:'center' }}>
          <Link href={backPath ?? '/admin'} className="re-back">← Pannello</Link>
          <span className="re-bartitle">Prenotazioni</span>
        </div>
        <Link href={`/sites/${siteSlug}`} target="_blank" className="re-back">Vedi il sito ↗</Link>
      </nav>

      <div className="re-wrap">
        <div className="re-tabs">
          {(['pending', 'confirmed', 'cancelled', 'all'] as Tab[]).map(t => (
            <button key={t} type="button" className={`re-tab ${tab === t ? 'on' : ''}`} onClick={() => setTab(t)}>
              {t === 'pending' ? 'In attesa' : t === 'confirmed' ? 'Confermate' : t === 'cancelled' ? 'Annullate' : 'Tutte'}
              <span className="re-tab-badge">{counts[t]}</span>
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="re-empty">
            {tab === 'pending' ? 'Nessuna prenotazione in attesa.' : tab === 'confirmed' ? 'Nessuna confermata.' : tab === 'cancelled' ? 'Nessuna annullata.' : 'Nessuna prenotazione ancora.'}
          </div>
        )}

        {filtered.map(r => (
          <div key={r.id} className="re-card">
            <span className={`re-card-status re-status-${r.status}`}>
              {r.status === 'pending' ? 'In attesa' : r.status === 'confirmed' ? 'Confermata' : 'Annullata'}
            </span>
            <div className="re-card-row">
              <div>
                <p className="re-guest">{r.guest_name}</p>
                <p className="re-meta">
                  📞 {r.guest_phone}
                  {r.guest_email ? ' · ✉️ ' + r.guest_email : ''}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p className="re-when">{formatDate(r.date)} · {(r.time || '').slice(0, 5)}</p>
                <p className="re-people">{r.guests_count} {r.guests_count === 1 ? 'persona' : 'persone'}</p>
              </div>
            </div>

            {r.notes && (
              <div className="re-notes">
                <p className="re-note-label">Note del cliente</p>
                {r.notes}
              </div>
            )}

            {r.owner_note && r.status !== 'pending' && (
              <div className="re-notes" style={{ background: 'rgba(229,45,29,0.08)' }}>
                <p className="re-note-label">La tua nota</p>
                {r.owner_note}
              </div>
            )}

            {r.status === 'pending' && (
              <>
                <textarea
                  className="re-note-input"
                  placeholder="Nota personale (opzionale): es. tavolo accanto alla finestra"
                  value={noteDraft[r.id] || ''}
                  onChange={e => setNoteDraft(prev => ({ ...prev, [r.id]: e.target.value }))}
                  rows={2}
                  maxLength={400}
                />
                <div className="re-actions">
                  <button type="button" className="re-btn re-btn-confirm" disabled={pending} onClick={() => handleConfirm(r.id)}>
                    ✓ Conferma
                  </button>
                  <button type="button" className="re-btn re-btn-cancel" disabled={pending} onClick={() => handleCancel(r.id)}>
                    ✕ Annulla
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {feedback && (
        <div className={`re-toast ${feedback.ok ? 're-toast-ok' : 're-toast-err'}`}>
          {feedback.msg}
        </div>
      )}
    </div>
  )
}

function formatDate(iso: string): string {
  if (!iso) return ''
  try {
    return new Date(iso + 'T00:00:00').toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })
  } catch {
    return iso
  }
}
