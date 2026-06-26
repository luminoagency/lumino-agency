import type { Metadata } from 'next'
import SiteChrome from '@/components/site/SiteChrome'
import IniziaForm from './IniziaForm'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata: Metadata = {
  title: 'Inizia ora · Lumino',
  description:
    'Raccontaci del tuo locale e ti ricontattiamo noi. Lascia i tuoi dati: pensiamo noi al tuo nuovo sito.',
}

export const dynamic = 'force-dynamic'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Pre-compilazione smart: se l'URL contiene ?lead=<uuid> e l'uuid corrisponde
 * a un record in `restaurants`, i campi del form arrivano già compilati.
 */
async function loadLead(leadId?: string): Promise<{
  leadId?: string
  known: boolean
  prefill?: { restaurantName?: string; phone?: string; email?: string }
}> {
  if (!leadId || !UUID_RE.test(leadId)) return { known: false }
  try {
    const db = createAdminClient()
    const { data } = await db
      .from('restaurants')
      .select('id, name, phone, email')
      .eq('id', leadId)
      .maybeSingle()
    if (!data) return { known: false }
    return {
      leadId: data.id as string,
      known: true,
      prefill: {
        restaurantName: (data.name as string) || '',
        phone: (data.phone as string) || '',
        email: (data.email as string) || '',
      },
    }
  } catch {
    // Se il client admin non è configurato (es. dev senza env) il form resta vuoto.
    return { known: false }
  }
}

export default async function IniziaPage({
  searchParams,
}: {
  searchParams: { lead?: string }
}) {
  const { leadId, known, prefill } = await loadLead(searchParams?.lead)

  return (
    <SiteChrome
      header={{
        kicker: '✦ inizia ora',
        title: (
          <>
            Raccontaci del tuo <em>locale</em>.
          </>
        ),
        intro:
          'Lascia i tuoi dati e ti ricontattiamo noi. Niente impegno: capiamo cosa ti serve e ti mostriamo come può essere il tuo nuovo sito.',
      }}
    >
      <div className="ls-container">
        <section className="ls-section" style={{ paddingTop: '1rem', paddingBottom: '4rem' }}>
          <div className="ls-card" style={{ maxWidth: 680, margin: '0 auto' }}>
            <h3 style={{ marginBottom: 18 }}>I tuoi dati</h3>
            <IniziaForm leadId={leadId} known={known} prefill={prefill} />
          </div>
        </section>
      </div>
    </SiteChrome>
  )
}
