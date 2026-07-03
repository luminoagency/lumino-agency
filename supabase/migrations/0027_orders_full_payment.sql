-- ============================================================
-- Migration 0027 — Pagamento completo (type "full")
-- Il cliente può scegliere di pagare TUTTO in una volta invece del solo
-- acconto. Serve una colonna per tracciare l'ID ordine PayPal di questo
-- pagamento "full", coerente con paypal_deposit_order_id / paypal_balance_order_id.
--
-- NON distruttiva: aggiunge solo una colonna nullable. Nessun dato toccato.
-- ============================================================

BEGIN;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS paypal_full_order_id text;

COMMIT;
