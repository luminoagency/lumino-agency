'use client'

import dynamic from 'next/dynamic'
import type { PuntoZona } from './MappaLeaflet'

export type { PuntoZona }

/**
 * La mappa, caricata solo quando serve.
 *
 * Leaflet, il suo CSS e il plugin dei cluster sono circa 180KB: tanti per una
 * card, troppi per una pagina che non ha mappe. Qui stanno dietro un
 * `next/dynamic` con `ssr: false`, quindi entrano in un file a parte che il
 * browser scarica **dopo** il primo dipinto e solo nelle pagine che montano
 * questo componente.
 *
 * `ssr: false` non è una comodità: Leaflet legge `window` mentre si carica, e
 * sul server non c'è. Ed è anche il motivo per cui questo involucro è un client
 * component — `next/dynamic` con `ssr: false` non è ammesso dentro un server
 * component, e le pagine che lo usano sono tutte server component.
 *
 * Nell'attesa resta il riquadro grigio dell'altezza giusta: senza, la card si
 * accorcerebbe e poi salterebbe quando la mappa arriva.
 */
const Leaflet = dynamic(() => import('./MappaLeaflet'), { ssr: false })

export default function Mappa({
  altezza = 'sm',
  mancanti = 0,
  ...resto
}: {
  punti: PuntoZona[]
  altezza?: 'sm' | 'md' | 'lg'
  unita?: string
  centro?: [number, number]
  zoom?: number
  /**
   * Quanti non si possono disegnare perché non hanno coordinate.
   *
   * Una mappa con venti pin dove i clienti sono venticinque non si vede che è
   * incompleta: i cinque che mancano mancano in silenzio, e nessuno conta i pin.
   * Questa riga è l'unico posto in cui quel numero compare, e porta con sé cosa
   * fare — la scheda di ognuno dice poi se è un indirizzo da correggere o un
   * indirizzo che non c'è.
   */
  mancanti?: number
}) {
  /* La cornice è qui e non dentro il pezzo caricato a parte: esiste dal primo
     dipinto, con la sua altezza, e quando la mappa arriva ci si appoggia dentro
     senza far saltare la card. */
  return (
    <>
      <div className="lm-map" data-h={altezza}>
        <Leaflet {...resto} />
      </div>
      {mancanti > 0 && (
        <p className="lm-map-mancanti">
          {mancanti} client{mancanti === 1 ? 'e' : 'i'} non {mancanti === 1 ? 'è' : 'sono'} sulla
          mappa: {mancanti === 1 ? 'manca' : 'mancano'} le coordinate. La scheda di ognuno dice se
          l’indirizzo va corretto.
        </p>
      )}
    </>
  )
}
