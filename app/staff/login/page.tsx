import { redirect } from 'next/navigation'
import Wordmark from '@/components/home/Wordmark'
import { createClient } from '@/lib/supabase/server'
import LoginForm from './LoginForm'

export const metadata = { title: 'Accesso staff' }

/**
 * Accesso all'area staff.
 *
 * Chi è già dentro non deve rivedere il modulo: se la sessione c'è ED è di uno
 * staff, si entra. Il secondo controllo non è pignoleria — la stessa istanza
 * Supabase autentica i titolari dei ristoranti, e senza quel controllo un
 * cliente loggato sul proprio sito verrebbe rimbalzato su /staff, dove il gate
 * lo respingerebbe e lo rimanderebbe qui: un anello.
 */
export default async function StaffLoginPage({
  searchParams,
}: {
  searchParams: { next?: string; motivo?: string }
}) {
  const supabase = createClient()
  const { data: auth } = await supabase.auth.getUser()

  if (auth.user) {
    const { data: profile } = await supabase
      .from('staff_profiles')
      .select('id, attivo')
      .eq('id', auth.user.id)
      .maybeSingle()

    if (profile?.attivo) redirect(safeNext(searchParams.next))
  }

  return (
    <div className="lm-staff-login">
      <div className="lm-staff-login-box">
        <span className="lm-staff-brand">
          <Wordmark animated={false} />
          <span className="lm-staff-tag">Staff</span>
        </span>

        <h1 className="lm-staff-h1" style={{ marginTop: '1.4rem' }}>
          Bentornato.
        </h1>
        <p className="lm-staff-sub">
          {searchParams.motivo === 'non-autorizzato'
            ? 'Questo account esiste ma non è un account dello staff. Entra con le credenziali dello staff.'
            : 'Area interna. Clienti, trattative, visite e incassi.'}
        </p>

        <LoginForm next={safeNext(searchParams.next)} />
      </div>
    </div>
  )
}

/**
 * Il `next` arriva dalla barra degli indirizzi, quindi è ostile fino a prova
 * contraria: senza questo filtro `?next=https://altrove` diventa un redirect
 * aperto, cioè una pagina di login credibile che sputa l'utente su un dominio
 * di qualcun altro. Si accettano solo percorsi interni all'area.
 */
function safeNext(value: string | undefined): string {
  if (!value) return '/staff'
  if (!value.startsWith('/staff')) return '/staff'
  if (value.startsWith('//')) return '/staff'
  return value
}
