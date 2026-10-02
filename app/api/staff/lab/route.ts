import { NextResponse } from 'next/server'
import { requireStaff } from '@/lib/staff/auth'
import { eAdmin } from '@/lib/staff/permessi'
import { demoAttivo } from '@/lib/staff/demo'
import { ISTRUZIONI, MODELLO, foglioDati, labAttivo } from '@/lib/staff/lab'
import { ISTRUZIONI_ARCHIVIO, foglioArchivio } from '@/lib/staff/archivio-lab'

/**
 * La domanda al Lab.
 *
 * ## Perché una route e non una server action
 *
 * Una server action sarebbe bastata per mandare la domanda, ma la chiave di
 * Gemini deve restare sul server **e** la risposta deve arrivare a pezzi: una
 * risposta intera dopo quattro secondi di niente è un pulsante che sembra rotto,
 * la stessa risposta che si scrive da sé è un'attesa che si sopporta. Lo
 * streaming di una server action in Next 14 vuol dire restituire uno
 * `ReadableStream` e leggerlo a mano dal client, cioè esattamente questa route
 * con più passaggi.
 *
 * ## Cosa esce da qui
 *
 * Il foglio dei dati lo costruisce il **server**, non il browser: il client manda
 * una domanda e nient'altro. Se il contesto arrivasse dal client, chiunque
 * sapesse aprire la console potrebbe chiedere al modello di ragionare su numeri
 * inventati da lui — o, peggio, farsi restituire il taglio per venditore che la
 * RLS non gli mostra. Qui il foglio lo decide `foglioDati` a partire da
 * `requireStaff()`, cioè da chi è davvero connesso.
 *
 * ## Due fogli, non uno
 *
 * `modalita: 'dati'` manda i totali dell'azienda; `modalita: 'archivio'` manda
 * il materiale grezzo dell'Archivio. Sono due lavori diversi e hanno due
 * istruzioni diverse — sui numeri la regola è «non calcolare niente», sul
 * materiale è «non affermare niente senza dire dove l'hai letto» — e mescolarli
 * in un foglio solo vorrebbe dire un modello che cita una nota per giustificare
 * una percentuale letta altrove. La modalità la sceglie il client perché è una
 * scelta dell'interfaccia e non un permesso: in tutti e due i casi il contenuto
 * lo costruisce il server da `requireStaff()`.
 */

export const dynamic = 'force-dynamic'
/* La route parla con un servizio esterno e il piano gratuito non è veloce: il
   tetto di default di Vercel è dieci secondi, e una domanda lunga li supera. */
export const maxDuration = 30

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models'

/** Quante domande e risposte precedenti si rimandano indietro. */
const MEMORIA = 8

interface Turno {
  ruolo: 'io' | 'lab'
  testo: string
}

type Modalita = 'dati' | 'archivio'

export async function POST(req: Request) {
  const me = await requireStaff()

  if (!labAttivo()) {
    /* 503 e non 500: non è un guasto, è una sezione non ancora accesa. La
       pagina lo sa già e non dovrebbe arrivare qui, ma una route che risponde
       «ok» a chiave mancante è una route che un giorno risponderà «ok» con una
       chiave scaduta. */
    return NextResponse.json({ error: 'Il Lab non è ancora attivo su questo ambiente.' }, { status: 503 })
  }

  let corpo: { domanda?: unknown; storia?: unknown; modalita?: unknown }
  try {
    corpo = await req.json()
  } catch {
    return NextResponse.json({ error: 'Richiesta illeggibile.' }, { status: 400 })
  }

  const domanda = typeof corpo.domanda === 'string' ? corpo.domanda.trim() : ''
  if (!domanda) return NextResponse.json({ error: 'Manca la domanda.' }, { status: 400 })
  /* Un tetto sulla lunghezza: non per il costo — il piano è gratuito — ma perché
     una domanda di ventimila caratteri è un incollaggio per sbaglio, e mandarla
     a un servizio esterno è una cosa che nessuno voleva fare. */
  if (domanda.length > 1000) {
    return NextResponse.json({ error: 'Domanda troppo lunga: accorciala.' }, { status: 400 })
  }

  const storia = leggiStoria(corpo.storia)
  const modalita: Modalita = corpo.modalita === 'archivio' ? 'archivio' : 'dati'
  const demo = demoAttivo(me.role)

  const { apertura, foglio, istruzioni } =
    modalita === 'archivio'
      ? {
          apertura: 'Ecco l’archivio interno di Lumino.',
          foglio: (await foglioArchivio(demo)).testo,
          istruzioni: ISTRUZIONI_ARCHIVIO,
        }
      : {
          apertura: 'Ecco i dati di Lumino, aggiornati adesso.',
          foglio: await foglioDati(demo, eAdmin(me)),
          istruzioni: ISTRUZIONI,
        }

  /* Il foglio va nel **primo turno**, non nelle istruzioni di sistema: Gemini
     tratta `systemInstruction` come regole permanenti e il foglio è invece
     materiale che cambia a ogni richiesta. Messo come contesto della prima
     domanda, il modello lo cita come una fonte e non come una convinzione. */
  const contents = [
    { role: 'user', parts: [{ text: `${apertura}\n\n${foglio}` }] },
    {
      role: 'model',
      parts: [
        {
          text:
            modalita === 'archivio' ? 'Ho letto l’archivio. Chiedi pure.' : 'Ho letto i dati. Chiedi pure.',
        },
      ],
    },
    ...storia.map((t) => ({
      role: t.ruolo === 'io' ? 'user' : 'model',
      parts: [{ text: t.testo }],
    })),
    { role: 'user', parts: [{ text: domanda }] },
  ]

  /**
   * Il tempo massimo per **aprire** la connessione, non per riceverla tutta.
   *
   * `AbortSignal.timeout(25_000)` sembrava la scelta ovvia e era un bug: quel
   * segnale non smette di contare quando arrivano le intestazioni, quindi a
   * venticinque secondi abortiva il **corpo che stava ancora scorrendo**. Fuori
   * dal `try`, che a quel punto era già finito, l'abort diventava una
   * `unhandledRejection` nei log del server e una risposta troncata a metà
   * frase per chi leggeva. Con un controller esplicito il timer si cancella nel
   * momento in cui la risposta comincia: da lì in poi lo stream può durare
   * quanto vuole, ed è `maxDuration` a metterci un tetto.
   */
  const controller = new AbortController()
  const scadenza = setTimeout(() => controller.abort(), 20_000)

  let risposta: Response
  try {
    risposta = await fetch(
      `${ENDPOINT}/${MODELLO}:streamGenerateContent?alt=sse&key=${encodeURIComponent(
        process.env.GEMINI_API_KEY as string,
      )}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: { parts: [{ text: istruzioni }] },
          /* L'analisi dell'archivio è più lunga di una risposta sui numeri — sei
             problemi con i loro contrassegni non stanno in ottocento token — e
             un elenco troncato a metà è peggio di nessuna risposta. */
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: modalita === 'archivio' ? 2000 : 800,
          },
        }),
        signal: controller.signal,
      },
    )
  } catch {
    return NextResponse.json({ error: 'Il servizio non ha risposto. Riprova fra poco.' }, { status: 502 })
  } finally {
    clearTimeout(scadenza)
  }

  if (!risposta.ok || !risposta.body) {
    /* Il corpo dell'errore finisce nei log del server e **non** nella risposta:
       contiene il nome del modello, la quota e a volte un pezzo della richiesta,
       cioè roba che non deve arrivare a un browser. Ma senza di esso un 404 di
       Gemini — «questo modello non è più disponibile, usa il successore» — si
       legge in dashboard come «il servizio ha risposto male», che manda a
       cercare un guasto di rete per un nome da cambiare in una variabile. */
    console.error('[lab] Gemini ha risposto', risposta.status, await risposta.text().catch(() => ''))
    /* Tre errori distinti, perché chiedono tre cose diverse a chi legge. 429 e
       503 dicono «aspetta» (tetto del piano gratuito, modello sovraccarico); il
       404 dice «cambia una variabile», ed è capitato davvero — Google ritira i
       modelli e risponde 404 indicando il successore. Con un messaggio unico,
       quel 404 si legge come un guasto di rete e si va a cercarlo nel posto
       sbagliato per mezz'ora. */
    const messaggio =
      risposta.status === 429
        ? 'Troppe domande in poco tempo. Il piano gratuito si riprende fra un minuto.'
        : risposta.status === 503
          ? 'Il modello è sovraccarico in questo momento. Riprova fra un minuto.'
          : risposta.status === 404
            ? 'Il modello configurato non esiste più. Va cambiato GEMINI_MODEL nelle variabili d’ambiente.'
            : 'Il servizio ha risposto male. Riprova fra poco.'
    return NextResponse.json({ error: messaggio }, { status: 502 })
  }

  return new Response(testoDaSse(risposta.body), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      /* Niente buffering intermedio: senza questa intestazione un proxy può
         tenersi i pezzi e consegnarli tutti insieme, che è esattamente ciò che
         lo streaming serviva a evitare. */
      'Cache-Control': 'no-store, no-transform',
      'X-Accel-Buffering': 'no',
    },
  })
}

/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Da SSE di Gemini a testo semplice.
 *
 * Gemini manda `data: {...}` per riga; al client serve solo il testo. La
 * conversione si fa qui e non nel browser per una ragione pratica: così il
 * client è un `while (read())` di dieci righe invece di un parser, e se un
 * giorno il modello cambia fornitore cambia solo questo file.
 *
 * Il `resto` esiste perché un pezzo può finire a metà riga — anzi, a metà
 * carattere multibyte: `decode(..., { stream: true })` tiene in sospeso i byte
 * incompleti, che in italiano capita a ogni accento.
 */
function testoDaSse(sorgente: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const lettore = sorgente.getReader()
  const decodifica = new TextDecoder()
  const codifica = new TextEncoder()
  let resto = ''

  return new ReadableStream({
    async pull(controller) {
      const { done, value } = await lettore.read()
      if (done) {
        controller.close()
        return
      }

      resto += decodifica.decode(value, { stream: true })
      const righe = resto.split('\n')
      /* L'ultima riga resta in sospeso: o è vuota, o è un pezzo di JSON che
         deve ancora arrivare per intero. */
      resto = righe.pop() ?? ''

      for (const riga of righe) {
        if (!riga.startsWith('data:')) continue
        const grezzo = riga.slice(5).trim()
        if (!grezzo || grezzo === '[DONE]') continue
        try {
          const d = JSON.parse(grezzo) as {
            candidates?: { content?: { parts?: { text?: string }[] } }[]
          }
          const testo = d.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? ''
          if (testo) controller.enqueue(codifica.encode(testo))
        } catch {
          /* Una riga malformata si salta: interrompere la risposta intera per
             un pezzo illeggibile vorrebbe dire perdere anche quello che era
             arrivato bene. */
        }
      }
    },
    cancel() {
      /* La scheda chiusa a metà risposta: si chiude anche verso Gemini, invece
         di lasciare una richiesta aperta a consumare il tetto del piano. */
      void lettore.cancel()
    },
  })
}

/** La storia arriva dal browser, quindi si guarda con sospetto e si accorcia. */
function leggiStoria(v: unknown): Turno[] {
  if (!Array.isArray(v)) return []
  return v
    .filter(
      (t): t is Turno =>
        Boolean(t) &&
        typeof t === 'object' &&
        (t as Turno).ruolo !== undefined &&
        ((t as Turno).ruolo === 'io' || (t as Turno).ruolo === 'lab') &&
        typeof (t as Turno).testo === 'string',
    )
    .slice(-MEMORIA)
    .map((t) => ({ ruolo: t.ruolo, testo: t.testo.slice(0, 4000) }))
}
