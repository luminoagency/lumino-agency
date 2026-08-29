import en from '@/messages/en.json'
import fr from '@/messages/fr.json'
import it from '@/messages/it.json'
import { DEFAULT_LOCALE, type Locale } from './config'

/**
 * I tre cataloghi, importati staticamente.
 *
 * NON con un import() dinamico: sono tre file JSON di pochi kB, e caricarli a
 * runtime li trasformerebbe in tre chunk separati da attendere prima di poter
 * dipingere. Importati così finiscono nel bundle della rotta, che è già
 * suddiviso per lingua dal segmento [locale].
 *
 * L'inglese è anche il tipo di riferimento: se una chiave manca in francese o
 * in italiano, TypeScript se ne accorge qui e non a pagina aperta.
 */
export type Messages = typeof en

const CATALOGUES: Record<Locale, Messages> = {
  en,
  fr: fr as Messages,
  it: it as Messages,
}

export function getMessages(locale: Locale): Messages {
  return CATALOGUES[locale] ?? CATALOGUES[DEFAULT_LOCALE]
}

/**
 * Sostituisce i segnaposto {nome} in una stringa del catalogo.
 * Serve alle poche frasi che contengono un dato — il nome del cliente
 * nell'alt di una finestra, il titolo dell'anteprima.
 */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (whole, key) =>
    key in values ? String(values[key]) : whole,
  )
}
