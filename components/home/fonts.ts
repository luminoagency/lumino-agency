import { Anton } from 'next/font/google'

/**
 * Font display della sola home.
 *
 * Anton serve a UNA cosa: il wordmark gigante dell'hero. Non sta in
 * app/layout.tsx perché lì lo pagherebbero tutte le pagine, comprese quelle
 * che non lo useranno mai (legali, area cliente, dashboard). Dichiarato qui e
 * applicato al contenitore della home, il file parte solo su "/".
 *
 * Via next/font e non con @import: il file è self-hosted, precaricato, e non
 * c'è una richiesta a Google al primo dipinto (stessa regola di Inter e
 * Fraunces in app/layout.tsx).
 */
export const anton = Anton({
  subsets: ['latin'],
  /* Anton ha un solo peso: dichiararlo è obbligatorio. */
  weight: '400',
  variable: '--font-display',
  display: 'swap',
})
