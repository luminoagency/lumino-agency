'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { aggiornaProfilo } from '@/lib/staff/actions'

/**
 * Il titolo e il saluto.
 *
 * Due campi, e sotto l'anteprima di come suoneranno nella home: un campo che
 * scrive un titolo dentro un'intestazione che non si vede è un campo che si
 * riempie a caso. L'anteprima costa una riga e toglie il giro «salvo, vado in
 * home, torno indietro, correggo».
 *
 * Il nome non si modifica da qui, e non è una dimenticanza: è la stessa colonna
 * che compare nello storico delle attività di ogni cliente e nelle statistiche
 * per venditore. Cambiarlo da soli vorrebbe dire riscrivere la firma di un anno
 * di lavoro, quindi lo cambia un admin dalla pagina Team.
 */
export default function ProfiloForm({
  nome,
  ruoloTitolo,
  salutoCustom,
}: {
  nome: string
  ruoloTitolo: string | null
  salutoCustom: string | null
}) {
  const router = useRouter()
  const [titolo, setTitolo] = useState(ruoloTitolo ?? '')
  const [saluto, setSaluto] = useState(salutoCustom ?? '')
  const [esito, setEsito] = useState<string | null>(null)
  const [errore, setErrore] = useState<string | null>(null)
  const [inCorso, avvia] = useTransition()

  const primo = nome.trim().split(/\s+/)[0] || nome

  function salva(e: React.FormEvent) {
    e.preventDefault()
    setEsito(null)
    setErrore(null)
    avvia(async () => {
      const r = await aggiornaProfilo({ ruolo_titolo: titolo, saluto_custom: saluto })
      if (!r.ok) return setErrore(r.error ?? 'Non salvato.')
      setEsito('Salvato.')
      router.refresh()
    })
  }

  return (
    <form className="lm-form" onSubmit={salva}>
      <label className="lm-field">
        <span className="lm-label">Ruolo</span>
        <input
          type="text"
          value={titolo}
          maxLength={40}
          placeholder="CCO"
          onChange={(e) => setTitolo(e.target.value)}
        />
        <span className="lm-field-hint">
          Va davanti al nome nel saluto. Non cambia cosa puoi vedere: quello è il ruolo di sistema.
        </span>
      </label>

      <label className="lm-field" data-wide="true">
        <span className="lm-label">La tua riga</span>
        <textarea
          value={saluto}
          maxLength={160}
          placeholder="Lasciala vuota e la scrive l’ora del giorno."
          onChange={(e) => setSaluto(e.target.value)}
        />
        <span className="lm-field-hint">{160 - saluto.length} caratteri liberi.</span>
      </label>

      <div className="lm-field" data-wide="true">
        <span className="lm-label">Come lo vedrai entrando</span>
        <p className="lm-anteprima-saluto">
          Bentornato, <em>{titolo.trim() ? `${titolo.trim()} ${primo}` : primo}</em>
          <small>{saluto.trim() || 'Buongiorno. La giornata è ancora tutta da scrivere.'}</small>
        </p>
      </div>

      <div className="lm-modal-actions" data-wide="true">
        {errore && <span className="lm-field-hint" data-errore="true">{errore}</span>}
        {esito && !errore && <span className="lm-field-hint">{esito}</span>}
        <button type="submit" className="lm-btn" data-variant="dark" disabled={inCorso}>
          {inCorso ? 'Salvo…' : 'Salva'}
        </button>
      </div>
    </form>
  )
}
