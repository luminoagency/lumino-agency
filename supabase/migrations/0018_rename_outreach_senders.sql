-- ============================================================
-- Migration 0018 — Rinomina i 4 mittenti outreach
-- Luca     → Matteo Conti     (matteo@bylumino.com)
-- Pietro   → Francesca De Luca (francesca@bylumino.com)
-- Giovanni → Davide Marini     (davide@bylumino.com)
-- Gabriele → Sara Romano       (sara@bylumino.com)
-- NON modifica la migration 0014 (seed originale). Rinomina in-place.
-- ============================================================

BEGIN;

UPDATE outreach_accounts
   SET sender_name = 'Matteo Conti',
       email       = 'matteo@bylumino.com',
       smtp_user   = 'matteo@bylumino.com'
 WHERE sender_name = 'Luca' OR email = 'luca@bylumino.com';

UPDATE outreach_accounts
   SET sender_name = 'Francesca De Luca',
       email       = 'francesca@bylumino.com',
       smtp_user   = 'francesca@bylumino.com'
 WHERE sender_name = 'Pietro' OR email = 'pietro@bylumino.com';

UPDATE outreach_accounts
   SET sender_name = 'Davide Marini',
       email       = 'davide@bylumino.com',
       smtp_user   = 'davide@bylumino.com'
 WHERE sender_name = 'Giovanni' OR email = 'giovanni@bylumino.com';

UPDATE outreach_accounts
   SET sender_name = 'Sara Romano',
       email       = 'sara@bylumino.com',
       smtp_user   = 'sara@bylumino.com'
 WHERE sender_name = 'Gabriele' OR email = 'gabriele@bylumino.com';

COMMIT;
