import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ANTEPRIMA } from './db'
import { PROFILO_DEMO } from './demo'
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
  /* In anteprima di sviluppo non c'è nessuna sessione da verificare: il
     profilo è finto come i dati. I due lucchetti stanno in db.ts. */
  if (ANTEPRIMA) return PROFILO_DEMO

  const supabase = createClient()

  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect('/staff/login')

  const { data: profile } = await supabase
    .from('staff_profiles')
    /* `*` e non l'elenco delle colonne: `ruolo_titolo`, `saluto_custom` e
       `foto_url` arrivano con la migration 0033, e nominarle esplicitamente
       farebbe fallire *ogni* pagina di /staff su un database dove quella non è
       ancora passata — cioè chiuderebbe l'area invece di mostrarla senza foto.
       È la stessa scelta della home per `is_demo`. */
    .select('*')
    .eq('id', auth.user.id)
    .maybeSingle()

  if (!profile || !profile.attivo) redirect('/staff/login?motivo=non-autorizzato')

  /* Le tre colonne della 0033 si normalizzano a `null`: con `select('*')` su un
     database dove la migration non è passata arriverebbero `undefined`, e
     `undefined` in un attributo React stampa la stringa vuota invece di far
     scattare il fallback delle iniziali. */
  const riga = profile as Record<string, unknown>
  return {
    ...(profile as StaffProfile),
    ruolo_titolo: (riga.ruolo_titolo as string | null) ?? null,
    saluto_custom: (riga.saluto_custom as string | null) ?? null,
    foto_url: (riga.foto_url as string | null) ?? null,
  }
}
