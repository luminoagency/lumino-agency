#!/usr/bin/env node
/**
 * Semina (o cancella) i dati demo dell'area staff.
 *
 *   node scripts/staff-seed.mjs            # inserisce le righe finte
 *   node scripts/staff-seed.mjs --clean    # le cancella tutte
 *   node scripts/staff-seed.mjs --email x@y.z   # le intesta a un altro staff
 *
 * Le righe nascono con `is_demo = true` (migration 0031) e si vedono solo
 * quando un admin accende l'interruttore nel rail. Cancellarle è una riga:
 * `delete ... where is_demo`, e le tabelle figlie seguono in cascata.
 *
 * Usa la service-role e quindi scavalca la RLS: è voluto, perché deve poter
 * scrivere righe intestate a un venditore che non è chi lancia il comando. Per
 * la stessa ragione **non gira mai nel browser** — è uno script da terminale.
 *
 * Il contenuto non sta qui ma in `lib/staff/demo.ts`: è la stessa sorgente che
 * alimenta l'anteprima di sviluppo, e due elenchi separati sarebbero due
 * elenchi che divergono al primo ritocco.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const radice = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(path.join(radice, 'package.json'))

/* L'ordine è quello della cancellazione: prima le figlie, poi i genitori.
   `on delete cascade` basterebbe, ma cancellare in ordine dà un conteggio per
   tabella invece di un numero solo — ed è quello che si guarda per capire se il
   seed è andato. `staff_deal_margins` non ha `is_demo` e non le serve: sparisce
   in cascata col deal, che è l'unico modo in cui si legge. */
const TABELLE = [
  'staff_extra_changes',
  'staff_field_reports',
  'staff_followups',
  'staff_activities',
  'staff_projects',
  'staff_subscriptions',
  'staff_deals',
  'staff_clients',
]

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

  const { createClient } = require('@supabase/supabase-js')
  const sb = createClient(url, key, { auth: { persistSession: false } })

  const pulisci = process.argv.includes('--clean')
  const emailArg = valoreArg('--email')

  await controllaColonna(sb)

  if (pulisci) {
    await cancella(sb)
    return
  }

  const { venditore, collega } = await scegliStaff(sb, emailArg)
  await cancella(sb, true)
  await semina(sb, venditore, collega)
}

/* ─────────────────────────────────────────────────────────────────────────── */

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
  return i >= 0 ? process.argv[i + 1] : null
}

/**
 * Il controllo che evita il danno peggiore.
 *
 * Senza `is_demo` l'insert fallirebbe comunque, ma con un errore di PostgREST
 * che non dice cosa fare. E il rischio vero non è l'errore: è che qualcuno lo
 * aggiri togliendo il campo e si ritrovi venticinque locali inventati in mezzo
 * ai clienti veri, senza più un modo per distinguerli.
 */
async function controllaColonna(sb) {
  const { error } = await sb.from('staff_clients').select('is_demo').limit(1)
  if (error) {
    if (error.code === '42P01') {
      throw new Error('Le tabelle staff_* non esistono: esegui prima 0030_staff_dashboard.sql')
    }
    throw new Error(
      'Manca la colonna is_demo: esegui supabase/migrations/0031_staff_demo.sql nell’SQL editor ' +
        'di Supabase, poi rilancia. Senza, le righe finte non sarebbero più distinguibili dalle vere.',
    )
  }

  /* La stessa colonna, sulla tabella che la 0031 aveva lasciato fuori. Il
     controllo è separato perché il rimedio è un'altra migration, e dire «esegui
     la 0031» a chi ha già eseguito la 0031 è il modo più rapido di far perdere
     mezz'ora. */
  const extra = await sb.from('staff_extra_changes').select('is_demo').limit(1)
  if (extra.error) {
    throw new Error(
      'Manca is_demo su staff_extra_changes: esegui supabase/migrations/' +
        '0032_staff_extra_demo.sql nell’SQL editor di Supabase, poi rilancia.',
    )
  }
}

async function scegliStaff(sb, email) {
  const { data, error } = await sb
    .from('staff_profiles')
    .select('id, nome, email, role')
    .eq('attivo', true)
    .order('role')

  if (error) throw new Error(`staff_profiles: ${error.message}`)
  if (!data?.length) throw new Error('Nessun profilo staff attivo: creane uno prima di seminare.')

  const venditore = email ? data.find((p) => p.email === email) : data.find((p) => p.role === 'admin') ?? data[0]
  if (!venditore) throw new Error(`Nessuno staff con email ${email}`)

  /* Il secondo intestatario serve a far vedere i filtri "assegnato a" e le
     statistiche per venditore: se c'è un collega si usa lui, altrimenti
     tutto va alla stessa persona. */
  const collega = data.find((p) => p.id !== venditore.id) ?? venditore

  console.log(`→ intestate a ${venditore.nome}${collega.id !== venditore.id ? ` e ${collega.nome}` : ''}`)
  return { venditore, collega }
}

async function cancella(sb, silenzioso = false) {
  for (const t of TABELLE) {
    const { error, count } = await sb.from(t).delete({ count: 'exact' }).eq('is_demo', true)
    if (error) throw new Error(`${t}: ${error.message}`)
    if (!silenzioso && count) console.log(`  − ${t}: ${count}`)
  }
  if (!silenzioso) console.log('✓ dati demo rimossi')
}

async function semina(sb, venditore, collega) {
  const righe = await caricaFixture(venditore.id, collega.id)

  /* L'ordine conta: le figlie hanno una foreign key sul cliente, e inserirle
     prima le farebbe rimbalzare tutte. */
  const ordine = [
    'staff_clients',
    'staff_deals',
    'staff_deal_margins',
    'staff_subscriptions',
    'staff_projects',
    'staff_extra_changes',
    'staff_activities',
    'staff_followups',
    'staff_field_reports',
  ]

  for (const t of ordine) {
    const dati = righe[t]
    if (!dati?.length) continue
    const { error } = await sb.from(t).insert(dati)
    if (error) throw new Error(`${t}: ${error.message}`)
    console.log(`  + ${t}: ${dati.length}`)
  }

  console.log('\n✓ dati demo inseriti. Accendi «Dati demo» nel rail di /staff per vederli.')
}

/**
 * Le righe finte, prese dal modulo TypeScript dell'app.
 *
 * Il modulo si transpila al volo col compilatore TypeScript che il progetto ha
 * già in casa, e si esegue con un `require` finto: l'unica dipendenza che
 * `demo.ts` ha su Next è `cookies()`, che serve all'interruttore e non ai
 * dati, quindi qui si restituisce un guscio vuoto.
 *
 * Non è una duplicazione dei dati e non deve diventarlo: un secondo elenco di
 * venticinque locali, in un altro file, sarebbe allineato per una settimana.
 */
async function caricaFixture(venditoreId, collegaId) {
  const ts = require('typescript')
  const sorgente = fs.readFileSync(path.join(radice, 'lib/staff/demo.ts'), 'utf8')

  const { outputText } = ts.transpileModule(sorgente, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  })

  const modulo = { exports: {} }
  const requireFinto = (nome) => {
    if (nome === 'next/headers') return { cookies: () => ({ get: () => undefined }) }
    return require(nome)
  }

  // eslint-disable-next-line no-new-func
  new Function('exports', 'require', 'module', outputText)(modulo.exports, requireFinto, modulo)

  return modulo.exports.righeDemo(venditoreId, collegaId)
}
