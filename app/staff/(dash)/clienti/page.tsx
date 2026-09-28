import Link from 'next/link'
import { LayoutGrid, Plus, Upload } from 'lucide-react'
import PageHead from '@/components/staff/PageHead'
import { requireStaff } from '@/lib/staff/auth'
import { demoAttivo } from '@/lib/staff/demo'
import { AVVISO_SCHEMA, caricaClienti } from '@/lib/staff/queries'
import ClientiView from './ClientiView'

export const metadata = { title: 'Clienti' }

export const dynamic = 'force-dynamic'

export default async function ClientiPage() {
  const me = await requireStaff()
  const { clienti, prezzi, venditori, zone, mancaSchema } = await caricaClienti(
    demoAttivo(me.role),
  )

  return (
    <>
      <PageHead
        title="Clienti"
        sub={`${clienti.length} client${clienti.length === 1 ? 'e' : 'i'} in archivio. Seleziona per vedere il dettaglio.`}
      >
        <Link href="/staff/pipeline" className="lm-btn" data-variant="ghost">
          <LayoutGrid aria-hidden="true" />
          Kanban
        </Link>
        <Link href="/staff/clienti/importa" className="lm-btn" data-variant="ghost">
          <Upload aria-hidden="true" />
          Importa CSV
        </Link>
        <Link href="/staff/clienti/nuovo" className="lm-btn">
          <Plus aria-hidden="true" />
          Nuovo cliente
        </Link>
      </PageHead>

      {mancaSchema && <p className="lm-warn">{AVVISO_SCHEMA}</p>}

      <ClientiView clienti={clienti} prezzi={prezzi} venditori={venditori} zone={zone} />
    </>
  )
}
