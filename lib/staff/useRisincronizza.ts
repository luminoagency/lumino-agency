'use client'

import { useState, type Dispatch, type SetStateAction } from 'react'

/**
 * Una copia locale che si riallinea quando il server cambia idea.
 *
 * ## Il bug che questo hook esiste per non far ripetere
 *
 * Elenco clienti e kanban tengono le righe in uno stato locale, e devono
 * tenerlo: lo spostamento di una card è **ottimista** — si muove subito e
 * torna indietro se il database rifiuta — e un'interfaccia che aspetta il giro
 * di rete prima di muovere la card è un'interfaccia che sembra rotta.
 *
 * Il modo in cui quello stato nasceva era però `useState(dalServer)`, e
 * `useState` guarda il suo argomento **una volta sola**, al montaggio. Dopo un
 * salvataggio la catena funzionava fino all'ultimo anello: l'update arrivava a
 * Postgres, `revalidatePath` buttava via la cache, `router.refresh()` rifaceva
 * il render del server, le prop nuove arrivavano al componente — e il
 * componente le ignorava, perché era già montato. Risultato: il database
 * aggiornato, il server che manda i dati giusti, e lo schermo che mostra
 * quelli di prima finché non si ricarica la pagina a mano. La scheda del
 * cliente invece si aggiornava, perché è un render di server puro e non ha
 * nessuna copia da riallineare: due viste dello stesso dato che si comportano
 * in due modi, che è il motivo per cui il problema sembrava capriccioso.
 *
 * ## Perché durante il render e non in un effetto
 *
 * È il modo che React documenta per correggere lo stato quando una prop
 * cambia. Un `useEffect` farebbe la stessa cosa **un dipinto dopo**: ci sarebbe
 * un fotogramma coi dati vecchi, cioè esattamente il lampo che il salvataggio
 * doveva far sparire. Impostare lo stato durante il render fa ripartire il
 * render subito, prima che il browser disegni, e non è un ciclo: al secondo
 * giro `visto === dalServer` e non si imposta più niente.
 *
 * `dalServer` è un oggetto nuovo a ogni render del server, quindi il confronto
 * per identità è quello giusto: dice «il server ha parlato di nuovo», che è
 * precisamente il momento in cui la copia locale va buttata. Un confronto per
 * valore terrebbe in vita un aggiornamento ottimista già smentito.
 */
export function useRisincronizza<T>(dalServer: T): [T, Dispatch<SetStateAction<T>>] {
  const [locale, setLocale] = useState(dalServer)
  const [visto, setVisto] = useState(dalServer)

  if (visto !== dalServer) {
    setVisto(dalServer)
    setLocale(dalServer)
  }

  return [locale, setLocale]
}
