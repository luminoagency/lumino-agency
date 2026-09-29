'use client'

import { useEffect } from 'react'

/**
 * Registra il service worker dell'area staff.
 *
 * ## Le tre righe che contano
 *
 * 1. **Dopo `load`.** Registrare durante il primo caricamento mette il
 *    download e la valutazione del worker in concorrenza con il JavaScript
 *    della pagina, sullo stesso thread e sulla stessa banda. Aspettare `load`
 *    costa zero a chi apre l'app e toglie il worker dalla strada del primo
 *    disegno — che è la cosa che si nota.
 * 2. **Ambito `/staff`.** Il file sta in radice perché un worker governa solo
 *    la propria cartella, e `/staff/sw.js` non governerebbe `/staff`. Il
 *    permesso di prendersi un ambito diverso dal proprio arriva
 *    dall'intestazione `Service-Worker-Allowed` in `next.config.js`.
 * 3. **`updateViaCache: 'none'`.** Senza, il browser può servire il file del
 *    worker dalla sua cache HTTP e tenere l'app ferma a una versione che non
 *    esiste più. È la stessa ragione del `no-store` che gli mettiamo addosso.
 *
 * Non disegna niente e non ha stato: è un effetto e basta.
 */
export default function RegistraSW() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    /* In sviluppo no: il worker metterebbe in cache i chunk di `next dev`, che
       cambiano a ogni salvataggio, e il primo sintomo sarebbe una pagina che
       non si aggiorna più mentre si lavora. */
    if (process.env.NODE_ENV !== 'production') return

    let annullato = false

    const registra = () => {
      if (annullato) return
      navigator.serviceWorker
        .register('/staff-sw.js', { scope: '/staff', updateViaCache: 'none' })
        .catch(() => {
          /* Un worker che non si registra non è un guasto da mostrare: l'app
             continua a funzionare esattamente come prima, solo senza pagina
             offline. */
        })
    }

    if (document.readyState === 'complete') registra()
    else window.addEventListener('load', registra, { once: true })

    return () => {
      annullato = true
      window.removeEventListener('load', registra)
    }
  }, [])

  return null
}
