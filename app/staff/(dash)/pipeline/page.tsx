import Soon from '../Soon'

export const metadata = { title: 'Pipeline' }

export default function Page() {
  return (
    <Soon
      sezione="Pipeline"
      titolo="Il kanban"
      testo="Le trattative in colonne, una per stato, da trascinare con il dito o col mouse. Passando un cliente a «rifiutato» si dovrà scrivere il motivo: è il dato che spiega perché si perde, e senza obbligo non lo scrive nessuno."
      fase={2}
    />
  )
}
