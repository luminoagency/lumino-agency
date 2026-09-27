import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Progress } from '@/components/staff/Bars'
import Cascade from '@/components/staff/Cascade'
import Counter from '@/components/staff/Counter'
import PageHead from '@/components/staff/PageHead'
import Ring from '@/components/staff/Ring'
import Spark from '@/components/staff/Spark'
import Tilt from '@/components/staff/Tilt'
import { requireStaff } from '@/lib/staff/auth'
import { demoAttivo } from '@/lib/staff/demo'
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
  const me = await requireStaff()
  const { visite, foto, daFare, fatti, mancaSchema } = await caricaCampo(demoAttivo(me.role))

  const oggi = oggiISO()
  const settimanaFa = new Date(Date.now() - 7 * 86_400_000).toISOString()

  const questaSettimana = visite.filter((v) => v.created_at >= settimanaFa).length
  const perOggi = daFare.filter((f) => f.data === oggi).length
  const inRitardo = daFare.filter((f) => f.data < oggi).length

  /* Quattordici giorni di visite, una colonna per giorno: è quello che
     distingue «tre visite» da «tre visite tutte di lunedì e poi più niente». */
  const perGiorno = Array.from({ length: 14 }, (_, i) => {
    const g = new Date(Date.now() - (13 - i) * 86_400_000).toISOString().slice(0, 10)
    return visite.filter((v) => v.created_at.slice(0, 10) === g).length
  })

  const chiusi = fatti.length
  const quotaChiusa = chiusi + daFare.length > 0 ? (chiusi / (chiusi + daFare.length)) * 100 : 0

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

      <Tilt>
        <Cascade className="lm-bento">
          <div className="lm-card lm-in" data-span="4" data-tone="black" data-hover data-reveal>
            <div className="lm-card-top">
              <span className="lm-label">Visite, ultimi 7 giorni</span>
              <span className="lm-live" style={{ color: 'rgba(255,255,255,0.7)' }}>
                in corso
              </span>
            </div>
            <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
              <Counter value={questaSettimana} size="xl" />
              <p className="lm-kpi-name">{visite.length} in tutto l&apos;archivio recente</p>
            </div>
            <Spark serie={perGiorno} label="Visite giorno per giorno, ultime due settimane" />
          </div>

          <div className="lm-card lm-in" data-span="4" data-hover data-reveal>
            <span className="lm-label">Da richiamare oggi</span>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.2rem',
                marginTop: 'auto',
                paddingTop: '1rem',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <Counter value={perOggi} size="lg" />
                <p className="lm-kpi-name">{daFare.length} richiami aperti in tutto</p>
              </div>
              <Ring
                value={quotaChiusa}
                cap="chiusi"
                size={92}
                stroke={5}
                label="Quota di richiami già chiusi"
              />
            </div>
          </div>

          <div className="lm-card lm-in" data-span="4" data-tone="pearl" data-hover data-reveal>
            <span className="lm-label">In ritardo</span>
            <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
              <Counter value={inRitardo} size="lg" />
              <p className="lm-kpi-name">
                {inRitardo === 0 ? 'Niente arretrato' : 'Scaduti e ancora aperti'}
              </p>
            </div>
            <div style={{ marginTop: '1.1rem' }}>
              <Progress
                label="Arretrato sui richiami aperti"
                value={inRitardo}
                max={Math.max(1, daFare.length)}
                tone={inRitardo > 0 ? 'violet' : undefined}
              />
            </div>
          </div>
        </Cascade>
      </Tilt>

      <CampoView visite={visite} foto={foto} daFare={daFare} fatti={fatti} />
    </>
  )
}
