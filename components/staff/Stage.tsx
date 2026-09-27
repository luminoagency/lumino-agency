'use client'

import { useEffect, useState } from 'react'

/**
 * La stanza dietro il vetro.
 *
 * È l'elemento da cui dipende tutto il linguaggio dell'area: senza una scena
 * vera dietro, un pannello traslucido è solo un rettangolo grigio, e il blur
 * non ha niente da sfocare.
 *
 * Il video è **muto, in loop, senza controlli e senza contenuto narrativo** —
 * un interno sfocato in cui passa qualcuno. Non racconta niente e non deve:
 * se ci si accorge di starlo guardando, ruba attenzione al lavoro.
 *
 * Il file è già preparato per il suo mestiere (`public/staff/bg.mp4`, 1.8MB,
 * 1600px, loop palindromo così non c'è stacco al riavvolgimento). Sostituirlo
 * vuol dire cambiare quei due file e basta — nessun codice da toccare.
 *
 * Con `prefers-reduced-motion` il video **non viene nemmeno scaricato**: si
 * monta solo il poster. Nasconderlo in CSS avrebbe lasciato il download a
 * carico di chi ha chiesto meno movimento, che è esattamente il contrario.
 */
export default function Stage() {
  /* Si parte dal poster e si passa al video dopo il primo render: al momento
     dell'HTML generato sul server non si sa cosa preferisca chi guarda, e un
     video montato subito e poi tolto è un download buttato. */
  const [video, setVideo] = useState(false)

  useEffect(() => {
    const q = window.matchMedia('(prefers-reduced-motion: reduce)')
    const aggiorna = () => setVideo(!q.matches)
    aggiorna()
    q.addEventListener('change', aggiorna)
    return () => q.removeEventListener('change', aggiorna)
  }, [])

  return (
    <div className="lm-scene" aria-hidden="true">
      {video ? (
        <video
          src="/staff/bg.mp4"
          poster="/staff/bg.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
      ) : (
        <div className="lm-scene-poster" />
      )}
    </div>
  )
}
