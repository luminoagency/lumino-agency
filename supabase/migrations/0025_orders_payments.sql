-- ============================================================
-- Migration 0025 — Ordini a preventivo con pagamento 30/70 (PayPal)
-- Ogni lavoro (sito per un ristorante) ha un importo concordato e si
-- paga in due tranche: acconto 30% all'avvio, saldo 70% alla consegna.
-- L'ordine viene creato dal titolare Lumino (super-admin); il cliente
-- riceve un link e paga con carta / PayPal (Advanced Checkout).
--
-- SICUREZZA: RLS attiva SENZA policy pubbliche. La tabella è scrivibile
-- e leggibile SOLO dal server tramite la service_role (che bypassa RLS).
-- Il client pubblico (anon key) non può leggere né scrivere nulla:
-- gli importi passano sempre dal server.
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS orders (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Dati cliente
  client_name              text        NOT NULL,
  client_email             text        NOT NULL,
  client_whatsapp          text,

  -- Importi (EUR). total = deposit + balance.
  total_amount             numeric(10, 2) NOT NULL,
  deposit_amount           numeric(10, 2) NOT NULL,  -- 30%
  balance_amount           numeric(10, 2) NOT NULL,  -- 70%

  -- Stato delle due tranche: 'pending' | 'paid'
  deposit_status           text        NOT NULL DEFAULT 'pending',
  balance_status           text        NOT NULL DEFAULT 'pending',
  deposit_paid_at          timestamptz,
  balance_paid_at          timestamptz,

  -- ID ordine PayPal (Orders v2) per ciascuna tranche, per idempotenza/tracciamento
  paypal_deposit_order_id  text,
  paypal_balance_order_id  text,

  created_at               timestamptz NOT NULL DEFAULT now()
);

-- Vincoli di coerenza sugli stati (difesa in profondità).
ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_deposit_status_check;
ALTER TABLE orders
  ADD CONSTRAINT orders_deposit_status_check
  CHECK (deposit_status IN ('pending', 'paid'));

ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_balance_status_check;
ALTER TABLE orders
  ADD CONSTRAINT orders_balance_status_check
  CHECK (balance_status IN ('pending', 'paid'));

-- Indici per filtrare gli ordini con tranche ancora da incassare.
CREATE INDEX IF NOT EXISTS idx_orders_created_at
  ON orders (created_at DESC);

-- ============================================================
-- Row Level Security
-- Attiviamo RLS e NON creiamo alcuna policy: di default, con RLS attiva
-- e nessuna policy, i client con anon key non hanno accesso.
-- La service_role bypassa comunque RLS (uso esclusivamente server-side).
-- ============================================================
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders FORCE ROW LEVEL SECURITY;

COMMIT;
