/**
 * Genera /public/og-image.jpg — l'anteprima 1200×630 dei link condivisi
 * (Google, WhatsApp, LinkedIn, X).
 *
 *   node scripts/og-image.mjs
 *
 * È uno script e non un'immagine caricata a mano perché il payoff cambia: la
 * prossima volta che cambia, si riscrive una riga qui invece di riaprire un
 * editor grafico e sperare di ricentrare tutto uguale.
 *
 * La composizione è quella dell'hero: fondo scuro caldo, due nuclei di luce
 * (rosso a sinistra, blu-viola a destra), il wordmark LUMINO con la I nel
 * gradiente, il payoff sotto.
 *
 * I font arrivano da Google Fonts e finiscono nella cartella temporanea, non
 * nel repo: servono solo qui, una volta, e non vale la pena versionarli.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'public', 'og-image.jpg')
const FONT_DIR = path.join(tmpdir(), 'lumino-og-fonts')

const W = 1200
const H = 630

/* Gli stessi token di app/globals.css. Qui sono letterali perché sharp non
   legge il CSS: se cambiano lì, vanno cambiati anche qui. */
const VOID = '#171210'
const CREAM = '#f4eee4'
const DIM = '#b9aea1'
const RED = '#e5342a'
const PINK = '#ec6a9c'
const VIOLET = '#8b5cf6'
const BLUE = '#3b4fc4'

const PAYOFF = 'Progettiamo e costruiamo siti che si ricordano.'
const SECTORS = 'STUDIO DIGITALE — RISTORANTI · HOTEL · AZIENDE · RETAIL'

/* Da fonts.googleapis.com con uno User-Agent vecchio: risponde in TTF, che è
   il formato che sa leggere il motore di testo di sharp (woff2 no). */
const FONTS = {
  'Anton.ttf': 'https://fonts.gstatic.com/s/anton/v27/1Ptgg87LROyAm3Kz-Co.ttf',
  'Fraunces.ttf':
    'https://fonts.gstatic.com/s/fraunces/v38/6NUh8FyLNQOQZAnv9bYEvDiIdE9Ea92uemAk_WBq8U_9v0c2Wa0K7iN7hzFUPJH58nib1603gg7S2nfgRYIc6RuTCf7W.ttf',
  'Inter.ttf': 'https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZg.ttf',
}

async function ensureFonts() {
  await mkdir(FONT_DIR, { recursive: true })
  for (const [name, url] of Object.entries(FONTS)) {
    const file = path.join(FONT_DIR, name)
    if (existsSync(file)) continue
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Font ${name}: ${res.status}`)
    await writeFile(file, Buffer.from(await res.arrayBuffer()))
  }
}

const font = (name) => path.join(FONT_DIR, name)

/** Un blocco di testo reso su fondo trasparente, scalato per stare nel riquadro. */
function text(markup, { file, family, width, height, align = 'centre', spacing = 0 }) {
  return sharp({
    /* `font` NON è facoltativo insieme a `fontfile`: il file dice a Pango dove
       guardare, il nome della famiglia gli dice cosa prendere. Senza, ripiega
       sulla famiglia di default e il testo esce nel font sbagliato. */
    text: { text: markup, font: family, fontfile: font(file), rgba: true, width, height, align, spacing },
  })
    .png()
    .toBuffer()
}

/**
 * Il fondale: base calda, due nuclei saturi ai lati, un centro tiepido e la
 * vignettatura che chiude gli angoli. Stessa ricetta del bagliore dell'hero.
 */
const background = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <radialGradient id="left" cx="18%" cy="42%" r="58%">
      <stop offset="0%" stop-color="${RED}" stop-opacity=".62"/>
      <stop offset="100%" stop-color="${RED}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="right" cx="84%" cy="52%" r="60%">
      <stop offset="0%" stop-color="${BLUE}" stop-opacity=".62"/>
      <stop offset="46%" stop-color="${VIOLET}" stop-opacity=".26"/>
      <stop offset="100%" stop-color="${VIOLET}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="warm" cx="50%" cy="46%" r="42%">
      <stop offset="0%" stop-color="#ffbe8c" stop-opacity=".16"/>
      <stop offset="100%" stop-color="#ffbe8c" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="vig" cx="50%" cy="46%" r="76%">
      <stop offset="42%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#050303" stop-opacity=".92"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="${VOID}"/>
  <rect width="${W}" height="${H}" fill="url(#left)"/>
  <rect width="${W}" height="${H}" fill="url(#right)"/>
  <rect width="${W}" height="${H}" fill="url(#warm)"/>
  <rect width="${W}" height="${H}" fill="url(#vig)"/>
</svg>`

/** Il filo di gradiente sotto il payoff: la firma, in piccolo. */
const rule = `
<svg xmlns="http://www.w3.org/2000/svg" width="220" height="3">
  <defs>
    <linearGradient id="g" x1="0" x2="1">
      <stop offset="0%" stop-color="${RED}"/>
      <stop offset="46%" stop-color="${PINK}"/>
      <stop offset="100%" stop-color="${VIOLET}"/>
    </linearGradient>
  </defs>
  <rect width="220" height="3" rx="1.5" fill="url(#g)"/>
</svg>`

/* Il riquadro del wordmark. La I va dipinta col gradiente, e Pango sa fare un
   colore pieno per parola ma non un gradiente: allora la parola si rende due
   volte con le STESSE metriche — una col solo cream e la I trasparente, una
   con la sola I piena — e la seconda serve da maschera al gradiente. */
const WORD_W = 780
const WORD_H = 215
const WORD_X = Math.round((W - WORD_W) / 2)
const WORD_Y = 152

async function wordmark() {
  const cream = await text(
    `<span foreground="${CREAM}">LUM</span><span alpha="1%">I</span><span foreground="${CREAM}">NO</span>`,
    { file: 'Anton.ttf', family: 'Anton', width: WORD_W, height: WORD_H },
  )
  const onlyI = await text(
    `<span alpha="1%">LUM</span><span foreground="#ffffff">I</span><span alpha="1%">NO</span>`,
    { file: 'Anton.ttf', family: 'Anton', width: WORD_W, height: WORD_H },
  )

  const { width, height } = await sharp(cream).metadata()

  const gradientI = await sharp({
    create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([
      {
        input: Buffer.from(`
          <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
            <defs>
              <linearGradient id="g" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%" stop-color="${RED}"/>
                <stop offset="46%" stop-color="${PINK}"/>
                <stop offset="100%" stop-color="${VIOLET}"/>
              </linearGradient>
            </defs>
            <rect width="${width}" height="${height}" fill="url(#g)"/>
          </svg>`),
      },
      // La maschera: resta solo ciò che nella seconda passata era opaco, la I.
      { input: onlyI, blend: 'dest-in' },
    ])
    .png()
    .toBuffer()

  return sharp(cream).composite([{ input: gradientI }]).png().toBuffer()
}

async function main() {
  await ensureFonts()

  const word = await wordmark()
  const wordMeta = await sharp(word).metadata()

  const payoff = await text(`<span foreground="${CREAM}">${PAYOFF}</span>`, {
    file: 'Fraunces.ttf',
    family: 'Fraunces',
    width: 840,
    height: 44,
  })
  const payoffMeta = await sharp(payoff).metadata()

  const sectors = await text(`<span foreground="${DIM}">${SECTORS}</span>`, {
    file: 'Inter.ttf',
    family: 'Inter',
    width: 620,
    height: 17,
    spacing: 6,
  })
  const sectorsMeta = await sharp(sectors).metadata()

  const PAYOFF_Y = 424
  const RULE_Y = 502
  const SECTORS_Y = 542

  await sharp(Buffer.from(background))
    .composite([
      { input: word, top: WORD_Y, left: Math.round((W - wordMeta.width) / 2) },
      { input: payoff, top: PAYOFF_Y, left: Math.round((W - payoffMeta.width) / 2) },
      { input: Buffer.from(rule), top: RULE_Y, left: Math.round((W - 220) / 2) },
      { input: sectors, top: SECTORS_Y, left: Math.round((W - sectorsMeta.width) / 2) },
    ])
    .jpeg({ quality: 88, chromaSubsampling: '4:4:4' })
    .toFile(OUT)

  const out = await sharp(await readFile(OUT)).metadata()
  console.log(`og-image.jpg — ${out.width}×${out.height}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
