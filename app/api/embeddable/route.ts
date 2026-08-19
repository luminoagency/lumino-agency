import { NextResponse } from 'next/server'
import { WORKS } from '@/components/home/worksData'

/**
 * Dice se un sito si lascia incorporare in un iframe.
 *
 * Serve perché dal browser NON si può sapere: un iframe rifiutato per
 * X-Frame-Options o CSP frame-ancestors emette gli stessi eventi `load` di uno
 * caricato bene, e il documento dentro risulta opaco in entrambi i casi
 * (SecurityError alla lettura). Misurato, non supposto: le due situazioni sono
 * identiche viste dal DOM.
 *
 * Gli header invece si leggono benissimo da server. La home chiede qui prima
 * di montare l'iframe: se la risposta è no, mostra subito lo screenshot e il
 * bottone, senza far aspettare cinque secondi davanti a un riquadro vuoto.
 *
 * ALLOWLIST OBBLIGATORIA: senza, questa route sarebbe un proxy che chiama
 * qualunque indirizzo arrivi da fuori — inclusi indirizzi interni alla rete.
 * Si risponde solo sugli host dei nostri progetti.
 */

export const runtime = 'nodejs'
/* Gli header di framing cambiano di rado: un'ora di cache evita di ripetere la
   stessa domanda a ogni apertura. */
export const revalidate = 3600

const ALLOWED_HOSTS = new Set(
  WORKS.map((work) => {
    try {
      return new URL(work.siteUrl).host
    } catch {
      return ''
    }
  }).filter(Boolean),
)

function blocksFraming(headers: Headers): string | null {
  const xfo = headers.get('x-frame-options')?.toLowerCase() ?? ''
  if (xfo.includes('deny') || xfo.includes('sameorigin')) return `x-frame-options: ${xfo}`

  const csp = headers.get('content-security-policy')?.toLowerCase() ?? ''
  const match = csp.match(/frame-ancestors ([^;]*)/)
  if (match) {
    const value = match[1].trim()
    // 'none' blocca tutti; un elenco che non ci contiene blocca noi.
    if (value.includes("'none'") || !value.includes('*')) {
      return `frame-ancestors: ${value}`
    }
  }
  return null
}

export async function GET(request: Request) {
  const target = new URL(request.url).searchParams.get('url') ?? ''

  let parsed: URL
  try {
    parsed = new URL(target)
  } catch {
    return NextResponse.json({ ok: false, reason: 'url non valido' }, { status: 400 })
  }

  if (parsed.protocol !== 'https:' || !ALLOWED_HOSTS.has(parsed.host)) {
    return NextResponse.json({ ok: false, reason: 'host non ammesso' }, { status: 403 })
  }

  try {
    const response = await fetch(parsed.toString(), {
      redirect: 'follow',
      signal: AbortSignal.timeout(6000),
      headers: { 'user-agent': 'LuminoEmbedCheck/1.0' },
    })

    // Finire su un dominio diverso significa essere stati dirottati altrove —
    // tipicamente su una pagina di accesso: non è il sito del cliente.
    const landed = new URL(response.url)
    if (landed.host !== parsed.host) {
      return NextResponse.json({
        ok: false,
        reason: `reindirizzato a ${landed.host}`,
        status: response.status,
      })
    }

    const blocked = blocksFraming(response.headers)
    return NextResponse.json({
      ok: response.ok && !blocked,
      status: response.status,
      reason: blocked ?? (response.ok ? null : `http ${response.status}`),
    })
  } catch (error) {
    return NextResponse.json({
      ok: false,
      reason: error instanceof Error ? error.name : 'irraggiungibile',
    })
  }
}
