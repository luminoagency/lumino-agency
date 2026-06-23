'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { requestPasswordResetActionState, type ForgotPasswordState } from '../auth/actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        padding: '12px 16px',
        background: pending ? '#a8221a' : '#e52d1d',
        color: '#fff',
        border: 'none',
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 600,
        cursor: pending ? 'not-allowed' : 'pointer',
        marginTop: 4,
        fontFamily: 'inherit',
      }}
    >
      {pending ? 'Invio in corso…' : 'Manda il link'}
    </button>
  )
}

export function ForgotPasswordForm() {
  const [state, formAction] = useFormState<ForgotPasswordState, FormData>(
    requestPasswordResetActionState,
    null,
  )
  const sent = state?.sent === true
  const errorMsg = state?.ok === false ? state.error : undefined

  if (sent) {
    return (
      <div style={{
        padding: '24px 20px',
        background: 'rgba(34,197,94,0.08)',
        border: '1px solid rgba(34,197,94,0.3)',
        borderRadius: 10,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>✉️</div>
        <h2 style={{ color: '#22c55e', fontSize: 16, fontWeight: 700, marginBottom: 8, margin: 0 }}>Email inviata</h2>
        <p style={{ color: '#aaa', fontSize: 13, lineHeight: 1.6, marginTop: 8 }}>
          Se l&apos;indirizzo esiste, ti abbiamo mandato un link per resettare la password.
          Controlla anche la cartella <strong style={{ color: '#fff' }}>Spam/Promozioni</strong>.
        </p>
        <p style={{ color: '#666', fontSize: 12, marginTop: 14 }}>
          Il link scade dopo 1 ora.
        </p>
      </div>
    )
  }

  return (
    <>
      {errorMsg && (
        <div style={{
          padding: '12px 14px',
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 8,
          color: '#ef4444',
          fontSize: 13,
          marginBottom: 16,
        }}>
          {errorMsg}
        </div>
      )}

      <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ color: '#aaa', fontSize: 12, marginBottom: 6, display: 'block', fontWeight: 500 }}>Email</label>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="tu@email.it"
            style={{
              width: '100%',
              padding: '11px 14px',
              background: '#1a1a1a',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              color: '#fff',
              fontSize: 14,
              fontFamily: 'inherit',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <SubmitButton />
      </form>
    </>
  )
}
