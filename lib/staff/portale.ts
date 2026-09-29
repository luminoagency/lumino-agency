/**
 * Dove va ciò che deve stare sopra tutto.
 *
 * L'area staff ha due piani isolati — il vetro e, dentro, la colonna del
 * contenuto (vedi «I piani» in `staff.css`). È quello che impedisce a una card
 * di finire sopra il rail, ed è anche quello che **intrappola** una modale:
 * `position: fixed` e `z-index: 70` non servono a niente se l'antenato è
 * isolato, perché il numero vale solo dentro quel piano. Una modale disegnata
 * dove nasce finirebbe sotto la barra nera.
 *
 * Quindi si sposta. Ma **non nel `<body>`**: le variabili dell'area — i colori,
 * i raggi, la curva — sono dichiarate su `.lm-staff`, e un pannello attaccato al
 * body le perde tutte. Era il caso del pannello della preghiera: `var(--r-xl)`
 * e `var(--ease)` non risolvevano, cioè spigoli vivi e un'animazione senza
 * curva, in silenzio.
 *
 * L'ospite giusto è `.lm-staff`: dentro le variabili, fuori dai due isolamenti.
 */
export function ospitePortale(): HTMLElement | null {
  if (typeof document === 'undefined') return null
  return document.querySelector<HTMLElement>('.lm-staff') ?? document.body
}
