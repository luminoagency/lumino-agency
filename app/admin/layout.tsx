import type { Metadata } from 'next'
import { getMySite } from './actions/site'
import { AdminSidebar } from './AdminSidebar'
import { AdminStyles } from './AdminStyles'

export const metadata: Metadata = { title: 'Admin — Lumino' }

// force-dynamic: lo shell legge il sito dell'utente ad ogni richiesta.
export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const site = await getMySite()

  // Nessun sito (non loggato o account senza sito): niente shell — lasciamo che
  // la pagina gestisca il redirect al login o la schermata "Nessun sito collegato".
  if (!site) {
    return <div style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{children}</div>
  }

  const tier = (site as any).tier as string

  return (
    <div className="as-shell">
      <AdminStyles />
      <AdminSidebar tier={tier} />
      <main className="as-main">{children}</main>
    </div>
  )
}
