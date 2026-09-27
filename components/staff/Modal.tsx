'use client'

import { useEffect, useRef } from 'react'

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

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)

    const first = boxRef.current?.querySelector<HTMLElement>(
      'input, textarea, select, button, [href]',
    )
    first?.focus()

    return () => {
      document.removeEventListener('keydown', onKey)
      previous?.focus?.()
    }
  }, [onClose])

  return (
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
    </div>
  )
}
