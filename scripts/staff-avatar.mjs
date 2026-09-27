#!/usr/bin/env node
/**
 * Carica la foto profilo di un membro dello staff, dal terminale.
 *
 *   node scripts/staff-avatar.mjs --email ratib.lumino@gmail.com --file ~/Downloads/ratib-foto.png
 *   node scripts/staff-avatar.mjs --email x@y.z --file foto.jpg --no-db   # carica e non scrive
 *
 * Esiste per il primo caricamento: l'interfaccia di `/staff/io` fa la stessa
 * cosa meglio (si inquadra a mano), ma richiede di essere entrati con
 * quell'account. Da qui la foto di un collega si mette al suo posto prima che il
 * collega abbia fatto il primo login.
 *
 * Cosa fa, nell'ordine:
 *   1. crea il bucket privato `staff-avatars` se non c'è già;
 *   2. risolve l'id dell'utente dalla sua email in `auth.users`;
 *   3. taglia la foto al centro in un quadrato e la porta a 512px JPEG (sharp);
 *   4. la carica come `{id}/{uuid}.jpg`;
 *   5. scrive `foto_url` su `staff_profiles`, e se la colonna non c'è ancora
 *      (migration 0033 non eseguita) lo dice e stampa l'SQL da incollare.
 *
 * **Il taglio è al centro, e non è come lo fa l'interfaccia.** Lì si trascina e
 * si stringe, perché il centro geometrico di una foto di una persona è quasi
 * sempre il petto. Qui non c'è nessuno a trascinare, quindi il centro è il meglio
 * che si può fare senza indovinare: se viene male, si rifà da `/staff/io` in dieci
 * secondi.
 *
 * Usa la service-role: è uno script da terminale e non gira mai nel browser.
 */

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const radice = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(path.join(radice, 'package.json'))

const BUCKET = 'staff-avatars'
const LATO = 512

main().catch((e) => {
  console.error('\n✗', e.message)
  process.exit(1)
})

async function main() {
  const env = leggiEnv()
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const key = env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Servono NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY in .env.local')
  }

  const email = valoreArg('--email')
  const fileArg = valoreArg('--file')
  if (!email || !fileArg) {
    throw new Error('Uso: --email <email> --file <percorso della foto>')
  }

  const file = path.resolve(fileArg.replace(/^~/, process.env.USERPROFILE || process.env.HOME || '~'))
  if (!fs.existsSync(file)) throw new Error(`Foto non trovata: ${file}`)

  const { createClient } = require('@supabase/supabase-js')
  const sharp = require('sharp')
  const sb = createClient(url, key, { auth: { persistSession: false } })

  /* 1. il bucket */
  const { data: buckets } = await sb.storage.listBuckets()
  if (!buckets?.some((b) => b.name === BUCKET)) {
    const { error } = await sb.storage.createBucket(BUCKET, {
      public: false,
      fileSizeLimit: '2MB',
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    })
    if (error) throw new Error(`Bucket non creato: ${error.message}`)
    console.log(`✓ bucket ${BUCKET} creato (privato)`)
  } else {
    console.log(`· bucket ${BUCKET} già presente`)
  }

  /* 2. l'utente.
     `listUsers` e non una query su auth.users: lo schema auth non si interroga
     da PostgREST, e l'API di amministrazione è l'unica strada dal client JS.
     Si scorrono le pagine perché il default è cinquanta utenti, e questa istanza
     autentica anche i titolari dei ristoranti. */
  const id = await trovaUtente(sb, email)
  if (!id) {
    throw new Error(
      `Nessun utente con email ${email} in auth.users. Crealo da Supabase → Authentication → Add user.`,
    )
  }
  console.log(`✓ utente ${email} → ${id}`)

  /* 3. il quadrato a 512px */
  const jpeg = await sharp(file)
    .rotate() /* rispetta l'orientamento EXIF: senza, una foto scattata in
                 verticale col telefono arriva coricata */
    .resize(LATO, LATO, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 84, mozjpeg: true })
    .toBuffer()
  console.log(`✓ ritagliata a ${LATO}×${LATO} — ${(jpeg.length / 1024).toFixed(0)} KB`)

  /* 4. il caricamento */
  const percorso = `${id}/${crypto.randomUUID()}.jpg`
  const { error: errUp } = await sb.storage
    .from(BUCKET)
    .upload(percorso, jpeg, { contentType: 'image/jpeg', upsert: false })
  if (errUp) throw new Error(`Caricamento fallito: ${errUp.message}`)
  console.log(`✓ caricata in ${BUCKET}/${percorso}`)

  /* 5. il collegamento al profilo */
  if (process.argv.includes('--no-db')) {
    stampaSql(id, email, percorso)
    return
  }

  const { data: riga } = await sb.from('staff_profiles').select('id').eq('id', id).maybeSingle()
  if (!riga) {
    console.log('\n· nessuna riga in staff_profiles per questo utente.')
    stampaSql(id, email, percorso)
    return
  }

  const { error: errUpd } = await sb.from('staff_profiles').update({ foto_url: percorso }).eq('id', id)
  if (errUpd) {
    console.log(`\n· foto_url non scritta (${errUpd.code ?? ''} ${errUpd.message}).`)
    if (errUpd.code === '42703') console.log('  La migration 0033 non è ancora passata.')
    stampaSql(id, email, percorso)
    return
  }

  console.log('✓ foto_url scritta su staff_profiles')
  console.log(`\nPercorso da tenere a mente: ${percorso}`)
}

/* ─────────────────────────────────────────────────────────────────────────── */

async function trovaUtente(sb, email) {
  const cercata = email.trim().toLowerCase()
  for (let pagina = 1; pagina <= 20; pagina++) {
    const { data, error } = await sb.auth.admin.listUsers({ page: pagina, perPage: 200 })
    if (error) throw new Error(`auth.users non leggibile: ${error.message}`)
    const trovato = data.users.find((u) => (u.email ?? '').toLowerCase() === cercata)
    if (trovato) return trovato.id
    if (data.users.length < 200) return null
  }
  return null
}

function stampaSql(id, email, percorso) {
  console.log('\n── SQL da incollare nell’editor di Supabase ──\n')
  console.log(`insert into staff_profiles (id, nome, email, role, ruolo_titolo, foto_url)`)
  console.log(`values ('${id}', 'Ratib', '${email}', 'admin', 'CCO', '${percorso}')`)
  console.log(`on conflict (id) do update set`)
  console.log(`  ruolo_titolo = excluded.ruolo_titolo,`)
  console.log(`  foto_url     = excluded.foto_url;\n`)
}

function leggiEnv() {
  const p = path.join(radice, '.env.local')
  if (!fs.existsSync(p)) throw new Error('.env.local non trovato')
  return Object.fromEntries(
    fs
      .readFileSync(p, 'utf8')
      .split(/\r?\n/)
      .filter((l) => l.includes('=') && !l.trimStart().startsWith('#'))
      .map((l) => {
        const i = l.indexOf('=')
        return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
      }),
  )
}

function valoreArg(nome) {
  const i = process.argv.indexOf(nome)
  return i > -1 ? process.argv[i + 1] : null
}
