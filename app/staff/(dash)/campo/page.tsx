import Link from 'next/link'
import { Plus } from 'lucide-react'
import Cascade from '@/components/staff/Cascade'
import Counter from '@/components/staff/Counter'
import PageHead from '@/components/staff/PageHead'
import { requireStaff } from '@/lib/staff/auth'
import { AVVISO_SCHEMA, caricaCampo } from '@/lib/staff/queries'
import { oggiISO } from '@/lib/staff/types'
import CampoView from './CampoView'

export const metadata = { title: 'Campo' }
export const dynamic = 'force-dynamic'

/**
 * Campo.
 *
 * Due cose sole: le visite fatte e i richiami da fare. Tutto il resto — i
 * numeri, i grafici, la pipeline — sta altrove, perché questa pagina si apre
 * in piedi davanti a un locale e ha un compito solo, portare al bottone
 * «Nuova visita» o dire chi va richiamato adesso.
 *
 * I tre numeri in testa non sono un cruscotto: sono la risposta a «come sto
 * andando questa settimana» e «quanto sono indietro», che è l'unica domanda
 * che un venditore si fa fra una porta e l'altra.
 */
export default async function Campo() {
  await requireStaff()
  const { visite, foto, daFare, fatti, mancaSchema } = await caricaCampo()

  const oggi = oggiISO()
  const settimanaFa = new Date(Date.now() - 7 * 86_400_000).toISOString()

  const questaSettimana = visite.filter((v) => v.created_at >= settimanaFa).length
  const perOggi = daFare.filter((f) => f.data === oggi).length
  const inRitardo = daFare.filter((f) => f.data < oggi).length

  return (
    <>
      <PageHead
        title="Campo"
        sub="Una visita registrata in meno di due minuti, e i richiami che ne nascono."
      >
        <Link href="/staff/campo/nuova" className="lm-btn">
          <Plus aria-hidden="true" />
          Nuova visita
        </Link>
      </PageHead>

      {mancaSchema && <p className="lm-warn">{AVVISO_SCHEMA}</p>}

      <Cascade className="lm-bento">
        <div className="lm-card lm-in" data-span="4" data-tone="cream" data-reveal>
          <span className="lm-label">Visite, ultimi 7 giorni</span>
          <div style={{ marginTop: 'auto', paddingTop: '1.2rem' }}>
            <Counter value={questaSettimana} size="xl" />
            <p className="lm-kpi-name">
              {visite.length} in tutto l&apos;archivio recente
            </p>
          </div>
        </div>

        <div className="lm-card lm-in" data-span="4" data-glow data-reveal>
          <span className="lm-label">Da richiamare oggi</span>
          <div style={{ marginTop: 'auto', paddingTop: '1.2rem' }}>
            <Counter value={perOggi} size="lg" />
            <p className="lm-kpi-name">{daFare.length} richiami aperti</p>
          </div>
        </div>

        <div className="lm-card lm-in" data-span="4" data-reveal>
          <span className="lm-label">In ritardo</span>
          <div style={{ marginTop: 'auto', paddingTop: '1.2rem' }}>
            <Counter value={inRitardo} size="lg" />
            <p className="lm-kpi-name">
              {inRitardo === 0 ? 'Niente arretrato' : 'Scaduti e ancora aperti'}
            </p>
          </div>
        </div>
      </Cascade>

      <CampoView visite={visite} foto={foto} daFare={daFare} fatti={fatti} />
    </>
  )
}
