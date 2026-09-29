/**
 * La stanza di /staff, da fotografia a file.
 *
 *   node scripts/sfondo-staff.mjs <foto.jpg>
 *
 * Prende una foto qualsiasi di un interno luminoso e ne ricava
 * `public/staff/stanza.webp`: 1920px di larghezza, schiarita, un filo
 * desaturata e **già sfocata**.
 *
 * La sfocatura è cotta nel file e non lasciata a `filter: blur()` per due
 * ragioni che vanno insieme. La prima è il peso: una foto sfocata non ha più
 * dettaglio fine da codificare, quindi passa da ~550 KB a poche decine — è
 * l'unico motivo per cui possiamo permetterci 1920px veri invece di
 * un'immagine piccola tirata. La seconda è il costo a fotogramma: la stanza si
 * muove per tutta la vita della pagina, e un livello sfocato dal browser è un
 * livello che il browser può decidere di ridisegnare a ogni fotogramma. Qui
 * non c'è niente da ridisegnare: è una texture, e si sposta.
 *
 * Per cambiare stanza: si lancia questo comando con un'altra foto. Non c'è
 * nient'altro da toccare, né nel CSS né nel componente. Il **nome** del file
 * invece è nominato anche nel matcher di `middleware.ts`: sta sotto `/staff/`,
 * e senza quell'eccezione il gate dell'area lo rimanda al login.
 */
import sharp from 'sharp'
import { stat } from 'node:fs/promises'

const sorgente = process.argv[2]
if (!sorgente) {
  console.error('Serve una foto: node scripts/sfondo-staff.mjs <foto.jpg>')
  process.exit(1)
}

const destinazione = 'public/staff/stanza.webp'

await sharp(sorgente)
  .resize({ width: 1920, withoutEnlargement: true })
  // Appena desaturata, perché il verde degli alberi fuori dalla finestra non
  // diventi il colore dell'interfaccia. **Non schiarita**: la schiarita la fa
  // il velo nel CSS, che è la cosa giusta da regolare — un file schiarito
  // perde la struttura di toni, e senza quella la stanza vista attraverso il
  // vetro torna a essere una foschia bianca invece di una stanza.
  .modulate({ brightness: 1.0, saturation: 0.9 })
  // Cinque pixel di sfocatura su 1920. Erano nove, ed erano troppi: il
  // pannello davanti ha già la sua sfocatura, il velo schiarisce, e sommando
  // le tre cose la stanza diventava una foschia — cioè di nuovo un fondo
  // piatto, che è il difetto da cui siamo partiti. A cinque pixel le vetrate
  // restano vetrate anche viste attraverso il vetro, e il dettaglio fine che
  // farebbe rumore dietro al testo sparisce lo stesso.
  .blur(5)
  .webp({ quality: 72, effort: 6 })
  .toFile(destinazione)

const { size } = await stat(destinazione)
console.log(`${destinazione} — ${(size / 1024).toFixed(0)} KB`)
