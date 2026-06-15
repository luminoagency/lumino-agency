-- ============================================================
-- Phase 10 (parziale) — Campi raccolti in registrazione cliente
-- Vedi memoria onboarding-form-decisions per il razionale.
-- ============================================================

BEGIN;

-- Dominio: scelta del cliente in fase signup (Pro/Premium)
--   custom_domain            = il dominio se ce l'ha gia
--   domain_managed_by_lumino = true se "no, registratelo voi" (Lumino lo registra via Porkbun)
ALTER TABLE sites
  ADD COLUMN IF NOT EXISTS custom_domain            text,
  ADD COLUMN IF NOT EXISTS domain_managed_by_lumino boolean not null default false;

CREATE UNIQUE INDEX IF NOT EXISTS idx_sites_custom_domain_unique
  ON sites (custom_domain)
  WHERE custom_domain IS NOT NULL;

-- WhatsApp button: numero per il bottone WhatsApp sul sito (Pro+).
-- NULL = il cliente ha detto "no, solo chiamata".
ALTER TABLE site_content
  ADD COLUMN IF NOT EXISTS whatsapp_number text;

COMMIT;
