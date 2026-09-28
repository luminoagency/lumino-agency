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
  searchParams: { next?: string }
}) {
  const supabase = createClient()
  const { data: auth } = await supabase.auth.getUser()

  /* Tre esiti, non due, e la differenza fra loro è tutto il messaggio.
     `nessuna`  → non c'è nessuna sessione: si chiede di entrare.
     `non-staff`→ la sessione è valida ma in `staff_profiles` non c'è la riga.
     `sospeso`  → la riga c'è e ha `attivo = false`.
     Prima erano un caso solo, «questo account non è dello staff», e su un
     account che *è* dello staff ma la cui riga non è ancora stata inserita
     quel messaggio è falso: manda a cercare credenziali diverse invece di dire
     che manca un inserimento nel database. */
  let esito: 'nessuna' | 'non-staff' | 'sospeso' = 'nessuna'
  let entratoCome: string | null = null

  if (auth.user) {
    entratoCome = auth.user.email ?? null
    const { data: profile } = await supabase
      .from('staff_profiles')
      .select('id, attivo')
      .eq('id', auth.user.id)
      .maybeSingle()

    if (profile?.attivo) redirect(safeNext(searchParams.next))
    esito = profile ? 'sospeso' : 'non-staff'
  }

  return (
    <div className="lm-staff-login">
      <div className="lm-login-card">
        <span className="lm-staff-brand">
          <Wordmark animated={false} />
          <span className="lm-staff-tag">Staff</span>
        </span>

        <h1 className="lm-h1">Bentornato</h1>
        <p className="lm-sub">
          {esito === 'nessuna'
            ? 'Area interna. Clienti, trattative, visite e incassi.'
            : esito === 'sospeso'
              ? 'L’accesso di questo account è stato sospeso. Chiedi a un amministratore di riattivarlo.'
              : 'L’account esiste e la password è giusta: quello che manca è la riga nell’elenco dello staff. Deve inserirla un amministratore — non è una password da ritrovare.'}
        </p>

        {/* Il modo di uscire da una sessione che non apre niente. Senza, chi
            entra con l'account sbagliato resta bloccato su questa pagina: il
            modulo lo rifà entrare con lo stesso utente e il cookie non si
            cancella da sé. */}
        {esito !== 'nessuna' && (
          <div className="lm-login-chi">
            <span>
              Sei entrato come <b>{entratoCome ?? 'questo account'}</b>.
            </span>
            <form action="/staff/logout" method="post">
              <button type="submit">Esci e prova con un altro</button>
            </form>
          </div>
        )}

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
