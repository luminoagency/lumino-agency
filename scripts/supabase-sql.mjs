#!/usr/bin/env node
/**
 * Esegue un file .sql sul progetto Supabase, senza SQL editor e senza password.
 *
 * Il PAT (`SUPABASE_ACCESS_TOKEN`, quello che comincia con `sbp_`) sta in
 * `.env.local`, fuori da git e fuori da Vercel. Con quello la Management API
 * esegue qualunque DDL: è la stessa strada che usa la CLI ufficiale, senza il
 * giro dell'autenticazione interattiva.
 *
 *   node scripts/supabase-sql.mjs supabase/migrations/0035_staff_archivio.sql
 *   node scripts/supabase-sql.mjs --query "select count(*) from staff_archive"
 *
 * **Non spezza il file in statement.** L'endpoint accetta uno script intero e lo
 * esegue in una transazione: spezzarlo su `;` romperebbe ogni funzione con un
 * corpo `$$ ... $$` dentro, che è metà delle migration di quest'area.
 */
import { readFile } from 'node:fs/promises'

const PROGETTO = 'xuxcpltbwvyozuprvbki'

async function leggiEnv() {
  /* Niente `dotenv`: è una dipendenza in più per leggere sette righe, e questo
     script gira fuori da Next, dove il caricamento automatico non c'è. */
  const testo = await readFile(new URL('../.env.local', import.meta.url), 'utf8').catch(() => '')
  for (const riga of testo.split(/\r?\n/)) {
    const m = riga.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
  }
}

async function main() {
  await leggiEnv()

  const token = process.env.SUPABASE_ACCESS_TOKEN
  if (!token) {
    console.error('Manca SUPABASE_ACCESS_TOKEN in .env.local (il PAT sbp_… del proprietario).')
    process.exit(1)
  }

  const args = process.argv.slice(2)
  const i = args.indexOf('--query')
  const query = i >= 0 ? args[i + 1] : await readFile(args[0], 'utf8')
  if (!query) {
    console.error('Uso: node scripts/supabase-sql.mjs <file.sql> | --query "select 1"')
    process.exit(1)
  }

  const risposta = await fetch(
    `https://api.supabase.com/v1/projects/${PROGETTO}/database/query`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    },
  )

  const corpo = await risposta.text()
  if (!risposta.ok) {
    console.error(`Supabase ha risposto ${risposta.status}:`)
    console.error(corpo)
    process.exit(1)
  }

  console.log(corpo)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
