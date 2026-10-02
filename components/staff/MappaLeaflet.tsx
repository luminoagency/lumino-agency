'use client'

import { useEffect, useMemo, useRef } from 'react'
import { linkMappe } from '@/lib/staff/geocode'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'

export interface PuntoZona {
  /** Il nome che va nel popup: una città, una zona, un cliente. */
  nome: string
  lat: number
  lng: number
  /** Quanti: clienti, visite, chiusure. Il popup lo dice con `unita`. */
  n: number
  /**
   * L'indirizzo scritto, quando il punto è **un** posto e non un gruppo.
   *
   * La sua presenza è quello che cambia il popup: con l'indirizzo compaiono i
   * due bottoni per aprire le mappe del telefono, senza resta il conteggio. È
   * la distinzione giusta — «Jesolo · 6 clienti» non è un posto in cui si va, e
   * un bottone «Naviga» su un comune porterebbe in piazza.
   */
  indirizzo?: string | null
  /** La scheda da aprire dal popup, se il punto è un cliente. */
  id?: string
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
  /* Una volta per montaggio: lo user agent non cambia mentre la pagina è
     aperta, e leggerlo dentro l'effetto dei marker vorrebbe dire rileggerlo a
     ogni cambio di dati. */
  const duePiattaforme = useMemo(appleQui, [])
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
        /* Il telefono si riconosce dal **tipo di puntatore**, non dalla
           larghezza: un portatile con lo schermo touch ha un mouse, e un
           tablet in orizzontale è largo come un desktop. `(pointer: coarse)`
           risponde alla domanda vera — «si punta con un dito?». */
        const dito = window.matchMedia('(pointer: coarse)').matches

        const m = L.map(el, {
          center: centro,
          zoom,
          /* **La rotellina zooma, e prima no.** Era spenta per non far
             diventare lo scroll della pagina uno zoom della mappa, e il
             problema era vero: il rimedio però era una mappa su cui non si
             poteva zoomare, che è peggio del male. Il rimedio giusto è che la
             mappa si prenda la rotellina solo quando ha il fuoco del
             puntatore, e Leaflet lo fa da sé — la rotellina su una mappa
             sotto il cursore zooma, altrove scorre la pagina. */
          scrollWheelZoom: true,
          /* Il doppio clic ingrandisce, e con shift rimpicciolisce. */
          doubleClickZoom: true,
          /* **Su un dito il trascinamento parte spento, e questa è la riga
             che non blocca lo scroll della pagina.** Non per modo di dire: il
             CSS di Leaflet mette `touch-action: none` sul contenitore solo
             quando il gestore del trascinamento è attivo (la classe
             `leaflet-touch-drag`). Spento, resta `pan-x pan-y`, cioè il dito
             che parte da sopra la mappa scorre la pagina come su qualunque
             altra card — che su una dashboard lunga con una mappa alta 210px è
             l'unico comportamento che non è una trappola.

             Il pinch continua a funzionare, e il pinch di Leaflet **sposta
             anche**: muove il centro seguendo il punto medio fra le due dita.
             Quindi con due dita la mappa si zooma e si trascina già. L'effetto
             qui sotto accende in più il trascinamento vero mentre le due dita
             sono giù, così anche un movimento a distanza costante — due dita
             che scorrono parallele, senza stringere — la sposta.

             Col mouse non c'è niente di tutto questo: si trascina e basta. */
          dragging: !dito,
          touchZoom: true,
          zoomControl: true,
          attributionControl: true,
        })

        /* Due dita sulla mappa: si può spostare. Un dito: scorre la pagina.
           `touchstart` e `touchend` e non i Pointer Events, perché la cosa che
           serve sapere è **quante** dita ci sono, e `TouchEvent.touches` è
           l'unico posto dove quel numero è già pronto. `passive: true`: qui non
           si annulla niente, si accende e si spegne un comportamento di
           Leaflet. */
        if (dito) {
          const guarda = (e: TouchEvent) => {
            if (e.touches.length >= 2) m.dragging.enable()
            else m.dragging.disable()
          }
          el.addEventListener('touchstart', guarda, { passive: true })
          el.addEventListener('touchend', guarda, { passive: true })
          el.addEventListener('touchcancel', guarda, { passive: true })
        }

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
        marker.bindPopup(popup(p, unita, duePiattaforme))
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
  }, [punti, centro, zoom, unita, duePiattaforme])

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
      {/* Il suggerimento delle due dita: lo mostra il CSS solo dove si punta
          con un dito (`pointer: coarse`), perché su un computer sarebbe
          un'istruzione per un gesto che non esiste. Dirlo è necessario: un dito
          che scorre la pagina invece di muovere la mappa, senza una riga che lo
          spieghi, si legge come una mappa rotta — ed è esattamente l'errore da
          cui veniamo. */}
      {Boolean(punti.length) && (
        <p className="lm-map-dita" aria-hidden="true">
          Due dita per spostare e zoomare
        </p>
      )}
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

/**
 * Il contenuto del popup.
 *
 * Due forme, e la differenza la fa l'indirizzo:
 *
 * · **un gruppo** (una città, una zona) → nome e conteggio. Non ci sono bottoni
 *   per navigare, perché non c'è un posto dove andare: «Jesolo» è sei clienti
 *   sparsi, e un «Naviga» porterebbe nel municipio;
 * · **un cliente** → nome, indirizzo scritto, e i due bottoni che aprono
 *   l'applicazione di mappe del telefono. Più il link alla scheda, che è la cosa
 *   che si cerca più spesso dopo aver riconosciuto un pin.
 *
 * `target="_blank" rel="noopener"` su tutti e tre: senza, l'app di mappe si
 * aprirebbe **dentro** la dashboard sostituendola, e tornare indietro vorrebbe
 * dire ricaricare l'area e ritrovarsi sul pin perduto.
 *
 * È una stringa e non JSX perché `bindPopup` di Leaflet vuole HTML: ogni valore
 * che viene dal database passa da `fuga()`, compreso l'indirizzo — un nome di
 * locale con una parentesi angolare dentro è raro ma esiste, e il popup è il
 * posto in cui diventerebbe markup.
 */
function popup(p: PuntoZona, unita: string, duePiattaforme: boolean): string {
  const nome = fuga(p.nome)

  if (!p.indirizzo) {
    return `<span class="lm-pop-nome">${nome}</span><span class="lm-pop-n">${p.n} ${fuga(unita)}</span>`
  }

  const { google, apple } = linkMappe(p.lat, p.lng, p.nome)
  const scheda = p.id
    ? `<a class="lm-pop-scheda" href="/staff/clienti/${encodeURIComponent(p.id)}">Apri la scheda</a>`
    : ''

  /* Su Android il bottone Apple non si mostra: aprirebbe `maps.apple.com` nel
     browser, cioè una pagina che dice «apri su un dispositivo Apple». Su iPhone
     si mostrano entrambi perché l'una o l'altra è una preferenza vera, e
     indovinarla al posto di chi guarda si sbaglia la metà delle volte. */
  const bottoni = [
    `<a class="lm-pop-naviga" href="${google}" target="_blank" rel="noopener">Google Maps</a>`,
    duePiattaforme
      ? `<a class="lm-pop-naviga" href="${apple}" target="_blank" rel="noopener">Apple Maps</a>`
      : '',
  ]
    .filter(Boolean)
    .join('')

  return (
    `<span class="lm-pop-nome">${nome}</span>` +
    `<span class="lm-pop-dove">${fuga(p.indirizzo)}</span>` +
    `<span class="lm-pop-azioni">${bottoni}</span>` +
    scheda
  )
}

/**
 * Siamo su un dispositivo Apple?
 *
 * Serve a decidere se mostrare anche il bottone di Apple Maps, e si risponde
 * con lo user agent perché non c'è altro modo: non esiste una *feature query*
 * per «hai Apple Maps installata».
 *
 * Il secondo controllo non è un doppione: dal 2019 un **iPad** si dichiara
 * «Macintosh» per ricevere i siti da desktop, quindi l'unico modo di
 * riconoscerlo è un Mac che ha più di un punto di contatto — un Mac vero ne ha
 * zero. Senza quella riga, su iPad comparirebbe solo Google Maps, cioè
 * mancherebbe l'applicazione di sistema.
 */
function appleQui(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod/.test(ua)) return true
  return /Macintosh/.test(ua) && navigator.maxTouchPoints > 1
}
