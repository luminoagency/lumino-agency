'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useI18n } from './I18nProvider'
import {
  LOCALES,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_LABEL,
  LOCALE_NAME,
  localePath,
  splitLocale,
  type Locale,
} from '@/lib/i18n/config'

/**
 * Selettore di lingua: IT / FR / EN, sempre in vista.
 *
 * Non è un menu a tendina. Tre lingue stanno in tre caratteri l'una: un menu
 * chiederebbe un click per scoprire cosa c'è dentro, e il punto di questo
 * selettore è che un marocchino che preferisce l'inglese lo veda subito e ci
 * arrivi in un colpo solo.
 *
 * Cambiando lingua si RESTA sulla stessa pagina: si sostituisce solo il
 * prefisso. E si scrive il cookie, altrimenti il rilevamento del paese
 * rimanderebbe la persona da dove è venuta al prossimo ingresso — che è
 * esattamente la trappola da evitare.
 */
export default function LocaleSwitch({ tone = 'nav' }: { tone?: 'nav' | 'overlay' }) {
  const { locale, m } = useI18n()
  const router = useRouter()
  const pathname = usePathname()

  const choose = (next: Locale) => {
    if (next === locale) return

    /* Il cookie prima della navigazione: il middleware lo legge sulla
       richiesta successiva, e se non c'è ancora rimbalza sulla lingua del
       paese vanificando il click. */
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`

    const { path } = splitLocale(pathname || '/')
    router.push(localePath(next, path))
    router.refresh()
  }

  return (
    <div className={`lm-lang lm-lang-${tone}`} role="group" aria-label={m.nav.languageLabel}>
      {LOCALES.map((l) => (
        <button
          type="button"
          key={l}
          className={`lm-lang-opt${l === locale ? ' is-on' : ''}`}
          onClick={() => choose(l)}
          aria-label={LOCALE_NAME[l]}
          aria-current={l === locale ? 'true' : undefined}
          lang={l}
          data-cursor="grow"
        >
          {LOCALE_LABEL[l]}
        </button>
      ))}
    </div>
  )
}
