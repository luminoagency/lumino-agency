'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Link2,
  Mic,
  Plus,
  Search,
  StickyNote,
  Trash2,
  Type,
  X,
  type LucideIcon,
} from 'lucide-react'
import Modal from '@/components/staff/Modal'
import VoiceNote from '@/components/staff/VoiceNote'
import { correggiTesto, creaVoceArchivio, eliminaVoceArchivio } from '@/lib/staff/azioni-archivio'
import {
  GENERI,
  type DatiArchivio,
  type FiltriArchivio,
  type Genere,
  type VoceArchivio,
} from '@/lib/staff/archivio-tipi'
import { eImmagine, estraiDa } from '@/lib/staff/estrai'

/**
 * L'Archivio, dal lato di chi lo usa.
 *
 * Due momenti diversi, e vanno progettati come due cose diverse.
 *
 * · **Buttare dentro** succede in piedi, subito dopo, con una mano sola. Un
 *   campo obbligatorio solo (il titolo), il resto facoltativo, e l'estrazione
 *   del testo che parte da sé appena si sceglie il file — non dietro un
 *   bottone «estrai», perché un bottone in più è un bottone che non si preme.
 * · **Ritrovare** succede al tavolino, mesi dopo, cercando una parola che si
 *   ricorda a metà. Per questo la ricerca è la prima cosa della pagina, sta
 *   nell'indirizzo, e i tag sotto sono quelli che esistono davvero con quante
 *   voci hanno dentro.
 *
 * Il filtro non è uno stato React: si naviga. Vedi il commento in `page.tsx`.
 */

const ICONE: Record<Genere, LucideIcon> = {
  pdf: FileText,
  immagine: ImageIcon,
  nota: StickyNote,
  vocale: Mic,
  link: Link2,
  testo: Type,
}

export default function ArchivioView({
  dati,
  filtri,
  filtrato,
  clienti,
  io,
}: {
  dati: DatiArchivio
  filtri: FiltriArchivio
  /** C'è almeno un filtro acceso: cambia cosa dire quando non esce niente. */
  filtrato: boolean
  clienti: { id: string; nome: string }[]
  /** Il mio id: le voci degli altri non si cancellano, e non si finge di sì. */
  io: string
}) {
  const [nuova, setNuova] = useState(false)
  const [aperta, setAperta] = useState<VoceArchivio | null>(null)

  return (
    <>
      <Barra filtri={filtri} dati={dati} clienti={clienti} apri={() => setNuova(true)} />

      {dati.voci.length === 0 ? (
        <p className={filtrato ? 'lm-empty' : 'lm-vuoto-porta'}>
          {filtrato ? (
            'Niente con questi filtri. Prova con una parola sola, o togline uno.'
          ) : (
            <>
              <b>L’archivio è vuoto.</b>
              <span>
                Il PDF che ti ha mandato un fornitore, la foto di un menù, la nota detta uscendo da
                un locale: qui dentro diventano una cosa sola, cercabile e leggibile dal Lab AI.
              </span>
              <button type="button" className="lm-btn" onClick={() => setNuova(true)}>
                <Plus aria-hidden="true" /> Butta dentro la prima cosa
              </button>
            </>
          )}
        </p>
      ) : (
        <div className="lm-bento lm-archivio">
          {dati.voci.map((v) => (
            <Card key={v.id} voce={v} mia={v.created_by === io} apri={() => setAperta(v)} />
          ))}
        </div>
      )}

      {nuova && <Nuova clienti={clienti} chiudi={() => setNuova(false)} />}
      {aperta && (
        <Dettaglio voce={aperta} mia={aperta.created_by === io} chiudi={() => setAperta(null)} />
      )}
    </>
  )
}

/* ── La barra: cerca, filtra, aggiungi ─────────────────────────────────────── */

/**
 * La ricerca scrive nell'indirizzo, ma non a ogni tasto.
 *
 * Trecento millisecondi di pausa prima di navigare. Senza, ogni lettera è una
 * richiesta al server e una riga nella cronologia del browser: dopo aver
 * scritto «prenotazioni» il tasto indietro andrebbe premuto dodici volte per
 * tornare indietro di una ricerca. Con `replace` invece di `push` la cronologia
 * resta una voce sola per ricerca, e il tasto indietro riporta dove si era.
 */
function Barra({
  filtri,
  dati,
  clienti,
  apri,
}: {
  filtri: FiltriArchivio
  dati: DatiArchivio
  clienti: { id: string; nome: string }[]
  apri: () => void
}) {
  const router = useRouter()
  const params = useSearchParams()
  const [testo, setTesto] = useState(filtri.q ?? '')
  const [altri, setAltri] = useState(Boolean(filtri.autore || filtri.cliente || filtri.dal || filtri.al))
  const primo = useRef(true)

  function vaiCon(cambi: Record<string, string | undefined>) {
    const q = new URLSearchParams(params?.toString() ?? '')
    for (const [k, v] of Object.entries(cambi)) {
      if (v) q.set(k, v)
      else q.delete(k)
    }
    const s = q.toString()
    router.replace(s ? `/staff/archivio?${s}` : '/staff/archivio', { scroll: false })
  }

  useEffect(() => {
    /* Al montaggio il campo contiene già la ricerca dell'indirizzo: navigare
       subito vorrebbe dire una richiesta identica a quella appena servita. */
    if (primo.current) {
      primo.current = false
      return
    }
    const t = setTimeout(() => vaiCon({ q: testo.trim() || undefined }), 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testo])

  /* `voce` è nell'elenco come gli altri: ci si arriva da una citazione del Lab
     AI, che lascia la pagina su una voce sola. Senza, «togli i filtri» non
     comparirebbe proprio nel caso in cui serve di più — uno schermo con una
     card e nessun modo evidente di tornare a vederle tutte. */
  const conFiltri = Boolean(
    filtri.q ||
      filtri.voce ||
      filtri.kind ||
      filtri.tag ||
      filtri.autore ||
      filtri.cliente ||
      filtri.dal ||
      filtri.al,
  )

  return (
    <div className="lm-arc-barra">
      <div className="lm-arc-cerca">
        <Search aria-hidden="true" />
        <input
          type="search"
          value={testo}
          onChange={(e) => setTesto(e.target.value)}
          placeholder="Cerca dentro tutto: titoli, note, testo estratto…"
          aria-label="Cerca nell’archivio"
        />
        {/* La sintassi è quella che chiunque ha già imparato altrove, e dirlo
            costa una riga: senza, nessuno prova le virgolette. */}
        <span className="lm-arc-sintassi">&ldquo;frase esatta&rdquo; · -escludi</span>
      </div>

      <button type="button" className="lm-btn" onClick={apri}>
        <Plus aria-hidden="true" /> Aggiungi
      </button>

      <div className="lm-chips" role="group" aria-label="Filtra per tipo">
        <button type="button" data-on={!filtri.kind} onClick={() => vaiCon({ kind: undefined })}>
          tutto
        </button>
        {(Object.keys(GENERI) as Genere[]).map((g) => (
          <button
            key={g}
            type="button"
            data-on={filtri.kind === g}
            onClick={() => vaiCon({ kind: filtri.kind === g ? undefined : g })}
          >
            {GENERI[g]}
          </button>
        ))}
      </div>

      {dati.tagInUso.length > 0 && (
        <div className="lm-chips lm-arc-tag" role="group" aria-label="Filtra per tag">
          {dati.tagInUso.map((t) => (
            <button
              key={t.tag}
              type="button"
              data-on={filtri.tag === t.tag}
              onClick={() => vaiCon({ tag: filtri.tag === t.tag ? undefined : t.tag })}
            >
              {t.tag} <small>{t.quante}</small>
            </button>
          ))}
        </div>
      )}

      <div className="lm-arc-altri">
        <button
          type="button"
          className="lm-arc-piu"
          aria-expanded={altri}
          onClick={() => setAltri((v) => !v)}
        >
          {altri ? 'meno filtri' : 'chi, quale cliente, quando'}
        </button>

        {conFiltri && (
          <button type="button" className="lm-arc-pulisci" onClick={() => router.replace('/staff/archivio')}>
            <X aria-hidden="true" /> togli i filtri
          </button>
        )}
      </div>

      {altri && (
        <div className="lm-arc-avanzati">
          <label className="lm-field">
            <span>Chi l’ha caricato</span>
            <select
              value={filtri.autore ?? ''}
              onChange={(e) => vaiCon({ autore: e.target.value || undefined })}
            >
              <option value="">chiunque</option>
              {dati.autori.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome}
                </option>
              ))}
            </select>
          </label>

          <label className="lm-field">
            <span>Cliente</span>
            <select
              value={filtri.cliente ?? ''}
              onChange={(e) => vaiCon({ cliente: e.target.value || undefined })}
            >
              <option value="">tutti, anche senza</option>
              {clienti.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </label>

          <label className="lm-field">
            <span>Dal</span>
            <input
              type="date"
              value={filtri.dal ?? ''}
              onChange={(e) => vaiCon({ dal: e.target.value || undefined })}
            />
          </label>

          <label className="lm-field">
            <span>Al</span>
            <input
              type="date"
              value={filtri.al ?? ''}
              onChange={(e) => vaiCon({ al: e.target.value || undefined })}
            />
          </label>
        </div>
      )}
    </div>
  )
}

/* ── La card ───────────────────────────────────────────────────────────────── */

function Card({ voce, mia, apri }: { voce: VoceArchivio; mia: boolean; apri: () => void }) {
  const Icona = ICONE[voce.kind] ?? FileText
  const [inCorso, avvia] = useTransition()

  return (
    <article className="lm-card lm-arc-card" data-span={4} data-hover data-genere={voce.kind}>
      <header className="lm-arc-top">
        <span className="lm-arc-icona" aria-hidden="true">
          <Icona />
        </span>
        <span className="lm-arc-genere">{GENERI[voce.kind]}</span>
        {voce.testo && (
          /* Lo stato del testo è in cima e non in fondo: è la cosa che decide
             se ci si può fidare di quello che c'è scritto dentro. */
          <span className="lm-arc-testo-stato" data-stato={voce.testo_stato}>
            {voce.testo_stato === 'corretto' ? 'riletto' : 'estratto'}
          </span>
        )}
      </header>

      <button type="button" className="lm-arc-titolo" onClick={apri}>
        {voce.titolo}
      </button>

      {voce.nota && <p className="lm-sub">{voce.nota}</p>}

      {/* Di una foto si mostra la foto. L'assaggio di testo è per quello che
          del testo ce l'ha davvero: un'immagine non ne ha più (vedi
          `estrai.ts`), e un rettangolo di parole al posto di un'anteprima è la
          cosa che rendeva l'archivio illeggibile a colpo d'occhio. */}
      {eImmagine(voce.mime) && voce.indirizzo ? (
        <img className="lm-arc-anteprima" src={voce.indirizzo} alt="" loading="lazy" />
      ) : (
        voce.testo && (
          <p className="lm-arc-assaggio">{voce.testo.slice(0, 170).replace(/\s+/g, ' ')}…</p>
        )
      )}

      {voce.tags.length > 0 && (
        <div className="lm-arc-tags">
          {voce.tags.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      )}

      <footer className="lm-arc-piede">
        <span className="lm-muted">
          {quando(voce)}
          {voce.cliente ? ` · ${voce.cliente}` : ''}
          {voce.autore ? ` · ${voce.autore}` : ''}
        </span>

        <span className="lm-arc-azioni">
          {voce.indirizzo && (
            <a
              href={voce.indirizzo}
              target="_blank"
              rel="noreferrer"
              className="lm-arc-apri"
              aria-label={`Apri ${voce.titolo}`}
            >
              <ExternalLink aria-hidden="true" />
            </a>
          )}
          {mia && (
            <button
              type="button"
              className="lm-lab-cestino"
              disabled={inCorso}
              aria-label={`Elimina ${voce.titolo}`}
              onClick={() => avvia(async () => void (await eliminaVoceArchivio(voce.id)))}
            >
              <Trash2 aria-hidden="true" />
            </button>
          )}
        </span>
      </footer>
    </article>
  )
}

/* ── Il dettaglio: leggere e correggere il testo ───────────────────────────── */

/**
 * Correggere il testo è la funzione che rende accettabile l'estrazione
 * automatica.
 *
 * Un OCR sbaglia i nomi propri e le cifre; un dettato sbaglia il dialetto —
 * cioè sbagliano esattamente le cose per cui quel materiale è stato archiviato.
 * Qui il testo è un campo, non un paragrafo: si legge, si aggiusta la riga
 * storta, e da quel momento il Lab AI sa che dietro c'è una persona.
 */
function Dettaglio({ voce, mia, chiudi }: { voce: VoceArchivio; mia: boolean; chiudi: () => void }) {
  const [testo, setTesto] = useState(voce.testo ?? '')
  const [errore, setErrore] = useState<string | null>(null)
  const [salvato, setSalvato] = useState(false)
  const [inCorso, avvia] = useTransition()

  const cambiato = testo !== (voce.testo ?? '')
  /* `mime` vuoto e genere «immagine»: sono le voci seminate come dati demo, che
     una foto non ce l'hanno. Contano come immagini lo stesso — il box del testo
     non gli si deve aprire. */
  const foto = eImmagine(voce.mime) || voce.kind === 'immagine'

  return (
    <Modal title={voce.titolo} onClose={chiudi}>
      <div className="lm-arc-dettaglio">
        <h2>{voce.titolo}</h2>
        <p className="lm-muted">
          {GENERI[voce.kind]} · {quando(voce)}
          {voce.cliente ? ` · ${voce.cliente}` : ''}
          {voce.autore ? ` · caricato da ${voce.autore}` : ''}
          {voce.fonte ? ` · da ${voce.fonte}` : ''}
        </p>

        {voce.nota && <p className="lm-arc-nota">{voce.nota}</p>}

        {voce.indirizzo && (
          <a className="lm-btn" data-variant="ghost" href={voce.indirizzo} target="_blank" rel="noreferrer">
            <ExternalLink aria-hidden="true" /> {voce.nostro ? 'Apri il file' : 'Apri il link'}
          </a>
        )}

        {/* Una foto si guarda. Il box «Il testo che l'AI legge» qui dentro
            mostrava l'OCR, cioè righe di caratteri che non erano parole: non
            era un testo sbagliato, era rumore spacciato per contenuto. Vedi
            `estrai.ts`. Quello che di una foto va detto sta nella nota, qui
            sopra, e la nota è indicizzata come il testo. */}
        {foto ? (
          voce.indirizzo ? (
            <figure className="lm-arc-foto">
              <img src={voce.indirizzo} alt={voce.titolo} />
            </figure>
          ) : (
            <p className="lm-empty">Questa foto non è più disponibile.</p>
          )
        ) : (
          <div className="lm-field">
            <label htmlFor="arc-testo">
              Il testo che l’AI legge
              <small>
                {voce.testo_stato === 'corretto'
                  ? ' — riletto da una persona'
                  : voce.testo_stato === 'automatico'
                    ? ' — estratto in automatico, può contenere errori'
                    : ' — nessun testo: scrivilo tu, e diventa cercabile'}
              </small>
            </label>
            <textarea
              id="arc-testo"
              rows={12}
              value={testo}
              readOnly={!mia}
              placeholder="Nessun testo leggibile."
              onChange={(e) => {
                setTesto(e.target.value)
                setSalvato(false)
              }}
            />
            {!mia && (
              <p className="lm-field-hint">
                Questa voce l’ha caricata qualcun altro: si legge, non si corregge.
              </p>
            )}
          </div>
        )}

        {errore && (
          <p className="lm-error" role="alert">
            {errore}
          </p>
        )}

        <div className="lm-modal-actions">
          <button type="button" className="lm-btn" data-variant="ghost" onClick={chiudi}>
            Chiudi
          </button>
          {mia && !foto && (
            <button
              type="button"
              className="lm-btn"
              disabled={inCorso || !cambiato}
              onClick={() =>
                avvia(async () => {
                  const esito = await correggiTesto(voce.id, testo)
                  if (esito.ok) setSalvato(true)
                  else setErrore(esito.error ?? 'Non è stato salvato. Riprova.')
                })
              }
            >
              {inCorso ? 'Salvo…' : salvato ? 'Salvato' : 'Salva il testo'}
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}

/* ── Aggiungere ────────────────────────────────────────────────────────────── */

type Modo = 'file' | 'nota' | 'vocale' | 'link'

const MODI: { chiave: Modo; label: string; hint: string }[] = [
  { chiave: 'file', label: 'Un file', hint: 'PDF, foto, screenshot, testo. Dai documenti il testo lo leggo io.' },
  { chiave: 'nota', label: 'Una nota', hint: 'Scritta a mano libera, adesso.' },
  { chiave: 'vocale', label: 'Una vocale', hint: 'Parla, e resta la trascrizione. L’audio non si salva.' },
  { chiave: 'link', label: 'Un link', hint: 'Un articolo, un sito, un documento di qualcun altro.' },
]

function Nuova({ clienti, chiudi }: { clienti: { id: string; nome: string }[]; chiudi: () => void }) {
  const [modo, setModo] = useState<Modo>('file')
  const [testo, setTesto] = useState('')
  const [vocale, setVocale] = useState('')
  const [estrazione, setEstrazione] = useState<{ frase: string; quota: number } | null>(null)
  const [notaEstrazione, setNotaEstrazione] = useState<string | null>(null)
  /* L'anteprima della foto scelta, prima ancora che parta il caricamento: è
     `URL.createObjectURL`, cioè il file che sta già nel browser, zero rete.
     Si revoca quando cambia e quando la modale si chiude, o ogni foto provata
     e scartata resta in memoria finché la scheda non si chiude. */
  const [anteprima, setAnteprima] = useState<string | null>(null)
  const [errore, setErrore] = useState<string | null>(null)
  const [inCorso, avvia] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  /**
   * L'estrazione parte da sé appena si sceglie il file.
   *
   * Non dietro un bottone «estrai il testo»: un bottone in più è un bottone che
   * non si preme, e l'archivio si riempirebbe di file muti. Parte qui, dura
   * quanto dura, e intanto si può continuare a scrivere il titolo — quando si
   * salva, il testo c'è già.
   */
  useEffect(() => () => void (anteprima && URL.revokeObjectURL(anteprima)), [anteprima])

  async function suFile(file: File | undefined) {
    setNotaEstrazione(null)
    setTesto('')
    setAnteprima(file && eImmagine(file.type) ? URL.createObjectURL(file) : null)
    if (!file) return

    setEstrazione({ frase: 'Apro il file…', quota: 0.02 })
    try {
      const esito = await estraiDa(file, (frase, quota) => setEstrazione({ frase, quota }))
      if (esito) {
        setTesto(esito.testo)
        setNotaEstrazione(esito.nota)
      } else {
        setNotaEstrazione('Da questo formato non so tirare fuori del testo: scrivi tu nella nota cosa contiene.')
      }
    } catch {
      /* Un'estrazione fallita non deve impedire il caricamento: il materiale
         vale comunque più della comodità di averlo cercabile. */
      setNotaEstrazione('Non sono riuscito a leggere il testo di questo file. Si archivia lo stesso.')
    } finally {
      setEstrazione(null)
    }
  }

  return (
    <Modal title="Butta dentro" onClose={chiudi}>
      <form
        ref={formRef}
        onSubmit={(e) => {
          e.preventDefault()
          const form = new FormData(e.currentTarget)
          form.set('testo', modo === 'vocale' ? vocale : testo)
          form.set('testo_stato', modo === 'vocale' || modo === 'nota' ? 'corretto' : 'automatico')
          if (modo === 'vocale') form.set('vocale', '1')
          avvia(async () => {
            const esito = await creaVoceArchivio(form)
            if (esito.ok) chiudi()
            else setErrore(esito.error ?? 'Non è stato salvato. Riprova.')
          })
        }}
      >
        <div className="lm-chips lm-arc-modi" role="group" aria-label="Cosa stai archiviando">
          {MODI.map((m) => (
            <button
              key={m.chiave}
              type="button"
              data-on={modo === m.chiave}
              onClick={() => setModo(m.chiave)}
            >
              {m.label}
            </button>
          ))}
        </div>
        <p className="lm-field-hint">{MODI.find((m) => m.chiave === modo)?.hint}</p>

        <div className="lm-field">
          <label htmlFor="arc-titolo">Titolo</label>
          <input
            id="arc-titolo"
            name="titolo"
            maxLength={160}
            required
            autoFocus
            placeholder="Come lo cercherai fra sei mesi"
          />
        </div>

        {modo === 'file' && (
          <div className="lm-field">
            <label htmlFor="arc-file">Il file</label>
            <input
              id="arc-file"
              name="file"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.txt,.md,.csv"
              onChange={(e) => void suFile(e.target.files?.[0])}
            />
            <p className="lm-field-hint">
              Massimo 20 MB. Dai PDF e dai file di testo estraggo il testo; le foto si guardano e basta.
            </p>
          </div>
        )}

        {modo === 'link' && (
          <div className="lm-field">
            <label htmlFor="arc-link">L’indirizzo</label>
            <input id="arc-link" name="link" type="url" inputMode="url" placeholder="https://…" />
          </div>
        )}

        {modo === 'vocale' && (
          <VoiceNote
            value={vocale}
            onChange={setVocale}
            label="Parla"
            hint="Resta solo la trascrizione: l’audio non viene salvato da nessuna parte."
          />
        )}

        {estrazione && (
          <div className="lm-arc-estrazione" role="status">
            <span>{estrazione.frase}</span>
            <span className="lm-arc-prog">
              <i style={{ transform: `scaleX(${Math.max(0.02, estrazione.quota)})` }} />
            </span>
          </div>
        )}

        {anteprima ? (
          <div className="lm-field">
            <span className="lm-label">Cosa stai archiviando</span>
            <figure className="lm-arc-foto" data-scelta="true">
              <img src={anteprima} alt="La foto scelta" />
            </figure>
            {notaEstrazione && <p className="lm-field-hint">{notaEstrazione}</p>}
          </div>
        ) : (
          modo !== 'vocale' &&
          modo !== 'nota' &&
          (testo || notaEstrazione) && (
            <div className="lm-field">
              <label htmlFor="arc-estratto">
                Il testo trovato<small> — correggilo adesso, o dopo dal dettaglio</small>
              </label>
              <textarea
                id="arc-estratto"
                rows={7}
                value={testo}
                onChange={(e) => setTesto(e.target.value)}
              />
              {notaEstrazione && <p className="lm-field-hint">{notaEstrazione}</p>}
            </div>
          )
        )}

        <div className="lm-field">
          <label htmlFor="arc-nota">
            {modo === 'nota' ? 'La nota' : 'Perché la stai archiviando'}
          </label>
          <textarea
            id="arc-nota"
            name="nota"
            rows={modo === 'nota' ? 6 : 2}
            required={modo === 'nota'}
            placeholder={
              modo === 'nota'
                ? 'Scrivi quello che ti ricordi, com’è uscito.'
                : 'Una riga: è quella che ti farà capire, fra sei mesi, perché ti serviva.'
            }
          />
        </div>

        <div className="lm-arc-riga">
          <div className="lm-field">
            <label htmlFor="arc-tags">Tag</label>
            <input
              id="arc-tags"
              name="tags"
              placeholder="prezzi, menù, obiezioni"
              autoCapitalize="none"
            />
            <p className="lm-field-hint">Separati da virgola. Sono il modo vero di ritrovare le cose.</p>
          </div>

          <div className="lm-field">
            <label htmlFor="arc-fonte">Da dove arriva</label>
            <input id="arc-fonte" name="fonte" maxLength={60} placeholder="telefonata, sopralluogo, WhatsApp" />
          </div>
        </div>

        <div className="lm-arc-riga">
          <div className="lm-field">
            <label htmlFor="arc-cliente">Cliente</label>
            <select id="arc-cliente" name="cliente" defaultValue="">
              <option value="">nessuno, è roba generale</option>
              {clienti.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="lm-field">
            <label htmlFor="arc-data">Quand’è successo</label>
            <input id="arc-data" name="avvenuto_il" type="date" />
            <p className="lm-field-hint">Vuoto: vale oggi.</p>
          </div>
        </div>

        {errore && (
          <p className="lm-error" role="alert">
            {errore}
          </p>
        )}

        <div className="lm-modal-actions">
          <button type="button" className="lm-btn" data-variant="ghost" onClick={chiudi}>
            Annulla
          </button>
          <button type="submit" className="lm-btn" disabled={inCorso || Boolean(estrazione)}>
            {inCorso ? 'Salvo…' : estrazione ? 'Sto leggendo il file…' : 'Archivia'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */

/** La data che conta: quando è successo, o in mancanza quando è entrato. */
function quando(v: VoceArchivio): string {
  const iso = v.avvenuto_il ?? v.created_at.slice(0, 10)
  const d = new Date(iso + 'T12:00:00')
  return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })
}
