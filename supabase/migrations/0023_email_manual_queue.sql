-- ============================================================
-- Migration 0023 — Coda invio manuale (warmup)
-- Aggiunge lo stato 'ready_to_send' a emails_sent e le colonne
-- per tracciare l'invio manuale dalla dashboard outreach-queue.
-- ============================================================

BEGIN;

-- 1. Stato 'ready_to_send' nel check constraint di emails_sent.status
--    (in 0003 il check inline è auto-nominato emails_sent_status_check).
ALTER TABLE emails_sent
  DROP CONSTRAINT IF EXISTS emails_sent_status_check;
ALTER TABLE emails_sent
  ADD CONSTRAINT emails_sent_status_check
  CHECK (status IN ('sending', 'sent', 'failed', 'skipped', 'ready_to_send'));

-- 2. Tracciamento invio manuale
ALTER TABLE emails_sent
  ADD COLUMN IF NOT EXISTS manually_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS manually_sent_by text;  -- per ora 'admin', in futuro l'utente loggato

-- 3. Indice per la coda (email pronte da inviare a mano)
CREATE INDEX IF NOT EXISTS idx_emails_sent_ready
  ON emails_sent (status)
  WHERE status = 'ready_to_send';

COMMIT;
