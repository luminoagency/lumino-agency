'use client'

import { useState } from 'react'
import GdprConsent from './GdprConsent'

/**
 * Customer-facing "Leave a review" form.
 * Renders in each template (themed via accent + theme).
 * On submit, POSTs to /api/reviews which writes to site_user_reviews (RLS-protected).
 *
 * Owner has to approve from admin before reviews show on the live site —
 * this gives review-bombing protection.
 */

interface LeaveReviewFormProps {
  siteId?: string         // when provided, submission targets this site
  accent: string
  theme?: 'dark' | 'light'
  scope?: string          // CSS class scope to avoid collisions
  labelFont?: string      // serif font for heading (e.g. 'Fraunces' or 'Playfair Display')
}

export function LeaveReviewForm({ siteId, accent, theme = 'dark', scope = 'lr', labelFont = 'Fraunces' }: LeaveReviewFormProps) {
  const [name, setName] = useState('')
  const [text, setText] = useState('')
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !text.trim() || rating < 1) {
      setError('Compila tutti i campi e dai un voto.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site_id: siteId, author_name: name.trim(), rating, text: text.trim() }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Errore invio')
      }
      setSubmitted(true)
    } catch (err: any) {
      setError(err.message || 'Errore. Riprova.')
    } finally {
      setSubmitting(false)
    }
  }

  const bg = theme === 'dark' ? 'rgba(255,255,255,0.04)' : '#fdfbf5'
  const border = theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
  const fg = theme === 'dark' ? '#f4f1ff' : '#3d2b1c'
  const muted = theme === 'dark' ? 'rgba(244,241,255,0.6)' : '#7a6754'

  if (submitted) {
    return (
      <div className={`${scope}-wrap`}>
        <div className={`${scope}-success`}>
          <div className={`${scope}-success-icon`}>✦</div>
          <h3 className={`${scope}-success-title`}>Grazie del feedback!</h3>
          <p className={`${scope}-success-text`}>La tua recensione sarà pubblicata dopo una rapida verifica.</p>
        </div>
        <style>{`
          .${scope}-wrap { padding: 2rem; }
          .${scope}-success { text-align: center; padding: 2rem 1rem; }
          .${scope}-success-icon { font-size: 3rem; color: ${accent}; margin-bottom: 1rem; }
          .${scope}-success-title { font-family: '${labelFont}', Georgia, serif; font-size: 1.8rem; font-weight: 400; font-style: italic; color: ${fg}; margin: 0 0 0.5rem; letter-spacing: -0.02em; }
          .${scope}-success-text { color: ${muted}; font-size: 0.95rem; line-height: 1.6; }
        `}</style>
      </div>
    )
  }

  return (
    <div className={`${scope}-wrap`}>
      <p className={`${scope}-eyebrow`}>✦ Scrivi una recensione</p>
      <h3 className={`${scope}-title`}>
        Com'è andata la <em>tua esperienza</em>?
      </h3>
      <p className={`${scope}-sub`}>
        Le tue parole aiutano altri a scegliere. Servono 30 secondi.
      </p>

      <form onSubmit={onSubmit} className={`${scope}-form`}>
        {/* Stars */}
        <div className={`${scope}-stars-row`}>
          <span className={`${scope}-stars-label`}>Voto</span>
          <div className={`${scope}-stars`}>
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                type="button"
                className={`${scope}-star ${n <= (hover || rating) ? 'active' : ''}`}
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                aria-label={`${n} stelle`}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        <input
          required
          type="text"
          placeholder="Il tuo nome"
          value={name}
          onChange={e => setName(e.target.value)}
          className={`${scope}-input`}
        />

        <textarea
          required
          rows={4}
          placeholder="Racconta com'è stata la tua esperienza..."
          value={text}
          onChange={e => setText(e.target.value)}
          className={`${scope}-input`}
        />

        {error && <p className={`${scope}-error`}>{error}</p>}

        <GdprConsent accent={accent} color={muted} />

        <button type="submit" disabled={submitting} className={`${scope}-submit`}>
          {submitting ? 'Invio…' : 'Pubblica recensione'}
        </button>

        <p className={`${scope}-disclaimer`}>
          La recensione sarà pubblica dopo una rapida verifica.
        </p>
      </form>

      <style>{`
        .${scope}-wrap {
          background: ${bg};
          border: 1px solid ${border};
          border-radius: 20px;
          padding: 2.5rem 2rem;
          backdrop-filter: blur(20px);
          max-width: 600px;
          margin: 0 auto;
        }
        .${scope}-eyebrow {
          font-size: 0.75rem;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: ${accent};
          margin: 0 0 0.85rem;
          font-weight: 600;
        }
        .${scope}-title {
          font-family: '${labelFont}', Georgia, serif;
          font-size: clamp(1.5rem, 3vw, 2rem);
          font-weight: 400;
          letter-spacing: -0.02em;
          line-height: 1.15;
          color: ${fg};
          margin: 0 0 0.5rem;
        }
        .${scope}-title em {
          font-style: italic;
          color: ${accent};
        }
        .${scope}-sub {
          color: ${muted};
          font-size: 0.95rem;
          line-height: 1.5;
          margin: 0 0 1.75rem;
        }
        .${scope}-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .${scope}-stars-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.5rem 0 0.75rem;
        }
        .${scope}-stars-label {
          font-size: 0.78rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: ${muted};
          font-weight: 600;
        }
        .${scope}-stars {
          display: inline-flex;
          gap: 4px;
        }
        .${scope}-star {
          background: none;
          border: none;
          padding: 4px;
          font-size: 1.8rem;
          color: ${theme === 'dark' ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)'};
          cursor: pointer;
          transition: color 0.2s, transform 0.2s;
          line-height: 1;
        }
        .${scope}-star:hover {
          transform: scale(1.15);
        }
        .${scope}-star.active {
          color: #eab308;
          text-shadow: 0 0 12px rgba(234,179,8,0.5);
        }
        .${scope}-input {
          width: 100%;
          padding: 0.95rem 1.1rem;
          background: ${theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.025)'};
          border: 1px solid ${border};
          border-radius: 12px;
          color: ${fg};
          font-family: inherit;
          font-size: 0.95rem;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.2s, background 0.2s;
        }
        .${scope}-input:focus {
          border-color: ${accent};
          background: ${theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'};
        }
        .${scope}-input::placeholder { color: ${muted}; opacity: 0.6; }
        textarea.${scope}-input { resize: vertical; min-height: 80px; }
        .${scope}-error {
          color: #ef4444;
          font-size: 0.85rem;
          margin: 0;
        }
        .${scope}-submit {
          padding: 1rem 1.5rem;
          background: ${accent};
          color: ${theme === 'dark' ? '#0a0612' : '#fff'};
          border: none;
          border-radius: 12px;
          font-family: inherit;
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          transition: transform 0.25s, box-shadow 0.25s, opacity 0.2s;
          margin-top: 0.5rem;
        }
        .${scope}-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 30px ${accent}55;
        }
        .${scope}-submit:disabled { opacity: 0.6; cursor: wait; }
        .${scope}-disclaimer {
          font-size: 0.7rem;
          color: ${muted};
          text-align: center;
          margin: 0.5rem 0 0;
          letter-spacing: 0.05em;
        }
      `}</style>
    </div>
  )
}
