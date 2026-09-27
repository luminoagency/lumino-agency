import Link from 'next/link'
import { List, Plus } from 'lucide-react'
import PageHead from '@/components/staff/PageHead'
import { requireStaff } from '@/lib/staff/auth'
import { demoAttivo } from '@/lib/staff/demo'
import { AVVISO_SCHEMA, caricaClienti } from '@/lib/staff/queries'
import PipelineView from './PipelineView'

export const metadata = { title: 'Pipeline' }

/* I dati cambiano a ogni trascinamento: una pagina statica mostrerebbe il
   kanban di ieri. */
export const dynamic = 'force-dynamic'

export default async function PipelinePage() {
  const me = await requireStaff()
  const { clienti, prezzi, venditori, zone, mancaSchema } = await caricaClienti(
    demoAttivo(me.role),
  )

  return (
    <>
      <PageHead
        title="Pipeline"
        sub="Tocca un numero per filtrare, trascina una card per cambiarle stato. Su rifiutato viene chiesto il motivo."
      >
        <Link href="/staff/clienti" className="lm-btn" data-variant="ghost">
          <List aria-hidden="true" />
          Vista lista
        </Link>
        <Link href="/staff/clienti/nuovo" className="lm-btn">
          <Plus aria-hidden="true" />
          Nuovo cliente
        </Link>
      </PageHead>

      {mancaSchema && <p className="lm-warn">{AVVISO_SCHEMA}</p>}

      <PipelineView clienti={clienti} prezzi={prezzi} venditori={venditori} zone={zone} />
    </>
  )
}
