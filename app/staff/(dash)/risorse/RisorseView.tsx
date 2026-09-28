'use client'

import { useMemo, useState, useTransition } from 'react'
import {
  ExternalLink,
  FileText,
  Film,
  Image as ImageIcon,
  Link2,
  Plus,
  Presentation,
  Trash2,
  type LucideIcon,
} from 'lucide-react'
import Modal from '@/components/staff/Modal'
import { creaRisorsa, eliminaRisorsa } from '@/lib/staff/azioni-f5'
import type { RisorsaVista } from '@/lib/staff/f5'
import { SETTORE_LABEL, SETTORI } from '@/lib/staff/types'

/**
 * Il materiale.
 *
 * Non è un archivio: è quello che serve **avere in mano davanti a un titolare**,
 * cioè su un telefono, in piedi, in un bar rumoroso. Da lì discendono tutte le
 * scelte di questa schermata.
 *
 * · **Un tocco solo per aprire.** La card intera è il link, e il filtro per
 *   settore sta in cima: chi sta per entrare in un hotel tocca «hotel» e vede
 *   tre voci invece di venti.
 * · **Il peso è scritto accanto al nome.** Un PDF da 8 MB su una connessione
 *   mobile davanti a un cliente che aspetta è un silenzio di quindici secondi:
 *   saperlo prima è la differenza fra aprirlo e mandarlo per messaggio.
 * · **Il link esterno si distingue dal file nostro.** Non per pedanteria: il
 *   file nostro si apre anche con una riga di campo, un Drive di qualcun altro
 *   può chiedere di accedere proprio nel momento peggiore.
 */

const ICONE: Record<string, LucideIcon> = {
  PDF: FileText,
  immagine: ImageIcon,
  video: Film,
  slide: Presentation,
  documento: FileText,
  link: Link2,
}

export default function RisorseView({
  risorse,
  isAdmin,
}: {
  risorse: RisorsaVista[]
  isAdmin: boolean
}) {
  const [settore, setSettore] = useState<string>('')
  const [nuova, setNuova] = useState(false)

  /* I settori che esistono davvero in elenco, non tutti quelli possibili: un
     filtro con sei bottoni di cui quattro danno zero risultati è un filtro che
     insegna a non usare i filtri. */
  const settori = useMemo(() => {
    const presenti = new Set(risorse.map((r) => r.settore).filter((s): s is string => Boolean(s)))
    return SETTORI.filter((s) => presenti.has(s))
  }, [risorse])

  const viste = settore ? risorse.filter((r) => r.settore === settore) : risorse

  return (
    <>
      <div className="lm-risorse-barra">
        {settori.length > 0 && (
          <div className="lm-chips" role="group" aria-label="Filtra per settore">
            <button type="button" data-on={!settore} onClick={() => setSettore('')}>
              tutto
            </button>
            {settori.map((s) => (
              <button
                key={s}
                type="button"
                data-on={settore === s}
                onClick={() => setSettore(settore === s ? '' : s)}
              >
                {SETTORE_LABEL[s]}
              </button>
            ))}
          </div>
        )}

        {isAdmin && (
          <button type="button" className="lm-btn" onClick={() => setNuova(true)}>
            <Plus aria-hidden="true" /> Aggiungi
          </button>
        )}
      </div>

      {viste.length === 0 ? (
        <p className="lm-empty">
          {risorse.length === 0
            ? 'Ancora niente. Il listino, il manuale e le demo per settore vanno qui: si aprono dal telefono davanti a un titolare.'
            : 'Niente in questo settore.'}
        </p>
      ) : (
        <div className="lm-bento lm-risorse">
          {viste.map((r) => (
            <Card key={r.id} risorsa={r} isAdmin={isAdmin} />
          ))}
        </div>
      )}

      {nuova && <Nuova chiudi={() => setNuova(false)} />}
    </>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */

function Card({ risorsa, isAdmin }: { risorsa: RisorsaVista; isAdmin: boolean }) {
  const [inCorso, avvia] = useTransition()
  const Icona = ICONE[risorsa.tipo ?? ''] ?? FileText
  /* Una risorsa senza indirizzo esiste: il bucket non è ancora stato creato, o
     la firma non è riuscita. Si mostra lo stesso — sapere che il listino esiste
     è già qualcosa — ma non si finge che sia un link. */
  const apribile = Boolean(risorsa.indirizzo)

  return (
    <article className="lm-card lm-risorsa" data-span={4} data-hover={apribile || undefined}>
      <span className="lm-risorsa-icona" aria-hidden="true">
        <Icona />
      </span>

      {apribile ? (
        <a
          className="lm-risorsa-titolo"
          href={risorsa.indirizzo as string}
          target="_blank"
          rel="noreferrer"
        >
          {risorsa.titolo}
          {!risorsa.nostro && <ExternalLink aria-hidden="true" />}
        </a>
      ) : (
        <span className="lm-risorsa-titolo" data-spento="true">
          {risorsa.titolo}
        </span>
      )}

      {risorsa.descrizione && <p className="lm-sub">{risorsa.descrizione}</p>}

      <footer className="lm-risorsa-piede">
        <span className="lm-muted">
          {risorsa.nostro ? (risorsa.tipo ?? 'file') : 'link esterno'}
          {risorsa.dimensione ? ` · ${peso(risorsa.dimensione)}` : ''}
          {risorsa.settore ? ` · ${SETTORE_LABEL[risorsa.settore as keyof typeof SETTORE_LABEL] ?? risorsa.settore}` : ''}
        </span>
        {isAdmin && (
          <button
            type="button"
            className="lm-lab-cestino"
            disabled={inCorso}
            aria-label={`Elimina ${risorsa.titolo}`}
            onClick={() => avvia(async () => void (await eliminaRisorsa(risorsa.id)))}
          >
            <Trash2 aria-hidden="true" />
          </button>
        )}
      </footer>
    </article>
  )
}

/**
 * Aggiungere: un file **o** un link, mai tutti e due.
 *
 * I due campi si disabilitano a vicenda invece di dare un errore dopo l'invio.
 * È la stessa regola del vincolo in database, detta prima e senza parole: quando
 * si sceglie un file, il campo del link si spegne e si vede perché.
 */
function Nuova({ chiudi }: { chiudi: () => void }) {
  const [haFile, setHaFile] = useState(false)
  const [haLink, setHaLink] = useState(false)
  const [errore, setErrore] = useState<string | null>(null)
  const [inCorso, avvia] = useTransition()

  return (
    <Modal title="Aggiungi materiale" onClose={chiudi}>
      <form
        id="form-risorsa"
        onSubmit={(e) => {
          e.preventDefault()
          const form = new FormData(e.currentTarget)
          avvia(async () => {
            const esito = await creaRisorsa(form)
            if (esito.ok) chiudi()
            else setErrore(esito.error ?? 'Non è andata.')
          })
        }}
      >
        <div className="lm-field">
          <label htmlFor="ris-titolo">Titolo</label>
          <input id="ris-titolo" name="titolo" maxLength={120} required autoFocus />
        </div>

        <div className="lm-field">
          <label htmlFor="ris-desc">A cosa serve</label>
          <input id="ris-desc" name="descrizione" maxLength={200} placeholder="facoltativo" />
        </div>

        <div className="lm-field">
          <label htmlFor="ris-settore">Settore</label>
          <select id="ris-settore" name="settore" defaultValue="">
            <option value="">per tutti</option>
            {SETTORI.map((s) => (
              <option key={s} value={s}>
                {SETTORE_LABEL[s]}
              </option>
            ))}
          </select>
        </div>

        <div className="lm-field">
          <label htmlFor="ris-file">Il file</label>
          <input
            id="ris-file"
            name="file"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp,.mp4,.pptx,.docx"
            disabled={haLink}
            onChange={(e) => setHaFile(Boolean(e.target.files?.length))}
          />
          <p className="lm-field-hint">Massimo 10 MB. Per un video, usa il link.</p>
        </div>

        <div className="lm-field">
          <label htmlFor="ris-link">…oppure un link</label>
          <input
            id="ris-link"
            name="link"
            type="url"
            inputMode="url"
            placeholder="https://…"
            disabled={haFile}
            onChange={(e) => setHaLink(Boolean(e.target.value.trim()))}
          />
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
          <button type="submit" className="lm-btn" disabled={inCorso}>
            {inCorso ? 'Carico…' : 'Aggiungi'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

/** «2,4 MB». Con la virgola, perché si legge in italiano. */
function peso(byte: number): string {
  if (byte < 1024) return `${byte} B`
  if (byte < 1_048_576) return `${Math.round(byte / 1024)} KB`
  return `${(byte / 1_048_576).toFixed(1).replace('.', ',')} MB`
}
