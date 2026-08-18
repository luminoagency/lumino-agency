import '@/components/home/home.css'

import Nav from '@/components/home/Nav'
import Hero from '@/components/home/Hero'
import Marquee from '@/components/home/Marquee'
import About from '@/components/home/About'
import Works from '@/components/home/Works'
import Statement from '@/components/home/Statement'
import Process from '@/components/home/Process'
import Sectors from '@/components/home/Sectors'
import Services from '@/components/home/Services'
import Stats from '@/components/home/Stats'
import Contact from '@/components/home/Contact'
import Footer from '@/components/home/Footer'

/**
 * Home — vetrina dello studio.
 *
 * Server component: ogni sezione vive in components/home/ e porta con sé la
 * propria interattività. Qui c'è solo l'ordine delle sezioni.
 *
 * Nessun CTA di vendita, nessun riferimento a piani o prezzi: la home racconta
 * chi siamo e mostra i lavori. Il percorso commerciale resta su /pricing e
 * /inizia, raggiungibili dal menu, e l'area cliente non è toccata.
 *
 * Le due sezioni a fondo chiaro (Lavori, Servizi) sono volutamente tali:
 * servono a spezzare il buio: non renderle scure.
 */
export default function HomePage() {
  return (
    <div className="lm">
      <Nav />

      <main>
        <Hero />
        <Marquee />
        <About />
        <Works />
        <Statement />
        <Process />
        <Sectors />
        <Services />
        <Stats />
        <Contact />
      </main>

      <Footer />
    </div>
  )
}
