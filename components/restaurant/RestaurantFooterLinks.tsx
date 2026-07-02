'use client'

import { useEffect, useState } from 'react'
import { getLocaleFromCookie, type Locale } from '@/lib/sites/i18n'
import { RESTAURANT_OPEN_PREFERENCES_EVENT } from '@/lib/cookies/restaurantConsent'

/**
 * Riga discreta nei footer dei siti ristoratore, sotto "Sito realizzato da Lumino":
 * Cookie Policy · Privacy Policy · Gestisci cookie.
 *
 * - Lingua dal cookie `restaurant_locale` (IT/EN).
 * - "Gestisci cookie" dispatcha RESTAURANT_OPEN_PREFERENCES_EVENT → il banner
 *   riapre il pannello Personalizza.
 * - Colore ereditato dal footer + opacity ridotta, come la riga Powered by.
 */
export default function RestaurantFooterLinks({ slug }: { slug?: string }) {
  const [locale, setLocale] = useState<Locale>('it')
  useEffect(() => { setLocale(getLocaleFromCookie()) }, [])

  const base = slug ? `/sites/${slug}` : ''
  const manage = locale === 'en' ? 'Manage cookies' : 'Gestisci cookie'

  const openPreferences = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(RESTAURANT_OPEN_PREFERENCES_EVENT))
    }
  }

  const linkStyle: React.CSSProperties = { color: 'inherit', textDecoration: 'none' }

  return (
    <p style={{ marginTop: 6, fontSize: '0.7rem', opacity: 0.55, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
      <a href={`${base}/cookie-policy`} style={linkStyle}>Cookie Policy</a>
      <span aria-hidden="true">·</span>
      <a href={`${base}/privacy-policy`} style={linkStyle}>Privacy Policy</a>
      <span aria-hidden="true">·</span>
      <button
        type="button"
        onClick={openPreferences}
        style={{ ...linkStyle, background: 'none', border: 0, cursor: 'pointer', font: 'inherit', padding: 0 }}
      >
        {manage}
      </button>
    </p>
  )
}
