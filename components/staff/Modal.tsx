'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
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
 */
export default function Modal({
  title,
  onClose,
  children,
}: {
  title: string
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
     ancora cambiato niente. */
  useEffect(() => {
    if (!ospite) return
    const previous = document.activeElement as HTMLElement | null
    boxRef.current
      ?.querySelector<HTMLElement>('input, textarea, select, button, [href]')
      ?.focus()
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
        {children}
      </div>
    </div>,
    ospite,
  )
}
