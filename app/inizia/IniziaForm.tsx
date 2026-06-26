'use client'

import { useState } from 'react'

/**
 * Form di acquisizione "Inizia ora".
 * Il cliente lascia i suoi dati e lo ricontattiamo noi — NON è una
 * registrazione self-service. I dati vengono inviati a /api/inizia.
 *
 * Pre-compilazione smart: se la pagina è aperta da un link di cold outreach
 * (?lead=<uuid>), i campi arrivano già compilati via `prefill` + `known`.
 */
interface Props {
  leadId?: string
  known?: boolean
  prefill?: { restaurantName?: string; phone?: string; email?: string }
}

export default function IniziaForm({ leadId, known = false, prefill }: Props) {
  const [form, setForm] = useState({
    name: '',
    restaurantName: prefill?.restaurantName ?? '',
    phone: prefill?.phone ?? '',
    email: prefill?.email ?? '',
  })
  const [wantsContact, setWantsContact] = useState(true)
  const [privacy, setPrivacy] = useState(false)
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  const disabled =
    !form.name.trim() ||
    !form.restaurantName.trim() ||
    !form.phone.trim() ||
    !form.email.trim() ||
    !privacy ||
    status === 'sending'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (disabled) return
    setStatus('sending')
    setError('')
    try {
      const res = await fetch('/api/inizia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, wantsContact, privacy, leadId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error || 'Qualcosa è andato storto. Riprova.')
        setStatus('error')
        return
      }
      setStatus('done')
    } catch {
      setError('Connessione non riuscita. Riprova tra poco.')
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <div className="cf-done">
        <style dangerouslySetInnerHTML={{ __html: `
          .cf-done { text-align: center; padding: 24px 8px; }
          .cf-done-icon { width: 56px; height: 56px; margin: 0 auto 18px; border-radius: 50%; background: rgba(34,197,94,0.15); color: #22c55e; display: flex; align-items: center; justify-content: center; font-size: 28px; }
          .cf-done h3 { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 1.9rem; font-style: italic; color: #fff; margin: 0 0 10px; font-weight: 400; }
          .cf-done p { color: rgba(255,255,255,0.6); font-size: 14.5px; line-height: 1.6; margin: 0; }
        ` }} />
        <div className="cf-done-icon">✓</div>
        <h3>Grazie!</h3>
        <p>Ti ricontattiamo a breve.</p>
      </div>
    )
  }

  return (
    <form className="cf" onSubmit={handleSubmit}>
      <style dangerouslySetInnerHTML={{ __html: `
        .cf { display: flex; flex-direction: column; gap: 16px; }
        .cf-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .cf label { font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(255,255,255,0.5); font-weight: 600; margin-bottom: 6px; display: block; }
        .cf input[type=text], .cf input[type=email], .cf input[type=tel] {
          width: 100%; padding: 13px 16px; background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.12); border-radius: 12px;
          color: #fff; font-size: 14px; font-family: inherit; transition: border-color 0.2s, background 0.2s;
        }
        .cf input:focus { outline: none; border-color: rgba(167,139,250,0.6); background: rgba(255,255,255,0.06); }
        .cf-known { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-radius: 12px; background: rgba(34,197,94,0.10); border: 1px solid rgba(34,197,94,0.25); color: #86efac; font-size: 13.5px; }
        .cf-check { display: flex; gap: 10px; align-items: flex-start; font-size: 13px; color: rgba(255,255,255,0.65); line-height: 1.5; }
        .cf-check input { margin-top: 3px; accent-color: #e52d1d; width: 16px; height: 16px; flex-shrink: 0; }
        .cf-privacy { display: flex; gap: 10px; align-items: flex-start; font-size: 13px; color: rgba(255,255,255,0.6); line-height: 1.5; }
        .cf-privacy input { margin-top: 3px; accent-color: #e52d1d; width: 16px; height: 16px; flex-shrink: 0; }
        .cf-privacy a { color: #a78bfa; }
        .cf-error { color: #f87171; font-size: 13px; margin: 0; }
        .cf-submit { margin-top: 6px; padding: 15px 30px; border: 0; border-radius: 100px; background: linear-gradient(135deg,#e52d1d,#c9241a); color: #fff; font-size: 13px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; transition: transform 0.25s, box-shadow 0.25s, opacity 0.2s; box-shadow: 0 14px 40px rgba(229,45,29,0.4); }
        .cf-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 20px 48px rgba(229,45,29,0.5); }
        .cf-submit:disabled { opacity: 0.45; cursor: not-allowed; }
        @media (max-width: 560px) { .cf-row { grid-template-columns: 1fr; } }
      ` }} />

      {known && (
        <div className="cf-known">
          <span aria-hidden>✓</span>
          <span>Conosciamo già il tuo locale</span>
        </div>
      )}

      <div className="cf-row">
        <div>
          <label htmlFor="in-name">Nome</label>
          <input id="in-name" type="text" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Il tuo nome" required />
        </div>
        <div>
          <label htmlFor="in-restaurant">Nome del locale</label>
          <input id="in-restaurant" type="text" value={form.restaurantName} onChange={(e) => set('restaurantName', e.target.value)} placeholder="Es. Trattoria da Mario" required />
        </div>
      </div>

      <div className="cf-row">
        <div>
          <label htmlFor="in-phone">Telefono</label>
          <input id="in-phone" type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="Es. 333 1234567" required />
        </div>
        <div>
          <label htmlFor="in-email">Email</label>
          <input id="in-email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="nome@email.com" required />
        </div>
      </div>

      <label className="cf-check">
        <input type="checkbox" checked={wantsContact} onChange={(e) => setWantsContact(e.target.checked)} />
        <span>Vuoi essere ricontattato</span>
      </label>

      <label className="cf-privacy">
        <input type="checkbox" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} required />
        <span>
          Ho letto e accetto la{' '}
          <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>{' '}
          ai sensi del GDPR (Reg. UE 2016/679).
        </span>
      </label>

      {status === 'error' && <p className="cf-error">{error}</p>}

      <button type="submit" className="cf-submit" disabled={disabled}>
        {status === 'sending' ? 'Invio in corso…' : 'Invia richiesta →'}
      </button>
    </form>
  )
}
