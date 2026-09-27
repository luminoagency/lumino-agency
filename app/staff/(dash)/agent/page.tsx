import Soon from '../Soon'

export const metadata = { title: 'Ricerca Agent' }

export default function Page() {
  return (
    <Soon
      sezione="Ricerca Agent"
      titolo="La ricerca automatica"
      testo="L’agent che trova i locali senza sito decente, li valuta e riempie la pipeline da solo. I campi che compilerà (voto del sito, problemi nelle recensioni, prezzo consigliato) sono già nel database: per ora li scriviamo a mano."
      fase={5}
    />
  )
}
