import Link from 'next/link'

export const metadata = { title: 'Senza rete' }

/**
 * La pagina che si vede quando la rete non c'è.
 *
 * È una pagina vera e non una stringa dentro il service worker perché deve
 * avere il vestito dell'area — la stanza dietro, il vetro davanti, gli stessi
 * caratteri — e perché il worker la prende com'è, la mette in cache
 * all'installazione e la serve senza ricostruirla. Riusa `.lm-vuoto-porta`,
 * che è già il modo in cui quest'area dice «qui non c'è niente, ecco cosa
 * fare»: una schermata vuota che non dà il bottone è una pagina morta.
 *
 * Non sta dietro al gate di `/staff` (c'è la sua eccezione nel middleware): una
 * pagina di cortesia offline che rimanda al login è, senza rete, una porta
 * chiusa davanti a un'altra porta chiusa.
 *
 * **Dentro non c'è nessun dato**, ed è una regola e non un caso: è l'unica
 * pagina dell'area che finisce in cache, quindi è l'unica che potrebbe
 * sopravvivere al logout su un telefono prestato.
 *
 * Il bottone ricarica e basta. Non c'è un «riprova quando torna la rete»
 * automatico: qui il JavaScript dell'app potrebbe non essere mai arrivato, e un
 * bottone che promette e non mantiene è peggio di un bottone che aspetta.
 */
export default function OfflinePage() {
  return (
    <div className="lm-staff-shell" data-offline="true">
      <main className="lm-staff-main">
        <div className="lm-vuoto-porta" data-grande="true">
          <p>Non c&rsquo;è rete</p>
          <p className="lm-sub">
            La dashboard mostra sempre i numeri veri, quindi senza connessione non ha niente da
            mostrare. Le visite compilate nel frattempo restano sul telefono e partono da sole
            appena la rete torna.
          </p>
          <div className="lm-vuoto-azioni">
            <Link href="/staff" className="lm-btn">
              Riprova
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
