import { redirect } from 'next/navigation'
import { getMySite } from '../actions/site'
import { listMyReservations } from '../actions/reservations'
import { ReservationsManager } from './ReservationsManager'

export const dynamic = 'force-dynamic'

export default async function PrenotazioniPage() {
  const site = await getMySite()
  if (!site) {
    redirect('/login?next=' + encodeURIComponent('/admin/prenotazioni') + '&error=' + encodeURIComponent('Accedi per gestire le prenotazioni.'))
  }

  const tier = (site as any).tier as string
  if (tier === 'basic') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif', padding: '2rem' }}>
        <div style={{ textAlign: 'center', maxWidth: 460 }}>
          <h1 style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: 32, fontStyle: 'italic', marginBottom: 12 }}>Prenotazioni non incluse nel piano Basic</h1>
          <p style={{ color: '#aaa', lineHeight: 1.6 }}>Passa al piano Pro o Premium per ricevere prenotazioni online.</p>
          <a href="/admin" style={{ color: '#e52d1d', display: 'inline-block', marginTop: 18 }}>← Torna al pannello</a>
        </div>
      </div>
    )
  }

  const r = await listMyReservations('all')
  return (
    <ReservationsManager
      siteSlug={(site as any).slug}
      initial={r.reservations || []}
    />
  )
}
