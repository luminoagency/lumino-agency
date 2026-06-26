/**
 * Stato del pagamento di un sito (modello 30/70).
 *  - pending     → nessun acconto confermato
 *  - first_paid  → acconto (30%) confermato, lavoro avviabile
 *  - fully_paid  → saldo (70%) confermato, sito pubblicabile
 */
export type PaymentStatus = 'pending' | 'first_paid' | 'fully_paid'

export function getPaymentStatus(site: {
  first_payment_confirmed: boolean
  final_payment_confirmed: boolean
}): PaymentStatus {
  if (site.final_payment_confirmed) return 'fully_paid'
  if (site.first_payment_confirmed) return 'first_paid'
  return 'pending'
}

/** Il lavoro (generazione sito) parte solo con l'acconto confermato. */
export function canStartWork(site: { first_payment_confirmed: boolean }): boolean {
  return site.first_payment_confirmed
}

/** Il sito va online solo con il saldo confermato. */
export function canGoLive(site: { final_payment_confirmed: boolean }): boolean {
  return site.final_payment_confirmed
}
