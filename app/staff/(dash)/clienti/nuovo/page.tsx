import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import PageHead from '@/components/staff/PageHead'
import { requireStaff } from '@/lib/staff/auth'
import { createClient } from '@/lib/supabase/server'
import NuovoClienteForm from './NuovoClienteForm'

export const metadata = { title: 'Nuovo cliente' }

export const dynamic = 'force-dynamic'

export default async function NuovoClientePage() {
  const me = await requireStaff()
  const supabase = createClient()

  /* L'elenco dei colleghi serve solo all'admin. Un venditore lo riceverebbe
     comunque filtrato dalla RLS (vede solo sé), ma chiederlo per poi non
     mostrarlo è una query in meno da fare. */
  const { data: venditori } =
    me.role === 'admin'
      ? await supabase.from('staff_profiles').select('id, nome').eq('attivo', true).order('nome')
      : { data: [{ id: me.id, nome: me.nome }] }

  return (
    <>
      <Link href="/staff/clienti" className="lm-back">
        <ArrowLeft aria-hidden="true" />
        Clienti
      </Link>

      <PageHead
        title="Nuovo cliente"
        sub="Basta il nome. Il resto si compila man mano che lo si conosce."
      />

      <NuovoClienteForm
        venditori={(venditori ?? []) as { id: string; nome: string }[]}
        isAdmin={me.role === 'admin'}
        ioId={me.id}
      />
    </>
  )
}
