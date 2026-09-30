import type { Metadata, Viewport } from 'next'
import { anton } from '@/components/home/fonts'
import { manrope, naskh } from '@/components/staff/fonts'
import CodaVisite from '@/components/staff/CodaVisite'
import InvitoInstalla from '@/components/staff/InvitoInstalla'
import RegistraSW from '@/components/staff/RegistraSW'
import Sfondo from '@/components/staff/Sfondo'
import { AVVII_IOS } from '@/lib/staff/avvii'
import './staff.css'

/**
 * Involucro dell'area staff — il vestito, non il guardiano.
 *
 * Qui non c'è nessun controllo di accesso, e non è una dimenticanza: questo
 * layout avvolge anche /staff/login, che per definizione si apre senza
 * sessione. Il gate sta in app/staff/(dash)/layout.tsx, che avvolge tutto il
 * resto.
 *
 * La scena sta qui per la stessa ragione: lo sfondo che si muove dietro il
 * vetro è il fondo dell'area intera, login compreso. Montarlo nel layout
 * interno vorrebbe dire che la porta d'ingresso ha un aspetto e la casa un
 * altro.
 *
 * I tre font sono dichiarati qui e non in app/layout.tsx: Manrope veste tutta
 * l'interfaccia, Anton serve solo al wordmark, Noto Naskh Arabic solo le ayat
 * del widget della preghiera. Caricarli a livello di app li farebbe pagare
 * anche alle pagine pubbliche, che hanno i loro — e il subset arabo non
 * c'entra niente con il sito di un ristorante.
 */
export const metadata: Metadata = {
  title: 'Staff',
  /* Un'area interna non si indicizza, nemmeno la sua pagina di accesso. */
  robots: { index: false, follow: false },

  /* **Il manifest dell'app installabile, e vale solo qui.** Il sito pubblico ha
     il suo (`app/manifest.ts`, start_url `/`): questo lo sostituisce per tutte
     le pagine sotto /staff, con ambito `/staff`. Installando dalla dashboard si
     installa la dashboard, non il sito di Lumino. */
  manifest: '/pwa/staff.webmanifest',

  /* Quello che Safari non legge dal manifest e vuole nei meta. Senza
     `capable`, aggiungere alla schermata Home fa una scorciatoia che riapre
     Safari con la sua barra; con lui si apre a tutto schermo come un'app.
     `translucent` è la barra di stato trasparente: è la scelta che lascia il
     fondo scuro del marchio sotto l'orologio invece di una fascia bianca, e
     **obbliga** a occuparsi dell'area sicura, cosa che facciamo in staff.css. */
  appleWebApp: {
    capable: true,
    title: 'Lumino Staff',
    statusBarStyle: 'black-translucent',
  },

  /* Il gemello standard di `apple-mobile-web-app-capable`. Chrome avverte in
     console che quello con prefisso è deprecato e vuole questo; Safari
     conosce solo quello con prefisso. Servono tutti e due, e Next non scrive
     il secondo da sé. */
  other: { 'mobile-web-app-capable': 'yes' },

  icons: {
    icon: [
      { url: '/pwa/icona-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/pwa/icona-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/pwa/apple-touch-icon.png', sizes: '180x180' }],
    /* Le schermate d'avvio di iOS: Safari ne vuole una per ogni dimensione di
       schermo, scelta con una media query, e se non la trova mostra una pagina
       bianca per il secondo che ci mette ad aprirsi. L'elenco è generato da
       `scripts/icone-pwa.mjs` insieme ai file, perché trentaquattro righe che
       devono corrispondere ai nomi dei file non si scrivono a mano. */
    other: AVVII_IOS.map((a) => ({ rel: 'apple-touch-startup-image', ...a })),
  },
}

/**
 * `viewportFit: 'cover'` porta la pagina sotto il notch e sotto la barra dei
 * gesti — che è quello che si vuole (il fondo arriva ai bordi), a patto di
 * rimettere l'aria con `env(safe-area-inset-*)` dove c'è del contenuto. Lo fa
 * `staff.css`, nella sezione «L'area sicura».
 *
 * Il colore del tema è il nero del marchio: è la fascia che Android disegna
 * attorno all'app installata, e deve essere la stessa del manifest.
 */
export const viewport: Viewport = {
  themeColor: '#171210',
  viewportFit: 'cover',
  /* Un'interfaccia di lavoro non si ingrandisce con le dita fino a rompersi,
     ma **si può ancora ingrandire**: `maximumScale` fermo a 1 è la riga che
     rende un'app inutilizzabile a chi ha bisogno di zoomare, ed è vietata. */
  width: 'device-width',
  initialScale: 1,
  /* Quando si apre la tastiera, Android di suo la disegna **sopra** la pagina:
     la finestra resta alta uguale, `dvh` non cambia, e il piede di una modale
     finisce coperto proprio mentre si scrive nel campo sopra. Con
     `resizes-content` la tastiera rimpicciolisce la pagina, quindi il foglio si
     accorcia e i bottoni restano visibili. */
  interactiveWidget: 'resizes-content',
}

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`lm-staff ${manrope.variable} ${anton.variable} ${naskh.variable}`}>
      <Sfondo />
      {children}
      {/* I tre pezzi dell'app installata. Sono tutti e tre client component che
          non disegnano niente finché non c'è qualcosa da dire, e stanno qui e
          non nel layout interno perché valgono anche per la pagina di accesso —
          chi installa l'app la apre da lì la prima volta. */}
      <RegistraSW />
      <CodaVisite />
      <InvitoInstalla />
    </div>
  )
}
