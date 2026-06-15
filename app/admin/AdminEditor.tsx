'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { saveSiteContent, publishSite, unpublishSite, generateMySiteContent } from './actions/site'
import { logoutAction } from '../auth/actions'

interface OpeningHoursDay { open?: string; close?: string; closed?: boolean }
type OpeningHours = Record<string, OpeningHoursDay>

interface Props {
  site: { id: string; slug: string; tier: string; active: boolean; status: string }
  initial: {
    restaurant_name: string
    tagline: string
    description: string
    address: string
    city: string
    phone: string
    email: string
    whatsapp: string
    opening_hours: OpeningHours
  }
  eventsCount: number
}

const DAYS: Array<{ key: string; label: string }> = [
  { key: 'mon', label: 'Lun' },
  { key: 'tue', label: 'Mar' },
  { key: 'wed', label: 'Mer' },
  { key: 'thu', label: 'Gio' },
  { key: 'fri', label: 'Ven' },
  { key: 'sat', label: 'Sab' },
  { key: 'sun', label: 'Dom' },
]

export function AdminEditor({ site, initial, eventsCount }: Props) {
  const [data, setData] = useState(initial)
  const [hours, setHours] = useState<OpeningHours>(initial.opening_hours || {})
  const [pending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ ok?: boolean; msg?: string } | null>(null)
  const [status, setStatus] = useState(site.status)

  const isLive = status === 'live'

  function set<K extends keyof typeof data>(k: K, v: string) {
    setData(prev => ({ ...prev, [k]: v }))
  }
  function setHour(day: string, field: 'open' | 'close' | 'closed', value: string | boolean) {
    setHours(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }))
  }

  function saveAll() {
    setFeedback(null)
    startTransition(async () => {
      const r = await saveSiteContent({
        ...data as any,
        opening_hours: hours,
      })
      if (r.ok) {
        setFeedback({ ok: true, msg: '✓ Salvato' })
        setTimeout(() => setFeedback(null), 3000)
      } else {
        setFeedback({ ok: false, msg: r.error || 'Errore' })
      }
    })
  }

  function togglePublish() {
    setFeedback(null)
    startTransition(async () => {
      const r = isLive ? await unpublishSite() : await publishSite()
      if (r.ok) {
        setStatus(isLive ? 'building' : 'live')
        setFeedback({ ok: true, msg: isLive ? '✓ Sito nascosto' : '✓ Sito pubblicato' })
        setTimeout(() => setFeedback(null), 3000)
      } else {
        setFeedback({ ok: false, msg: r.error || 'Errore' })
      }
    })
  }

  function generateAI() {
    if (!confirm('Generare il contenuto del sito con AI? Sovrascrive testi, foto e menu attuali.')) return
    setFeedback(null)
    startTransition(async () => {
      const r = await generateMySiteContent()
      if (r.ok) {
        setStatus('live')
        setFeedback({ ok: true, msg: '✓ Sito generato. Ricarica la pagina per vedere.' })
        setTimeout(() => window.location.reload(), 1500)
      } else {
        setFeedback({ ok: false, msg: r.error || 'Generazione fallita' })
      }
    })
  }

  const publicUrl = `/sites/${site.slug}`

  return (
    <div className="ae-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=Inter:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; background: #050505; }
        .ae-root {
          min-height: 100vh; background: #050505; color: #fff;
          font-family: 'Inter', system-ui, sans-serif; padding-bottom: 80px;
        }
        .ae-top {
          padding: 18px 24px; border-bottom: 1px solid rgba(255,255,255,0.06);
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          background: rgba(10,10,10,0.7); backdrop-filter: blur(20px);
          position: sticky; top: 0; z-index: 10;
        }
        .ae-logo {
          display: inline-flex; align-items: baseline; gap: 4px;
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 24px; font-weight: 500; color: #fff; text-decoration: none; line-height: 1;
        }
        .ae-logo-dot { width: 6px; height: 6px; border-radius: 50%; background: #e52d1d; box-shadow: 0 0 10px #e52d1d; align-self: flex-end; margin-bottom: 5px; }
        .ae-top-right { display: flex; align-items: center; gap: 14px; }
        .ae-logout {
          background: transparent; border: 1px solid rgba(255,255,255,0.15);
          color: rgba(255,255,255,0.7); padding: 7px 14px; border-radius: 100px;
          font-size: 12px; cursor: pointer; transition: all 0.2s;
        }
        .ae-logout:hover { background: rgba(255,255,255,0.05); color: #fff; }

        .ae-wrap { max-width: 920px; margin: 0 auto; padding: 28px 22px; }

        /* Status card */
        .ae-status {
          padding: 22px 24px;
          background: ${isLive ? 'linear-gradient(180deg, rgba(34,197,94,0.10), rgba(20,20,22,0.7))' : 'linear-gradient(180deg, rgba(229,45,29,0.08), rgba(20,20,22,0.7))'};
          border: 1px solid ${isLive ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)'};
          border-radius: 18px; margin-bottom: 22px;
          display: flex; align-items: center; justify-content: space-between; gap: 18px; flex-wrap: wrap;
        }
        .ae-status-left { flex: 1; min-width: 220px; }
        .ae-status-pill {
          display: inline-flex; align-items: center; gap: 7px;
          font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; font-weight: 700;
          color: ${isLive ? '#22c55e' : 'rgba(255,255,255,0.55)'};
        }
        .ae-status-dot { width: 8px; height: 8px; border-radius: 50%; background: ${isLive ? '#22c55e' : '#888'}; box-shadow: 0 0 12px ${isLive ? '#22c55e' : 'transparent'}; }
        .ae-status-title {
          font-family: 'Cormorant Garamond', Georgia, serif; font-style: italic;
          font-size: 26px; font-weight: 400; margin: 6px 0 4px; letter-spacing: -0.01em;
        }
        .ae-status-meta { color: rgba(255,255,255,0.5); font-size: 13px; line-height: 1.5; }
        .ae-status-meta code { background: rgba(255,255,255,0.05); padding: 2px 7px; border-radius: 5px; font-size: 12px; }
        .ae-status-actions { display: flex; gap: 10px; flex-wrap: wrap; }

        .ae-btn {
          padding: 11px 20px; border: 0; border-radius: 100px;
          font-family: inherit; font-size: 12px; font-weight: 700;
          letter-spacing: 0.08em; text-transform: uppercase;
          cursor: pointer; transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
          text-decoration: none; display: inline-flex; align-items: center; gap: 6px;
        }
        .ae-btn-primary { background: linear-gradient(135deg, #e52d1d, #c9241a); color: #fff; box-shadow: 0 10px 24px rgba(229,45,29,0.3); }
        .ae-btn-primary:hover:not(:disabled) { transform: translateY(-2px); }
        .ae-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .ae-btn-success { background: linear-gradient(135deg, #22c55e, #16a34a); color: #fff; box-shadow: 0 10px 24px rgba(34,197,94,0.3); }
        .ae-btn-ai { background: linear-gradient(135deg, #a78bfa, #7c3aed); color: #fff; box-shadow: 0 10px 24px rgba(167,139,250,0.3); }
        .ae-btn-ai:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 14px 30px rgba(167,139,250,0.45); }
        .ae-btn-ghost { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.85); border: 1px solid rgba(255,255,255,0.12); }
        .ae-btn-ghost:hover { background: rgba(255,255,255,0.1); color: #fff; }
        .ae-btn-danger { background: rgba(239,68,68,0.1); color: #f87171; border: 1px solid rgba(239,68,68,0.3); }
        .ae-btn-danger:hover { background: rgba(239,68,68,0.2); }

        /* Sections */
        .ae-section {
          background: rgba(20,20,22,0.6);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 18px; padding: 24px 24px;
          margin-bottom: 18px;
        }
        .ae-h2 {
          font-family: 'Cormorant Garamond', Georgia, serif; font-style: italic;
          font-size: 22px; font-weight: 400; margin: 0 0 4px; letter-spacing: -0.015em;
        }
        .ae-h2-sub { color: rgba(255,255,255,0.5); font-size: 13px; margin: 0 0 20px; }

        .ae-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .ae-grid-1 { display: grid; grid-template-columns: 1fr; gap: 14px; }

        .ae-field { display: flex; flex-direction: column; }
        .ae-label { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.6); margin-bottom: 6px; letter-spacing: 0.04em; }
        .ae-input, .ae-textarea {
          width: 100%; padding: 11px 14px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px; color: #fff; font-size: 14px; font-family: inherit;
          outline: none; transition: border-color 0.2s, background 0.2s;
        }
        .ae-input:focus, .ae-textarea:focus { border-color: rgba(229,45,29,0.5); background: rgba(255,255,255,0.06); }
        .ae-textarea { min-height: 90px; resize: vertical; line-height: 1.5; }

        /* Hours */
        .ae-hours-row { display: grid; grid-template-columns: 60px 1fr 1fr 100px; gap: 10px; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
        .ae-hours-row:last-child { border-bottom: 0; }
        .ae-hours-day { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.8); }
        .ae-hours-input {
          width: 100%; padding: 8px 10px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px; color: #fff; font-size: 13px; font-family: inherit;
          outline: none;
        }
        .ae-hours-input:disabled { opacity: 0.3; }
        .ae-hours-closed { display: flex; align-items: center; gap: 6px; font-size: 12px; color: rgba(255,255,255,0.6); cursor: pointer; user-select: none; }
        .ae-hours-closed input { accent-color: #e52d1d; }

        /* Footer save bar */
        .ae-savebar {
          position: fixed; bottom: 18px; left: 50%; transform: translateX(-50%);
          padding: 12px 16px; background: rgba(10,10,10,0.95); backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.1); border-radius: 100px;
          box-shadow: 0 16px 48px rgba(0,0,0,0.6);
          display: flex; align-items: center; gap: 14px; z-index: 50;
        }
        .ae-feedback {
          font-size: 13px; font-weight: 600;
          padding: 6px 14px; border-radius: 100px;
        }
        .ae-feedback-ok { background: rgba(34,197,94,0.15); color: #22c55e; }
        .ae-feedback-err { background: rgba(239,68,68,0.15); color: #f87171; }

        @media (max-width: 720px) {
          .ae-grid { grid-template-columns: 1fr; }
          .ae-hours-row { grid-template-columns: 50px 1fr 1fr; }
          .ae-hours-closed { grid-column: 1 / -1; padding-top: 2px; }
        }
      `}</style>

      <nav className="ae-top">
        <Link href="/" className="ae-logo">
          <span>Lumino</span>
          <span className="ae-logo-dot" />
        </Link>
        <div className="ae-top-right">
          <form action={logoutAction}><button className="ae-logout" type="submit">Esci</button></form>
        </div>
      </nav>

      <div className="ae-wrap">
        {/* Status card */}
        <div className="ae-status">
          <div className="ae-status-left">
            <p className="ae-status-pill">
              <span className="ae-status-dot" />
              {isLive ? 'Sito pubblicato' : 'In costruzione'}
            </p>
            <h1 className="ae-status-title">{data.restaurant_name || 'Il tuo sito'}</h1>
            <p className="ae-status-meta">
              URL: <code>/sites/{site.slug}</code> · piano <strong style={{color:'#fff'}}>{site.tier}</strong>
            </p>
          </div>
          <div className="ae-status-actions">
            {isLive && (
              <Link href={publicUrl} target="_blank" className="ae-btn ae-btn-ghost">
                Vedi il sito ↗
              </Link>
            )}
            <button
              type="button"
              onClick={generateAI}
              disabled={pending}
              className="ae-btn ae-btn-ai"
              title="L'AI scrive testi, sceglie foto e crea il menu in base al tipo di locale"
            >
              ✨ Genera con AI
            </button>
            <button
              type="button"
              onClick={togglePublish}
              disabled={pending}
              className={`ae-btn ${isLive ? 'ae-btn-danger' : 'ae-btn-success'}`}
            >
              {isLive ? 'Metti offline' : 'Pubblica sito'}
            </button>
          </div>
        </div>

        {/* Identità */}
        <div className="ae-section">
          <h2 className="ae-h2">Identità del locale</h2>
          <p className="ae-h2-sub">Come si chiama, in che zona, qual è la sua anima.</p>
          <div className="ae-grid-1">
            <div className="ae-field">
              <label className="ae-label">Nome del ristorante</label>
              <input className="ae-input" value={data.restaurant_name} onChange={e => set('restaurant_name', e.target.value)} placeholder="Es. Trattoria del Sole" />
            </div>
            <div className="ae-field">
              <label className="ae-label">Tagline · una frase che lo descrive</label>
              <input className="ae-input" value={data.tagline} onChange={e => set('tagline', e.target.value)} placeholder="Es. La cucina toscana di casa, in centro a Milano" />
            </div>
            <div className="ae-field">
              <label className="ae-label">Descrizione · 2-3 righe sulla storia, lo stile, l'atmosfera</label>
              <textarea className="ae-textarea" value={data.description} onChange={e => set('description', e.target.value)} placeholder="Aperti dal 1972, tre generazioni..." />
            </div>
          </div>
        </div>

        {/* Contatti */}
        <div className="ae-section">
          <h2 className="ae-h2">Contatti e indirizzo</h2>
          <p className="ae-h2-sub">Dove sei, come ti chiamano. Tutti i contatti che vuoi mostrare sul sito.</p>
          <div className="ae-grid">
            <div className="ae-field">
              <label className="ae-label">Indirizzo</label>
              <input className="ae-input" value={data.address} onChange={e => set('address', e.target.value)} placeholder="Via Solferino 24" />
            </div>
            <div className="ae-field">
              <label className="ae-label">Città</label>
              <input className="ae-input" value={data.city} onChange={e => set('city', e.target.value)} placeholder="Milano" />
            </div>
            <div className="ae-field">
              <label className="ae-label">Telefono</label>
              <input className="ae-input" type="tel" value={data.phone} onChange={e => set('phone', e.target.value)} placeholder="+39 02 ..." />
            </div>
            <div className="ae-field">
              <label className="ae-label">Email</label>
              <input className="ae-input" type="email" value={data.email} onChange={e => set('email', e.target.value)} placeholder="info@..." />
            </div>
            <div className="ae-field" style={{ gridColumn: 'span 2' }}>
              <label className="ae-label">WhatsApp · numero per il bottone (opzionale)</label>
              <input className="ae-input" type="tel" value={data.whatsapp} onChange={e => set('whatsapp', e.target.value)} placeholder="39 ... (senza spazi né +)" />
            </div>
          </div>
        </div>

        {/* Orari */}
        <div className="ae-section">
          <h2 className="ae-h2">Orari di apertura</h2>
          <p className="ae-h2-sub">Imposta gli orari per ogni giorno. Spunta "Chiuso" per i giorni di riposo.</p>
          {DAYS.map(({ key, label }) => {
            const d = hours[key] || {}
            const closed = !!d.closed
            return (
              <div key={key} className="ae-hours-row">
                <div className="ae-hours-day">{label}</div>
                <input
                  className="ae-hours-input"
                  type="time"
                  value={d.open || ''}
                  onChange={e => setHour(key, 'open', e.target.value)}
                  disabled={closed}
                  placeholder="dalle"
                />
                <input
                  className="ae-hours-input"
                  type="time"
                  value={d.close || ''}
                  onChange={e => setHour(key, 'close', e.target.value)}
                  disabled={closed}
                  placeholder="alle"
                />
                <label className="ae-hours-closed">
                  <input type="checkbox" checked={closed} onChange={e => setHour(key, 'closed', e.target.checked)} />
                  Chiuso
                </label>
              </div>
            )
          })}
        </div>

        {/* Sezioni dedicate */}
        <div className="ae-section">
          <h2 className="ae-h2">Altre sezioni</h2>
          <p className="ae-h2-sub">Gestisci menu, eventi e altro nelle pagine dedicate.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <Link href="/admin/menu" className="ae-btn ae-btn-ghost" style={{ justifyContent: 'space-between' }}>
              <span>🍽 Menu</span><span style={{ opacity: 0.5 }}>→</span>
            </Link>
            <Link href="/admin/events" className="ae-btn ae-btn-ghost" style={{ justifyContent: 'space-between' }}>
              <span>📅 Eventi</span><span style={{ opacity: 0.5 }}>→</span>
            </Link>
            <Link href="/admin/chef" className="ae-btn ae-btn-ghost" style={{ justifyContent: 'space-between' }}>
              <span>👨‍🍳 Lo chef</span><span style={{ opacity: 0.5 }}>→</span>
            </Link>
          </div>
          <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.4)', marginTop: 14 }}>
            Foto e gallery sono gestite automaticamente dal sistema. Clicca "✨ Genera con AI" per rifare tutto da zero.
          </p>
        </div>
      </div>

      {/* Floating save bar */}
      <div className="ae-savebar">
        {feedback && (
          <span className={`ae-feedback ${feedback.ok ? 'ae-feedback-ok' : 'ae-feedback-err'}`}>
            {feedback.msg}
          </span>
        )}
        <button
          type="button"
          onClick={saveAll}
          disabled={pending}
          className="ae-btn ae-btn-primary"
        >
          {pending ? 'Salvataggio...' : 'Salva modifiche'}
        </button>
      </div>
    </div>
  )
}
