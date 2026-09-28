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
  ...resto
}: {
  punti: PuntoZona[]
  altezza?: 'sm' | 'md' | 'lg'
  unita?: string
  centro?: [number, number]
  zoom?: number
}) {
  /* La cornice è qui e non dentro il pezzo caricato a parte: esiste dal primo
     dipinto, con la sua altezza, e quando la mappa arriva ci si appoggia dentro
     senza far saltare la card. */
  return (
    <div className="lm-map" data-h={altezza}>
      <Leaflet {...resto} />
    </div>
  )
}
