import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Le foto profilo.
 *
 * Bucket **privato**, come `staff-field`. Sono le facce di chi lavora qui: un
 * bucket pubblico vorrebbe dire che l'indirizzo di ognuna è indovinabile e
 * resta valido per sempre, e una foto di una persona non è un logo. Il prezzo è
 * una firma da rinnovare, ed è quello che fa questo file.
 *
 * Sta a parte da `storage.ts` non per ordine ma perché le due cose hanno
 * scadenze diverse: le foto di campo si guardano dentro una scheda e un'ora
 * basta; un avatar sta nel rail di **tutte** le pagine, quindi la firma dura più
 * a lungo — se scadesse a metà giornata l'utente vedrebbe la propria faccia
 * diventare un'iniziale senza aver fatto niente.
 */
export const BUCKET_AVATAR = 'staff-avatars'

/**
 * Sei ore.
 *
 * Non ventiquattro: una firma è un URL che funziona per chiunque lo abbia, e più
 * dura più a lungo resta in giro nella cronologia di qualcuno. Sei ore coprono
 * una giornata di lavoro con un margine, e le pagine di /staff sono
 * `force-dynamic`, quindi la firma si rifà a ogni apertura.
 */
const DURATA_FIRMA = 21_600

/**
 * Da percorso a URL guardabile. Una sola foto, una sola chiamata.
 *
 * Se la firma non riesce — file cancellato, bucket rifatto — torna `null` e
 * l'interfaccia mostra le iniziali. Un avatar mancante non deve poter impedire
 * l'apertura di una pagina: è la decorazione più sostituibile che ci sia.
 */
export async function firmaAvatar(path: string | null | undefined): Promise<string | null> {
  if (!path) return null
  const mappa = await firmaAvatars([path])
  return mappa[path] ?? null
}

/** Più avatar in un viaggio solo: la pagina Team ne mostra uno per riga. */
export async function firmaAvatars(paths: (string | null | undefined)[]): Promise<Record<string, string>> {
  const puliti = Array.from(new Set(paths.filter((p): p is string => Boolean(p))))
  if (!puliti.length) return {}

  try {
    const { data, error } = await createAdminClient()
      .storage.from(BUCKET_AVATAR)
      .createSignedUrls(puliti, DURATA_FIRMA)
    if (error || !data) return {}

    const mappa: Record<string, string> = {}
    for (const riga of data) {
      if (riga.path && riga.signedUrl) mappa[riga.path] = riga.signedUrl
    }
    return mappa
  } catch {
    /* Il bucket può non esistere ancora: è documentato in
       supabase/storage-buckets.md e si crea a mano. Fino a quel momento le
       iniziali, non un errore. */
    return {}
  }
}

/** Le iniziali: due se il nome ha due parole, una se ne ha una. */
export function iniziali(nome: string): string {
  const parti = nome.trim().split(/\s+/).filter(Boolean)
  if (!parti.length) return '·'
  if (parti.length === 1) return parti[0].charAt(0).toUpperCase()
  return (parti[0].charAt(0) + parti[parti.length - 1].charAt(0)).toUpperCase()
}
