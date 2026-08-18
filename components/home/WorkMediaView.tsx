import type { Work } from './worksData'

/**
 * Il contenuto della finestra: screenshot full-page, video in loop, o
 * placeholder finché l'asset non esiste.
 *
 * Estratto dalla card perché serve identico in due posti — la card in griglia
 * e il fallback dentro la finestra a tutto schermo quando un sito rifiuta di
 * farsi incorporare.
 */
export default function WorkMediaView({ work, eager = false }: { work: Work; eager?: boolean }) {
  const { media } = work

  if (!work.ready) {
    return (
      <div className="lm-card-placeholder" aria-hidden="true">
        <span>{work.client}</span>
      </div>
    )
  }

  if (media.kind === 'video') {
    return (
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
    )
  }

  return (
    /* eslint-disable-next-line @next/next/no-img-element -- screenshot full-page
       altissimo: next/image lo ridimensionerebbe sul lato sbagliato.
       Dimensioni esplicite → nessun layout shift. */
    <img
      className="lm-card-media"
      src={media.src}
      width={media.width}
      height={media.height}
      alt={`Il sito di ${work.client}`}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
    />
  )
}
