'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireStaff } from './auth'
import { BUCKET_AVATAR } from './avatar'
import type { Esito } from './actions'
import type { StaffRole } from './types'

/**
 * Creare un membro della squadra.
 *
 * ## Perché sta in un file suo, e perché per anni non è esistito
 *
 * La pagina Team diceva, scritto in chiaro: «gli account si creano nella
 * dashboard di Supabase». La ragione era giusta — creare un membro vuol dire
 * creare **credenziali**, cioè `auth.admin.createUser`, cioè la service-role —
 * e una route che crea account è il primo posto che qualcuno proverebbe a
 * spingere. Ora però si assume, e passare dalla dashboard di Supabase per ogni
 * persona significa che l'unico che può farlo è chi ha quelle chiavi.
 *
 * Quello che rende la cosa accettabile non è il codice qui sotto: è
 * `puo_creare_membri` (migration 0037), che è un permesso **che non si eredita
 * da `role`**. Un admin creato da questa stessa funzione non può a sua volta
 * creare account. Senza quella colonna, il primo membro aggiunto da qui
 * avrebbe ereditato la chiave di casa.
 *
 * ## Tre scritture, e l'ordine conta
 *
 * 1. l'utente in `auth.users`;
 * 2. la riga in `staff_profiles` — **se fallisce, l'utente si cancella**: un
 *    account che entra e trova «non è roba tua» è peggio di nessun account, e
 *    resterebbe lì a occupare l'email senza che nessuna pagina lo nomini;
 * 3. la foto, che è l'unica delle tre che può fallire senza rovinare niente.
 *    Il membro esiste già: si dice che la foto non è passata e si va avanti.
 *
 * La service-role salta la RLS, quindi la RLS qui non protegge niente: il
 * cancello è il controllo su `me.puo_creare_membri` in cima, e il trigger della
 * 0037 impedisce che quel permesso se lo dia qualcuno da solo.
 */
export async function creaMembro(form: FormData): Promise<Esito & { id?: string }> {
  const me = await requireStaff()
  if (!me.puo_creare_membri) {
    return { ok: false, error: 'Non hai il permesso di creare membri.' }
  }

  const nome = testo(form.get('nome'))
  const email = (testo(form.get('email')) ?? '').toLowerCase()
  const password = String(form.get('password') ?? '')
  const ruoloTitolo = testo(form.get('ruolo_titolo'))
  const role: StaffRole = form.get('role') === 'admin' ? 'admin' : 'sales'
  const foto = form.get('foto')

  if (!nome) return { ok: false, error: 'Il nome serve.' }
  if (nome.length > 80) return { ok: false, error: 'Il nome sta in ottanta caratteri.' }
  if (ruoloTitolo && ruoloTitolo.length > 40) {
    return { ok: false, error: 'Il ruolo sta in quaranta caratteri.' }
  }
  /* Un controllo largo apposta: l'unico giudice di un'email è il server di
     posta, e un'espressione regolare severa qui rifiuterebbe indirizzi veri. */
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'L’email non sembra un’email.' }
  }
  /* Otto e non sei (il minimo di Supabase): è una password che qualcun altro
     sceglie per te e che quasi nessuno cambia al primo accesso. */
  if (password.length < 8) {
    return { ok: false, error: 'La password iniziale vuole almeno otto caratteri.' }
  }

  const admin = createAdminClient()

  /* ── 1. l'account ───────────────────────────────────────────────────────── */
  /* `email_confirm: true` perché non c'è nessuna email da confermare: questo
     indirizzo lo sta scrivendo un co-founder guardando in faccia la persona,
     non è una registrazione da internet. Senza, il primo login rimbalzerebbe. */
  const { data: creato, error: errAuth } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nome },
  })

  if (errAuth || !creato?.user) {
    /* Supabase risponde 422 `email_exists` quando l'indirizzo c'è già. È il
       caso frequente — si riprova con la stessa persona — e merita una frase
       sua invece del messaggio inglese dell'API. */
    const gia =
      errAuth?.code === 'email_exists' ||
      /already (been )?registered|already exists/i.test(errAuth?.message ?? '')
    if (gia) {
      return {
        ok: false,
        error: `Esiste già un account con ${email}. Se è la persona giusta, va collegata al team da chi amministra il database.`,
      }
    }
    return { ok: false, error: errAuth?.message ?? 'L’account non è stato creato.' }
  }

  const id = creato.user.id

  /* ── 2. il profilo ──────────────────────────────────────────────────────── */
  const { error: errProfilo } = await admin.from('staff_profiles').insert({
    id,
    nome,
    email,
    role,
    ruolo_titolo: ruoloTitolo,
    attivo: true,
  })

  if (errProfilo) {
    await admin.auth.admin.deleteUser(id)
    return { ok: false, error: `Profilo non creato, account annullato: ${errProfilo.message}` }
  }

  /* ── 3. la foto ─────────────────────────────────────────────────────────── */
  let avvisoFoto: string | undefined
  if (foto instanceof File && foto.size > 0) {
    avvisoFoto = await salvaFoto(id, foto)
  }

  /* Il layout porta il rail con dentro i nomi, e i campi «Assegnato a» stanno
     in pagine diverse da Team: si rinfresca tutta l'area, non una rotta. */
  revalidatePath('/staff', 'layout')
  return avvisoFoto ? { ok: true, id, error: avvisoFoto } : { ok: true, id }
}

/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * La foto nel bucket degli avatar, stessa cartella e stesso formato di tutti.
 *
 * Restituisce **un avviso, non un errore**: a questo punto il membro esiste già
 * e funziona. Una foto che non è passata si rimette da `/staff/io` al primo
 * accesso, e far fallire tutta la creazione per quello vorrebbe dire cancellare
 * un account buono.
 */
async function salvaFoto(id: string, file: File): Promise<string | undefined> {
  /* Il browser ritaglia e ridimensiona a 512px prima di inviare: se arriva
     qualcosa di più grande di due mega, non è passato da lì. */
  if (file.size > 2_000_000) return 'Il membro è stato creato, ma la foto era troppo pesante.'
  if (!['image/jpeg', 'image/webp', 'image/png'].includes(file.type)) {
    return 'Il membro è stato creato, ma la foto non era un JPEG, un PNG o un WebP.'
  }

  const admin = createAdminClient()
  const est = file.type === 'image/webp' ? 'webp' : file.type === 'image/png' ? 'png' : 'jpg'
  const path = `${id}/${crypto.randomUUID()}.${est}`

  const { error } = await admin.storage
    .from(BUCKET_AVATAR)
    .upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: false })
  if (error) return `Il membro è stato creato, ma la foto no: ${error.message}`

  const { error: errRiga } = await admin
    .from('staff_profiles')
    .update({ foto_url: path })
    .eq('id', id)
  if (errRiga) {
    await admin.storage.from(BUCKET_AVATAR).remove([path])
    return 'Il membro è stato creato, ma la foto non si è collegata al profilo.'
  }
  return undefined
}

/** Stringa vuota e assente sono la stessa cosa: entrambe diventano `null`. */
function testo(v: FormDataEntryValue | null): string | null {
  const s = typeof v === 'string' ? v.trim() : ''
  return s || null
}
