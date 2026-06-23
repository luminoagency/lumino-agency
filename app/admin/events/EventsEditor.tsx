'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { saveMyEvents, type EventDTO } from '../actions/site'

export type { EventDTO }

interface Props {
  initial: EventDTO[]
  siteSlug: string
  backPath?: string
  saveAction?: (events: EventDTO[]) => Promise<{ ok: boolean; error?: string }>
}

export function EventsEditor({ initial, siteSlug, backPath, saveAction }: Props) {
  const [events, setEvents] = useState<EventDTO[]>(initial.length > 0 ? initial : [emptyEvent()])
  const [pending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ ok?: boolean; msg?: string } | null>(null)

  function update(i: number, patch: Partial<EventDTO>) {
    setEvents(prev => prev.map((e, idx) => idx === i ? { ...e, ...patch } : e))
  }
  function add() { setEvents(prev => [...prev, emptyEvent()]) }
  function remove(i: number) {
    if (!confirm('Eliminare questo evento?')) return
    setEvents(prev => prev.filter((_, idx) => idx !== i))
  }

  function save() {
    setFeedback(null)
    const cleaned = events.filter(e => e.title.trim() && e.event_date)
    startTransition(async () => {
      const r = await (saveAction ? saveAction(cleaned) : saveMyEvents(cleaned))
      if (r.ok) {
        setFeedback({ ok: true, msg: '✓ Eventi salvati' })
        setTimeout(() => setFeedback(null), 3000)
      } else {
        setFeedback({ ok: false, msg: r.error || 'Errore' })
      }
    })
  }

  return (
    <div className="ev-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;1,400&family=Inter:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; background: #050505; }
        .ev-root { min-height: 100vh; background: #050505; color: #fff; font-family: 'Inter', system-ui, sans-serif; padding-bottom: 110px; }
        .ev-top { padding:18px 24px; border-bottom:1px solid rgba(255,255,255,0.06); display:flex; align-items:center; justify-content:space-between; background:rgba(10,10,10,0.7); backdrop-filter:blur(20px); position:sticky; top:0; z-index:10; }
        .ev-back { color:rgba(255,255,255,0.6); text-decoration:none; font-size:13px; margin-right: 14px; }
        .ev-back:hover { color:#fff; }
        .ev-title-bar { font-family:'Cormorant Garamond', Georgia, serif; font-size:22px; font-style:italic; }
        .ev-wrap { max-width: 760px; margin: 0 auto; padding: 28px 22px; }
        .ev-hint { color: rgba(255,255,255,0.55); font-size: 13.5px; line-height: 1.55; margin: 0 0 22px; }
        .ev-card { background:rgba(20,20,22,0.6); border:1px solid rgba(255,255,255,0.06); border-radius:16px; padding:20px; margin-bottom: 14px; }
        .ev-row { display:grid; grid-template-columns: 1fr 180px 40px; gap: 12px; align-items: center; margin-bottom: 10px; }
        .ev-in { padding:11px 14px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:10px; color:#fff; font-size:14.5px; font-family:inherit; }
        .ev-in:focus { outline:none; border-color: rgba(229,45,29,0.45); }
        .ev-desc { width:100%; padding:11px 14px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:10px; color:#fff; font-size:14px; font-family:inherit; resize: vertical; min-height: 60px; line-height: 1.5; }
        .ev-desc:focus { outline:none; border-color: rgba(229,45,29,0.45); }
        .ev-x { background:transparent; border:0; color:rgba(239,68,68,0.6); cursor:pointer; font-size:18px; }
        .ev-add { display:block; width:100%; padding:14px; text-align:center; background:rgba(255,255,255,0.04); border:1px dashed rgba(255,255,255,0.18); border-radius:12px; color:rgba(255,255,255,0.75); font-size:13px; cursor:pointer; font-family:inherit; margin-top: 6px; }
        .ev-add:hover { background:rgba(255,255,255,0.07); color:#fff; }
        .ev-savebar { position:fixed; bottom:18px; left:50%; transform:translateX(-50%); padding:12px 16px; background:rgba(10,10,10,0.95); backdrop-filter:blur(24px); border:1px solid rgba(255,255,255,0.1); border-radius:100px; box-shadow:0 16px 48px rgba(0,0,0,0.6); display:flex; align-items:center; gap:14px; z-index: 50; }
        .ev-save { padding:11px 22px; border:0; border-radius:100px; background:linear-gradient(135deg, #e52d1d, #c9241a); color:#fff; font-size:12px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; cursor:pointer; font-family:inherit; }
        .ev-save:disabled { opacity:0.5; cursor:not-allowed; }
        .ev-fb { font-size: 13px; font-weight: 600; padding: 6px 14px; border-radius: 100px; }
        .ev-fb-ok { background: rgba(34,197,94,0.15); color: #22c55e; }
        .ev-fb-err { background: rgba(239,68,68,0.15); color: #f87171; }
        @media (max-width: 600px) { .ev-row { grid-template-columns: 1fr 130px 32px; } }
      `}</style>

      <nav className="ev-top">
        <div>
          <Link href={backPath ?? '/admin'} className="ev-back">← Pannello</Link>
          <span className="ev-title-bar">Eventi</span>
        </div>
        <Link href={`/sites/${siteSlug}`} target="_blank" className="ev-back">Vedi il sito ↗</Link>
      </nav>

      <div className="ev-wrap">
        <p className="ev-hint">Pubblica eventi come "Cena con i vini", "Live music venerdì", "Menù speciale di Natale". Vengono mostrati sul tuo sito in ordine cronologico.</p>

        {events.map((e, i) => (
          <div key={i} className="ev-card">
            <div className="ev-row">
              <input className="ev-in" value={e.title} onChange={ev => update(i, { title: ev.target.value })} placeholder="Titolo evento" />
              <input className="ev-in" type="date" value={e.event_date || ''} onChange={ev => update(i, { event_date: ev.target.value })} />
              <button type="button" className="ev-x" onClick={() => remove(i)} title="Elimina">✕</button>
            </div>
            <textarea className="ev-desc" value={e.description || ''} onChange={ev => update(i, { description: ev.target.value })} placeholder="Descrizione (1-2 frasi)..." />
          </div>
        ))}

        <button type="button" className="ev-add" onClick={add}>+ Aggiungi evento</button>
      </div>

      <div className="ev-savebar">
        {feedback && <span className={`ev-fb ${feedback.ok ? 'ev-fb-ok' : 'ev-fb-err'}`}>{feedback.msg}</span>}
        <button type="button" className="ev-save" onClick={save} disabled={pending}>
          {pending ? 'Salvataggio...' : 'Salva eventi'}
        </button>
      </div>
    </div>
  )
}

function emptyEvent(): EventDTO {
  return { title: '', description: '', event_date: '', active: true }
}
