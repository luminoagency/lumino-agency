'use client'

import { useEffect, useState } from 'react'
import { iniziali } from '@/lib/staff/avatar'
import type { Saluto as DatiSaluto } from '@/lib/staff/saluto'

/**
 * Il benvenuto della home.
 *
 * Non è un'intestazione di pagina con dentro un nome: è la prima cosa della
 * giornata, e deve dare la sensazione di entrare in casa propria. La faccia di
 * chi è entrato, grande; il nome enorme nel gradiente Lumino; e **sotto, la riga
 * che parla davvero** — costruita sui suoi dati veri da `lib/staff/saluto.ts`,
 * non dall'ora e basta.
 *
 * La gerarchia è voluta e va letta in quest'ordine: **faccia → nome → riga
 * personale → data**. La riga personale è la seconda cosa più grande della
 * schermata, più dei numeri delle card: è quella che dice «so chi sei e cosa hai
 * fatto ieri», e messa in piccolo accanto alla data sarebbe una didascalia.
 *
 * ## Il saluto lungo vale una volta al giorno
 *
 * Un'animazione che si rifà a ogni navigazione sulla home diventa un pedaggio:
 * la prima volta è bella, la quindicesima è un ritardo fra sé e il lavoro. Dal
 * secondo passaggio la stessa intestazione resta, in scala ridotta e ferma. La
 * memoria è la data di oggi in `localStorage`: è del dispositivo, non
 * dell'account, e questo è giusto — chi apre la dashboard sul telefono alle otto
 * e sul portatile alle nove ha aperto due giornate, una per schermo.
 *
 * **La riga cambia fra le due versioni, il resto no.** Il server manda entrambe
 * (`prima` e `rientro`), il browser sceglie dentro un effetto: così il markup
 * che il server disegna vale per tutti e due i casi e non c'è niente da
 * riconciliare. Le lettere partono invisibili dal CSS proprio per questo — se il
 * JS tarda, non si vede un titolo già a posto che poi rifà l'entrata.
 */
export default function Saluto({
  nome,
  titolo,
  foto,
  saluto,
}: {
  nome: string
  /** «CCO», «Head of Sales». Sta davanti al nome, se c'è. */
  titolo: string | null
  /** L'URL firmato della foto profilo. */
  foto: string | null
  saluto: DatiSaluto
}) {
  /* `null` = non si è ancora guardato il registro: il server disegna la versione
     lunga (ferma e invisibile), il browser decide subito dopo. */
  const [lungo, setLungo] = useState<boolean | null>(null)
  const [rotta, setRotta] = useState(false)

  useEffect(() => {
    setLungo(primaVoltaOggi())
  }, [])

  const primo = nome.trim().split(/\s+/)[0] || nome
  const etichetta = titolo ? `${titolo} ${primo}` : primo
  const mostraFoto = foto && !rotta
  /* Finché non si sa, si mostra la riga del primo accesso: è quella scritta per
     essere letta con attenzione, ed è il caso in cui sbagliare costa meno. */
  const riga = lungo === false ? saluto.rientro : saluto.prima

  return (
    <header
      className="lm-saluto"
      data-lungo={lungo !== false}
      /* Tre stati e non due. `attesa` è il momento fra il primo dipinto e la
         lettura del registro: lì le lettere sono invisibili, perché disegnarle e
         poi farle rientrare sarebbe un lampo nel punto più guardato della
         pagina. È la convenzione di `.lm-in` in tutta quest'area. */
      data-anima={lungo === null ? 'attesa' : lungo ? 'si' : 'no'}
    >
      <span className="lm-saluto-foto" data-foto={Boolean(mostraFoto)}>
        {mostraFoto ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={foto} alt={`Foto di ${nome}`} onError={() => setRotta(true)} />
        ) : (
          <span aria-hidden="true">{iniziali(nome)}</span>
        )}
      </span>

      <div className="lm-saluto-testo">
        <h1 className="lm-saluto-h1">
          {/* L'apertura è l'unica cosa che la versione compatta nasconde: senza
              di lei resta «CCO Ratib», che è un'intestazione e basta. */}
          <span className="lm-saluto-ben">
            <Lettere testo={saluto.apertura} da={0} />{' '}
          </span>
          <em>
            <Lettere testo={etichetta} da={saluto.apertura.length + 1} />
          </em>
        </h1>

        {/* La riga personale. `key` sul testo la fa rientrare quando cambia da
            `prima` a `rientro`: senza, il testo si sostituirebbe a metà
            animazione e si vedrebbe come uno scatto. */}
        <p className="lm-saluto-riga" key={riga}>
          {riga}
        </p>

        <p className="lm-saluto-meta">{saluto.meta}</p>
      </div>
    </header>
  )
}

/**
 * È la prima volta oggi?
 *
 * **La decisione sta fuori dal componente**, in una variabile di modulo, e non
 * è un'ottimizzazione: è una correzione. Dentro l'effetto, la risposta era
 * «leggo il registro e subito lo firmo», cioè una funzione che cambia ciò che
 * sta misurando. In sviluppo React monta ogni componente due volte di proposito
 * (StrictMode), quindi la prima esecuzione firmava e la seconda trovava la
 * firma: il saluto lungo non compariva **mai**, e lo stesso sarebbe successo in
 * produzione a ogni Fast Refresh o a ogni rimontaggio.
 *
 * Con la risposta calcolata una volta per caricamento di pagina, un secondo
 * montaggio ottiene la stessa risposta del primo — che è esattamente cosa vuol
 * dire «primo accesso della giornata». Tornando sulla home da un'altra sezione,
 * la variabile è ancora piena e il saluto resta compatto: giusto anche quello,
 * la giornata l'abbiamo già aperta.
 */
let rispostaDiOggi: boolean | null = null

function primaVoltaOggi(): boolean {
  if (rispostaDiOggi !== null) return rispostaDiOggi

  /* La data locale, non `toISOString()`: quello passa per UTC, e alle due di
     notte in Italia darebbe ancora ieri — cioè il saluto lungo comparirebbe due
     volte nella stessa giornata di lavoro. */
  const oggi = new Date()
  const chiave = `${oggi.getFullYear()}-${oggi.getMonth() + 1}-${oggi.getDate()}`

  try {
    rispostaDiOggi = localStorage.getItem('lm_saluto') !== chiave
    if (rispostaDiOggi) localStorage.setItem('lm_saluto', chiave)
  } catch {
    /* Storage negato: il saluto lungo ogni volta. È il caso peggiore, ed è una
       cosa bella vista troppe volte — non un difetto. */
    rispostaDiOggi = true
  }
  return rispostaDiOggi
}

/**
 * Le lettere che salgono, una parola alla volta.
 *
 * Una `<span>` per carattere, con il proprio indice in una variabile CSS: il
 * ritardo lo calcola il foglio di stile, così `prefers-reduced-motion` lo azzera
 * in una regola sola invece di dover ricalcolare qui. Si animano `transform` e
 * `opacity` e nient'altro, come tutto il resto dell'area.
 *
 * ## Perché le parole sono avvolte
 *
 * `.lm-lettera` è `inline-block`, e fra due inline-block il browser può andare
 * a capo: su uno schermo da 390 il saluto si leggeva «Buonasera, Prov / a».
 * Spezzare un nome a metà è il difetto peggiore che possa avere la riga più
 * grande della schermata, perché è il nome della persona appena entrata.
 *
 * Quindi ogni **parola** sta dentro un `.lm-parola` con `white-space: nowrap`,
 * che toglie le occasioni di a capo lì dentro, e fra una parola e l'altra c'è
 * uno spazio di testo vero — fuori da ogni inline-block, quindi con la sua
 * larghezza e la sua occasione di a capo. L'animazione non cambia di una
 * virgola: le lettere restano lettere, e l'indice continua a contare sul testo
 * intero, spazi compresi, così le due metà del saluto non si accavallano.
 *
 * Il tutto resta selezionabile e leggibile da uno screen reader: i caratteri
 * sono in ordine e non c'è niente in mezzo.
 *
 * `da` sfasa il secondo blocco: il nome deve partire *dopo* che l'apertura ha
 * finito, o le due metà salirebbero sovrapposte.
 */
function Lettere({ testo, da }: { testo: string; da: number }) {
  /* La posizione nel testo originale, spazi inclusi: è quella che va nella
     variabile del ritardo, non l'indice dentro la parola. */
  let posizione = 0

  return (
    <>
      {testo.split(' ').map((parola, p) => {
        const inizio = posizione
        posizione += parola.length + 1
        return (
          <span key={`${p}-${parola}`}>
            {/* Lo spazio fra le parole, di testo e non dentro uno span: è
                l'unico posto in cui si può andare a capo. */}
            {p > 0 && ' '}
            <span className="lm-parola">
              {Array.from(parola).map((c, i) => (
                <span
                  key={`${i}-${c}`}
                  className="lm-lettera"
                  style={{ '--l': inizio + i + da } as React.CSSProperties}
                >
                  {c}
                </span>
              ))}
            </span>
          </span>
        )
      })}
    </>
  )
}
