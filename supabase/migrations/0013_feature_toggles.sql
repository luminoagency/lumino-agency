-- ============================================================
-- Section 2 — Feature toggles per ristoratore
-- null  = usa default del piano (lib/plans.PLAN_FEATURE_DEFAULTS)
-- true  = forza ON (se il piano lo permette)
-- false = forza OFF (override esplicito del ristoratore)
-- ============================================================

BEGIN;

ALTER TABLE site_content
  ADD COLUMN IF NOT EXISTS feature_reservations_enabled    boolean,
  ADD COLUMN IF NOT EXISTS feature_newsletter_enabled      boolean,
  ADD COLUMN IF NOT EXISTS feature_events_enabled          boolean,
  ADD COLUMN IF NOT EXISTS feature_whatsapp_button_enabled boolean,
  ADD COLUMN IF NOT EXISTS feature_reviews_enabled         boolean,
  ADD COLUMN IF NOT EXISTS feature_chef_section_enabled    boolean;

COMMIT;
