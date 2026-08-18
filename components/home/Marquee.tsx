/**
 * Sezione 2 — Marquee: testo gigante.
 *
 * Blocco 3: nastro statico, già duplicato in due metà identiche così il loop
 * infinito del Blocco 4 può scorrere senza stacchi. Il trascinamento con
 * inerzia e l'inclinazione allo scroll arrivano nel Blocco 4.
 */

const PHRASE = ['Identità', 'Interfacce', 'Movimento', 'Codice']

function Star() {
  return (
    <svg className="lm-marquee-star" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0c.6 6.2 5.2 10.8 12 12-6.8 1.2-11.4 5.8-12 12-.6-6.2-5.2-10.8-12-12C6.8 10.8 11.4 6.2 12 0z" />
    </svg>
  )
}

function Half({ ghost }: { ghost: boolean }) {
  return (
    <>
      {PHRASE.map((word) => (
        <span key={word} style={{ display: 'contents' }}>
          <span className="lm-marquee-item" data-ghost={ghost ? 'true' : 'false'}>
            {word}
          </span>
          <Star />
        </span>
      ))}
    </>
  )
}

export default function Marquee() {
  return (
    <section className="lm-marquee" aria-label="Identità, interfacce, movimento, codice">
      <div className="lm-marquee-track" aria-hidden="true">
        <Half ghost={false} />
        <Half ghost />
      </div>
    </section>
  )
}
