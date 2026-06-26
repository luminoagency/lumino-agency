-- ============================================================
-- Migration 0022 — Pagamento in due step (modello 30/70)
-- Sostituisce il singolo flag sites.payment_confirmed con due
-- conferme distinte: acconto (30%) e saldo (70%).
-- La vecchia colonna payment_confirmed NON viene rimossa qui:
-- resta deprecata finché tutto il codice non è migrato.
-- ============================================================

BEGIN;

-- 1. Nuove colonne
ALTER TABLE sites
  ADD COLUMN IF NOT EXISTS first_payment_confirmed    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS final_payment_confirmed    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS first_payment_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS final_payment_confirmed_at timestamptz;

-- 2. Migrazione dati: i siti con il vecchio flag confermato diventano
--    "completati" su entrambi gli step, per non bloccarne nessuno.
--    Timestamp = data di creazione del record se disponibile, altrimenti adesso.
UPDATE sites
   SET first_payment_confirmed    = true,
       final_payment_confirmed    = true,
       first_payment_confirmed_at = COALESCE(created_at, now()),
       final_payment_confirmed_at = COALESCE(created_at, now())
 WHERE payment_confirmed = true;

-- 3. Indici utili per filtrare i siti pronti a partire / pubblicabili.
CREATE INDEX IF NOT EXISTS idx_sites_first_payment_confirmed
  ON sites (first_payment_confirmed)
  WHERE first_payment_confirmed = true;

CREATE INDEX IF NOT EXISTS idx_sites_final_payment_confirmed
  ON sites (final_payment_confirmed)
  WHERE final_payment_confirmed = true;

COMMIT;
