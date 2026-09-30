'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { ospitePortale } from '@/lib/staff/portale'

/**
 * La modale in glass.
 *
 * Fa le tre cose che una modale deve fare e che si dimenticano sempre: si
 * chiude con Esc, porta il fuoco dentro appena si apre e lo riporta da dove
 * era partito quando si chiude. Senza l'ultima, chi naviga da tastiera dopo
 * una conferma si ritrova con il fuoco all'inizio del documento.
 *
 * Non usa <dialog>: il `showModal()` nativo va guidato da un effetto per stare
 * dietro a uno stato React, e qui non serve niente di quello che dà in più.
 *
 * **Si disegna altrove.** La colonna del contenuto è un piano isolato e scorre:
 * lasciata dove nasce, la modale finirebbe sotto il rail e tagliata dal bordo
 * della colonna. Si sposta su `.lm-staff` — fuori dall'isolamento, dentro le
 * variabili dell'area — e il primo giro resta a vuoto perché sul server non
 * c'è nessun documento a cui agganciarsi.
 *
 * ## Tre pezzi, e il pulsante non se ne va mai
 *
 * Fino al 30 settembre 2026 la modale era una scatola sola: testa, campi e
 * bottoni uno sotto l'altro, e la scatola cresceva quanto il contenuto. Con un
 * allegato dentro — una foto verticale da telefono, nell'Archivio — la scatola
 * diventava più alta dello schermo e **«Archivia» finiva sotto il bordo
 * inferiore**, irraggiungibile: non si poteva salvare. Il `max-height: 88vh`
 * che c'era valeva per i soli form marcati, usava `vh` (che su telefono conta
 * anche la barra degli indirizzi quando è aperta) e faceva scorrere *tutta* la
 * scatola, bottoni compresi.
 *
 * Ora sono tre piani in una colonna flex: `.lm-modal-testa` ferma in cima,
 * `.lm-modal-corpo` che scorre, `.lm-modal-actions` fermo in fondo. Il tetto è
 * in `dvh`. Chi apre la modale vede sempre sia di che cosa si tratta sia come
 * ne esce, e in mezzo scorre quello che deve scorrere.
 *
 * Il contratto verso chi la usa è di due classi: il contenuto va in un
 * `.lm-modal-corpo`, i bottoni in un `.lm-modal-actions`. Un `<form>` che deve
 * avvolgerli tutti e due si marca `.lm-modal-form`, che è `display: contents`
 * — resta un form per il DOM (quindi per il submit e per Invio) e sparisce
 * come scatola, così i tre piani restano figli diretti della colonna.
 */
export default function Modal({
  title,
  head,
  onClose,
  children,
}: {
  /** Il nome della finestra per chi non la vede. Titola anche la testa, se `head` manca. */
  title: string
  /** La testa, quando il titolo visibile non è il titolo accessibile o porta altro con sé. */
  head?: React.ReactNode
  onClose: () => void
  children: React.ReactNode
}) {
  const boxRef = useRef<HTMLDivElement>(null)
  const [ospite, setOspite] = useState<HTMLElement | null>(null)

  useEffect(() => setOspite(ospitePortale()), [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  /* Il fuoco si sposta quando il riquadro **esiste**, cioè al giro dopo che
     l'ospite è stato trovato: al primo giro `boxRef` è ancora vuoto e chiamare
     `focus()` lì dentro non farebbe niente. La riga da cui si era partiti si
     legge nello stesso momento, non al montaggio: prima dell'ospite non è
     ancora cambiato niente.

     Si cerca **dentro il corpo** e solo dopo in tutta la scatola: da quando la
     testa ha la sua X di chiusura, il primo elemento a fuoco del documento è
     quella, e aprire una modale piazzando il cursore sul bottone «chiudi» è il
     contrario di quello che serve. */
  useEffect(() => {
    if (!ospite) return
    const previous = document.activeElement as HTMLElement | null
    const fuocabili = 'input, textarea, select, button, [href]'
    const primo =
      boxRef.current?.querySelector<HTMLElement>(`.lm-modal-corpo :is(${fuocabili})`) ??
      boxRef.current?.querySelector<HTMLElement>(fuocabili)
    primo?.focus()
    return () => previous?.focus?.()
  }, [ospite])

  if (!ospite) return null

  return createPortal(
    <div className="lm-modal" onMouseDown={onClose}>
      <div
        ref={boxRef}
        className="lm-modal-box"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="lm-modal-testa">
          <div className="lm-modal-titolo">{head ?? <h2>{title}</h2>}</div>
          <button type="button" className="lm-modal-chiudi" onClick={onClose} aria-label="Chiudi">
            <X aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    ospite,
  )
}
