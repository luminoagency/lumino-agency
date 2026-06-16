/**
 * Porkbun integration — domain registration + DNS config.
 *
 * Status: STUB. Pronto per attivazione: tutte le firme sono definitive,
 * i body lanciano "Not implemented". Quando aggiungiamo le credenziali
 * Porkbun in env, sostituiamo il body con fetch alle API ufficiali:
 *   https://porkbun.com/api/json/v3
 *
 * Setup pre-attivazione:
 *   1. Crea account Porkbun + abilita API access
 *   2. Genera API key + secret
 *   3. Decommenta PORKBUN_API_KEY / PORKBUN_SECRET_KEY in .env.local.example
 *   4. Sostituisci i body di queste funzioni con chiamate HTTP reali
 *
 * Tutte le funzioni sono no-op safe: lanciano errore se chiamate prima
 * dell'attivazione, MAI corrompono dati.
 */

export const PORKBUN_API_KEY = process.env.PORKBUN_API_KEY
export const PORKBUN_SECRET_KEY = process.env.PORKBUN_SECRET_KEY

const PORKBUN_BASE = 'https://porkbun.com/api/json/v3'

function assertConfigured() {
  if (!PORKBUN_API_KEY || !PORKBUN_SECRET_KEY) {
    throw new Error('[porkbun] Stub non attivo. Configurare PORKBUN_API_KEY e PORKBUN_SECRET_KEY in .env.local')
  }
}

export interface AvailabilityResult {
  available: boolean
  price?: number
  currency?: string
}

/**
 * Controlla se un dominio è disponibile per la registrazione.
 * STUB: ritorna sempre `{ available: false }`. Sostituire con
 * POST /domain/checkDomain { domain: name }.
 */
export async function checkAvailability(name: string): Promise<AvailabilityResult> {
  assertConfigured()
  void name
  void PORKBUN_BASE
  throw new Error('[porkbun] checkAvailability not implemented')
}

export interface RegisterResult {
  ok: boolean
  domain: string
  expiresAt?: string
  error?: string
}

/**
 * Registra un dominio per `years` anni.
 * STUB: lancia "Not implemented". Sostituire con
 * POST /domain/registerDomain { domain, years, autoRenew, … }.
 */
export async function registerDomain(name: string, years: number = 1): Promise<RegisterResult> {
  assertConfigured()
  void name
  void years
  throw new Error('[porkbun] registerDomain not implemented')
}

export interface DnsConfig {
  /** Per Vercel: l'IP A record consigliato (es. 76.76.21.21) o un CNAME */
  vercelTarget: string
  /** Anche record `www` */
  wildcardSubdomain?: boolean
}

/**
 * Configura i record DNS per puntare il dominio a Vercel.
 * STUB: lancia "Not implemented". Sostituire con
 * POST /dns/create/{domain} per ogni record (A @, CNAME www, …).
 */
export async function configureDNS(name: string, config: DnsConfig): Promise<{ ok: boolean }> {
  assertConfigured()
  void name
  void config
  throw new Error('[porkbun] configureDNS not implemented')
}
