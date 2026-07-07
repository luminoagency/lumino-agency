'use client'

import { useState, useTransition } from 'react'
import { saveSiteContent } from '../actions/site'

interface OpeningHoursDay { open?: string; close?: string; closed?: boolean }
type OpeningHours = Record<string, OpeningHoursDay>

interface Props {
  initial: { address: string; city: string; phone: string; email: string; whatsapp: string; opening_hours: OpeningHours }
}

const DAYS: Array<{ key: string; label: string }> = [
  { key: 'mon', label: 'Lun' }, { key: 'tue', label: 'Mar' }, { key: 'wed', label: 'Mer' },
  { key: 'thu', label: 'Gio' }, { key: 'fri', label: 'Ven' }, { key: 'sat', label: 'Sab' }, { key: 'sun', label: 'Dom' },
]

export function ContattiEditor({ initial }: Props) {
  const [data, setData] = useState({ address: initial.address, city: initial.city, phone: initial.phone, email: initial.email, whatsapp: initial.whatsapp })
  const [hours, setHours] = useState<OpeningHours>(initial.opening_hours || {})
  const [pending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ ok?: boolean; msg?: string } | null>(null)

  function set<K extends keyof typeof data>(k: K, v: string) {
    setData(prev => ({ ...prev, [k]: v }))
  }
  function setHour(day: string, field: 'open' | 'close' | 'closed', value: string | boolean) {
    setHours(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }))
  }

  function save() {
    setFeedback(null)
    startTransition(async () => {
      const r = await saveSiteContent({ ...data, opening_hours: hours } as any)
      if (r.ok) {
        setFeedback({ ok: true, msg: '✓ Salvato' })
        setTimeout(() => setFeedback(null), 3000)
      } else {
        setFeedback({ ok: false, msg: r.error || 'Errore' })
      }
    })
  }

  return (
    <div className="ac-wrap">
      <div className="ac-head">
        <h1 className="ac-title">Contatti &amp; orari</h1>
        <p className="ac-sub">Dove sei, come ti contattano e quando sei aperto. Tutto ciò che mostri sul sito.</p>
      </div>

      <div className="ae-section">
        <h2 className="ae-h2">Contatti e indirizzo</h2>
        <p className="ae-h2-sub">I recapiti che vuoi mostrare ai clienti.</p>
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

      <div className="ae-section">
        <h2 className="ae-h2">Orari di apertura</h2>
        <p className="ae-h2-sub">Imposta gli orari per ogni giorno. Spunta "Chiuso" per i giorni di riposo.</p>
        {DAYS.map(({ key, label }) => {
          const d = hours[key] || {}
          const closed = !!d.closed
          return (
            <div key={key} className="ae-hours-row">
              <div className="ae-hours-day">{label}</div>
              <input className="ae-hours-input" type="time" value={d.open || ''} onChange={e => setHour(key, 'open', e.target.value)} disabled={closed} />
              <input className="ae-hours-input" type="time" value={d.close || ''} onChange={e => setHour(key, 'close', e.target.value)} disabled={closed} />
              <label className="ae-hours-closed">
                <input type="checkbox" checked={closed} onChange={e => setHour(key, 'closed', e.target.checked)} />
                Chiuso
              </label>
            </div>
          )
        })}
      </div>

      <div className="ae-savebar">
        {feedback && <span className={`ae-feedback ${feedback.ok ? 'ae-feedback-ok' : 'ae-feedback-err'}`}>{feedback.msg}</span>}
        <button type="button" className="ae-btn ae-btn-primary" onClick={save} disabled={pending}>
          {pending ? 'Salvataggio...' : 'Salva modifiche'}
        </button>
      </div>
    </div>
  )
}
