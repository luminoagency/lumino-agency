import Soon from '../Soon'

export const metadata = { title: 'Progetti' }

export default function Page() {
  return (
    <Soon
      titolo="I cantieri"
      testo="Ogni sito in lavorazione con la sua fase, il link dell’anteprima da mandare al cliente e la scadenza del dominio, che va vista prima e non il giorno dopo."
      fase={4}
    />
  )
}
