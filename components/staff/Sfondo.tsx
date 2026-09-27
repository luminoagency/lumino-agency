/**
 * La stanza dietro il vetro, senza un video.
 *
 * Prima qui c'era `bg.mp4`: 1.8MB da scaricare a ogni primo accesso, un
 * elemento `<video>` che il compositore ridisegna a 25 fotogrammi al secondo
 * sotto un `backdrop-filter`, e un file da sostituire a mano il giorno che la
 * stanza non piace più. Costava troppo per una cosa che non si deve nemmeno
 * notare.
 *
 * Al suo posto **quattro macchie di colore che si muovono piano e non finiscono
 * mai**. Sono quattro `radial-gradient` nei toni Lumino — perla, crema, un filo
 * di rosa e uno di viola — ognuna su un proprio livello, ognuna con la sua
 * durata (48s, 61s, 73s, 89s: numeri primi fra loro, così la composizione non
 * torna mai identica a sé stessa).
 *
 * Il movimento è **solo `transform`**: niente blur animato, niente cambio di
 * colore, niente `background-position`. Il browser promuove ogni livello a
 * texture sulla GPU una volta e poi la sposta — il costo per fotogramma è la
 * stessa operazione che fa per scorrere la pagina. Un `filter: blur()` animato
 * o un gradiente che cambia colore, invece, obbligherebbero a rasterizzare di
 * nuovo mezzo schermo a ogni frame: è esattamente il motivo per cui lo sfondo
 * precedente pesava.
 *
 * La sfumatura la fa la forma del gradiente (`transparent 70%`), non un filtro:
 * un `blur(80px)` su quattro livelli grandi come la finestra sarebbe la cosa
 * più costosa della pagina.
 *
 * Server Component: nessun JS, nessun `useEffect`, nessuna idratazione. Si
 * ferma con `prefers-reduced-motion`, dove resta il solo fondo fermo.
 */
export default function Sfondo() {
  return (
    <div className="lm-scene" aria-hidden="true">
      <span className="lm-blob" data-b="1" />
      <span className="lm-blob" data-b="2" />
      <span className="lm-blob" data-b="3" />
      <span className="lm-blob" data-b="4" />
    </div>
  )
}
