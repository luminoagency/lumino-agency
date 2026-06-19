-- ============================================================
-- Section 1 — Reservations privacy + owner workflow
-- Aggiunge stato, decisione owner, e timestamps email lifecycle.
-- Lumino non vede mai dati personali: solo aggregati per ristorante.
-- ============================================================

BEGIN;

-- status era 'pending' default ma senza constraint forte (vedi 0007)
-- Allineamento: pending → confirmed → cancelled
ALTER TABLE site_reservations
  ADD COLUMN IF NOT EXISTS owner_decided_at      timestamptz,
  ADD COLUMN IF NOT EXISTS owner_note            text,
  ADD COLUMN IF NOT EXISTS ack_email_sent_at     timestamptz,
  ADD COLUMN IF NOT EXISTS outcome_email_sent_at timestamptz;

-- Drop e ricrea il check per essere sicuri (idempotente)
ALTER TABLE site_reservations
  DROP CONSTRAINT IF EXISTS site_reservations_status_check;

ALTER TABLE site_reservations
  ADD CONSTRAINT site_reservations_status_check
  CHECK (status IN ('pending','confirmed','cancelled','no_show','completed'));

-- Indice per lista pending del ristoratore
CREATE INDEX IF NOT EXISTS idx_reservations_pending
  ON site_reservations (site_id, status, created_at DESC)
  WHERE status = 'pending';

COMMIT;
