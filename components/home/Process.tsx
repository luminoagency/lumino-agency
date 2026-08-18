/**
 * Sezione 6 — Il design: colonna media sticky a sinistra, tre blocchi di testo
 * che scorrono a destra. Il media cambia in sincrono con il blocco attivo.
 *
 * REGOLA CRITICA: nessun transform: scale() su ciò che avvolge un <video>.
 * Il passaggio fra i tre livelli è solo un crossfade di opacity (vedi home.css).
 *
 * Blocco 3: struttura statica, primo livello attivo. Sincronizzazione allo
 * scroll nel Blocco 4, sorgenti video nel Blocco 6.
 */

export const PROCESS_STEPS = [
  {
    num: '01',
    title: 'Hero immersivo',
    body: 'La prima schermata deve dire dove sei e perché restare. Nessuna promessa generica: una scena, una frase, un motivo per scendere.',
  },
  {
    num: '02',
    title: 'Motion su misura',
    body: 'Il movimento è al servizio della lettura. Accompagna lo sguardo dove serve, e sparisce quando ha finito il suo lavoro.',
  },
  {
    num: '03',
    title: 'Mobile first',
    body: 'La maggior parte di chi ti cerca ha una mano sola libera. Il telefono non è una riduzione del sito: è il sito.',
  },
]

export default function Process() {
  return (
    <section className="lm-section" id="design">
      <div className="lm-wrap">
        <p className="lm-kicker lm-reveal">Il design</p>

        <div className="lm-process-grid">
          <div className="lm-process-media" aria-hidden="true">
            {PROCESS_STEPS.map((step, i) => (
              <div
                className={`lm-process-layer${i === 0 ? ' is-active' : ''}`}
                key={step.num}
                data-step={i}
              >
                {/* TODO ASSET — /public/motion/: 3 clip 6–8s, mute, loop senza
                    stacco, verticali 4:5, WebM + MP4. Vedi Blocco 6.
                    Finché mancano, il livello resta un fondo pieno. */}
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    background: `linear-gradient(150deg, var(--surface), ${
                      ['var(--bordeaux)', 'var(--blue)', 'var(--violet)'][i]
                    })`,
                    opacity: 0.55,
                  }}
                />
              </div>
            ))}
          </div>

          <div className="lm-process-steps">
            {PROCESS_STEPS.map((step, i) => (
              <div
                className={`lm-process-step${i === 0 ? ' is-active' : ''}`}
                key={step.num}
                data-step={i}
              >
                <span className="lm-process-num">{step.num}</span>
                <h3 className="lm-display lm-d3">{step.title}</h3>
                <p className="lm-lead">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
