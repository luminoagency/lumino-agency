import type { ReactNode } from 'react'

/**
 * Spezza il titolo dell'hero in righe, segmenti e lettere.
 *
 * Ogni lettera è uno <span class="lm-char"> perché deve poter essere spostata,
 * sollevata e illuminata singolarmente dal cursore.
 *
 * Le lettere del segmento in gradiente portano data-grad: il colore glielo
 * assegna il JS una per una, interpolando fra i tre colori della firma.
 * Con background-clip non funzionerebbe — il gradiente resta ancorato al
 * riquadro del testo, quindi appena una lettera si muove il colore le rimane
 * indietro.
 *
 * L'accessibilità è preservata: il titolo intero sta nell'aria-label dell'h1 e
 * le righe sono aria-hidden.
 */

export interface Segment {
  text: string
  variant?: 'thin' | 'grad'
}

export function Chars({ text, variant }: Segment): ReactNode {
  return (
    <span className={variant ? `lm-seg lm-seg-${variant}` : 'lm-seg'}>
      {Array.from(text).map((char, i) =>
        char === ' ' ? (
          <span key={`s-${i}`}> </span>
        ) : (
          <span className="lm-char" key={`${char}-${i}`} data-grad={variant === 'grad' ? 'true' : undefined}>
            {char}
          </span>
        ),
      )}
    </span>
  )
}

/**
 * Una riga del titolo: il wrapper esterno taglia, quello interno sale.
 *
 * Accetta anche nodi già pronti (`children`) invece dei soli segmenti di testo:
 * serve alla riga che contiene la parola rotante, che non è testo semplice.
 */
export function Line({
  segments,
  children,
}: {
  segments?: Segment[]
  children?: ReactNode
}): ReactNode {
  return (
    <span className="lm-hline" aria-hidden="true">
      <span>
        {segments?.map((segment, i) => (
          <Chars key={i} text={segment.text} variant={segment.variant} />
        ))}
        {children}
      </span>
    </span>
  )
}
