/**
 * L'oggetto cromato (ref1, la sfera dentro la card nera).
 *
 * È la cosa che in ref1 fa la differenza fra un pannello e un prodotto: in
 * mezzo a grafici e numeri c'è **una cosa fisica che gira**. Senza, la
 * composizione è corretta e dimenticabile.
 *
 * Qui è una sfera cromata con dentro la I del wordmark — la stessa lettera che
 * sul sito pubblico porta il gradiente, e l'unico posto dell'area interna in
 * cui il marchio si fa vedere per intero.
 *
 * È CSS puro: `conic-gradient` per il metallo, due `radial-gradient` per la
 * luce e il riflesso viola, `inset box-shadow` per la curvatura. Niente
 * WebGL, niente canvas, niente file — una sfera cromata vera costerebbe una
 * libreria 3D e un contesto grafico su ogni caricamento, per qualcosa che
 * nessuno guarda più di due secondi.
 *
 * Server Component: gira senza JS, e si ferma con `prefers-reduced-motion`.
 */
export default function Oggetto({ cap }: { cap?: string }) {
  return (
    <div className="lm-object" role="img" aria-label="Marchio Lumino in movimento">
      <span className="lm-object-core" aria-hidden="true" />
      <span className="lm-object-ring" aria-hidden="true" />
      <span className="lm-object-i" aria-hidden="true">
        I
      </span>
      {cap && (
        <span className="lm-callout" data-dir="left" style={{ top: '18%', left: '-6%' }}>
          <b>{cap}</b>
        </span>
      )}
    </div>
  )
}
