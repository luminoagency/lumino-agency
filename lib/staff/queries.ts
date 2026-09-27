import { createClient } from '@/lib/supabase/server'
import { STAFF_COUNTRY, type ClienteRiga } from './types'

const CAMPI_CLIENTE = `
  id, nome, settore, citta, zona, indirizzo, referente, telefono, email, instagram,
  sito_attuale, note_sito, stato, motivo_rifiuto, assegnato_a, prezzo_consigliato,
  voto_sito, fonte, created_at
`

export interface ElencoClienti {
  clienti: ClienteRiga[]
  /** Il valore in campo per cliente: il chiuso se c'è, altrimenti il proposto. */
  prezzi: Record<string, number | null>
  venditori: { id: string; nome: string }[]
  zone: string[]
  mancaSchema: boolean
}

/**
 * L'elenco che alimenta pipeline e vista a lista.
 *
 * Tre query e non una join: PostgREST restituirebbe il deal annidato dentro
 * ogni cliente, e con più trattative per cliente andrebbe comunque appiattito
 * qui. Tanto vale leggerle in parallelo e incrociarle in memoria — sono
 * centinaia di righe, non milioni.
 *
 * Le zone e i venditori si ricavano dai dati veri: un elenco di zone scritto a
 * mano diventa sbagliato al primo cliente in un paese nuovo.
 */
export async function caricaClienti(): Promise<ElencoClienti> {
  const supabase = createClient()

  const [clienti, deals, profili] = await Promise.all([
    supabase
      .from('staff_clients')
      .select(CAMPI_CLIENTE)
      .eq('country', STAFF_COUNTRY)
      .order('created_at', { ascending: false }),
    supabase.from('staff_deals').select('client_id, prezzo_proposto, prezzo_chiuso'),
    supabase.from('staff_profiles').select('id, nome').eq('attivo', true).order('nome'),
  ])

  const righe = (clienti.data ?? []) as unknown as ClienteRiga[]

  const prezzi: Record<string, number | null> = {}
  for (const d of (deals.data ?? []) as {
    client_id: string
    prezzo_proposto: number | null
    prezzo_chiuso: number | null
  }[]) {
    prezzi[d.client_id] = d.prezzo_chiuso ?? d.prezzo_proposto ?? prezzi[d.client_id] ?? null
  }
  /* Il prezzo consigliato è l'ultima spiaggia: meglio un numero indicativo che
     una card muta, purché non ci sia già una trattativa vera. */
  for (const c of righe) {
    if (prezzi[c.id] == null) prezzi[c.id] = c.prezzo_consigliato
  }

  const zone = Array.from(
    new Set(righe.map((c) => c.zona ?? c.citta).filter((z): z is string => Boolean(z))),
  ).sort((a, b) => a.localeCompare(b, 'it'))

  return {
    clienti: righe,
    prezzi,
    venditori: (profili.data ?? []) as { id: string; nome: string }[],
    zone,
    mancaSchema: [clienti, deals, profili].some((r) => r.error?.code === '42P01'),
  }
}

/** L'avviso che compare finché la migration 0030 non è passata. */
export const AVVISO_SCHEMA =
  'Le tabelle dell’area staff non esistono ancora su questo database: esegui supabase/migrations/0030_staff_dashboard.sql nell’SQL editor di Supabase.'
