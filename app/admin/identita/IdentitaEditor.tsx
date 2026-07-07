'use client'

import { useState, useTransition } from 'react'
import { saveSiteContent } from '../actions/site'

interface Props {
  initial: { restaurant_name: string; tagline: string; description: string }
}

export function IdentitaEditor({ initial }: Props) {
  const [data, setData] = useState(initial)
  const [pending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ ok?: boolean; msg?: string } | null>(null)

  function set<K extends keyof typeof data>(k: K, v: string) {
    setData(prev => ({ ...prev, [k]: v }))
  }

  function save() {
    setFeedback(null)
    startTransition(async () => {
      const r = await saveSiteContent({ ...data })
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
        <h1 className="ac-title">Identità &amp; storia</h1>
        <p className="ac-sub">Come si chiama il locale, in una frase la sua anima, e la storia che lo racconta.</p>
      </div>

      <div className="ae-section">
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

      <div className="ae-savebar">
        {feedback && <span className={`ae-feedback ${feedback.ok ? 'ae-feedback-ok' : 'ae-feedback-err'}`}>{feedback.msg}</span>}
        <button type="button" className="ae-btn ae-btn-primary" onClick={save} disabled={pending}>
          {pending ? 'Salvataggio...' : 'Salva modifiche'}
        </button>
      </div>
    </div>
  )
}
