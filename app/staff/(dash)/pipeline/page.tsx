import Link from 'next/link'
import { List, Plus } from 'lucide-react'
import PageHead from '@/components/staff/PageHead'
import { requireStaff } from '@/lib/staff/auth'
import { puo } from '@/lib/staff/permessi'
import { demoAttivo } from '@/lib/staff/demo'
import { AVVISO_SCHEMA, caricaClienti } from '@/lib/staff/queries'
import PipelineView from './PipelineView'

export const metadata = { title: 'Pipeline' }

/* I dati cambiano a ogni trascinamento: una pagina statica mostrerebbe il
   kanban di ieri. */
export const dynamic = 'force-dynamic'

export default async function PipelinePage() {
  const me = await requireStaff()
  const gestione = puo(me, 'can_manage_clients')
  const { clienti, prezzi, venditori, zone, mancaSchema } = await caricaClienti(
    demoAttivo(me.role),
  )
  /* Vedi la nota in `clienti/page.tsx`: senza il permesso i prezzi non ci
     sono, non valgono zero. */
  const prezziVisibili = puo(me, 'can_view_soldi') ? prezzi : {}

  return (
    <>
      <PageHead
        title="Pipeline"
        sub={
          gestione
            ? 'Tocca un numero per filtrare, trascina una card per cambiarle stato. Su rifiutato viene chiesto il motivo.'
            : 'Tocca un numero per filtrare. Lo stato lo sposta chi ha il permesso di gestire i clienti.'
        }
      >
        <Link href="/staff/clienti" className="lm-btn" data-variant="ghost">
          <List aria-hidden="true" />
          Vista lista
        </Link>
        {gestione && (
          <Link href="/staff/clienti/nuovo" className="lm-btn">
            <Plus aria-hidden="true" />
            Nuovo cliente
          </Link>
        )}
      </PageHead>

      {mancaSchema && <p className="lm-warn">{AVVISO_SCHEMA}</p>}

      <PipelineView
        clienti={clienti}
        prezzi={prezziVisibili}
        venditori={venditori}
        zone={zone}
        gestione={gestione}
      />
    </>
  )
}
