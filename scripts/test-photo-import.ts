/**
 * Test manuale del photo-import (Layer 4.7). NON eseguito automaticamente.
 * Uso: npx tsx scripts/test-photo-import.ts
 * Richiede .env.local con CLAUDE_API_KEY (categorizzazione) e credenziali Supabase (upload).
 */

import fs from 'fs';
import path from 'path';
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    const m = line.match(/^([^=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  });
}

import { importPhotosForProject } from '../lib/lab/photo-import';

async function main() {
  const { result } = await importPhotosForProject({
    projectId: 'test',
    businessName: 'Hotel Villa Serena',
    businessAddress: 'Lago di Como, Italia',
    sources: [
      { name: 'booking', url: 'https://www.booking.com/hotel/it/villa-serena.html' },
    ],
    maxPhotos: 20,
  });
  console.log(JSON.stringify(result, null, 2));
}
main();
