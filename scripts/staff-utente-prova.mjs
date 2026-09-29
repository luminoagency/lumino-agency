#!/usr/bin/env node
/**
 * Un account staff usa e getta, per misurare le prestazioni con una sessione
 * vera invece che in anteprima.
 *
 *   node scripts/staff-utente-prova.mjs          crea (o rigenera la password)
 *   node scripts/staff-utente-prova.mjs --via    cancella utente e profilo
 *
 * Perché esiste: l'anteprima di sviluppo non interroga Supabase, quindi i tempi
 * che si misurano lì sono i tempi di React e nient'altro. Con una sessione vera
 * ogni cambio pagina fa le query che farà in produzione, ed è l'unico numero
 * che voglia dire qualcosa.
 *
 * La password si genera qui e finisce **solo** in
 * `scripts/.utente-prova.json`, che è ignorato da git. Non si stampa e non si
 * incolla da nessuna parte. L'account va cancellato appena finita la misura:
 * `--via` fa esattamente quello, e non lascia in giro un profilo staff che
 * nessuno ricorda di aver creato.
 */
import { randomBytes } from 'node:crypto'
import { readFile, writeFile, rm } from 'node:fs/promises'
import { createClient } from '@supabase/supabase-js'

const EMAIL = 'prova.prestazioni@bylumino.com'
const NOME = 'Prova Prestazioni'
const DOVE = new URL('./.utente-prova.json', import.meta.url)

async function env() {
  const testo = await readFile(new URL('../.env.local', import.meta.url), 'utf8')
  const out = {}
  for (const riga of testo.split(/\r?\n/)) {
    const m = riga.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m) out[m[1]] = m[2]
  }
  return out
}

async function main() {
  const e = await env()
  const sb = createClient(e.NEXT_PUBLIC_SUPABASE_URL, e.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const via = process.argv.includes('--via')

  /* L'id si cerca per email invece di conservarlo: se lo script viene lanciato
     due volte, la seconda deve ritrovare l'account di prima e non crearne un
     secondo con la stessa email, che Supabase rifiuterebbe. */
  const { data: elenco } = await sb.auth.admin.listUsers({ page: 1, perPage: 200 })
  const esistente = (elenco?.users ?? []).find((u) => u.email === EMAIL)

  if (via) {
    if (esistente) {
      await sb.from('staff_profiles').delete().eq('id', esistente.id)
      const { error } = await sb.auth.admin.deleteUser(esistente.id)
      if (error) throw new Error(error.message)
      console.log('✓ utente di prova cancellato, profilo compreso')
    } else {
      console.log('· nessun utente di prova da cancellare')
    }
    await rm(DOVE, { force: true })
    return
  }

  const password = randomBytes(18).toString('base64url')

  let id
  if (esistente) {
    id = esistente.id
    const { error } = await sb.auth.admin.updateUserById(id, { password })
    if (error) throw new Error(error.message)
  } else {
    const { data, error } = await sb.auth.admin.createUser({
      email: EMAIL,
      password,
      email_confirm: true,
    })
    if (error) throw new Error(error.message)
    id = data.user.id
  }

  /* Il profilo staff è l'altra metà: senza la riga in `staff_profiles` il login
     riesce e l'area risponde «questo account non è un account dello staff».
     Ruolo `sales` e non `admin`: si misurano le pagine che vedono tutti, e un
     admin vede anche l'interruttore dei dati finti. */
  const { error } = await sb.from('staff_profiles').upsert({
    id,
    nome: NOME,
    email: EMAIL,
    role: 'sales',
    attivo: true,
  })
  if (error) throw new Error(error.message)

  await writeFile(DOVE, JSON.stringify({ email: EMAIL, password, id }, null, 2))
  console.log('✓ utente di prova pronto:', EMAIL)
  console.log('  password in scripts/.utente-prova.json (fuori da git)')
  console.log('  cancellalo con: node scripts/staff-utente-prova.mjs --via')
}

main().catch((e) => {
  console.error('✗', e.message)
  process.exit(1)
})
