import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { StaffProfile } from './types'

/**
 * Chi sta guardando, e ha diritto di guardare.
 *
 * Il middleware controlla solo che *esista* un cookie di sessione: è un gate
 * ottimistico, non una verifica. Qui si verifica davvero, e si verifica una
 * cosa in più — che quell'utente abbia una riga in staff_profiles.
 *
 * Serve perché la stessa istanza Supabase autentica anche i titolari dei
 * ristoranti: un cliente con un account valido ha una sessione valida, e senza
 * questo controllo /staff gli si aprirebbe. Non essere staff non è un errore
 * di autenticazione, quindi non si rimanda al login (ci si tornerebbe in
 * cerchio): si dice che non è roba sua.
 */
export async function requireStaff(): Promise<StaffProfile> {
  const supabase = createClient()

  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect('/staff/login')

  const { data: profile } = await supabase
    .from('staff_profiles')
    .select('id, nome, email, telefono, role, attivo, obiettivo_mensile, provvigione_pct')
    .eq('id', auth.user.id)
    .maybeSingle()

  if (!profile || !profile.attivo) redirect('/staff/login?motivo=non-autorizzato')

  return profile as StaffProfile
}
