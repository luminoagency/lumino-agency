import type { ReactNode } from 'react'

/**
 * Spezza una frase in parole e lettere renderizzate come <span>.
 *
 * Serve al titolo dell'hero: ogni lettera deve poter essere spostata,
 * sollevata e illuminata singolarmente dal cursore, e le lettere della
 * parola in gradiente vanno colorate una per una via JS (interpolando fra
 * i tre colori della firma) — non con background-clip, che su un testo
 * animato per lettera non regge.
 *
 * L'accessibilità è preservata: la frase intera resta leggibile agli screen
 * reader tramite aria-label sul contenitore, e gli span sono aria-hidden.
 */

export interface SplitTextProps {
  text: string
  /** Parola (case-insensitive) da marcare con data-grad per la colorazione JS. */
  gradientWord?: string
  className?: string
}

export function SplitText({ text, gradientWord, className }: SplitTextProps): ReactNode {
  const words = text.split(' ')
  const target = gradientWord?.toLowerCase()
  let charIndex = 0

  return (
    <span className={className} aria-label={text}>
      {words.map((word, wi) => {
        const stripped = word.replace(/[^\p{L}\p{N}]/gu, '').toLowerCase()
        const isGradient = target !== undefined && stripped === target

        return (
          <span className="lm-word" key={`${word}-${wi}`} aria-hidden="true">
            {Array.from(word).map((char, ci) => {
              const i = charIndex++
              return (
                <span
                  className="lm-char"
                  key={`${char}-${ci}`}
                  data-i={i}
                  data-grad={isGradient ? 'true' : undefined}
                >
                  {char}
                </span>
              )
            })}
            {wi < words.length - 1 ? <span className="lm-space"> </span> : null}
          </span>
        )
      })}
    </span>
  )
}
