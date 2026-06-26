-- ============================================================
-- Migration 0021 — inbound_leads
-- Lead in arrivo dal form pubblico /inizia (sia diretti che da
-- link di cold outreach con ?lead=<uuid>).
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS inbound_leads (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 text,
  restaurant_name      text,
  email                text,
  phone                text,
  wants_contact        boolean NOT NULL DEFAULT true,
  source               text NOT NULL DEFAULT 'form_direct'
                         CHECK (source IN ('form_direct', 'form_cold_outreach')),
  linked_restaurant_id uuid REFERENCES restaurants (id) ON DELETE SET NULL,
  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inbound_leads_created_at ON inbound_leads (created_at);
CREATE INDEX IF NOT EXISTS idx_inbound_leads_linked     ON inbound_leads (linked_restaurant_id);

COMMIT;
