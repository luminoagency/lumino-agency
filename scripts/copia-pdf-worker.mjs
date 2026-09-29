#!/usr/bin/env node
/**
 * Il worker di pdf.js, copiato in `public/`.
 *
 * Il modo idiomatico sarebbe `new URL('pdfjs-dist/build/pdf.worker.min.mjs',
 * import.meta.url)`, e non funziona: webpack lo emette come risorsa e poi
 * Terser prova a minificarlo come se fosse uno script classico, trova `import`
 * ed `export` e ferma la build intera. È un problema noto di pdf.js con il
 * bundler di Next, e la soluzione che regge è togliere il file dal grafo del
 * bundler: in `public/` viene servito così com'è, già minificato da chi l'ha
 * scritto.
 *
 * Si copia a ogni build invece di finire in git: è un megabyte di codice di
 * qualcun altro, e la versione deve seguire quella del pacchetto senza che
 * nessuno se ne ricordi. Gira da `prebuild` e da `predev`.
 */
import { copyFileSync, mkdirSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const radice = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)

const sorgente = path.join(
  path.dirname(require.resolve('pdfjs-dist/package.json')),
  'build',
  'pdf.worker.min.mjs',
)
const cartella = path.join(radice, 'public', 'pdfjs')
const destinazione = path.join(cartella, 'pdf.worker.min.mjs')

if (!existsSync(sorgente)) {
  console.error('✗ pdfjs-dist non è installato: niente da copiare.')
  process.exit(1)
}

mkdirSync(cartella, { recursive: true })
copyFileSync(sorgente, destinazione)
console.log('✓ public/pdfjs/pdf.worker.min.mjs aggiornato')
