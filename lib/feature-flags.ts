/**
 * Feature flag centrali — PIANO B.
 * Mettere a `true` solo quando le email professionali sono attive.
 * Vedi PIANO_B_CHECKLIST.md per la procedura completa.
 */
export const FEATURE_FLAGS = {
  // PIANO B — passare a true quando le email pro sono attive
  OUTREACH_ENABLED: false,
  // Warmup: il cron PREPARA le email ma NON le invia via SMTP — finiscono in coda
  // (/lumino-admin/outreach-queue) e si mandano a mano. false quando passi a invio automatico.
  MANUAL_SEND_MODE: true,
  PRO_EMAIL_ACTIVE: false,
}
