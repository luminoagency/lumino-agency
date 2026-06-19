-- ============================================================
-- Section 3 — Zoho Mail migration
-- 4 account SMTP @bylumino.com (Luca, Pietro, Giovanni, Gabriele)
-- Apps Script smette di inviare cold outreach. Resta solo per
-- reservation emails + tracking + welcome.
-- ============================================================

BEGIN;

ALTER TABLE outreach_accounts
  ADD COLUMN IF NOT EXISTS provider                text DEFAULT 'zoho',
  ADD COLUMN IF NOT EXISTS smtp_host               text DEFAULT 'smtp.zoho.eu',
  ADD COLUMN IF NOT EXISTS smtp_port               integer DEFAULT 465,
  ADD COLUMN IF NOT EXISTS smtp_user               text,
  ADD COLUMN IF NOT EXISTS smtp_password_encrypted text,
  ADD COLUMN IF NOT EXISTS sender_name             text,
  ADD COLUMN IF NOT EXISTS daily_cap               integer DEFAULT 5,
  ADD COLUMN IF NOT EXISTS warmup_day              integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_rate           numeric(4,3) DEFAULT 1.000,
  ADD COLUMN IF NOT EXISTS last_paused_at          timestamptz,
  ADD COLUMN IF NOT EXISTS failure_count           integer DEFAULT 0;

ALTER TABLE outreach_accounts
  DROP CONSTRAINT IF EXISTS outreach_accounts_provider_check;
ALTER TABLE outreach_accounts
  ADD CONSTRAINT outreach_accounts_provider_check
  CHECK (provider IN ('zoho','gmail'));

-- status: 'warming','active','paused','burned'
ALTER TABLE outreach_accounts
  DROP CONSTRAINT IF EXISTS outreach_accounts_status_check;
ALTER TABLE outreach_accounts
  ADD CONSTRAINT outreach_accounts_status_check
  CHECK (status IN ('warming','active','paused','burned'));

-- Suppression globale per ristoranti che hanno chiesto unsub
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS do_not_contact boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS do_not_contact_reason text,
  ADD COLUMN IF NOT EXISTS do_not_contact_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_restaurants_do_not_contact
  ON restaurants (do_not_contact)
  WHERE do_not_contact = true;

-- Seed 4 account (idempotente, ON CONFLICT)
INSERT INTO outreach_accounts (email, sender_name, provider, smtp_user, smtp_host, smtp_port, status, daily_cap, warmup_day)
VALUES
  ('luca@bylumino.com',     'Luca',     'zoho', 'luca@bylumino.com',     'smtp.zoho.eu', 465, 'warming', 5, 0),
  ('pietro@bylumino.com',   'Pietro',   'zoho', 'pietro@bylumino.com',   'smtp.zoho.eu', 465, 'warming', 5, 0),
  ('giovanni@bylumino.com', 'Giovanni', 'zoho', 'giovanni@bylumino.com', 'smtp.zoho.eu', 465, 'warming', 5, 0),
  ('gabriele@bylumino.com', 'Gabriele', 'zoho', 'gabriele@bylumino.com', 'smtp.zoho.eu', 465, 'warming', 5, 0)
ON CONFLICT (email) DO NOTHING;

COMMIT;
