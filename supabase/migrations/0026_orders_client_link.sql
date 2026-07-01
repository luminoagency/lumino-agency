-- ============================================================
-- Migration 0026 — Collega orders ai clienti reali
-- Aggiunge orders.client_id come FK verso clients(id). Il legame vero
-- diventa client_id; client_name/client_email restano come campi
-- DENORMALIZZATI (copia dei dati del cliente al momento della creazione
-- dell'ordine), utili per storico e per mostrare l'ordine anche se il
-- cliente venisse in futuro modificato.
--
-- NON distruttiva: aggiunge solo una colonna nullable e un indice.
-- Nessun dato esistente viene toccato o cancellato.
-- ON DELETE SET NULL: se un cliente viene eliminato, lo storico ordini
-- resta (client_id diventa NULL, ma client_name/client_email rimangono).
-- ============================================================

BEGIN;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_client_id
  ON orders (client_id);

COMMIT;
