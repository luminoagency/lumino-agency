import { ForgotPasswordForm } from './ForgotPasswordForm'

export const metadata = { title: 'Password dimenticata · Lumino' }

export default function ForgotPasswordPage() {
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

        <ForgotPasswordForm />

        <p style={{ color: '#888', fontSize: 13, textAlign: 'center', marginTop: 22 }}>
          Ti sei ricordato? <a href="/login" style={{ color: '#e52d1d', textDecoration: 'none', fontWeight: 600 }}>Torna al login</a>
        </p>
      </div>
    </div>
  )
}
