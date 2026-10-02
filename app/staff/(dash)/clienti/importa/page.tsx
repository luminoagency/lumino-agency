import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import PageHead from '@/components/staff/PageHead'
import { requireStaff } from '@/lib/staff/auth'
import { eAdmin, puo } from '@/lib/staff/permessi'
import ImportCsv from './ImportCsv'

export const metadata = { title: 'Importa CSV' }

export default async function ImportaPage() {
  const me = await requireStaff()
  if (!puo(me, 'can_manage_clients')) notFound()

  return (
    <>
      <Link href="/staff/clienti" className="lm-back">
        <ArrowLeft aria-hidden="true" />
        Clienti
      </Link>

      <PageHead
        title="Importa lead"
        sub="Un CSV esportato da Maps, da un gestionale o da un foglio. Prima si guarda cosa entra, poi si importa."
      />

      <p className="lm-sub" style={{ marginBottom: '1.2rem' }}>
        {eAdmin(me)
          ? 'I clienti importati restano intestati a te: l’assegnazione a un venditore si cambia dalla scheda.'
          : 'I clienti importati vengono intestati a te.'}
      </p>

      <ImportCsv />
    </>
  )
}
