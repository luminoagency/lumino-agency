'use client'

import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'

export interface PuntoZona {
  /** Il nome che va nel popup: una città, una zona, un cliente. */
  nome: string
  lat: number
  lng: number
  /** Quanti: clienti, visite, chiusure. Il popup lo dice con `unita`. */
  n: number
}

/**
 * La mappa del territorio, vera.
 *
 * Prima al suo posto c'era un piano cartesiano: i clienti cadevano su un
 * rettangolo grigio secondo latitudine e longitudine, con una diagonale
 * disegnata a mano per il mare. Funzionava finché i punti erano lontani; con i
 * dati veri i cerchi di Jesolo, Cavallino e Caorle si sovrapponevano e le
 * etichette si coprivano a vicenda, cioè proprio dove serviva leggere.
 *
 * Qui c'è **Leaflet con le tile standard di OpenStreetMap**, schiarite e
 * desaturate dal CSS (vedi `.lm-map-canvas .leaflet-tile-pane` in staff.css).
 * L'attribuzione è obbligatoria per la licenza e la mette Leaflet in basso a
 * destra.
 *
 * Il primo tentativo era CartoDB Positron, che sarebbe più bello in partenza:
 * **non è più utilizzabile senza chiave.** Oggi `basemaps.cartocdn.com` risponde
 * con una tile segnaposto da 2KB con scritto «API KEY REQUIRED» — e lo fa con
 * uno `200 OK`, quindi Leaflet la disegna senza lamentarsi e la mappa sembra
 * funzionare finché non la si guarda. Stessa cosa per Stadia Maps, che senza
 * account funziona su localhost e smette di funzionare sul dominio vero: il
 * peggiore dei due modi di rompersi, perché si rompe dopo il deploy.
 *
 * OpenStreetMap standard non chiede chiavi, e la sua policy d'uso ammette
 * un'applicazione di poche decine di visualizzazioni al giorno come questa. Il
 * giorno che diventasse un servizio pubblico, qui si cambia una stringa.
 *
 * Tre scelte che vale la pena spiegare:
 *
 * 1. **Leaflet entra solo nel browser, e solo quando questa mappa esiste.**
 *    `import('leaflet')` dentro l'effetto, non in cima al file: Leaflet tocca
 *    `window` mentre si carica, quindi un import statico romperebbe il render
 *    sul server, e comunque farebbe pagare ~150KB a chi apre una pagina senza
 *    mappa. Chi importa questo componente lo fa con `next/dynamic`.
 * 2. **I punti vicini si sommano** (`leaflet.markercluster`): a livello di
 *    regione un disco con «12» dice più di dodici pallini sovrapposti, e
 *    avvicinandosi il gruppo si apre da sé.
 * 3. **Il nome sta nel popup, non sulla mappa.** Le etichette fisse erano il
 *    difetto peggiore della versione precedente: sette parole su duecento pixel
 *    si coprono sempre, qualunque sia l'algoritmo.
 *
 * La mappa si crea una volta e poi si aggiornano solo i marker: ricrearla a
 * ogni cambio di dati vorrebbe dire riscaricare le tile e perdere lo zoom che
 * chi guarda aveva scelto.
 */
export default function Mappa({
  punti,
  unita = 'clienti',
  centro = [45.62, 12.42],
  zoom = 8,
}: {
  punti: PuntoZona[]
  /** Come si chiamano le cose contate: «clienti», «visite», «chiusure». */
  unita?: string
  centro?: [number, number]
  zoom?: number
}) {
  const box = useRef<HTMLDivElement>(null)
  /* Il tipo è `unknown` e si restringe dentro l'effetto: tipizzarlo come
     `L.Map` costringerebbe a importare Leaflet anche solo per i tipi, e
     `import type` in cima a un file client lo trascina nel bundle del server. */
  const mappa = useRef<{ mappa: unknown; gruppo: unknown } | null>(null)

  useEffect(() => {
    let vivo = true

    async function monta() {
      const L = (await import('leaflet')).default
      await import('leaflet.markercluster')
      const el = box.current
      if (!vivo || !el) return

      if (!mappa.current) {
        const m = L.map(el, {
          center: centro,
          zoom,
          /* Lo scroll della pagina non deve diventare uno zoom della mappa: su
             una dashboard che si scorre è il modo più rapido di perdere il
             segno. Ci si zooma coi comandi o col doppio clic. */
          scrollWheelZoom: false,
          zoomControl: true,
          attributionControl: true,
        })

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 18,
        }).addTo(m)

        const gruppo = (
          L as unknown as {
            markerClusterGroup: (o: Record<string, unknown>) => {
              addTo: (m: unknown) => unknown
            }
          }
        ).markerClusterGroup({
          showCoverageOnHover: false,
          maxClusterRadius: 44,
          iconCreateFunction: (cluster: { getAllChildMarkers: () => { options: { lmN?: number } }[] }) => {
            /* Il numero del cluster è la **somma dei clienti**, non il numero
               di marker: due pallini da sei non fanno «2», fanno «12». */
            const totale = cluster
              .getAllChildMarkers()
              .reduce((s, mk) => s + (mk.options.lmN ?? 1), 0)
            const lato = 30 + Math.sqrt(totale) * 5
            return L.divIcon({
              html: `<span class="lm-cluster" style="width:${lato}px;height:${lato}px">${totale}</span>`,
              className: '',
              iconSize: [lato, lato],
            })
          },
        })
        gruppo.addTo(m)
        mappa.current = { mappa: m, gruppo }
      }

      const { mappa: m, gruppo } = mappa.current as {
        mappa: { invalidateSize: () => void; fitBounds: (b: unknown, o: unknown) => void }
        gruppo: {
          clearLayers: () => void
          addLayer: (l: unknown) => void
          getLayers: () => unknown[]
          getBounds: () => { isValid: () => boolean }
        }
      }

      gruppo.clearLayers()
      for (const p of punti) {
        const lato = 16 + Math.sqrt(p.n) * 7
        const marker = L.marker([p.lat, p.lng], {
          icon: L.divIcon({
            html: '<span class="lm-pin"></span>',
            className: '',
            iconSize: [lato, lato],
          }),
          title: p.nome,
          /* Passato dentro le opzioni: è così che il cluster lo ritrova senza
             tenere una seconda mappa id → numero da mantenere in pari. */
          ...({ lmN: p.n } as Record<string, unknown>),
        })
        marker.bindPopup(
          `<span class="lm-pop-nome">${fuga(p.nome)}</span><span class="lm-pop-n">${p.n} ${fuga(unita)}</span>`,
        )
        gruppo.addLayer(marker)
      }

      /* La finestra si adatta ai punti che ci sono davvero: un centro fisso sul
         Veneto va bene con venticinque clienti sparsi, ma con tre tutti a
         Jesolo mostrerebbe mezza pianura vuota. */
      if (punti.length > 1) {
        const bounds = gruppo.getBounds()
        if (bounds.isValid()) m.fitBounds(bounds, { padding: [28, 28], maxZoom: 11 })
      }

      /* Leaflet misura il contenitore al momento della creazione. Qui dentro il
         contenitore è una card che entra in dissolvenza, quindi la prima misura
         può essere sbagliata: un secondo giro dopo il layout la corregge. */
      requestAnimationFrame(() => m.invalidateSize())
    }

    monta()
    return () => {
      vivo = false
    }
  }, [punti, centro, zoom, unita])

  /* Lo smontaggio vero è separato: nel corpo dell'effetto sopra dipenderebbe da
     `punti`, e ogni cambio di dati distruggerebbe e ricreerebbe la mappa. */
  useEffect(
    () => () => {
      const corrente = mappa.current as { mappa: { remove: () => void } } | null
      corrente?.mappa.remove()
      mappa.current = null
    },
    [],
  )

  /* La cornice (`.lm-map`, con la sua altezza) la mette l'involucro in
     Mappa.tsx: deve esistere prima che questo file sia stato scaricato, o la
     card si accorcerebbe e poi salterebbe all'arrivo della mappa. */
  return (
    <>
      <div ref={box} className="lm-map-canvas" />
      {!punti.length && (
        <p className="lm-map-vuota">
          Nessun punto sulla mappa: i clienti senza coordinate non si possono
          disegnare.
        </p>
      )}
    </>
  )
}

/** Il popup è HTML: un nome con un apostrofo o una parentesi angolare non deve
    poter chiudere il tag che lo contiene. */
function fuga(testo: string): string {
  return testo.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`)
}
