import Link from 'next/link'
import { LayoutGrid, Plus, Upload } from 'lucide-react'
import PageHead from '@/components/staff/PageHead'
import { requireStaff } from '@/lib/staff/auth'
import { puo } from '@/lib/staff/permessi'
import { demoAttivo } from '@/lib/staff/demo'
import { AVVISO_SCHEMA, caricaClienti } from '@/lib/staff/queries'
import ClientiView from './ClientiView'

export const metadata = { title: 'Clienti' }

export const dynamic = 'force-dynamic'

export default async function ClientiPage() {
  const me = await requireStaff()
  const gestione = puo(me, 'can_manage_clients')
  const { clienti, prezzi, venditori, zone, mancaSchema } = await caricaClienti(
    demoAttivo(me.role),
  )

  /* I prezzi si **svuotano**, non si disegnano a zero: `prezzo` arriva
     `undefined` a ogni card e la riga del valore semplicemente non c'è. Un
     «0 €» accanto al nome di un locale non dice «non ti è permesso», dice che
     quel locale non vale niente — ed è un'informazione falsa. */
  const prezziVisibili = puo(me, 'can_view_soldi') ? prezzi : {}

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
        {gestione && (
          <>
            <Link href="/staff/clienti/importa" className="lm-btn" data-variant="ghost">
              <Upload aria-hidden="true" />
              Importa CSV
            </Link>
            <Link href="/staff/clienti/nuovo" className="lm-btn">
              <Plus aria-hidden="true" />
              Nuovo cliente
            </Link>
          </>
        )}
      </PageHead>

      {mancaSchema && <p className="lm-warn">{AVVISO_SCHEMA}</p>}

      <ClientiView
        clienti={clienti}
        prezzi={prezziVisibili}
        venditori={venditori}
        zone={zone}
        gestione={gestione}
      />
    </>
  )
}
