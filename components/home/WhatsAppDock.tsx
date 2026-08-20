'use client'

import { useEffect, useState } from 'react'
import { WA_LINK } from './whatsappLink'

/**
 * Pulsante WhatsApp flottante della home.
 *
 * NON è il FAB globale di app/layout.tsx: quello sulla home resta escluso, ed
 * è giusto così — è verde WhatsApp, generico, e su questa vetrina sarebbe un
 * corpo estraneo. Questo è suo, e parla la lingua del sito.
 *
 * Serve perché la maggior parte di chi arriva vuole scrivere subito, e finché
 * il blocco WhatsApp stava solo in fondo alla home chi non scorreva non lo
 * trovava mai.
 *
 * TRE MOMENTI
 *  · durante l'hero non c'è. Lì sporcherebbe una composizione costruita al
 *    millimetro, e comunque nessuno ha ancora visto niente da chiedere.
 *  · passata la prima schermata entra con una molla.
 *  · arrivati ai Contatti sparisce: lì sotto c'è già la conversazione intera,
 *    e due inviti a fare la stessa cosa nello stesso schermo sono uno di
 *    troppo.
 *
 * Lo scroll è letto da un listener passivo e lo stato cambia solo quando la
 * risposta cambia davvero: React non ridisegna a ogni pixel.
 */

/** Sotto questa quota siamo ancora dentro la prima schermata. */
const APPEAR_AT = 0.9

export default function WhatsAppDock() {
  const [past, setPast] = useState(false)
  const [atContact, setAtContact] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      const beyond = window.scrollY > window.innerHeight * APPEAR_AT
      setPast((current) => (current === beyond ? current : beyond))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  /* La sezione Contatti la si osserva, non la si calcola: la sua posizione
     cambia ogni volta che qualcuno tocca una sezione più in alto. */
  useEffect(() => {
    const contact = document.getElementById('contatti')
    if (!contact) return

    const observer = new IntersectionObserver(([entry]) => setAtContact(entry.isIntersecting), {
      threshold: 0,
    })
    observer.observe(contact)
    return () => observer.disconnect()
  }, [])

  const visible = past && !atContact

  return (
    <a
      className={`lm-wadock${visible ? ' is-in' : ''}`}
      href={WA_LINK}
      target="_blank"
      rel="noopener noreferrer"
      /* Nascosto anche alla tastiera e ai lettori di schermo quando non è in
         scena: un link invisibile ma tabulabile è una trappola. */
      aria-hidden={!visible}
      tabIndex={visible ? undefined : -1}
      data-cursor="whatsapp"
    >
      <span className="lm-wadock-label">Scrivici su WhatsApp</span>

      <span className="lm-wadock-icon">
        <span className="lm-wadock-ring" aria-hidden="true" />
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </span>
    </a>
  )
}
