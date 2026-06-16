-- ============================================================
-- Phase 11 (placeholder) — gate manuale per pipeline AI
-- Un sito può essere generato solo se il pagamento della prima rata
-- è stato confermato. Per ora il flag è impostato a mano dal super-admin
-- (action in /lumino-admin). Quando si attiverà un payment provider,
-- il webhook lo setterà automaticamente.
-- ============================================================

BEGIN;

ALTER TABLE sites
  ADD COLUMN IF NOT EXISTS payment_confirmed boolean not null default false;

CREATE INDEX IF NOT EXISTS idx_sites_payment_confirmed
  ON sites (payment_confirmed)
  WHERE payment_confirmed = true;

COMMIT;
