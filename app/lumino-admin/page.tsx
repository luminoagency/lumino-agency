import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// SUPER ADMIN ALLOWLIST
// Only these emails can access /lumino-admin
const SUPER_ADMINS = [
  'bylumino06@gmail.com',
  'bylumino.06@gmail.com',
]

export const metadata = { title: 'Lumino Control · Super Admin' }
export const dynamic = 'force-dynamic'

export default async function LuminoAdminPage() {
  // Gate: must be logged in AND in the allowlist
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/lumino-admin')
  if (!SUPER_ADMINS.includes(user.email || '')) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif', padding: '2rem' }}>
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <h1 style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: 48, fontWeight: 400, margin: '0 0 12px', letterSpacing: '-0.02em' }}>Accesso negato</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.6 }}>
            Questa pagina è riservata al proprietario di Lumino. Loggato come <strong style={{ color: '#fff' }}>{user.email}</strong>.
          </p>
          <Link href="/admin" style={{ display: 'inline-block', marginTop: 20, color: '#e52d1d', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>← Torna al tuo pannello</Link>
        </div>
      </div>
    )
  }

  // Load data via service-role (bypasses RLS)
  const admin = createAdminClient()
  const [{ data: users = [] }, { data: sites = [] }, { data: owners = [] }, { data: signups = [] }] = await Promise.all([
    admin.auth.admin.listUsers().then(r => ({ data: r.data?.users || [] })) as any,
    admin.from('sites').select('id, slug, tier, active, status, created_at, restaurant:restaurants(name)').order('created_at', { ascending: false }).limit(500) as any,
    admin.from('site_owners').select('site_id, user_id, role, created_at').limit(500) as any,
    admin.from('site_reservations').select('id, site_id, created_at').gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) as any,
  ])

  const totalUsers = users.length
  const totalSites = sites.length
  const liveSites = sites.filter((s: any) => s.status === 'live').length
  const draftSites = sites.filter((s: any) => s.status === 'draft').length
  const planCount = {
    basic: sites.filter((s: any) => s.tier === 'basic').length,
    pro: sites.filter((s: any) => s.tier === 'pro').length,
    premium: sites.filter((s: any) => s.tier === 'premium').length,
  }
  const reservations30d = signups.length

  // Map user_id → site
  const userById = new Map(users.map((u: any) => [u.id, u]))
  const siteByUser = new Map()
  owners.forEach((o: any) => siteByUser.set(o.user_id, sites.find((s: any) => s.id === o.site_id)))

  return (
    <div style={{ minHeight: '100vh', background: '#050505', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif', position: 'relative', overflowX: 'hidden' }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&family=Inter:wght@300;400;500;600;700;800&display=swap" />
      <style>{`
        body { margin: 0; background: #050505; }
        .la-bg {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background:
            radial-gradient(800px circle at 12% 18%, rgba(229,45,29,0.08), transparent 50%),
            radial-gradient(700px circle at 88% 75%, rgba(167,139,250,0.06), transparent 50%);
        }
        .la-wrap { position: relative; z-index: 1; max-width: 1400px; margin: 0 auto; padding: 28px; }
        .la-top {
          display: flex; align-items: center; justify-content: space-between;
          padding-bottom: 28px; border-bottom: 1px solid rgba(255,255,255,0.08); margin-bottom: 36px;
        }
        .la-brand { display: inline-flex; align-items: baseline; gap: 5px; }
        .la-brand-name {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 30px; font-weight: 500; letter-spacing: -0.01em;
          color: #fff;
        }
        .la-brand-mark {
          font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase;
          color: #e52d1d; font-weight: 700; margin-left: 12px;
          padding: 3px 8px; border: 1px solid rgba(229,45,29,0.4); border-radius: 4px;
        }
        .la-user { color: rgba(255,255,255,0.6); font-size: 12px; }
        .la-user strong { color: #fff; font-weight: 600; }

        .la-hero {
          margin-bottom: 36px;
        }
        .la-hero-eyebrow { font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase; color: #e52d1d; font-weight: 600; margin: 0 0 12px; }
        .la-hero-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(2.2rem, 4vw, 3.2rem);
          font-weight: 400; letter-spacing: -0.03em; line-height: 1.05;
          margin: 0;
        }
        .la-hero-title em {
          font-style: italic;
          background: linear-gradient(135deg, #e52d1d, #a78bfa);
          -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
        }

        .la-stats {
          display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
          gap: 14px; margin-bottom: 28px;
        }
        .la-stat {
          padding: 24px;
          background: rgba(20,20,22,0.7);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px; backdrop-filter: blur(20px);
          transition: border-color 0.3s, transform 0.3s;
        }
        .la-stat:hover { border-color: rgba(229,45,29,0.4); transform: translateY(-3px); }
        .la-stat-label { font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(255,255,255,0.5); font-weight: 600; margin: 0 0 12px; }
        .la-stat-value {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 2.6rem; font-weight: 400; line-height: 1; letter-spacing: -0.03em;
          color: #fff;
        }
        .la-stat-big .la-stat-value { font-size: 3.5rem; }
        .la-stat-value em { color: #e52d1d; font-style: italic; }
        .la-stat-trend { font-size: 12px; color: rgba(255,255,255,0.5); margin-top: 8px; }

        .la-section { margin-bottom: 36px; }
        .la-section-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 22px; font-weight: 400; font-style: italic;
          margin: 0 0 16px; color: #fff; letter-spacing: -0.01em;
        }
        .la-card {
          background: rgba(20,20,22,0.7);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px; overflow: hidden; backdrop-filter: blur(20px);
        }
        .la-table-wrap { overflow-x: auto; }
        .la-table { width: 100%; border-collapse: collapse; min-width: 720px; }
        .la-table th {
          text-align: left; padding: 14px 22px;
          color: rgba(255,255,255,0.5); font-size: 10.5px; font-weight: 600;
          letter-spacing: 0.18em; text-transform: uppercase;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .la-table td {
          padding: 14px 22px; color: rgba(255,255,255,0.85); font-size: 13.5px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .la-table tr:last-child td { border-bottom: none; }
        .la-table tr:hover td { background: rgba(255,255,255,0.025); }
        .la-pill {
          display: inline-block; padding: 3px 10px; border-radius: 100px;
          font-size: 10.5px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
        }
        .la-pill.basic { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7); }
        .la-pill.pro { background: rgba(167,139,250,0.18); color: #c4b5fd; }
        .la-pill.premium { background: rgba(229,45,29,0.18); color: #fda4a1; }
        .la-pill.live { background: rgba(34,197,94,0.15); color: #22c55e; }
        .la-pill.draft { background: rgba(245,158,11,0.15); color: #f59e0b; }
        .la-empty { padding: 50px; text-align: center; color: rgba(255,255,255,0.4); font-size: 13px; }

        .la-plans {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px;
        }
        .la-plan {
          padding: 24px;
          background: rgba(20,20,22,0.7);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
        }
        .la-plan-name {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-style: italic; font-size: 1.6rem; font-weight: 400;
          color: #fff; margin: 0 0 8px;
        }
        .la-plan-count {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 3rem; font-weight: 400; line-height: 1;
          color: #fff;
        }
        .la-plan-revenue { font-size: 13px; color: rgba(255,255,255,0.5); margin-top: 6px; }

        @media (max-width: 768px) {
          .la-stats { grid-template-columns: 1fr 1fr; }
          .la-stat-big { grid-column: span 2; }
          .la-plans { grid-template-columns: 1fr; }
          .la-top { flex-direction: column; align-items: flex-start; gap: 12px; }
        }
      `}</style>

      <div className="la-bg" />
      <div className="la-wrap">
        <div className="la-top">
          <div className="la-brand">
            <span className="la-brand-name">Lumino</span>
            <span className="la-brand-mark">Control</span>
          </div>
          <div className="la-user">
            Loggato come <strong>{user.email}</strong>
          </div>
        </div>

        <div className="la-hero">
          <p className="la-hero-eyebrow">✦ control center</p>
          <h1 className="la-hero-title">La <em>tua</em> piattaforma.<br />Tutto sotto controllo.</h1>
        </div>

        {/* MAIN STATS */}
        <div className="la-stats">
          <div className="la-stat la-stat-big">
            <p className="la-stat-label">Utenti registrati</p>
            <p className="la-stat-value">{totalUsers}</p>
            <p className="la-stat-trend">{liveSites} siti attivi · {draftSites} in draft</p>
          </div>
          <div className="la-stat">
            <p className="la-stat-label">Siti totali</p>
            <p className="la-stat-value">{totalSites}</p>
          </div>
          <div className="la-stat">
            <p className="la-stat-label">Siti live</p>
            <p className="la-stat-value">{liveSites}</p>
          </div>
          <div className="la-stat">
            <p className="la-stat-label">In draft</p>
            <p className="la-stat-value">{draftSites}</p>
          </div>
          <div className="la-stat">
            <p className="la-stat-label">Prenotazioni 30gg</p>
            <p className="la-stat-value">{reservations30d}</p>
          </div>
        </div>

        {/* PLAN BREAKDOWN */}
        <div className="la-section">
          <h2 className="la-section-title">Distribuzione piani</h2>
          <div className="la-plans">
            <div className="la-plan">
              <p className="la-plan-name">Basic</p>
              <p className="la-plan-count">{planCount.basic}</p>
              <p className="la-plan-revenue">{planCount.basic === 1 ? 'utente' : 'utenti'}</p>
            </div>
            <div className="la-plan" style={{ borderColor: 'rgba(167,139,250,0.3)' }}>
              <p className="la-plan-name" style={{ color: '#c4b5fd' }}>Pro</p>
              <p className="la-plan-count">{planCount.pro}</p>
              <p className="la-plan-revenue">{planCount.pro === 1 ? 'utente' : 'utenti'}</p>
            </div>
            <div className="la-plan" style={{ borderColor: 'rgba(229,45,29,0.3)' }}>
              <p className="la-plan-name" style={{ color: '#fda4a1' }}>Premium</p>
              <p className="la-plan-count">{planCount.premium}</p>
              <p className="la-plan-revenue">{planCount.premium === 1 ? 'utente' : 'utenti'}</p>
            </div>
          </div>
        </div>

        {/* RECENT SIGNUPS */}
        <div className="la-section">
          <h2 className="la-section-title">Registrazioni recenti</h2>
          <div className="la-card">
            <div className="la-table-wrap">
              <table className="la-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Ristorante</th>
                    <th>Piano</th>
                    <th>Stato sito</th>
                    <th>Iscritto il</th>
                    <th>Slug</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 && (
                    <tr><td colSpan={6} className="la-empty">Ancora nessun utente registrato.</td></tr>
                  )}
                  {users.slice(0, 50).map((u: any) => {
                    const site = siteByUser.get(u.id) as any
                    return (
                      <tr key={u.id}>
                        <td style={{ fontWeight: 600, color: '#fff' }}>{u.email}</td>
                        <td>{site?.restaurant?.name || u.user_metadata?.restaurant_name || '—'}</td>
                        <td><span className={`la-pill ${site?.tier || 'basic'}`}>{site?.tier || 'basic'}</span></td>
                        <td>{site ? <span className={`la-pill ${site.status === 'live' ? 'live' : 'draft'}`}>{site.status}</span> : <span style={{ color: 'rgba(255,255,255,0.3)' }}>—</span>}</td>
                        <td style={{ color: 'rgba(255,255,255,0.55)' }}>{new Date(u.created_at).toLocaleString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{site?.slug || '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ALL SITES */}
        <div className="la-section">
          <h2 className="la-section-title">Tutti i siti</h2>
          <div className="la-card">
            <div className="la-table-wrap">
              <table className="la-table">
                <thead>
                  <tr>
                    <th>Ristorante</th>
                    <th>Slug</th>
                    <th>Piano</th>
                    <th>Stato</th>
                    <th>Attivo</th>
                    <th>Creato il</th>
                    <th>Vai al sito</th>
                  </tr>
                </thead>
                <tbody>
                  {sites.length === 0 && (
                    <tr><td colSpan={7} className="la-empty">Ancora nessun sito creato.</td></tr>
                  )}
                  {sites.slice(0, 80).map((s: any) => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600, color: '#fff' }}>{s.restaurant?.name || '—'}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>{s.slug}</td>
                      <td><span className={`la-pill ${s.tier || 'basic'}`}>{s.tier || 'basic'}</span></td>
                      <td><span className={`la-pill ${s.status === 'live' ? 'live' : 'draft'}`}>{s.status}</span></td>
                      <td>{s.active ? '✓' : '—'}</td>
                      <td style={{ color: 'rgba(255,255,255,0.55)' }}>{new Date(s.created_at).toLocaleDateString('it-IT')}</td>
                      <td>
                        {s.slug && s.status === 'live' && (
                          <a href={`/sites/${s.slug}`} target="_blank" rel="noopener noreferrer" style={{ color: '#e52d1d', textDecoration: 'none', fontSize: 12, fontWeight: 600 }}>Apri ↗</a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
