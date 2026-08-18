import type { Work } from './worksData'

/**
 * Card progetto: deve leggersi come un browser che scorre il sito del cliente.
 *
 * Il markup accetta indifferentemente uno screenshot full-page o un <video>
 * in loop (vedi WorkMedia): si cambia sorgente in worksData.ts senza toccare
 * questo componente.
 *
 * Blocco 3: struttura statica. Scorrimento all'hover, tilt 3D, riflesso e
 * barra di avanzamento arrivano nel Blocco 5.
 */
export default function WorkCard({ work, index }: { work: Work; index: number }) {
  const { media } = work

  return (
    <article className="lm-card lm-reveal" data-work={work.id} style={{ ['--accent' as string]: work.accent }}>
      {/* Barra finta del browser */}
      <div className="lm-card-browser">
        <span className="lm-card-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="lm-card-url">{work.url}</span>
      </div>

      {/* Finestra: il media scorre qui dentro */}
      <div className="lm-card-viewport">
        <div className="lm-card-scroll">
          {!work.ready ? (
            <div className="lm-card-placeholder" aria-hidden="true">
              <span>{work.client}</span>
            </div>
          ) : media.kind === 'video' ? (
            <video
              className="lm-card-media"
              width={media.width}
              height={media.height}
              poster={media.poster}
              muted
              loop
              playsInline
              preload="none"
            >
              {media.sources.map((source) => (
                <source key={source.src} src={source.src} type={source.type} />
              ))}
            </video>
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element -- screenshot
               full-page altissimo: next/image lo ridimensionerebbe sul lato
               sbagliato. Dimensioni esplicite → nessun layout shift. */
            <img
              className="lm-card-media"
              src={media.src}
              width={media.width}
              height={media.height}
              alt={`Il sito di ${work.client}`}
              loading={index < 2 ? 'eager' : 'lazy'}
              decoding="async"
            />
          )}
        </div>

        <div className="lm-card-progress" aria-hidden="true">
          <span />
        </div>
        <div className="lm-card-sheen" aria-hidden="true" />
      </div>

      <div className="lm-card-meta">
        <h3 className="lm-card-client">{work.client}</h3>
        <span className="lm-card-tag">
          {work.sector} · {work.year}
        </span>
        <p className="lm-card-blurb">{work.blurb}</p>
      </div>
    </article>
  )
}
