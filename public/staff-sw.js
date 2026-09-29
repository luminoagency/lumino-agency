/**
 * Il service worker dell'area staff.
 *
 * ## Dove sta, e perché non sotto /staff/
 *
 * Un service worker può governare solo la cartella da cui viene servito, e
 * `/staff/sw.js` governerebbe `/staff/` — cioè tutto tranne `/staff`, che è la
 * home della dashboard. Sta quindi in radice e si prende l'ambito `/staff` con
 * l'intestazione `Service-Worker-Allowed`, messa in `next.config.js`. Fuori da
 * lì non tocca niente: il sito pubblico di Lumino non ha e non deve avere un
 * service worker.
 *
 * ## La regola che decide tutto: i dati non si mettono in cache
 *
 * Questa è una dashboard di vendita. Un elenco clienti servito dalla cache è
 * peggio di un elenco che non arriva: chi lo legge non ha modo di sapere che
 * sta guardando ieri. Quindi:
 *
 * - **navigazioni** → rete, punto. Se la rete non c'è si mostra la pagina di
 *   cortesia `/staff/offline`, che dice a chiare lettere che è offline. L'HTML
 *   **non** viene mai messo in cache.
 * - **payload RSC** (`?_rsc=`, cioè i cambi pagina dentro l'app) → non toccati
 *   affatto. Sono dati.
 * - **server action, POST, Supabase, altre origini** → non toccati affatto: il
 *   `fetch` non chiama nemmeno `respondWith`, quindi il worker non è nemmeno
 *   sulla strada.
 * - **solo** i file immutabili — `/_next/static/...`, che hanno l'impronta nel
 *   nome, più le icone e la fotografia della stanza — stanno in cache, e sono
 *   gli unici.
 *
 * ## Perché non rallenta il primo caricamento
 *
 * All'installazione mette in cache **tre file**: la pagina offline e due icone.
 * Non c'è nessuna precache del guscio di Next, che sarebbe decine di chunk
 * scaricati mentre la persona sta guardando la dashboard. Tutto il resto entra
 * in cache solo perché è già stato chiesto dalla pagina.
 *
 * `skipWaiting` + `clients.claim`: la versione nuova prende il posto della
 * vecchia subito. È sicuro proprio perché in cache ci sono solo file col nome
 * impronta — non esiste il caso «HTML nuovo con JS vecchio», che è il motivo
 * per cui di solito si aspetta.
 */

const VERSIONE = 'v1'
const GUSCIO = `lumino-staff-guscio-${VERSIONE}`
const STATICI = `lumino-staff-statici-${VERSIONE}`
const OFFLINE = '/staff/offline'

/** Quanto tiene la cache dei file immutabili prima di potarla. */
const TETTO_STATICI = 120

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(GUSCIO)
      /* `reload` salta la cache HTTP: all'aggiornamento del worker la pagina
         offline deve essere quella nuova, non quella che il browser ha già. */
      await cache.addAll([
        new Request(OFFLINE, { cache: 'reload' }),
        new Request('/pwa/icona-192.png', { cache: 'reload' }),
        new Request('/pwa/icona-512.png', { cache: 'reload' }),
      ])
      await self.skipWaiting()
    })(),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const nomi = await caches.keys()
      await Promise.all(
        nomi
          .filter((n) => n.startsWith('lumino-staff-') && n !== GUSCIO && n !== STATICI)
          .map((n) => caches.delete(n)),
      )

      /* **La riga che impedisce al worker di rallentare l'apertura.**
         Un worker fermo va avviato prima di poter rispondere, e su un telefono
         sono decine di millisecondi in cui non succede niente — pagati a ogni
         apertura dell'app, che è esattamente il momento in cui si nota. Con la
         precarica il browser manda la richiesta di rete **mentre** avvia il
         worker, e quando il worker è pronto la risposta è già in volo. */
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable()
      }

      await self.clients.claim()
    })(),
  )
})

/** Un file che non cambierà mai sotto lo stesso indirizzo. */
function immutabile(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/pwa/') ||
    url.pathname === '/staff/stanza.webp' ||
    url.pathname.startsWith('/pdfjs/')
  )
}

/** Tiene la cache dei file immutabili sotto il tetto, dalla più vecchia. */
async function pota(cache) {
  const chiavi = await cache.keys()
  if (chiavi.length <= TETTO_STATICI) return
  await Promise.all(chiavi.slice(0, chiavi.length - TETTO_STATICI).map((k) => cache.delete(k)))
}

self.addEventListener('fetch', (event) => {
  const richiesta = event.request
  if (richiesta.method !== 'GET') return

  let url
  try {
    url = new URL(richiesta.url)
  } catch {
    return
  }
  if (url.origin !== self.location.origin) return

  /* I cambi pagina dentro l'app sono `fetch` con questa intestazione o questo
     parametro: sono il contenuto della pagina, cioè dati. Si lasciano stare. */
  if (richiesta.headers.get('RSC') === '1' || url.searchParams.has('_rsc')) return

  if (richiesta.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          /* La risposta che il browser ha già cominciato a scaricare mentre
             avviava il worker (vedi `navigationPreload` in `activate`). Se c'è
             si usa quella: rifare il `fetch` vorrebbe dire buttare via la
             richiesta appena partita e ricominciarne un'altra. */
          const precaricata = await event.preloadResponse
          if (precaricata) return precaricata
          return await fetch(richiesta)
        } catch {
          const cache = await caches.open(GUSCIO)
          return (await cache.match(OFFLINE)) ?? Response.error()
        }
      })(),
    )
    return
  }

  if (!immutabile(url)) return

  event.respondWith(
    (async () => {
      const cache = await caches.open(STATICI)
      const copia = await cache.match(richiesta)
      if (copia) return copia
      const risposta = await fetch(richiesta)
      /* Solo le risposte buone, e solo quelle di questa origine: una risposta
         opaca occupa la cache e non si può nemmeno leggere. */
      if (risposta.ok && risposta.type === 'basic') {
        await cache.put(richiesta, risposta.clone())
        pota(cache)
      }
      return risposta
    })(),
  )
})

/* La pagina chiede di svuotare tutto quando si esce: una cache che sopravvive
   al logout su un telefono prestato è un dato lasciato in giro. */
self.addEventListener('message', (event) => {
  if (event.data === 'lumino:svuota') {
    event.waitUntil(
      caches.keys().then((n) => Promise.all(n.filter((x) => x.startsWith('lumino-staff-')).map((x) => caches.delete(x)))),
    )
  }
})
