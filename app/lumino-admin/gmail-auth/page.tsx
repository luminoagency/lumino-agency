import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthUrl } from '@/lib/integrations/gmail-oauth'

const SUPER_ADMINS = ['bylumino06@gmail.com']

export const metadata = { title: 'Collega Gmail · Super Admin' }
export const dynamic = 'force-dynamic'

function fmt(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return isNaN(d.getTime()) ? '—' : d.toLocaleString('it-IT', { timeZone: 'Europe/Rome' })
}

export default async function GmailAuthPage({
  searchParams,
}: {
  searchParams: { connected?: string; error?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/lumino-admin/gmail-auth')
  if (!SUPER_ADMINS.includes(user.email || '')) redirect('/lumino-admin')

  const admin = createAdminClient()
  const { data: token } = await admin
    .from('gmail_oauth_tokens')
    .select('account_email, expires_at, last_sync_at, updated_at')
    .limit(1)
    .maybeSingle()

  const connected = !!token
  let authUrl: string | null = null
  let configError: string | null = null
  try {
    authUrl = getAuthUrl()
  } catch (e: any) {
    configError = e?.message || 'Credenziali Google non configurate'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#050505', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif', padding: '28px 22px' }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,500&display=swap" />
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <Link href="/lumino-admin" style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontSize: 12 }}>← Super Admin</Link>
        <h1 style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontStyle: 'italic', fontSize: 34, fontWeight: 500, margin: '12px 0 18px' }}>
          Collega Gmail
        </h1>

        {searchParams?.connected && (
          <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#86efac', fontSize: 13, marginBottom: 16 }}>
            ✓ Gmail collegata con successo.
          </div>
        )}
        {searchParams?.error && (
          <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', fontSize: 13, marginBottom: 16 }}>
            Errore: {searchParams.error}
          </div>
        )}

        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '20px 22px', marginBottom: 18 }}>
          <p style={{ margin: '0 0 8px', fontSize: 14 }}>
            <strong>Gmail collegata:</strong> {connected ? `sì (${token?.account_email})` : 'no'}
          </p>
          <p style={{ margin: '0 0 4px', fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
            Ultima sync: {fmt(token?.last_sync_at ?? null)}
          </p>
          {connected && (
            <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
              Token aggiornato: {fmt(token?.updated_at ?? null)} · scade: {fmt(token?.expires_at ?? null)}
            </p>
          )}
        </div>

        {configError ? (
          <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', color: '#fcd34d', fontSize: 13 }}>
            {configError}
            <br />Configura le credenziali Google Cloud (vedi <code>PIANO_B_CHECKLIST.md</code>) prima di collegare la casella.
          </div>
        ) : (
          <a
            href={authUrl!}
            style={{ display: 'inline-block', padding: '12px 22px', borderRadius: 100, background: 'linear-gradient(135deg,#e52d1d,#c9241a)', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 700, letterSpacing: '0.05em' }}
          >
            {connected ? 'Ricollega Gmail' : 'Collega Gmail'}
          </a>
        )}
      </div>
    </div>
  )
}
