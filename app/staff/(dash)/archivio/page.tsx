import PageHead from '@/components/staff/PageHead'
import { requireStaff } from '@/lib/staff/auth'
import { caricaArchivio, eGenere, type FiltriArchivio } from '@/lib/staff/archivio'
import { demoAttivo } from '@/lib/staff/demo'
import { AVVISO_SCHEMA, clientiPerVisita } from '@/lib/staff/queries'
import ArchivioView from './ArchivioView'

export const metadata = { title: 'Archivio' }
export const dynamic = 'force-dynamic'

/**
 * L'Archivio.
 *
 * **I filtri stanno nell'indirizzo, non in uno stato del browser.** È la scelta
 * che distingue una ricerca utile da una ricerca che si rifà ogni volta: con i
 * filtri nella query si torna indietro col tasto del browser, si ricarica senza
 * perdere niente, si manda un link a un collega («guarda cosa esce cercando
 * “prenotazioni”») e la pagina si può anche mettere fra i preferiti così com'è.
 * Con uno `useState` niente di tutto questo esiste, e la ricerca diventa una
 * cosa che si fa una volta e si abbandona.
 *
 * Il prezzo è un viaggio al server per ogni filtro. Si paga volentieri: la
 * ricerca è full-text su una colonna indicizzata, e la sola alternativa —
 * scaricare l'archivio intero nel browser per filtrarlo lì — vorrebbe dire
 * mandare megabyte di testo estratto a un telefono per cercare una parola.
 */
export default async function ArchivioPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const me = await requireStaff()
  const demo = demoAttivo(me.role)

  const filtri = leggiFiltri(searchParams)

  const [dati, { clienti }] = await Promise.all([
    caricaArchivio(demo, filtri),
    clientiPerVisita(demo),
  ])

  const filtrato = Object.values(filtri).some(Boolean)

  return (
    <>
      <PageHead
        title={
          <>
            L&rsquo;<em>archivio</em>
          </>
        }
        sub={
          dati.totale
            ? `${dati.totale} voci, ${dati.conTesto} con del testo dentro. Quelle col testo il Lab AI le sa leggere.`
            : 'Qui dentro va tutto quello che oggi resta nel telefono: PDF, foto, note, vocali, link. Il browser ne estrae il testo, e da lì in poi si cerca e si analizza.'
        }
      />

      {dati.mancaSchema && <p className="lm-avviso">{AVVISO_SCHEMA}</p>}

      <ArchivioView
        dati={dati}
        filtri={filtri}
        filtrato={filtrato}
        clienti={clienti.map((c) => ({ id: c.id, nome: c.nome }))}
        io={me.id}
      />
    </>
  )
}

/**
 * Dalla query ai filtri, con sospetto.
 *
 * Tutto quello che arriva qui l'ha scritto qualcuno nella barra degli
 * indirizzi. Le stringhe si accorciano, il genere si controlla contro l'elenco
 * vero e le date contro la loro forma: non per sicurezza — la RLS e Postgres
 * fanno il loro lavoro comunque — ma perché un parametro storto deve dare una
 * pagina senza quel filtro, non una pagina che non si apre.
 */
function leggiFiltri(sp: Record<string, string | string[] | undefined>): FiltriArchivio {
  const uno = (k: string) => {
    const v = sp[k]
    const s = (Array.isArray(v) ? v[0] : v) ?? ''
    return s.trim().slice(0, 120)
  }

  const kind = uno('kind')
  const data = (k: string) => {
    const v = uno(k)
    return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined
  }

  const voce = uno('voce')

  return {
    q: uno('q') || undefined,
    /* Solo se ha la forma di un uuid: un `voce=ciao` darebbe un errore 22P02 di
       Postgres invece di una pagina senza quel filtro. */
    voce: /^[0-9a-f-]{36}$/i.test(voce) ? voce : undefined,
    kind: eGenere(kind) ? kind : undefined,
    tag: uno('tag').toLowerCase() || undefined,
    autore: uno('autore') || undefined,
    cliente: uno('cliente') || undefined,
    dal: data('dal'),
    al: data('al'),
  }
}
