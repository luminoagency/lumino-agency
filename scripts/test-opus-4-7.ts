import { readFileSync } from 'node:fs';
import Anthropic from '@anthropic-ai/sdk';

// dotenv non è una dipendenza del progetto (Next.js carica .env.local nativamente).
// Parsing minimale di .env.local solo per questo test standalone.
function loadEnvLocal(): Record<string, string> {
  const out: Record<string, string> = {};
  let raw = '';
  try { raw = readFileSync('.env.local', 'utf8'); } catch { return out; }
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    out[m[1]] = v;
  }
  return out;
}

async function main() {
  const env = loadEnvLocal();
  const apiKey = process.env.CLAUDE_API_KEY || env.CLAUDE_API_KEY;
  if (!apiKey) {
    console.error('❌ CLAUDE_API_KEY non trovata in .env.local');
    process.exit(1);
  }

  console.log('🔑 API key trovata, lunghezza:', apiKey.length);
  console.log('📡 Chiamata test a claude-opus-4-7...');

  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 200,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'medium' },
      messages: [
        { role: 'user', content: 'Rispondi in italiano in massimo 20 parole: cos\'è la Libreria Lumino?' }
      ]
    } as any);

    console.log('✅ MODELLO FUNZIONA');
    console.log('Stop reason:', response.stop_reason);
    console.log('Risposta:', JSON.stringify(response.content, null, 2));
    console.log('Token usati:', response.usage);
  } catch (error: any) {
    console.error('❌ ERRORE:');
    console.error('Status:', error.status);
    console.error('Message:', error.message);
    if (error.error) console.error('Dettaglio:', JSON.stringify(error.error, null, 2));
    process.exit(1);
  }
}

main();
