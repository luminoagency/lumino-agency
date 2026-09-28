'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Email e password, e niente altro.
 *
 * L'accesso avviene nel browser perché è il client di @supabase/ssr a scrivere
 * i cookie di sessione da cui dipendono middleware e pagine server. Dopo il
 * login serve `router.refresh()`: la pagina di destinazione è un Server
 * Component e senza il refresh verrebbe servita dalla cache del router, cioè
 * ancora nella versione "non autenticato".
 */
export default function LoginForm({ next }: { next: string }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)

    const supabase = createClient()
    /* L'email si normalizza prima di partire. Il riempimento automatico del
       browser restituisce quello che l'utente ha salvato la prima volta, spazio
       finale e maiuscole comprese — «RATIB.LUMINO@gmail.com» è esattamente il
       caso visto — e la parte prima della @ è, per lo standard, sensibile alle
       maiuscole: chi confronta le due stringhe decide se sono lo stesso
       indirizzo, e quel chi non siamo noi. Qui l'ambiguità si toglie prima di
       chiederlo, che costa una riga. */
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })

    if (authError) {
      /* Il messaggio non dice MAI quale dei due è sbagliato: distinguerli
         significa confermare a un estraneo che un'email è di uno dello staff. */
      setError('Email o password non corretti.')
      setBusy(false)
      return
    }

    router.replace(next)
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="lm-field">
        <label htmlFor="staff-email">Email</label>
        <input
          id="staff-email"
          type="email"
          autoComplete="username"
          inputMode="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nome@bylumino.com"
        />
      </div>

      <div className="lm-field">
        <label htmlFor="staff-password">Password</label>
        <input
          id="staff-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </div>

      {error && (
        <p className="lm-error" role="alert">
          {error}
        </p>
      )}

      <button type="submit" className="lm-btn" disabled={busy}>
        {busy ? 'Un attimo…' : 'Entra'}
      </button>
    </form>
  )
}
