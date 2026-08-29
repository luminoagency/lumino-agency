import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import '@/components/home/home.css'
import '@/components/home/motion.css'
import '@/components/home/hero.css'
import '@/components/home/process.css'
import '@/components/home/whatsapp.css'

import { anton } from '@/components/home/fonts'
import { I18nProvider } from '@/components/i18n/I18nProvider'
import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_HREFLANG,
  isLocale,
  localePath,
  type Locale,
} from '@/lib/i18n/config'
import { getMessages } from '@/lib/i18n/messages'
import { OG_IMAGE, SITE_URL } from '@/lib/seo'

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
 * Home — vetrina dello studio, nelle tre lingue.
 *
 * L'inglese vive sulla radice senza prefisso: ci arriva per riscrittura dal
 * middleware, quindi questo file serve sia / che /fr che /it. Le tre versioni
 * hanno URL distinti e indicizzabili, che è l'unico modo perché Googlebot —
 * che scansiona dagli Stati Uniti — veda anche il francese e l'italiano.
 *
 * Le stringhe arrivano da /messages: i server component le leggono qui, i
 * client component dal provider.
 *
 * NOTA sul `lang`: sta sul contenitore della pagina e non su <html>, che è del
 * layout di radice e non conosce il segmento [locale]. Leggerlo lì
 * richiederebbe headers(), e headers() renderebbe dinamico tutto il sito —
 * caro, per un attributo che i motori usano molto meno di hreflang, che c'è.
 */

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  if (!isLocale(params.locale)) return {}
  const locale = params.locale
  const m = getMessages(locale)

  /* Ogni lingua dichiara sé stessa come canonica e indica le sorelle. Senza
     questo, tre pagine che dicono la stessa cosa in tre lingue si leggono come
     contenuto duplicato. x-default va sull'inglese: è la versione per chi non
     rientra in nessuna delle tre. */
  const languages: Record<string, string> = {}
  for (const l of LOCALES) languages[LOCALE_HREFLANG[l]] = `${SITE_URL}${localePath(l)}`
  languages['x-default'] = `${SITE_URL}${localePath(DEFAULT_LOCALE)}`

  return {
    /* Assoluto: il template della radice aggiunge il marchio, e qui il marchio
       c'è già — usciva "Lumino — … · Lumino". */
    title: { absolute: m.meta.title },
    description: m.meta.description,
    alternates: { canonical: `${SITE_URL}${localePath(locale)}`, languages },
    openGraph: {
      type: 'website',
      url: `${SITE_URL}${localePath(locale)}`,
      title: m.meta.title,
      description: m.meta.description,
      locale: locale === 'it' ? 'it_IT' : locale === 'fr' ? 'fr_FR' : 'en_GB',
      images: [{ ...OG_IMAGE, alt: m.meta.ogImageAlt }],
    },
    twitter: {
      card: 'summary_large_image',
      title: m.meta.title,
      description: m.meta.description,
      images: [OG_IMAGE.url],
    },
  }
}

export default function HomePage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  const locale: Locale = params.locale
  const m = getMessages(locale)

  return (
    <I18nProvider locale={locale} messages={m}>
      <div className={`lm ${anton.variable}`} lang={LOCALE_HREFLANG[locale]}>
        <SmoothScroll />
        <Preloader />
        <Cursor />
        <Reveal />

        <Nav />

        <main>
          <Hero />
          <Marquee />
          <About m={m} />
          <Works />
          <Statement m={m} />
          <Process />
          <Sectors />
          <Stats />
          <Contact />
        </main>

        <Footer m={m} />

        {/* Fuori dal <main> come Preloader e Cursor: non è contenuto della
            pagina, è un modo di raggiungerci che la accompagna. Il FAB globale
            di app/layout.tsx resta escluso dalla home: questo lo sostituisce. */}
        <WhatsAppDock />
      </div>
    </I18nProvider>
  )
}
