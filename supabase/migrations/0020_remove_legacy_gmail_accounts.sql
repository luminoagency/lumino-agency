-- ============================================================
-- Migration 0020 — Rimuove i 4 account Gmail legacy
-- (outlumino1..4) seedati nella migration 0003_outreach.sql.
-- NON modifica la 0003. DELETE idempotente: se le righe sono
-- già state rimosse, non elimina nulla e non fallisce.
--
-- Nota: in 0003 questi account vivono nella colonna `name`
-- (CHECK su outlumino1..4). Filtriamo su `name`; includiamo
-- anche le eventuali email gmail per sicurezza.
-- ============================================================

BEGIN;

DELETE FROM outreach_accounts
 WHERE name IN ('outlumino1', 'outlumino2', 'outlumino3', 'outlumino4');

DELETE FROM outreach_accounts
 WHERE email IN (
   'outlumino1@gmail.com',
   'outlumino2@gmail.com',
   'outlumino3@gmail.com',
   'outlumino4@gmail.com'
 );

COMMIT;
