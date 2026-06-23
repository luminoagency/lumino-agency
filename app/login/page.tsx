import { LoginForm } from './LoginForm'

export const metadata = { title: 'Accedi · Lumino Agency' }

export default function LoginPage({ searchParams }: { searchParams: { registered?: string; reset?: string; next?: string } }) {
  const registered = searchParams?.registered === '1'
  const reset = searchParams?.reset === '1'
  const next = searchParams?.next || ''

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

        <LoginForm next={next} />

        <p style={{ color: '#888', fontSize: 13, textAlign: 'center', marginTop: 22 }}>
          Non hai ancora un account? <a href="/register" style={{ color: '#e52d1d', textDecoration: 'none', fontWeight: 600 }}>Registrati</a>
        </p>
      </div>
    </div>
  )
}
