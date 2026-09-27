import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { requireStaff } from '@/lib/staff/auth'
import { demoAttivo } from '@/lib/staff/demo'
import { AVVISO_SCHEMA, clientiPerVisita } from '@/lib/staff/queries'
import NuovaVisita from './NuovaVisita'

export const metadata = { title: 'Nuova visita' }
export const dynamic = 'force-dynamic'

/**
 * L'elenco dei clienti arriva tutto insieme, non a ogni lettera digitata.
 *
 * Sono poche centinaia di righe strette, e la ricerca poi gira in memoria: in
 * strada, con una linea che va e viene, una ricerca che chiama il server a
 * ogni tasto è una ricerca che non risponde. Quello che la RLS non lascia
 * vedere non arriva nemmeno qui, quindi l'elenco completo è comunque il
 * proprio.
 */
export default async function NuovaVisitaPage() {
  const me = await requireStaff()
  const { clienti, mancaSchema } = await clientiPerVisita(demoAttivo(me.role))

  return (
    <>
      <Link href="/staff/campo" className="lm-back">
        <ArrowLeft aria-hidden="true" />
        Campo
      </Link>

      {mancaSchema && <p className="lm-warn">{AVVISO_SCHEMA}</p>}

      <NuovaVisita clienti={clienti} isAdmin={me.role === 'admin'} ioId={me.id} />
    </>
  )
}
