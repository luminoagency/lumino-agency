import PageHead from '@/components/staff/PageHead'
import { requireStaff } from '@/lib/staff/auth'
import { eAdmin } from '@/lib/staff/permessi'
import { demoAttivo } from '@/lib/staff/demo'
import { caricaRisorse } from '@/lib/staff/f5'
import { AVVISO_SCHEMA } from '@/lib/staff/queries'
import RisorseView from './RisorseView'

export const metadata = { title: 'Risorse' }
export const dynamic = 'force-dynamic'

/**
 * Il materiale.
 *
 * Tutti leggono, solo l'admin aggiunge — lo dice la policy della 0030 e questa
 * pagina non la ricontrolla: passa `isAdmin` all'interfaccia per **non mostrare
 * bottoni che non funzionerebbero**, che è una cosa diversa dal proteggere. La
 * protezione sta nel database.
 */
export default async function RisorsePage() {
  const me = await requireStaff()
  const { risorse, mancaSchema } = await caricaRisorse(demoAttivo(me.role))

  const nostri = risorse.filter((r) => r.nostro).length

  return (
    <>
      <PageHead
        title={
          <>
            Il <em>materiale</em>
          </>
        }
        sub={
          risorse.length
            ? `${risorse.length} voci, ${nostri} caricate qui. Si aprono dal telefono, davanti a un titolare.`
            : 'Listino, manuale di vendita e demo per settore: quello che serve avere in mano davanti a un titolare.'
        }
      />

      {mancaSchema && <p className="lm-avviso">{AVVISO_SCHEMA}</p>}

      <RisorseView risorse={risorse} isAdmin={eAdmin(me)} />
    </>
  )
}
