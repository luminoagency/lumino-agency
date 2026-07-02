/**
 * Setup / diagnostica del Lumino Lab. Esegui: npx tsx scripts/setup-lab.ts
 * Verifica env, connessione Supabase/Anthropic, bucket storage, tabelle migration.
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    const m = line.match(/^([^=]+)=(.*)$/); if (m) process.env[m[1].trim()] = m[2].trim();
  });
}

const ok = (b: boolean) => (b ? '✅' : '❌');

async function main() {
  console.log('🔧 LUMINO LAB — Diagnostica\n');

  // 1. Env vars
  const required = ['CLAUDE_API_KEY', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  const optional = ['VERCEL_TOKEN', 'VERCEL_TEAM_ID', 'VERCEL_PROJECT_PREFIX', 'GOOGLE_MAPS_API_KEY', 'NEXT_PUBLIC_LUMINO_APP_URL'];
  console.log('— Env vars —');
  required.forEach(k => console.log(`  ${ok(!!process.env[k])} ${k} (richiesta)`));
  optional.forEach(k => console.log(`  ${process.env[k] ? '✅' : '➖'} ${k} (opzionale)`));

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // 2. Supabase
  console.log('\n— Supabase —');
  if (!url || !key) {
    console.log('  ❌ Credenziali Supabase mancanti: salto le verifiche DB.');
  } else {
    const sb = createClient(url, key);
    try {
      const { error } = await sb.from('lab_projects').select('id', { count: 'exact', head: true });
      console.log(`  ${ok(!error)} Connessione + tabella lab_projects ${error ? '(' + error.message + ')' : ''}`);
    } catch (e: any) { console.log('  ❌ Connessione fallita:', e?.message); }

    // 3. Bucket storage
    try {
      const { data } = await sb.storage.getBucket('project-assets');
      console.log(`  ${ok(!!data)} Bucket 'project-assets' (migration 0018)`);
    } catch { console.log("  ❌ Bucket 'project-assets' assente (applica 0018)"); }

    // 4. Tabelle migration
    console.log('\n— Tabelle migration —');
    const tables: Array<[string, string]> = [
      ['lab_subscriptions', '0020'], ['lab_invoices', '0020'],
      ['lab_photo_imports', '0021'], ['lab_client_users', '0022'],
      ['lab_client_sessions', '0022'], ['lab_project_messages', '0022'],
    ];
    for (const [t, mig] of tables) {
      try { const { error } = await sb.from(t).select('id', { head: true, count: 'exact' }); console.log(`  ${ok(!error)} ${t} (${mig})`); }
      catch { console.log(`  ❌ ${t} (${mig}) — non applicata`); }
    }
  }

  // 5. Anthropic (solo presenza chiave, nessuna chiamata a pagamento)
  console.log('\n— Anthropic —');
  console.log(`  ${ok(!!process.env.CLAUDE_API_KEY)} CLAUDE_API_KEY presente (nessuna chiamata effettuata)`);

  // 6. Migration su disco
  console.log('\n— Migration su disco —');
  const migDir = path.join(process.cwd(), 'supabase', 'migrations');
  if (fs.existsSync(migDir)) fs.readdirSync(migDir).filter(f => f.endsWith('.sql')).sort().forEach(f => console.log('  •', f));

  console.log('\nFatto. Applica manualmente le migration mancanti quando pronto.');
}
main();
