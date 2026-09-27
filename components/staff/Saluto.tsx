'use client'

import { useEffect, useState } from 'react'
import { iniziali } from '@/lib/staff/avatar'

/**
 * Il benvenuto della home.
 *
 * Era «Ciao, Marco» a corpo di titolo, cioè un'intestazione di pagina con dentro
 * un nome. Qui diventa la prima cosa della giornata: la faccia di chi è entrato,
 * grande, e il nome col ruolo davanti — «Bentornato, CCO Ratib» — con le lettere
 * che salgono una dopo l'altra.
 *
 * **Il saluto lungo vale una volta al giorno.** Un'animazione che si rifà a ogni
 * navigazione sulla home diventa un pedaggio: la prima volta è bella, la
 * quindicesima è un ritardo fra sé e il lavoro. Dal secondo passaggio la stessa
 * intestazione resta, in scala ridotta e ferma. La memoria è la data di oggi in
 * `localStorage`: è del dispositivo, non dell'account, e questo è giusto — chi
 * apre la dashboard sul telefono alle otto e sul portatile alle nove ha aperto
 * due giornate, una per schermo.
 *
 * **Le parole sono le stesse nelle due versioni, e non è un caso.** Cambiando i
 * testi fra server e browser si avrebbe un errore di idratazione; cambiando solo
 * la scala e cosa è visibile, il server disegna un markup che vale per entrambe e
 * il browser decide dopo, senza che niente lampeggi. Le lettere partono
 * invisibili dal CSS proprio per questo: se il JS tarda, non si vede un titolo
 * già a posto che poi rifà l'entrata.
 */
export default function Saluto({
  nome,
  titolo,
  saluto,
  foto,
  sotto,
}: {
  nome: string
  /** «CCO», «Head of Sales». Sta davanti al nome, se c'è. */
  titolo: string | null
  /** La riga personale scelta dall'utente. Se manca, la scrive l'ora. */
  saluto: string | null
  /** L'URL firmato della foto profilo. */
  foto: string | null
  /** La riga di servizio: la data di oggi, e l'obiettivo del mese se c'è. */
  sotto: string
}) {
  /* `null` = non si è ancora guardato il registro: il server disegna la versione
     lunga (ferma e invisibile), il browser decide subito dopo. */
  const [lungo, setLungo] = useState<boolean | null>(null)
  const [frase, setFrase] = useState(saluto ?? 'Buon lavoro.')
  const [rotta, setRotta] = useState(false)

  useEffect(() => {
    if (!saluto) setFrase(fraseDellOra(new Date()))
    setLungo(primaVoltaOggi())
  }, [saluto])

  const primo = nome.trim().split(/\s+/)[0] || nome
  const etichetta = titolo ? `${titolo} ${primo}` : primo
  const mostraFoto = foto && !rotta

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
          {/* La parola di benvenuto è l'unica cosa che la versione compatta
              nasconde: senza di lei resta «CCO Ratib», che è un'intestazione. */}
          <span className="lm-saluto-ben">
            <Lettere testo="Bentornato," da={0} />{' '}
          </span>
          <em>
            <Lettere testo={etichetta} da={12} />
          </em>
        </h1>
        <p className="lm-saluto-sub">{frase}</p>
        <p className="lm-saluto-meta">{sotto}</p>
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
 * Le lettere che salgono.
 *
 * Una `<span>` per carattere, con il proprio indice in una variabile CSS: il
 * ritardo lo calcola il foglio di stile, così `prefers-reduced-motion` lo azzera
 * in una regola sola invece di dover ricalcolare qui. Si animano `transform` e
 * `opacity` e nient'altro, come tutto il resto dell'area.
 *
 * Gli spazi restano spazi veri (` ` dentro uno span non andrebbe a capo dove
 * deve): ognuno diventa una `<span>` col suo ritardo, e il testo resta
 * selezionabile e leggibile da uno screen reader perché i caratteri sono in
 * ordine e senza niente in mezzo.
 *
 * `da` sfasa il secondo blocco: il nome deve partire *dopo* che «Bentornato,» ha
 * finito, o le due metà salirebbero sovrapposte.
 */
function Lettere({ testo, da }: { testo: string; da: number }) {
  return (
    <>
      {Array.from(testo).map((c, i) => (
        <span
          key={`${i}-${c}`}
          className="lm-lettera"
          style={{ '--l': i + da } as React.CSSProperties}
        >
          {c === ' ' ? ' ' : c}
        </span>
      ))}
    </>
  )
}

/**
 * La frase di riserva, quando non c'è un saluto scritto a mano.
 *
 * Quattro fasce e non ventiquattro: sono le fasce in cui si lavora
 * diversamente. Alle sei di sera si esce dalle visite, a mezzanotte si sta
 * ancora dietro a un preventivo, e le due frasi non possono essere la stessa.
 */
function fraseDellOra(d: Date): string {
  const h = d.getHours()
  if (h < 6) return 'Notte fonda. Qui c’è tutto quello che serve.'
  if (h < 12) return 'Buongiorno. La giornata è ancora tutta da scrivere.'
  if (h < 18) return 'Buon pomeriggio. Le ore buone per una visita sono queste.'
  return 'Buonasera. Si chiude la giornata.'
}
