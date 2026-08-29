'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { Locale } from '@/lib/i18n/config'
import type { Messages } from '@/lib/i18n/messages'

/**
 * Le stringhe passate ai componenti client.
 *
 * I server component leggono il catalogo direttamente con getMessages(); i
 * client component — nav, selettore, WhatsApp, viewer dei lavori — hanno
 * bisogno di riceverle. Questo è il ponte, e viaggia già serializzato dentro
 * il payload RSC: nessuna richiesta in più.
 *
 * Il catalogo passa INTERO e non a pezzi: sono pochi kB, e ritagliarlo per
 * componente vorrebbe dire mantenere a mano l'elenco di chi usa cosa.
 */

interface I18nValue {
  locale: Locale
  m: Messages
}

const I18nContext = createContext<I18nValue | null>(null)

export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale
  messages: Messages
  children: ReactNode
}) {
  return <I18nContext.Provider value={{ locale, m: messages }}>{children}</I18nContext.Provider>
}

/**
 * Le stringhe e la lingua corrente.
 *
 * Lancia se usato fuori dal provider: è un errore di cablaggio, e vederlo
 * subito in sviluppo è meglio che ritrovarsi le stringhe inglesi su /fr.
 */
export function useI18n(): I18nValue {
  const value = useContext(I18nContext)
  if (!value) throw new Error('useI18n va usato dentro <I18nProvider>')
  return value
}
