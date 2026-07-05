-- ============================================================
-- 0028 — Policy RLS di lettura su `sites` (ri-applica 0010)
--
-- Contesto: le policy SELECT su `sites` create in 0010 risultavano NON
-- applicate sul DB di produzione. Con RLS attiva ma senza policy di lettura,
-- il client in contesto-utente non riusciva a leggere la propria riga `sites`
-- e il pannello /admin mostrava "Nessun sito collegato" per tutti gli owner
-- (i siti pubblici funzionano perché il loader usa il client service-role,
-- che bypassa RLS).
--
-- Le policy sono già state applicate a mano nel SQL editor sul DB live; questa
-- migration le TRACCIA, così restano se il DB viene ricreato da zero.
--
-- Idempotente: DROP POLICY IF EXISTS + CREATE (rieseguibile senza errori).
-- ============================================================

BEGIN;

-- Visitatori non autenticati: leggono SOLO i siti pubblicati.
DROP POLICY IF EXISTS "public can read live sites" ON sites;
CREATE POLICY "public can read live sites"
  ON sites FOR SELECT
  USING (active = true AND status = 'live');

-- Proprietario: legge il proprio sito anche se non pubblicato (draft/building).
DROP POLICY IF EXISTS "owner can read own site" ON sites;
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
