'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireStaff } from './auth'
import { BUCKET_AVATAR } from './avatar'
import { PERMESSI, puoGestireTeam, type Permesso } from './permessi'
import type { Esito } from './actions'
import type { StaffProfile, StaffRole } from './types'

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
  const no = soloOwner(me)
  if (no) return no

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
    /* I permessi arrivano dai quattro interruttori del modulo. `puo_creare_membri`
       **no**, e non è una dimenticanza: resta `false` qualunque cosa dica la
       richiesta. Chi entra dalla porta non riceve la chiave della porta. */
    ...permessiDalForm(form),
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

/* ═══════════════════════════════════════════════════════════════════════════
   Gestire chi c'è già (migration 0040)

   Quattro azioni, un cancello solo. Tutte passano da `soloOwner()` **prima** di
   guardare qualunque dato, e tutte scrivono con il service-role: la RLS qui non
   protegge niente, perché la chiave di servizio la salta per definizione. Il
   controllo in cima non è una cortesia per l'interfaccia — è l'unico controllo
   che c'è, e per questo è la prima riga di ognuna.

   Il trigger `staff_profiles_permesso_membri` della 0040 copre la strada
   opposta: impedisce che ruolo e permessi si muovano da una **sessione utente**,
   cioè da una PATCH scritta a mano verso PostgREST. Le due cose insieme
   lasciano una sola via per cambiare un permesso: queste funzioni.
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * I permessi di un membro, dai quattro interruttori.
 *
 * Una `update` che cambia i permessi di qualcuno è l'azione più delicata di
 * questa pagina, e la più facile da sbagliare in silenzio: una colonna scritta
 * male non dà errore, dà una persona che vede quello che non deve. Per questo
 * l'elenco dei campi è `PERMESSI` e non una lista scritta a mano qui — se
 * domani se ne aggiunge un quinto, questo codice lo prende da sé o non compila.
 */
export async function aggiornaPermessi(
  id: string,
  permessi: Partial<Record<Permesso, boolean>>,
): Promise<Esito> {
  const me = await requireStaff()
  const no = soloOwner(me)
  if (no) return no

  /* L'owner non si tocca da qui, nemmeno da sé. `staff_has_perm()` risponde
     sempre `true` a un owner, quindi spegnergli un interruttore scriverebbe un
     `false` nel database che non cambia niente di quello che vede: un comando
     che non fa quello che dice è peggio di un comando che manca. */
  if (id === me.id) {
    return { ok: false, error: 'I tuoi permessi non si cambiano: sei il titolare.' }
  }

  const patch: Record<string, boolean> = {}
  for (const p of PERMESSI) {
    if (typeof permessi[p] === 'boolean') patch[p] = permessi[p] as boolean
  }
  if (!Object.keys(patch).length) return { ok: false, error: 'Nessun permesso da cambiare.' }

  const { data, error } = await createAdminClient()
    .from('staff_profiles')
    .update(patch)
    .eq('id', id)
    /* Il service-role salta la RLS, quindi zero righe qui non vuol dire «non ti
       è permesso»: vuol dire che quell'id non esiste più. Si conta comunque,
       perché «ok, zero righe» detto a un'interfaccia diventa un interruttore
       che resta girato e un permesso che non è cambiato. */
    .select('id')

  if (error) return { ok: false, error: error.message }
  if (!data?.length) return { ok: false, error: 'Questo membro non esiste più.' }

  revalidatePath('/staff', 'layout')
  return { ok: true }
}

/**
 * Il livello di accesso: venditore o amministratore.
 *
 * `owner` non è fra le opzioni e non lo diventa: è il ruolo di chi gestisce la
 * squadra, e un pannello che può crearne un secondo è un pannello che può
 * regalare se stesso. Si assegna con una riga di SQL, come `puo_creare_membri`
 * nella 0037 — è voluto che costi.
 */
export async function cambiaLivello(id: string, role: StaffRole): Promise<Esito> {
  const me = await requireStaff()
  const no = soloOwner(me)
  if (no) return no

  if (role !== 'admin' && role !== 'sales') {
    return { ok: false, error: 'Il livello può essere solo venditore o amministratore.' }
  }
  if (id === me.id) {
    return { ok: false, error: 'Non puoi declassare te stesso: resteresti senza titolare.' }
  }

  const { data, error } = await createAdminClient()
    .from('staff_profiles')
    .update({ role })
    .eq('id', id)
    .select('id')

  if (error) return { ok: false, error: error.message }
  if (!data?.length) return { ok: false, error: 'Questo membro non esiste più.' }

  revalidatePath('/staff', 'layout')
  return { ok: true }
}

/**
 * Una password nuova, scelta dall'owner.
 *
 * Non manda nessuna email di recupero: l'email di un membro dello staff può
 * essere quella che ha dimenticato, o una casella condivisa, e un link di
 * reset che arriva lì fa entrare chiunque la apra. Qui la password la detta chi
 * amministra, a voce, guardando in faccia la persona — che è lo stesso modo in
 * cui è stata creata.
 */
export async function reimpostaPassword(id: string, password: string): Promise<Esito> {
  const me = await requireStaff()
  const no = soloOwner(me)
  if (no) return no

  if (password.length < 8) {
    return { ok: false, error: 'La password vuole almeno otto caratteri.' }
  }

  const { error } = await createAdminClient().auth.admin.updateUserById(id, { password })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

/**
 * Sospendere e riammettere.
 *
 * Due scritture, e servono entrambe. `staff_profiles.attivo = false` chiude
 * /staff: `requireStaff()` lo guarda a ogni pagina e rimanda al login. Ma la
 * sessione Supabase resta valida, e con quella si continua a chiamare
 * PostgREST — dove le policy passano da `is_staff()`, che guarda `attivo`, e
 * quindi non si legge niente... tranne le tabelle che non lo guardano. Il ban
 * su `auth.users` chiude la questione alla radice: il token non si rinnova e
 * il login non riparte.
 *
 * Cento anni e non «per sempre» perché `ban_duration` vuole una durata. Levarlo
 * è `'none'`.
 */
export async function impostaAccesso(id: string, attivo: boolean): Promise<Esito> {
  const me = await requireStaff()
  const no = soloOwner(me)
  if (no) return no

  if (id === me.id) {
    return { ok: false, error: 'Non puoi sospendere te stesso.' }
  }

  const admin = createAdminClient()

  const { data, error } = await admin
    .from('staff_profiles')
    .update({ attivo })
    .eq('id', id)
    .select('id')
  if (error) return { ok: false, error: error.message }
  if (!data?.length) return { ok: false, error: 'Questo membro non esiste più.' }

  const { error: errBan } = await admin.auth.admin.updateUserById(id, {
    ban_duration: attivo ? 'none' : '876000h',
  })
  /* Il profilo è già cambiato: /staff gli è chiuso comunque. Si dice che la
     seconda metà non è passata invece di tornare indietro — un «errore» su una
     sospensione andata a buon fine metà sarebbe la cosa meno chiara di tutte. */
  if (errBan) {
    return {
      ok: true,
      error: `Accesso all’area chiuso, ma la sessione Supabase non si è revocata: ${errBan.message}`,
    }
  }

  revalidatePath('/staff', 'layout')
  return { ok: true }
}

/**
 * Fuori dalla squadra, per davvero.
 *
 * Cancella l'utente in `auth.users`, e la riga di `staff_profiles` se ne va in
 * cascata (`references auth.users on delete cascade`, migration 0030). Non è
 * una sospensione: l'email si libera e la persona non esiste più da nessuna
 * parte.
 *
 * **Cosa resta, e non è un dettaglio.** I suoi clienti non se ne vanno con lui:
 * `staff_clients.assegnato_a` è `on delete set null`, quindi restano tutti, non
 * assegnati a nessuno — e un cliente senza venditore lo vede solo un admin,
 * perché la policy di un venditore chiede `assegnato_a = auth.uid()`. Vanno
 * riassegnati, e l'interfaccia lo dice **prima**, con il numero vero: «3
 * clienti torneranno non assegnati» è un'informazione, «sei sicuro?» no.
 * Attività e report di campo restano con `user_id` a null: lo storico non si
 * cancella perché una persona se ne va.
 */
export async function rimuoviMembro(id: string): Promise<Esito & { orfani?: number }> {
  const me = await requireStaff()
  const no = soloOwner(me)
  if (no) return no

  if (id === me.id) {
    return { ok: false, error: 'Non puoi rimuovere te stesso dalla squadra.' }
  }

  const admin = createAdminClient()

  /* La foto prima: dopo la cancellazione il percorso non si sa più, e
     resterebbe un file in un bucket che nessuna riga nomina. */
  const { data: profilo } = await admin
    .from('staff_profiles')
    .select('foto_url, role')
    .eq('id', id)
    .maybeSingle()

  if ((profilo as { role?: string } | null)?.role === 'owner') {
    return { ok: false, error: 'Un titolare non si rimuove dal pannello.' }
  }

  const { count } = await admin
    .from('staff_clients')
    .select('id', { count: 'exact', head: true })
    .eq('assegnato_a', id)

  const { error } = await admin.auth.admin.deleteUser(id)
  if (error) return { ok: false, error: error.message }

  const foto = (profilo as { foto_url?: string | null } | null)?.foto_url
  if (foto) await admin.storage.from(BUCKET_AVATAR).remove([foto])

  revalidatePath('/staff', 'layout')
  return { ok: true, orfani: count ?? 0 }
}

/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Il cancello, in una riga, per non scriverlo cinque volte in cinque modi.
 *
 * Restituisce l'errore invece di lanciarlo: queste funzioni sono server action
 * chiamate da un modulo, e un'eccezione in una server action di produzione
 * arriva al browser come «An error occurred in the Server Components render»
 * — cioè come un guasto, mentre questo è un rifiuto e va letto come tale.
 */
function soloOwner(me: StaffProfile): Esito | null {
  return puoGestireTeam(me)
    ? null
    : { ok: false, error: 'Solo il titolare gestisce la squadra.' }
}

/** I quattro interruttori del modulo, letti con il nome vero della colonna. */
function permessiDalForm(form: FormData): Record<Permesso, boolean> {
  const out = {} as Record<Permesso, boolean>
  for (const p of PERMESSI) out[p] = form.get(p) === 'on' || form.get(p) === 'true'
  return out
}

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
