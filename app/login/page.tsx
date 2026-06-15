import { loginAction } from '../auth/actions'

export const metadata = { title: 'Accedi · Lumino Agency' }

export default function LoginPage({ searchParams }: { searchParams: { error?: string; registered?: string; reset?: string } }) {
  const errorMsg = searchParams?.error
  const registered = searchParams?.registered === '1'
  const reset = searchParams?.reset === '1'

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0a0a',
      padding: '2rem 1rem',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&display=swap" />
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ marginBottom: 36, textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 5, marginBottom: 18 }}>
            <span style={{ color: '#fff', fontSize: 34, fontFamily: '"Cormorant Garamond", Georgia, serif', fontWeight: 500, letterSpacing: '-0.01em', lineHeight: 1 }}>Lumino</span>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#e52d1d', boxShadow: '0 0 12px #e52d1d', alignSelf: 'flex-end', marginBottom: 6 }} />
          </div>
          <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 700, marginBottom: 6, letterSpacing: '-0.02em' }}>Accedi al tuo sito</h1>
          <p style={{ color: '#888', fontSize: 14, lineHeight: 1.5 }}>
            Gestisci menu, prenotazioni e contenuti del tuo ristorante.
          </p>
        </div>

        {registered && (
          <div style={{
            padding: '12px 14px',
            background: 'rgba(34,197,94,0.1)',
            border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: 8,
            color: '#22c55e',
            fontSize: 13,
            marginBottom: 16,
          }}>
            Registrazione completata. Controlla la tua mail per confermare e poi accedi.
          </div>
        )}

        {reset && (
          <div style={{
            padding: '12px 14px',
            background: 'rgba(34,197,94,0.1)',
            border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: 8,
            color: '#22c55e',
            fontSize: 13,
            marginBottom: 16,
          }}>
            Password aggiornata. Accedi con quella nuova.
          </div>
        )}

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
            {decodeURIComponent(errorMsg)}
          </div>
        )}

        <form action={loginAction} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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

          <button
            type="submit"
            style={{
              padding: '12px 16px',
              background: '#e52d1d',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: '0.02em',
              cursor: 'pointer',
              marginTop: 4,
              fontFamily: 'inherit',
              transition: 'background 0.2s',
            }}
          >
            Accedi
          </button>
        </form>

        <p style={{ color: '#888', fontSize: 13, textAlign: 'center', marginTop: 22 }}>
          Non hai ancora un account? <a href="/register" style={{ color: '#e52d1d', textDecoration: 'none', fontWeight: 600 }}>Registrati</a>
        </p>
      </div>
    </div>
  )
}
