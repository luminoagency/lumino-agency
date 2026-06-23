'use client'

import { useEffect } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { loginActionState, type LoginState } from '../auth/actions'

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
        letterSpacing: '0.02em',
        cursor: pending ? 'not-allowed' : 'pointer',
        marginTop: 4,
        fontFamily: 'inherit',
      }}
    >
      {pending ? 'Accesso in corso…' : 'Accedi'}
    </button>
  )
}

export function LoginForm({ next }: { next: string }) {
  const [state, formAction] = useFormState<LoginState, FormData>(loginActionState, null)

  // Full reload on success — middleware needs to see the new sb-*-auth-token cookie.
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
        {next && <input type="hidden" name="next" value={next} />}
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

        <div>
          <label style={{ color: '#aaa', fontSize: 12, marginBottom: 6, display: 'block', fontWeight: 500 }}>Password</label>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
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

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -4 }}>
          <a href="/forgot-password" style={{ color: '#888', fontSize: 12, textDecoration: 'none' }}>Password dimenticata?</a>
        </div>

        <SubmitButton />
      </form>
    </>
  )
}
