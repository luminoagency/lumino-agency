/**
 * Le icone e gli avviamenti della PWA dello staff.
 *
 *   node scripts/icone-pwa.mjs
 *
 * Tutto si ricava da `public/icon-512.png`, che è il marchio: qui non si
 * disegna niente, si compone. Se un giorno il marchio cambia, si rifà quel file
 * e si rilancia questo comando.
 *
 * ## Perché tre famiglie di icone e non una
 *
 * - **Normale** (`icona-192`, `icona-512`): il file com'è, angoli tondi
 *   compresi. È quella che Android mostra dove non applica maschere.
 * - **Maskable**: Android ritaglia l'icona nella forma decisa dal telefono —
 *   cerchio, goccia, squircle — e lo fa **dentro** l'immagine che gli diamo.
 *   Un'icona già con gli angoli tondi, ritagliata a cerchio, perde le anse
 *   della L. Quindi qui il fondo è pieno fino al bordo e il marchio sta nel
 *   60% centrale, che è la zona sicura dichiarata dalla specifica.
 * - **Apple**: iOS arrotonda da sé e **non** gestisce la trasparenza (la
 *   rende nera). Fondo pieno, marchio un po' più grande: l'angolo che iOS
 *   taglia è più piccolo di quello che taglia Android.
 *
 * ## Gli avviamenti
 *
 * Safari non legge `icons` dal manifest per la schermata d'avvio: vuole un PNG
 * delle dimensioni esatte del dispositivo, dichiarato in un `<link>` con la sua
 * media query. Se non lo trova mostra una pagina bianca. Sono immagini piatte —
 * un fondo e un marchio — quindi pesano due decine di KB anche a 1320x2868.
 */
import sharp from 'sharp'
import { mkdir, writeFile } from 'node:fs/promises'

const MARCHIO = 'public/icon-512.png'
const FONDO = { r: 0x17, g: 0x12, b: 0x10, alpha: 1 }
const FUORI = 'public/pwa'

await mkdir(FUORI, { recursive: true })

/** Il marchio dentro un quadrato pieno, con la percentuale di spazio che occupa. */
async function suFondo(lato, quota, nome) {
  const dentro = Math.round(lato * quota)
  const marchio = await sharp(MARCHIO).resize(dentro, dentro).png().toBuffer()
  await sharp({ create: { width: lato, height: lato, channels: 4, background: FONDO } })
    .composite([{ input: marchio, gravity: 'centre' }])
    .png({ compressionLevel: 9 })
    .toFile(`${FUORI}/${nome}`)
  return nome
}

const fatti = []

/* Normali: il marchio così com'è. */
for (const lato of [192, 512]) {
  await sharp(MARCHIO).resize(lato, lato).png({ compressionLevel: 9 }).toFile(`${FUORI}/icona-${lato}.png`)
  fatti.push(`icona-${lato}.png`)
}

/* Maskable: zona sicura al 60%. */
fatti.push(await suFondo(192, 0.6, 'icona-maskable-192.png'))
fatti.push(await suFondo(512, 0.6, 'icona-maskable-512.png'))

/* Apple: 180, fondo pieno, marchio al 72%. */
fatti.push(await suFondo(180, 0.72, 'apple-touch-icon.png'))

/**
 * Gli schermi degli iPhone e degli iPad ancora in giro, in pixel reali.
 * `[larghezza, altezza, dpr]` in punti CSS più il rapporto: il `<link>` che li
 * sceglie usa i punti, il file ha i pixel.
 */
const SCHERMI = [
  [320, 568, 2], [375, 667, 2], [414, 736, 3],
  [375, 812, 3], [390, 844, 3], [393, 852, 3], [402, 874, 3],
  [414, 896, 2], [414, 896, 3], [428, 926, 3], [430, 932, 3], [440, 956, 3],
  [768, 1024, 2], [834, 1112, 2], [834, 1194, 2], [820, 1180, 2], [1024, 1366, 2],
]

const righe = []
for (const [w, h, dpr] of SCHERMI) {
  for (const verso of ['portrait', 'landscape']) {
    const px = verso === 'portrait' ? [w * dpr, h * dpr] : [h * dpr, w * dpr]
    const nome = `avvio-${w}x${h}-${dpr}x-${verso === 'portrait' ? 'v' : 'o'}.png`
    const lato = Math.round(Math.min(px[0], px[1]) * 0.28)
    const marchio = await sharp(MARCHIO).resize(lato, lato).png().toBuffer()
    await sharp({ create: { width: px[0], height: px[1], channels: 4, background: FONDO } })
      .composite([{ input: marchio, gravity: 'centre' }])
      .png({ compressionLevel: 9, palette: true })
      .toFile(`${FUORI}/${nome}`)
    righe.push(
      `{ url: '/pwa/${nome}', media: '(device-width: ${w}px) and (device-height: ${h}px) and ` +
        `(-webkit-device-pixel-ratio: ${dpr}) and (orientation: ${verso})' },`,
    )
  }
}

/* I `<link>` non si scrivono a mano: sono trentaquattro righe che devono
   corrispondere esattamente ai file qui sopra, e una virgola sbagliata la si
   scopre solo installando l'app su un telefono che non si ha. */
await writeFile(
  'lib/staff/avvii.ts',
  `/* Generato da scripts/icone-pwa.mjs — non si modifica a mano. */\n` +
    `export const AVVII_IOS = [\n  ${righe.join('\n  ')}\n] as const\n`,
)

console.log(`${fatti.length} icone e ${righe.length} avviamenti in ${FUORI}/`)
