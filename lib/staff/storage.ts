import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Le foto di campo.
 *
 * Il bucket è **privato**: dentro ci sono vetrine, sale e a volte facce, ed è
 * materiale di lavoro, non contenuto pubblico come le gallery dei siti
 * generati. Il prezzo di essere privato è che ogni immagine va firmata prima
 * di poterla mostrare, ed è quello che fa questo file.
 *
 * Sta a parte da queries.ts perché importa il client service-role: un modulo
 * che lo contiene non deve mai finire, nemmeno per sbaglio, dentro un
 * componente client.
 *
 * Il bucket non nasce da una migration SQL — Storage non si crea con la DDL.
 * È documentato in supabase/storage-buckets.md e va ricreato di lì se il
 * progetto Supabase si rifà da zero.
 */
export const BUCKET_CAMPO = 'staff-field'

/** Un'ora: il tempo di guardare una scheda, non di girare un link. */
const DURATA_FIRMA = 3600

/**
 * Da percorsi a URL guardabili.
 *
 * Firma in blocco, non una chiamata per foto: una scheda con quattro immagini
 * farebbe quattro viaggi a Storage per niente.
 *
 * Le chiavi del risultato sono i percorsi di partenza, così chi chiama non
 * deve fidarsi dell'ordine. Una foto che non si firma — file sparito, bucket
 * rifatto — semplicemente non compare: una scheda con tre foto invece di
 * quattro è meglio di una scheda che non si apre.
 */
export async function firmaFoto(paths: string[]): Promise<Record<string, string>> {
  const puliti = Array.from(new Set(paths.filter(Boolean)))
  if (!puliti.length) return {}

  const { data, error } = await createAdminClient()
    .storage.from(BUCKET_CAMPO)
    .createSignedUrls(puliti, DURATA_FIRMA)

  if (error || !data) return {}

  const mappa: Record<string, string> = {}
  for (const riga of data) {
    if (riga.path && riga.signedUrl) mappa[riga.path] = riga.signedUrl
  }
  return mappa
}
