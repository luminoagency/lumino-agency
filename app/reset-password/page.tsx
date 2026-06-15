import Link from 'next/link'
import { updatePasswordAction } from '../auth/actions'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Nuova password · Lumino Agency' }

export default async function ResetPasswordPage({ searchParams }: { searchParams: { error?: string } }) {
  const errorMsg = searchParams?.error

  // Se l'utente arriva qui senza aver cliccato il link email, non c'è sessione.
  // Mostra un messaggio chiaro invece di lasciarlo provare il form e vedere "Auth session missing".
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', padding: '2rem 1rem', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&display=swap" />
        <div style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 5, marginBottom: 22 }}>
            <span style={{ color: '#fff', fontSize: 34, fontFamily: '"Cormorant Garamond", Georgia, serif', fontWeight: 500, letterSpacing: '-0.01em', lineHeight: 1 }}>Lumino</span>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#e52d1d', boxShadow: '0 0 12px #e52d1d', alignSelf: 'flex-end', marginBottom: 6 }} />
          </div>
          <div style={{ fontSize: 38, marginBottom: 14 }}>✉️</div>
          <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, marginBottom: 10, letterSpacing: '-0.02em' }}>Apri il link dall'email</h1>
          <p style={{ color: '#aaa', fontSize: 14, lineHeight: 1.6, margin: '0 0 22px' }}>
            Per cambiare password devi cliccare il link che ti abbiamo mandato per email. Non lo trovi?
            Controlla anche la cartella <strong style={{ color: '#fff' }}>Spam/Promozioni</strong>.
          </p>
          <Link href="/forgot-password" style={{
            display: 'inline-block', padding: '12px 22px',
            background: '#e52d1d', color: '#fff', textDecoration: 'none',
            borderRadius: 100, fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>
            Manda di nuovo il link
          </Link>
          <p style={{ color: '#666', fontSize: 13, marginTop: 22 }}>
            <Link href="/login" style={{ color: '#888' }}>Torna al login</Link>
          </p>
        </div>
      </div>
    )
  }

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
          <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 700, marginBottom: 6, letterSpacing: '-0.02em' }}>Crea una nuova password</h1>
          <p style={{ color: '#888', fontSize: 14, lineHeight: 1.5 }}>
            Scegli una password sicura. Da ora userai questa per accedere.
          </p>
        </div>

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

        <form action={updatePasswordAction} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
              marginTop: 8,
              fontFamily: 'inherit',
            }}
          >
            Salva nuova password
          </button>

          <p style={{ color: '#666', fontSize: 11, lineHeight: 1.6, marginTop: 4 }}>
            Suggerimento: usa una password lunga, mescola lettere maiuscole, minuscole, numeri e simboli.
          </p>
        </form>
      </div>
    </div>
  )
}
