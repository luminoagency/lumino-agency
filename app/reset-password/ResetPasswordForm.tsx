'use client'

import { useEffect } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { updatePasswordActionState, type UpdatePasswordState } from '../auth/actions'

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
        marginTop: 8,
        fontFamily: 'inherit',
      }}
    >
      {pending ? 'Salvataggio…' : 'Salva nuova password'}
    </button>
  )
}

export function ResetPasswordForm() {
  const [state, formAction] = useFormState<UpdatePasswordState, FormData>(updatePasswordActionState, null)

  useEffect(() => {
    if (state?.ok && state.redirectTo) window.location.assign(state.redirectTo)
  }, [state])

  const errorMsg = state?.ok === false ? state.error : undefined

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
          <label style={{ color: '#aaa', fontSize: 12, marginBottom: 6, display: 'block', fontWeight: 500 }}>Nuova password</label>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="Almeno 8 caratteri"
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

        <div>
          <label style={{ color: '#aaa', fontSize: 12, marginBottom: 6, display: 'block', fontWeight: 500 }}>Conferma password</label>
          <input
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="Riscrivi la password"
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

        <p style={{ color: '#666', fontSize: 11, lineHeight: 1.6, marginTop: 4 }}>
          Suggerimento: usa una password lunga, mescola lettere maiuscole, minuscole, numeri e simboli.
        </p>
      </form>
    </>
  )
}
