import type { Work } from './worksData'

/**
 * Il contenuto della finestra della card: lo screenshot del sito, o — finché
 * un asset non esiste — un finto layout di sito costruito in CSS.
 *
 * Il finto layout non è un riempitivo grigio: ha nav, hero, blocchi immagine
 * nei colori del progetto, colonne e listino. Serve a far capire cosa sarà
 * quella card. Nessuna card resta mai bianca.
 */

function FakeSite({ work }: { work: Work }) {
  return (
    <div className="lm-fake" style={{ ['--accent' as string]: work.accent }} aria-hidden="true">
      <div className="lm-fake-nav">
        <span className="lm-fake-logo">{work.client}</span>
        <span className="lm-fake-links">
          <i />
          <i />
          <i />
        </span>
      </div>

      <div className="lm-fake-hero">
        <span className="lm-fake-eyebrow" />
        <span className="lm-fake-h1" />
        <span className="lm-fake-h1 is-short" />
        <span className="lm-fake-btn" />
      </div>

      <div className="lm-fake-media" />

      <div className="lm-fake-cols">
        {[0, 1, 2].map((i) => (
          <span className="lm-fake-col" key={i}>
            <i className="lm-fake-thumb" />
            <i className="lm-fake-line" />
            <i className="lm-fake-line is-short" />
          </span>
        ))}
      </div>

      <div className="lm-fake-band">
        <span className="lm-fake-h2" />
        <i className="lm-fake-line" />
        <i className="lm-fake-line" />
        <i className="lm-fake-line is-short" />
      </div>

      <div className="lm-fake-media is-alt" />

      <div className="lm-fake-foot">
        <span className="lm-fake-logo">{work.client}</span>
      </div>
    </div>
  )
}

/**
 * `variant` decide QUALE immagine, non come mostrarla:
 *   · 'card' → la sola prima schermata, 16/10. È quello che serve nella
 *     griglia, dove la card è una finestrella da monitor e l'immagine sta
 *     ferma.
 *   · 'full' → lo screenshot intero. Serve solo dentro l'overlay, sotto
 *     l'iframe, dove c'è tutta l'altezza per mostrarlo.
 */
export default function WorkMediaView({
  work,
  eager = false,
  variant = 'full',
}: {
  work: Work
  eager?: boolean
  variant?: 'card' | 'full'
}) {
  const media = variant === 'card' ? work.shot : work.media

  if (!work.ready) return <FakeSite work={work} />

  /* 'sources' e non 'kind': è la proprietà che esiste SOLO sul video, quindi
     TypeScript restringe davvero, e nel ramo sotto sa che webp e png ci sono.
     Con 'kind' non ci riusciva, perché la prima schermata quel campo non ce
     l'ha affatto. */
  if ('sources' in media) {
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
    <picture>
      <source srcSet={media.webp} type="image/webp" />
      {/* eslint-disable-next-line @next/next/no-img-element -- lo screenshot è
          servito a dimensione fissa e già ottimizzato: next/image aggiungerebbe
          un secondo passaggio di ridimensionamento senza guadagno.
          Dimensioni esplicite → nessun layout shift. */}
      <img
        className="lm-card-media"
        src={media.png}
        width={media.width}
        height={media.height}
        alt={`Il sito di ${work.client}`}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
      />
    </picture>
  )
}
