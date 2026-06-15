-- ============================================================
-- Phase 9 — RLS policy: public può leggere righe sites che sono live
-- (La migrazione 0007 aveva creato policy su site_content/menus/events
--  ma aveva dimenticato la policy SELECT su sites stessa, quindi il
--  client anon non riusciva a leggere neanche la riga sites del slug.)
-- ============================================================

BEGIN;

-- Permette ai visitatori non autenticati di leggere SOLO siti pubblicati
CREATE POLICY "public can read live sites"
  ON sites FOR SELECT
  USING (active = true AND status = 'live');

-- E al proprietario di leggere il proprio sito anche se draft
CREATE POLICY "owner can read own site"
  ON sites FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM site_owners
      WHERE site_id = sites.id
        AND user_id = auth.uid()
    )
  );

COMMIT;
