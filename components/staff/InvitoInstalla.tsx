'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Share, SquarePlus, X } from 'lucide-react'

/**
 * L'invito a installare l'app, che compare una volta sola e poi sparisce.
 *
 * ## Le quattro condizioni
 *
 * Compare **solo** se: siamo su un telefono, l'app non è già installata, non
 * è già stato chiuso una volta, e c'è qualcosa di concreto da dire — cioè
 * Chrome ci ha passato il suo `beforeinstallprompt`, oppure siamo su iOS dove
 * quell'evento non esiste e l'unica strada è spiegare il gesto.
 *
 * Su desktop non compare mai: una dashboard aperta in una scheda non ha niente
 * da guadagnare da una finestra senza barra degli indirizzi, e un invito che
 * non serve è pubblicità dentro uno strumento di lavoro.
 *
 * ## iOS è un caso a parte, e non per capriccio
 *
 * Safari non ha `beforeinstallprompt` e non ha un bottone «installa». L'unico
 * modo è Condividi → «Aggiungi a schermata Home», e va fatto **da Safari**: da
 * Chrome o da un'anteprima dentro un'altra app la voce non c'è. Quindi lì non
 * c'è un bottone da premere, c'è un'istruzione — ed è scritta col nome esatto
 * della voce di menù, perché «usa la funzione di installazione» non si trova.
 *
 * ## Si chiude e non torna
 *
 * Il ricordo sta in `localStorage`, che è per dispositivo: chi ha detto no sul
 * telefono non se lo ritrova, chi apre da un altro telefono lo vede una volta.
 * È il comportamento giusto — la domanda riguarda quel telefono lì.
 */

const CHIAVE = 'lm_invito_installa'

interface EventoInstalla extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function giaInstallata(): boolean {
  if (typeof window === 'undefined') return true
  /* Due modi, perché i due mondi rispondono in due modi diversi: Android
     dichiara la modalità display, iOS espone una proprietà sua su `navigator`
     e non implementa la media query. */
  if (window.matchMedia('(display-mode: standalone)').matches) return true
  return (window.navigator as { standalone?: boolean }).standalone === true
}

function suIOS(): boolean {
  const ua = navigator.userAgent
  /* Gli iPad recenti si presentano come Mac: il tocco è l'unico modo di
     distinguerli, ed è quello che ci interessa davvero (un Mac non ha
     «Aggiungi a schermata Home»). */
  const iPadOS = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1
  return /iPhone|iPad|iPod/.test(ua) || iPadOS
}

/** Safari e non un browser dentro un'altra app: lì la voce di menù non c'è. */
function safariVero(): boolean {
  const ua = navigator.userAgent
  return !/CriOS|FxiOS|EdgiOS|OPiOS|FBAN|FBAV|Instagram|Line\//.test(ua)
}

export default function InvitoInstalla() {
  const percorso = usePathname()
  const [modo, setModo] = useState<'no' | 'android' | 'ios'>('no')
  const [evento, setEvento] = useState<EventoInstalla | null>(null)

  /* Non sulla porta d'ingresso. Il layout dell'area avvolge anche l'accesso e
     la pagina offline, ma lì l'invito è fuori posto in due modi: copre il
     bottone «Entra», che è l'unica cosa da fare in quella schermata, e propone
     di tenersi sul telefono una cosa in cui non si è ancora entrati. Chi
     installa lo fa dopo, dalla dashboard, che è quando ha senso. */
  const fuoriPosto = percorso === '/staff/login' || percorso === '/staff/offline'

  useEffect(() => {
    let vivo = true

    if (fuoriPosto) return

    try {
      if (window.localStorage.getItem(CHIAVE) === 'no') return
    } catch {
      /* Modalità privata: senza memoria l'invito tornerebbe a ogni apertura,
         che è la cosa più fastidiosa che possa fare. Meglio tacere. */
      return
    }

    if (giaInstallata()) return
    /* Il telefono, non la larghezza della finestra: una finestra stretta su un
       portatile non è un telefono, e lì l'invito non ha senso. */
    if (!window.matchMedia('(max-width: 1039px)').matches) return

    if (suIOS()) {
      if (safariVero()) setModo('ios')
      return
    }

    const alPrompt = (e: Event) => {
      /* Si ferma il prompt automatico di Chrome per rimandarlo a quando lo
         chiede la persona: la barra del browser lo mostrerebbe in un momento
         qualsiasi, magari mentre si sta compilando una visita. */
      e.preventDefault()
      if (!vivo) return
      setEvento(e as EventoInstalla)
      setModo('android')
    }

    window.addEventListener('beforeinstallprompt', alPrompt)
    /* Installata dal menù del browser mentre l'invito è lì: sparisce. */
    const installata = () => setModo('no')
    window.addEventListener('appinstalled', installata)

    return () => {
      vivo = false
      window.removeEventListener('beforeinstallprompt', alPrompt)
      window.removeEventListener('appinstalled', installata)
    }
  }, [fuoriPosto])

  function chiudi() {
    try {
      window.localStorage.setItem(CHIAVE, 'no')
    } catch {
      /* Niente memoria, niente da fare: sparisce almeno per questa sessione. */
    }
    setModo('no')
  }

  async function installa() {
    if (!evento) return
    await evento.prompt()
    await evento.userChoice
    /* Accettato o rifiutato, l'evento è consumato e non si può riusare: in
       entrambi i casi l'invito ha finito il suo lavoro. */
    chiudi()
  }

  if (modo === 'no') return null

  return (
    <div className="lm-invito" role="dialog" aria-label="Installa Lumino Staff">
      <div className="lm-invito-testo">
        <b>Tienila sul telefono</b>
        {modo === 'android' ? (
          <span>Si apre a tutto schermo, senza passare dal browser.</span>
        ) : (
          <span className="lm-invito-ios">
            Tocca <Share aria-hidden="true" /> in basso, poi{' '}
            <SquarePlus aria-hidden="true" /> «Aggiungi a schermata Home».
          </span>
        )}
      </div>

      {modo === 'android' && (
        <button type="button" className="lm-btn lm-invito-si" data-size="sm" onClick={installa}>
          Installa
        </button>
      )}

      <button type="button" className="lm-invito-no" onClick={chiudi} aria-label="Non mostrare più">
        <X aria-hidden="true" />
      </button>
    </div>
  )
}
