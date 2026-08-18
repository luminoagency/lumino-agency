/**
 * Strato tipografico di fondo: "LUMINO" ripetuto, gigantesco, in solo contorno.
 *
 * È il modo di dare profondità all'hero senza una sola immagine: due nastri che
 * scorrono a velocità diverse e reagiscono al mouse meno del titolo. La
 * profondità la fa la differenza di velocità, non un'ombra.
 *
 * Ogni nastro è duplicato: quando la prima metà è uscita, la trasformazione
 * torna a zero e il taglio non si vede.
 */

const WORD = 'LUMINO'
const REPEAT = 6

function Row({ variant }: { variant: 'a' | 'b' }) {
  return (
    <div className={`lm-backtype-row lm-backtype-${variant}`}>
      <span className="lm-backtype-track">
        {[0, 1].map((half) => (
          <span className="lm-backtype-half" key={half}>
            {Array.from({ length: REPEAT }, (_, i) => (
              <span className="lm-backtype-word" key={i}>
                {WORD}
              </span>
            ))}
          </span>
        ))}
      </span>
    </div>
  )
}

export default function HeroBackdrop() {
  return (
    <div className="lm-backtype" aria-hidden="true">
      <Row variant="a" />
      <Row variant="b" />
    </div>
  )
}
