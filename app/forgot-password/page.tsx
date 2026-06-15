import { requestPasswordResetAction } from '../auth/actions'

export const metadata = { title: 'Password dimenticata · Lumino Agency' }

export default function ForgotPasswordPage({ searchParams }: { searchParams: { error?: string; sent?: string } }) {
  const errorMsg = searchParams?.error
  const sent = searchParams?.sent === '1'

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
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 5, marginBottom: 18 }}>
            <span style={{ color: '#fff', fontSize: 34, fontFamily: '"Cormorant Garamond", Georgia, serif', fontWeight: 500, letterSpacing: '-0.01em', lineHeight: 1 }}>Lumino</span>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#e52d1d', boxShadow: '0 0 12px #e52d1d', alignSelf: 'flex-end', marginBottom: 6 }} />
          </div>
          <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 700, marginBottom: 6, letterSpacing: '-0.02em' }}>Password dimenticata?</h1>
          <p style={{ color: '#888', fontSize: 14, lineHeight: 1.5 }}>
            Inserisci la tua email. Ti mandiamo un link per crearne una nuova.
          </p>
        </div>

        {sent ? (
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
              Se l'indirizzo esiste, ti abbiamo mandato un link per resettare la password.
              Controlla anche la cartella <strong style={{ color: '#fff' }}>Spam/Promozioni</strong>.
            </p>
            <p style={{ color: '#666', fontSize: 12, marginTop: 14 }}>
              Il link scade dopo 1 ora.
            </p>
          </div>
        ) : (
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
                {decodeURIComponent(errorMsg)}
              </div>
            )}

            <form action={requestPasswordResetAction} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
                  cursor: 'pointer',
                  marginTop: 4,
                  fontFamily: 'inherit',
                }}
              >
                Manda il link
              </button>
            </form>
          </>
        )}

        <p style={{ color: '#888', fontSize: 13, textAlign: 'center', marginTop: 22 }}>
          Ti sei ricordato? <a href="/login" style={{ color: '#e52d1d', textDecoration: 'none', fontWeight: 600 }}>Torna al login</a>
        </p>
      </div>
    </div>
  )
}
