import { BLOBS } from './heroMotion'

/**
 * Blob liquidi.
 *
 * Cinque cerchi dentro un contenitore con filtro SVG "gooey": sfocatura forte,
 * poi feColorMatrix che alza il contrasto del solo canale alpha. Il risultato è
 * che due cerchi vicini si saldano in una massa sola con un raccordo morbido, e
 * si staccano quando si allontanano — come mercurio.
 *
 * I cerchi sono a piena opacità: è il CONTENITORE a essere trasparente. Se
 * fossero trasparenti loro, l'alpha in ingresso sarebbe troppo bassa perché il
 * feColorMatrix abbia qualcosa da irrigidire, e la fusione non si vedrebbe.
 *
 * Usato in due posti: nell'hero (mosso dal driver rAF) e dentro il primo demo
 * della sezione "Il design" (mosso da keyframe CSS, per restare scrubbabile).
 * Da lì arrivano i due parametri: meno cerchi in un riquadro piccolo, e un solo
 * `<defs>` in pagina — l'id del filtro è unico e va dichiarato una volta.
 */
export default function HeroBlobs({
  count = BLOBS.length,
  defs = true,
}: {
  count?: number
  defs?: boolean
}) {
  const tints = [
    'rgba(107, 31, 42, 0.9)', // bordeaux
    'rgba(139, 92, 246, 0.75)', // violet
    'rgba(59, 79, 196, 0.7)', // blue
    'rgba(107, 31, 42, 0.7)',
    'rgba(90, 70, 150, 0.65)',
  ]

  return (
    <div className="lm-blobs" aria-hidden="true">
      {defs ? (
        <svg className="lm-goo-defs" width="0" height="0" focusable="false" aria-hidden="true">
          <defs>
            <filter id="lm-goo" colorInterpolationFilters="sRGB">
              <feGaussianBlur in="SourceGraphic" stdDeviation="26" result="blurred" />
              {/* L'ultima riga è l'alpha: moltiplicata e ribassata, i bordi
                  sfumati tornano netti e le masse vicine si fondono. */}
              <feColorMatrix
                in="blurred"
                type="matrix"
                values="1 0 0 0 0
                        0 1 0 0 0
                        0 0 1 0 0
                        0 0 0 26 -12"
                result="goo"
              />
              {/* Una seconda sfocatura leggera toglie il bordo di plastica. */}
              <feGaussianBlur in="goo" stdDeviation="14" />
            </filter>

            {/* Versione leggera per gli schermi stretti: le sfocature sono la
                parte cara di questo filtro, e il raggio si paga sul numero di
                pixel da campionare. Dimezzarlo dimezza il conto, e su un
                riquadro piccolo la differenza non si vede. */}
            <filter id="lm-goo-lite" colorInterpolationFilters="sRGB">
              <feGaussianBlur in="SourceGraphic" stdDeviation="13" result="blurred" />
              <feColorMatrix
                in="blurred"
                type="matrix"
                values="1 0 0 0 0
                        0 1 0 0 0
                        0 0 1 0 0
                        0 0 0 22 -10"
                result="goo"
              />
              <feGaussianBlur in="goo" stdDeviation="7" />
            </filter>
          </defs>
        </svg>
      ) : null}

      <div className="lm-blobs-stage">
        {BLOBS.slice(0, count).map((blob, i) => (
          <span
            className="lm-blob"
            key={i}
            style={{
              left: `${blob.x}%`,
              top: `${blob.y}%`,
              width: `${blob.size}%`,
              background: tints[i],
            }}
          />
        ))}
      </div>
    </div>
  )
}
