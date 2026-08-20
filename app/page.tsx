import '@/components/home/home.css'
import '@/components/home/motion.css'
import '@/components/home/hero.css'
import '@/components/home/process.css'
import '@/components/home/whatsapp.css'

import { anton } from '@/components/home/fonts'
import SmoothScroll from '@/components/home/SmoothScroll'
import Preloader from '@/components/home/Preloader'
import Cursor from '@/components/home/Cursor'
import Reveal from '@/components/home/Reveal'
import Nav from '@/components/home/Nav'
import Hero from '@/components/home/Hero'
import Marquee from '@/components/home/Marquee'
import About from '@/components/home/About'
import Works from '@/components/home/Works'
import Statement from '@/components/home/Statement'
import Process from '@/components/home/Process'
import Sectors from '@/components/home/Sectors'
import Stats from '@/components/home/Stats'
import Contact from '@/components/home/Contact'
import Footer from '@/components/home/Footer'
import WhatsAppDock from '@/components/home/WhatsAppDock'

/**
 * Home — vetrina dello studio.
 *
 * Server component: ogni sezione vive in components/home/ e porta con sé la
 * propria interattività. Qui c'è solo l'ordine delle sezioni.
 *
 * Nessun CTA di vendita, nessun riferimento a piani o prezzi: la home racconta
 * chi siamo e mostra i lavori. Il percorso commerciale resta su /pricing e
 * /inizia, che non sono più linkati da qui, e l'area cliente non è toccata.
 *
 * La sezione a fondo chiaro (Lavori) è volutamente tale: serve a spezzare il
 * buio, non va resa scura. I servizi non sono più una sezione a sé: sono
 * raccontati dentro "Cosa facciamo", settore per settore.
 *
 * Preloader, Cursor e Reveal sono trasversali e stanno fuori dal <main>:
 * non sono contenuto, sono lo strato che lo fa muovere.
 *
 * Anton (--font-display) è agganciato qui e non ad app/layout.tsx: lo usa solo
 * il wordmark dell'hero, e le altre pagine non devono pagarne il caricamento.
 */
export default function HomePage() {
  return (
    <div className={`lm ${anton.variable}`}>
      <SmoothScroll />
      <Preloader />
      <Cursor />
      <Reveal />

      <Nav />

      <main>
        <Hero />
        <Marquee />
        <About />
        <Works />
        <Statement />
        <Process />
        <Sectors />
        <Stats />
        <Contact />
      </main>

      <Footer />

      {/* Fuori dal <main> come Preloader e Cursor: non è contenuto della
          pagina, è un modo di raggiungerci che la accompagna. Il FAB globale
          di app/layout.tsx resta escluso dalla home: questo lo sostituisce. */}
      <WhatsAppDock />
    </div>
  )
}
