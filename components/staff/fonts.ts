import { Manrope, Noto_Naskh_Arabic } from 'next/font/google'

/**
 * Il carattere dell'area staff.
 *
 * Manrope fa due mestieri in uno: l'interfaccia ai pesi 400/500 e i titoli
 * e i numeri enormi ai pesi 200/300. I pesi sottili sono il punto: il
 * "Dashboard" di ref1 è grandissimo e leggerissimo, e un 700 alla stessa
 * misura diventa un titolo di giornale. Sopra i 700 qui non si va — il grassetto
 * serve alle etichette, non alle cifre.
 *
 * Dichiarato qui e non in app/layout.tsx: le pagine pubbliche hanno Inter e
 * Fraunces, e non devono pagare un terzo file per un'area in cui non entrano.
 */
export const manrope = Manrope({
  subsets: ['latin'],
  weight: ['200', '300', '400', '500', '600', '700'],
  variable: '--font-ui',
  display: 'swap',
})

/**
 * L'arabo delle ayat.
 *
 * Noto Naskh Arabic e non uno dei Kufi geometrici che stanno bene nei loghi: il
 * naskh è la forma in cui il Corano si legge da mille anni, ha le legature e i
 * segni vocalici al posto giusto, e alle misure piccole di un widget resta
 * leggibile — che è l'unico requisito che conta qui.
 *
 * Arriva da `next/font`, quindi è **servito dal nostro dominio**: nessuna
 * richiesta a Google a runtime, nessun costo, e il testo arabo non resta
 * invisibile per mezzo secondo su una connessione lenta. Solo i pesi 400 e 600:
 * la vocalizzazione in un grassetto pesante impasta i segni.
 */
export const naskh = Noto_Naskh_Arabic({
  subsets: ['arabic'],
  weight: ['400', '600'],
  variable: '--font-ar',
  display: 'swap',
})
