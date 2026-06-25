'use client'

import { useState } from 'react'
import { COMPANY } from '@/lib/company'

/**
 * Form di contatto leggero: compone un messaggio e apre il client di posta
 * dell’utente (mailto) precompilato verso l’indirizzo aziendale.
 * Nessun backend richiesto, nessun dato salvato lato server.
 */
export default function ContactForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [privacy, setPrivacy] = useState(false)

  const disabled = !name.trim() || !email.trim() || !message.trim() || !privacy

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (disabled) return
    const subject = encodeURIComponent(`Richiesta da ${name} — sito Lumino`)
    const body = encodeURIComponent(
      `Nome: ${name}\nEmail: ${email}\n\nMessaggio:\n${message}`
    )
    window.location.href = `mailto:${COMPANY.email}?subject=${subject}&body=${body}`
  }

  return (
    <form className="cf" onSubmit={handleSubmit}>
      <style dangerouslySetInnerHTML={{ __html: `
        .cf { display: flex; flex-direction: column; gap: 16px; }
        .cf label { font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(255,255,255,0.5); font-weight: 600; margin-bottom: 6px; display: block; }
        .cf input[type=text], .cf input[type=email], .cf textarea {
          width: 100%; padding: 13px 16px; background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.12); border-radius: 12px;
          color: #fff; font-size: 14px; font-family: inherit; transition: border-color 0.2s, background 0.2s;
        }
        .cf input:focus, .cf textarea:focus { outline: none; border-color: rgba(167,139,250,0.6); background: rgba(255,255,255,0.06); }
        .cf textarea { resize: vertical; min-height: 130px; }
        .cf-privacy { display: flex; gap: 10px; align-items: flex-start; font-size: 13px; color: rgba(255,255,255,0.6); line-height: 1.5; }
        .cf-privacy input { margin-top: 3px; accent-color: #e52d1d; width: 16px; height: 16px; flex-shrink: 0; }
        .cf-privacy a { color: #a78bfa; }
        .cf-submit { margin-top: 6px; padding: 15px 30px; border: 0; border-radius: 100px; background: linear-gradient(135deg,#e52d1d,#c9241a); color: #fff; font-size: 13px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; transition: transform 0.25s, box-shadow 0.25s, opacity 0.2s; box-shadow: 0 14px 40px rgba(229,45,29,0.4); }
        .cf-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 20px 48px rgba(229,45,29,0.5); }
        .cf-submit:disabled { opacity: 0.45; cursor: not-allowed; }
      ` }} />

      <div>
        <label htmlFor="cf-name">Nome</label>
        <input
          id="cf-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Il tuo nome"
          required
        />
      </div>
      <div>
        <label htmlFor="cf-email">Email</label>
        <input
          id="cf-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nome@email.com"
          required
        />
      </div>
      <div>
        <label htmlFor="cf-message">Messaggio</label>
        <textarea
          id="cf-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Come possiamo aiutarti?"
          required
        />
      </div>
      <label className="cf-privacy">
        <input
          type="checkbox"
          checked={privacy}
          onChange={(e) => setPrivacy(e.target.checked)}
          required
        />
        <span>
          Ho letto e accetto la{' '}
          <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">
            Privacy Policy
          </a>{' '}
          e acconsento al trattamento dei miei dati personali per rispondere alla richiesta
          (Reg. UE 2016/679 — GDPR).
        </span>
      </label>
      <button type="submit" className="cf-submit" disabled={disabled}>
        Invia messaggio →
      </button>
    </form>
  )
}
